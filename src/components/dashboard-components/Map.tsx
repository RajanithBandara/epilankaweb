"use client";

import { useEffect, useRef, useState } from "react";
import * as tt from "@tomtom-international/web-sdk-maps";
import "@tomtom-international/web-sdk-maps/dist/maps.css";
import axios from "axios";

interface NearestAreaResponse {
    user_location: {
        latitude: number;
        longitude: number;
    };
    nearest_area: {
        district_id: number;
        district_name: string;
        latitude: number;
        longitude: number;
        province_name: string;
        distance: number;
    } | null;
    message?: string;
}

function MapComponent() {
    const mapElement = useRef<HTMLDivElement>(null);
    const mapRef = useRef<tt.Map | null>(null);
    const nearbyMarkerRef = useRef<tt.Marker | null>(null);
    const circleLayerIdRef = useRef<string | null>(null);

    const [isLoading, setIsLoading] = useState(false);

    const fetchNearbyLocation = async (
        latitude: number,
        longitude: number
    ): Promise<NearestAreaResponse | null> => {
        try {
            const res = await axios.get<NearestAreaResponse>(
                "/api/nearestlocation",
                {
                    params: { latitude, longitude },
                }
            );
            return res.data;
        } catch (err) {
            console.error("Error fetching nearby location:", err);
            return null;
        }
    };

    // ✅ Draw radius circle
    const addCircleToMap = (
        map: tt.Map,
        center: [number, number],
        radiusMeters = 5000
    ) => {
        const points = 64;
        const coords: number[][] = [];
        const radiusKm = radiusMeters / 1000;

        for (let i = 0; i < points; i++) {
            const angle = (i / points) * 2 * Math.PI;
            const lat =
                center[1] + (radiusKm / 111) * Math.cos(angle);
            const lng =
                center[0] +
                (radiusKm /
                    (111 * Math.cos((center[1] * Math.PI) / 180))) *
                Math.sin(angle);

            coords.push([lng, lat]);
        }
        coords.push(coords[0]);

        const sourceId = "radius-source";
        const layerId = "radius-layer";

        // Remove old layer
        if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
            map.removeLayer(`${layerId}-outline`);
            map.removeSource(sourceId);
        }

        map.addSource(sourceId, {
            type: "geojson",
            data: {
                type: "Feature",
                geometry: {
                    type: "Polygon",
                    coordinates: [coords],
                },
                properties: {},
            },
        });

        map.addLayer({
            id: layerId,
            type: "fill",
            source: sourceId,
            paint: {
                "fill-color": "#0080ff",
                "fill-opacity": 0.2,
            },
        });

        map.addLayer({
            id: `${layerId}-outline`,
            type: "line",
            source: sourceId,
            paint: {
                "line-color": "#0080ff",
                "line-width": 2,
            },
        });

        circleLayerIdRef.current = layerId;
    };

    useEffect(() => {
        if (!mapElement.current) return;

        const map = tt.map({
            key: process.env.NEXT_PUBLIC_TOMTOM_API_KEY!,
            container: mapElement.current,
            center: [80.7718, 7.8731], // Sri Lanka
            zoom: 8,
            language: "en-GB",
        });

        mapRef.current = map;

        map.on("load", () => {
            if (!navigator.geolocation) {
                alert("Geolocation not supported");
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    setIsLoading(true);

                    const { latitude, longitude } = pos.coords;
                    const userCoords: [number, number] = [
                        longitude,
                        latitude,
                    ];

                    // User marker
                    new tt.Marker({ color: "#FF0000" })
                        .setLngLat(userCoords)
                        .setPopup(
                            new tt.Popup({ offset: 30 }).setHTML(
                                `<strong>Your Location</strong><br/>
                 Lat: ${latitude.toFixed(4)}<br/>
                 Lng: ${longitude.toFixed(4)}`
                            )
                        )
                        .addTo(map);

                    map.setCenter(userCoords);
                    map.setZoom(10);

                    const data = await fetchNearbyLocation(
                        latitude,
                        longitude
                    );

                    if (data?.nearest_area) {
                        const area = data.nearest_area;
                        const areaCoords: [number, number] = [
                            area.longitude,
                            area.latitude,
                        ];

                        nearbyMarkerRef.current?.remove();

                        nearbyMarkerRef.current = new tt.Marker({
                            color: "#0000FF",
                        })
                            .setLngLat(areaCoords)
                            .setPopup(
                                new tt.Popup({ offset: 30 }).setHTML(
                                    `<strong>${area.district_name}</strong><br/>
                   Province: ${area.province_name}<br/>
                   Distance: ${area.distance.toFixed(2)} km`
                                )
                            )
                            .addTo(map);

                        addCircleToMap(map, areaCoords, 5000);

                        const bounds = new tt.LngLatBounds();
                        bounds.extend(userCoords);
                        bounds.extend(areaCoords);
                        map.fitBounds(bounds, { padding: 100 });
                    }

                    setIsLoading(false);
                },
                (err) => {
                    console.error(err);
                    alert("Unable to get location");
                    setIsLoading(false);
                }
            );
        });

        return () => {
            nearbyMarkerRef.current?.remove();
            map.remove();
        };
    }, []);

    return (
        <div className="relative w-full h-[600px] rounded-xl overflow-hidden shadow-lg">
            {isLoading && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded z-10">
                    Loading location data...
                </div>
            )}
            <div ref={mapElement} className="w-full h-full" />
        </div>
    );
}

export default MapComponent;
