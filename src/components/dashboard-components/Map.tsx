"use client";

import { useEffect, useRef, useState } from "react";
import * as tt from "@tomtom-international/web-sdk-maps";
import "@tomtom-international/web-sdk-maps/dist/maps.css";
import { useLocation } from "@/contexts/LocationContext";

type RiskLevel = "safe" | "low" | "medium" | "high";

interface DiseaseRisk {
    disease_id: number;
    disease_name: string;
    count: number;
    level: RiskLevel;
}

function MapComponent() {
    const mapElement = useRef<HTMLDivElement>(null);
    const mapRef = useRef<tt.Map | null>(null);
    const nearbyMarkerRef = useRef<tt.Marker | null>(null);
    const userMarkerRef = useRef<tt.Marker | null>(null);

    // Get location data from context
    const { locationData, isLoading: contextLoading, error: contextError } = useLocation();
    const [mapLoading, setMapLoading] = useState(false);

    const getRiskColor = (level: RiskLevel): string => {
        switch (level) {
            case "safe":
                return "#16A34A"; // Theme success color
            case "low":
                return "#eab308"; // Yellow for low risk
            case "medium":
                return "#F97316"; // Theme warning color
            case "high":
                return "#DC2626"; // Theme danger color
            default:
                return "#64748b"; // Theme text secondary
        }
    };

    const getMaxRiskLevel = (riskLevels: Record<string, DiseaseRisk>): RiskLevel => {
        const priority: Record<RiskLevel, number> = {
            safe: 0,
            low: 1,
            medium: 2,
            high: 3,
        };

        return Object.values(riskLevels).reduce<RiskLevel>(
            (max, d) => priority[d.level] > priority[max] ? d.level : max,
            "safe"
        );
    };

    const addCircleToMap = (
        map: tt.Map,
        center: [number, number],
        radiusMeters: number,
        color: string
    ) => {
        const points = 64;
        const coords: number[][] = [];
        const radiusKm = radiusMeters / 1000;

        for (let i = 0; i < points; i++) {
            const angle = (i / points) * 2 * Math.PI;
            const lat = center[1] + (radiusKm / 111) * Math.cos(angle);
            const lng = center[0] + (radiusKm / (111 * Math.cos((center[1] * Math.PI) / 180))) * Math.sin(angle);
            coords.push([lng, lat]);
        }
        coords.push(coords[0]);

        const sourceId = "radius-source";
        const layerId = "radius-layer";

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
                "fill-color": color,
                "fill-opacity": 0.2,
            },
        });

        map.addLayer({
            id: `${layerId}-outline`,
            type: "line",
            source: sourceId,
            paint: {
                "line-color": color,
                "line-width": 2,
            },
        });
    };

    useEffect(() => {
        if (!mapElement.current || !locationData) return;

        // Map loading state is managed through the map.on('load') callback
        const map = tt.map({
            key: process.env.NEXT_PUBLIC_TOMTOM_API_KEY!,
            container: mapElement.current,
            center: [80.7718, 7.8731],
            zoom: 8,
            language: "en-GB",
        });

        mapRef.current = map;

        map.on("load", () => {
            const { latitude, longitude } = locationData.user_location;
            const userCoords: [number, number] = [longitude, latitude];

            // Add user marker
            userMarkerRef.current = new tt.Marker({ color: "#1E3A8A" })
                .setLngLat(userCoords)
                .setPopup(
                    new tt.Popup({ offset: 30 }).setHTML(
                        `<strong>Your Location</strong><br/>
                         Lat: ${latitude.toFixed(4)}<br/>
                         Lng: ${longitude.toFixed(4)}`
                    )
                )
                .addTo(map);

            if (locationData.nearest_area) {
                const area = locationData.nearest_area;
                const areaCoords: [number, number] = [area.longitude, area.latitude];

                const maxRisk = getMaxRiskLevel(area.risk_levels);
                const markerColor = getRiskColor(maxRisk);

                // Add nearest area marker
                nearbyMarkerRef.current = new tt.Marker({ color: markerColor })
                    .setLngLat(areaCoords)
                    .setPopup(
                        new tt.Popup({ offset: 30 }).setHTML(
                            `
                            <strong>${area.district_name}</strong><br/>
                            Province: ${area.province_name}<br/>
                            Distance: ${area.distance.toFixed(2)} km<br/><br/>
                            <strong>Risk Levels:</strong><br/>
                            ${Object.values(area.risk_levels)
                                .map((d) => `${d.disease_name}: ${d.level} (${d.count})`)
                                .join("<br/>")}
                            `
                        )
                    )
                    .addTo(map);

                addCircleToMap(map, areaCoords, 5000, markerColor);

                // Fit bounds to show both markers
                const bounds = new tt.LngLatBounds();
                bounds.extend(userCoords);
                bounds.extend(areaCoords);
                map.fitBounds(bounds, { padding: 100 });
            } else {
                // If no nearest area, center on user
                map.setCenter(userCoords);
                map.setZoom(12);
            }

            setMapLoading(false);
        });

        return () => {
            userMarkerRef.current?.remove();
            nearbyMarkerRef.current?.remove();
            map.remove();
        };
    }, [locationData]);

    const isLoading = contextLoading || mapLoading;

    return (
        <div className="relative w-full h-[600px] rounded-2xl overflow-hidden shadow-2xl">
            {/* Loading Indicator */}
            {isLoading && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 animate-fade-in">
                    <div className="backdrop-blur-2xl bg-white/90 border border-gray-200 px-6 py-3.5 rounded-2xl shadow-xl">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-5 h-5 border-3 border-gray-200 border-t-[#1E3A8A] rounded-full animate-spin" />
                                <div className="absolute inset-0 w-5 h-5 border-3 border-transparent border-t-[#0EA5A4]/50 rounded-full animate-spin"
                                     style={{ animationDirection: "reverse", animationDuration: "1s" }} />
                            </div>
                            <span className="text-gray-800 font-semibold text-sm tracking-wide">
                                {contextLoading ? 'Fetching location...' : 'Loading map...'}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {contextError && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
                    <div className="backdrop-blur-2xl bg-red-50 border-2 border-[#DC2626] px-6 py-3.5 rounded-2xl shadow-xl">
                        <p className="text-[#DC2626] font-semibold text-sm flex items-center gap-2">
                            <span>❌</span>
                            <span>{contextError}</span>
                        </p>
                    </div>
                </div>
            )}

            {/* Area Info Card */}
            {locationData?.nearest_area && (
                <div className="absolute top-6 right-6 max-w-sm z-20 animate-slide-in-right">
                    <div className="bg-white border-2 border-gray-200 rounded-3xl shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="relative p-6 border-b border-gray-200 bg-gradient-to-br from-[#1E3A8A] to-[#1e40af]">
                            <div className="relative">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-bold text-xl text-white drop-shadow-sm flex-1">
                                        {locationData.nearest_area.district_name}
                                    </h3>
                                    <div className="bg-white/20 backdrop-blur-xl px-3 py-1 rounded-full border border-white/30">
                                        <span className="text-xs font-bold text-white">
                                            {locationData.nearest_area.distance.toFixed(1)} km
                                        </span>
                                    </div>
                                </div>
                                <p className="text-sm text-blue-100 font-medium">
                                    {locationData.nearest_area.province_name}
                                </p>
                            </div>
                        </div>

                        {/* Disease Risk Cards */}
                        <div className="p-5 space-y-3 bg-gray-50">
                            {Object.values(locationData.nearest_area.risk_levels).map((disease, index) => (
                                <div
                                    key={disease.disease_id}
                                    className="bg-white rounded-2xl p-4 border-2 border-gray-200 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 animate-fade-in-up"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2.5 mb-1.5">
                                                <p className="font-bold text-base text-gray-900">
                                                    {disease.disease_name}
                                                </p>
                                            </div>
                                            <p className="text-xs text-gray-600 font-medium">
                                                {disease.count} predicted {disease.count === 1 ? 'case' : 'cases'}
                                            </p>
                                        </div>
                                        <div
                                            className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-transform hover:scale-105"
                                            style={{
                                                backgroundColor: getRiskColor(disease.level),
                                                boxShadow: `0 4px 12px ${getRiskColor(disease.level)}40`,
                                            }}
                                        >
                                            {disease.level.toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Warning/Safe Banner */}
                        {locationData.warning && locationData.warning !== "Area is safe" ? (
                            <div className="mx-5 mb-5 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
                                <div className="bg-orange-50 border-l-4 border-[#F97316] rounded-2xl p-4 shadow-md">
                                    <p className="text-sm font-bold text-gray-900 leading-relaxed">
                                        ⚠️ {locationData.warning}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="mx-5 mb-5 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
                                <div className="bg-green-50 border-l-4 border-[#16A34A] rounded-2xl p-4 shadow-md">
                                    <p className="text-sm font-bold text-gray-900 leading-relaxed">
                                        ✅ Area is currently safe with low risk levels
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Map Container */}
            <div ref={mapElement} className="w-full h-full" />
        </div>
    );
}

export default MapComponent;
