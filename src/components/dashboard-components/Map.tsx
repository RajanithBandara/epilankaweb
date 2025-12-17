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
    const [isLoading, setIsLoading] = useState(false);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const nearbyMarkerRef = useRef<tt.Marker | null>(null);
    const circleLayerRef = useRef<string | null>(null);

    const fetchNearbyLocation = async (latitude: number, longitude: number) => {
        try {
            const response = await axios.get<NearestAreaResponse>(
                `${process.env.NEXT_PUBLIC_API_URL}/map/nearestlocation`,
                {
                    params: {
                        latitude: latitude,
                        longitude: longitude
                    },
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": process.env.SECRET_KEY
                    },
                }
            );
            console.log("Nearby location fetched:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error fetching nearby location:", error);
            return null;
        }
    };

    const addCircleToMap = (map: tt.Map, center: [number, number], radiusInMeters: number = 5000) => {
        const radiusInKm = radiusInMeters / 1000;
        const points = 64;
        const coords: number[][] = [];

        for (let i = 0; i < points; i++) {
            const angle = (i / points) * 2 * Math.PI;
            const lat = center[1] + (radiusInKm / 111) * Math.cos(angle);
            const lng = center[0] + (radiusInKm / (111 * Math.cos(center[1] * Math.PI / 180))) * Math.sin(angle);
            coords.push([lng, lat]);
        }
        coords.push(coords[0]);

        const sourceId = `circle-source-${Date.now()}`;
        const layerId = `circle-layer-${Date.now()}`;

        if (circleLayerRef.current && map.getLayer(circleLayerRef.current)) {
            map.removeLayer(circleLayerRef.current);
            map.removeLayer(`${circleLayerRef.current}-outline`);
            const oldSourceId = circleLayerRef.current.replace('layer', 'source');
            if (map.getSource(oldSourceId)) {
                map.removeSource(oldSourceId);
            }
        }

        map.addSource(sourceId, {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [coords]
                },
                properties: {}
            }
        });

        map.addLayer({
            id: layerId,
            type: 'fill',
            source: sourceId,
            paint: {
                'fill-color': '#0080ff',
                'fill-opacity': 0.2
            }
        });

        map.addLayer({
            id: `${layerId}-outline`,
            type: 'line',
            source: sourceId,
            paint: {
                'line-color': '#0080ff',
                'line-width': 2
            }
        });

        circleLayerRef.current = layerId;
    };

    useEffect(() => {
        if (!mapElement.current) return;

        const map = tt.map({
            key: process.env.NEXT_PUBLIC_TOMTOM_API_KEY || "",
            container: mapElement.current,
            center: [80.7718, 7.8731],
            zoom: 8,
            scrollZoom: true,
            language: "en-GB",
        });

        mapRef.current = map;

        map.on('load', () => {
            if (typeof window !== "undefined" && navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (pos) => {
                        setIsLoading(true);
                        const { latitude, longitude } = pos.coords;
                        const coords: [number, number] = [longitude, latitude];
                        setUserLocation(coords);

                        // Add user location marker
                        new tt.Marker({ color: "#FF0000" })
                            .setLngLat(coords)
                            .setPopup(
                                new tt.Popup({ offset: 35 }).setHTML(
                                    `<div><strong>Your Location</strong><br/>Lat: ${latitude.toFixed(4)}<br/>Lng: ${longitude.toFixed(4)}</div>`
                                )
                            )
                            .addTo(map);

                        map.setCenter(coords);
                        map.setZoom(10);

                        // Fetch nearest location from backend
                        const response = await fetchNearbyLocation(latitude, longitude);

                        if (response && response.nearest_area) {
                            const nearestArea = response.nearest_area;
                            const nearbyCoords: [number, number] = [
                                nearestArea.longitude,
                                nearestArea.latitude
                            ];

                            // Remove existing marker if any
                            if (nearbyMarkerRef.current) {
                                nearbyMarkerRef.current.remove();
                            }

                            // Add nearest district marker
                            nearbyMarkerRef.current = new tt.Marker({ color: "#0000FF" })
                                .setLngLat(nearbyCoords)
                                .setPopup(
                                    new tt.Popup({ offset: 35 }).setHTML(
                                        `<div>
                                            <strong>${nearestArea.district_name}</strong><br/>
                                            Province: ${nearestArea.province_name}<br/>
                                            Distance: ${nearestArea.distance.toFixed(2)} units
                                        </div>`
                                    )
                                )
                                .addTo(map);

                            // Add circle around the nearest district
                            addCircleToMap(map, nearbyCoords, 5000);

                            // Fit map to show both markers
                            const bounds = new tt.LngLatBounds();
                            bounds.extend(coords);
                            bounds.extend(nearbyCoords);
                            map.fitBounds(bounds, { padding: 100 });
                        } else {
                            console.warn("No nearest area found or error in response");
                        }

                        setIsLoading(false);
                    },
                    (error) => {
                        console.error("Error getting location:", error.message);
                        alert("Unable to retrieve your location");
                        setIsLoading(false);
                    }
                );
            }
        });

        return () => {
            if (nearbyMarkerRef.current) {
                nearbyMarkerRef.current.remove();
            }
            map.remove();
        };
    }, []);

    return (
        <div className="w-full h-[600px] rounded-xl overflow-hidden shadow-lg relative">
            {isLoading && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded shadow-lg z-10">
                    Loading location data...
                </div>
            )}
            <div ref={mapElement} className="w-full h-full" />
        </div>
    );
}

export default MapComponent;
