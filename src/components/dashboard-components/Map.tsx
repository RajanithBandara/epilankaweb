"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as tt from "@tomtom-international/web-sdk-maps";
import "@tomtom-international/web-sdk-maps/dist/maps.css";
import { useLocation } from "@/contexts/LocationContext";

// shared pill component must be defined outside to satisfy react-hooks/static-components
const RiskPill = ({ level, getRiskColor }: { level: RiskLevel; getRiskColor: (lvl: RiskLevel) => string }) => (
    <span
        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: getRiskColor(level) }}
    >
        <span className="inline-block w-2 h-2 rounded-full bg-white/90" />
        {level.toUpperCase()}
    </span>
);

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

    const { locationData, isLoading: contextLoading, error: contextError } = useLocation();

    const [mapReady, setMapReady] = useState(false);
    const [panelOpen, setPanelOpen] = useState(true);

    const isLoading = contextLoading || !mapReady;

    const getRiskColor = (level: RiskLevel): string => {
        switch (level) {
            case "safe":
                return "#16A34A";
            case "low":
                return "#EAB308";
            case "medium":
                return "#F97316";
            case "high":
                return "#DC2626";
            default:
                return "#64748B";
        }
    };

    const getMaxRiskLevel = (riskLevels: Record<string, DiseaseRisk>): RiskLevel => {
        const priority: Record<RiskLevel, number> = { safe: 0, low: 1, medium: 2, high: 3 };
        return Object.values(riskLevels).reduce<RiskLevel>(
            (max, d) => (priority[d.level] > priority[max] ? d.level : max),
            "safe"
        );
    };

    const circleGeoJson = (center: [number, number], radiusMeters: number) => {
        const points = 64;
        const coords: number[][] = [];
        const [lng, lat] = center;

        const radiusKm = radiusMeters / 1000;
        const latRad = (lat * Math.PI) / 180;

        for (let i = 0; i < points; i++) {
            const angle = (i / points) * 2 * Math.PI;

            const dLat = (radiusKm / 111) * Math.cos(angle);
            const dLng = (radiusKm / (111 * Math.cos(latRad))) * Math.sin(angle);

            coords.push([lng + dLng, lat + dLat]);
        }
        coords.push(coords[0]);

        return {
            type: "Feature" as const,
            geometry: { type: "Polygon" as const, coordinates: [coords] },
            properties: {},
        };
    };

    const upsertCircle = (map: tt.Map, center: [number, number], radiusMeters: number, color: string) => {
        const sourceId = "radius-source";
        const fillId = "radius-layer";
        const outlineId = "radius-layer-outline";

        const data = {
            type: "FeatureCollection" as const,
            features: [circleGeoJson(center, radiusMeters)],
        };

        if (!map.getSource(sourceId)) {
            map.addSource(sourceId, { type: "geojson", data });

            map.addLayer({
                id: fillId,
                type: "fill",
                source: sourceId,
                paint: {
                    "fill-color": color,
                    "fill-opacity": 0.18,
                },
            });

            map.addLayer({
                id: outlineId,
                type: "line",
                source: sourceId,
                paint: {
                    "line-color": color,
                    "line-width": 2,
                    "line-opacity": 0.9,
                },
            });
        } else {
            const src = map.getSource(sourceId) as tt.GeoJSONSource;
            src.setData(data);
            map.setPaintProperty(fillId, "fill-color", color);
            map.setPaintProperty(outlineId, "line-color", color);
        }
    };

    // Memo values for UI so it doesn't recalc a lot
    const area = locationData?.nearest_area;
    const riskList = useMemo(() => {
        if (!area) return [];
        return Object.values(area.risk_levels);
    }, [area]);

    const overallRisk = useMemo(() => {
        if (!area) return "safe" as RiskLevel;
        return getMaxRiskLevel(area.risk_levels);
    }, [area]);

    // Init map once
    useEffect(() => {
        if (!mapElement.current) return;
        if (mapRef.current) return; // ✅ prevents re-init

        const map = tt.map({
            key: process.env.NEXT_PUBLIC_TOMTOM_API_KEY!,
            container: mapElement.current,
            center: [80.7718, 7.8731],
            zoom: 8,
            language: "en-GB",
        });

        mapRef.current = map;

        map.on("load", () => setMapReady(true));

        return () => {
            userMarkerRef.current?.remove();
            nearbyMarkerRef.current?.remove();
            map.remove();
            mapRef.current = null;
        };
    }, []);

    // Update markers when locationData changes
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady || !locationData) return;

        const { latitude, longitude } = locationData.user_location;
        const userCoords: [number, number] = [longitude, latitude];

        // Remove previous markers
        userMarkerRef.current?.remove();
        nearbyMarkerRef.current?.remove();

        userMarkerRef.current = new tt.Marker({ color: "#1E3A8A" })
            .setLngLat(userCoords)
            .setPopup(
                new tt.Popup({ offset: 26 }).setHTML(
                    `<div style="font-weight:700;margin-bottom:4px;">Your Location</div>
           <div style="font-size:12px;opacity:.85;">Lat: ${latitude.toFixed(4)} · Lng: ${longitude.toFixed(4)}</div>`
                )
            )
            .addTo(map);

        if (locationData.nearest_area) {
            const a = locationData.nearest_area;
            const areaCoords: [number, number] = [a.longitude, a.latitude];

            const maxRisk = getMaxRiskLevel(a.risk_levels);
            const markerColor = getRiskColor(maxRisk);

            nearbyMarkerRef.current = new tt.Marker({ color: markerColor })
                .setLngLat(areaCoords)
                .setPopup(
                    new tt.Popup({ offset: 26 }).setHTML(
                        `<div style="font-weight:800;margin-bottom:4px;">${a.district_name}</div>
             <div style="font-size:12px;opacity:.9;margin-bottom:8px;">${a.province_name} · ${a.distance.toFixed(
                            2
                        )} km</div>
             <div style="font-weight:700;margin-bottom:4px;">Risk levels</div>
             <div style="font-size:12px;line-height:1.4;">
               ${Object.values(a.risk_levels)
                            .map((d) => `• ${d.disease_name}: <b>${d.level}</b> (${d.count})`)
                            .join("<br/>")}
             </div>`
                    )
                )
                .addTo(map);

            upsertCircle(map, areaCoords, 5000, markerColor);

            const bounds = new tt.LngLatBounds();
            bounds.extend(userCoords);
            bounds.extend(areaCoords);
            map.fitBounds(bounds, { padding: 110, maxZoom: 12 });
        } else {
            map.setCenter(userCoords);
            map.setZoom(12);
        }
    }, [locationData, mapReady]); // upsertCircle is stable and defined outside of React's scope

    return (
        <div className="relative w-full h-[calc(100vh-4.75rem)] md:h-[600px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-gray-200 bg-gray-100 max-h-[760px] md:max-h-none">
            {/* Map */}
            <div ref={mapElement} className="w-full h-full" />

            {/* Soft top gradient for readability */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 sm:h-28 bg-gradient-to-b from-black/25 to-transparent" />

            {/* Legend */}
            <div className="absolute left-3 sm:left-4 top-3 sm:top-4 z-20">
                <div className="bg-white/90 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-xl px-3 sm:px-4 py-2.5 sm:py-3">
                    <div className="text-[11px] sm:text-xs font-extrabold text-gray-900 mb-1.5 sm:mb-2">Risk legend</div>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        {(["safe", "low", "medium", "high"] as RiskLevel[]).map((lvl) => (
                            <span key={lvl} className="inline-flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold text-gray-800">
                                <span
                                    className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full"
                                    style={{ backgroundColor: getRiskColor(lvl) }}
                                />
                                {lvl}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Loading overlay */}
            {isLoading && (
                <div className="absolute inset-0 z-30 bg-white/35 backdrop-blur-[2px] flex items-start justify-center pt-6">
                    <div className="bg-white/90 border border-gray-200 px-5 sm:px-6 py-3.5 rounded-2xl shadow-xl">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                            <div className="w-5 h-5 border-2 border-gray-200 border-t-[#1E3A8A] rounded-full animate-spin" />
                            <span className="text-gray-800 font-semibold text-xs sm:text-sm tracking-wide">
                                {contextLoading ? "Fetching location..." : "Loading map..."}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Error */}
            {contextError && (
                <div className="absolute left-1/2 -translate-x-1/2 top-3 sm:top-4 z-40 px-3 sm:px-0">
                    <div className="bg-red-50/95 backdrop-blur-xl border-2 border-[#DC2626] px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-2xl shadow-xl max-w-xs sm:max-w-none">
                        <p className="text-[#DC2626] font-semibold text-xs sm:text-sm flex items-center gap-2">
                            <span>❌</span>
                            <span>{contextError}</span>
                        </p>
                    </div>
                </div>
            )}

            {/* Toggle button */}
            {area && (
                <button
                    type="button"
                    onClick={() => setPanelOpen((v) => !v)}
                    className="absolute right-3 sm:right-4 top-3 sm:top-4 z-30 bg-white/90 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-xl px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-gray-900 hover:bg-white transition"
                >
                    {panelOpen ? "Hide details" : "Show details"}
                </button>
            )}

            {/* Info panel (desktop right, mobile bottom-sheet feel) */}
            {area && panelOpen && (
                <div className="absolute z-20 md:right-4 md:top-16 md:w-[380px] inset-x-3 bottom-[5rem] sm:inset-x-auto sm:right-4 sm:left-auto sm:translate-x-0 sm:w-[92vw] md:w-[380px] max-w-md mx-auto">
                    <div className="bg-white/95 backdrop-blur-2xl border border-gray-200 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[60vh] md:max-h-none flex flex-col">
                        {/* Header */}
                        <div className="p-4 sm:p-5 bg-gradient-to-br from-[#1E3A8A] to-[#1e40af]">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="text-white font-extrabold text-lg sm:text-xl leading-tight">{area.district_name}</div>
                                    <div className="text-blue-100 font-semibold text-xs sm:text-sm">{area.province_name}</div>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    <div className="bg-white/15 border border-white/25 rounded-2xl px-2.5 sm:px-3 py-1">
                                        <span className="text-white text-xs font-bold">{area.distance.toFixed(1)} km</span>
                                    </div>
                                    <RiskPill level={overallRisk} getRiskColor={getRiskColor} />
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-3 sm:p-4 bg-gray-50 overflow-y-auto">
                            <div className="grid gap-2.5 sm:gap-3">
                                {riskList.map((d) => (
                                    <div
                                        key={d.disease_id}
                                        className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-200 shadow-sm hover:shadow-md transition"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="font-extrabold text-gray-900 text-sm sm:text-base truncate">{d.disease_name}</div>
                                                <div className="text-[11px] sm:text-xs font-semibold text-gray-600">
                                                    {d.count} predicted {d.count === 1 ? "case" : "cases"}
                                                </div>
                                            </div>

                                            <span
                                                className="shrink-0 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-extrabold text-white"
                                                style={{ backgroundColor: getRiskColor(d.level) }}
                                            >
                                                {d.level.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Banner */}
                            <div className="mt-3 sm:mt-4">
                                {locationData?.warning && locationData.warning !== "Area is safe" ? (
                                    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3 sm:p-4">
                                        <p className="text-xs sm:text-sm font-bold text-gray-900 leading-relaxed">⚠️ {locationData.warning}</p>
                                    </div>
                                ) : (
                                    <div className="bg-green-50 border border-green-200 rounded-2xl p-3 sm:p-4">
                                        <p className="text-xs sm:text-sm font-bold text-gray-900 leading-relaxed">
                                            ✅ Area is currently safe with low risk levels
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Mobile helper */}
                    <div className="mt-2 sm:mt-3 md:hidden text-center text-[11px] sm:text-xs font-semibold text-white/90 drop-shadow">
                        Tip: pinch to zoom · drag to move
                    </div>
                </div>
            )}
        </div>
    );
}

export default MapComponent;
