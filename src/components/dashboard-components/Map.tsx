'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import * as tt from "@tomtom-international/web-sdk-maps";
import "@tomtom-international/web-sdk-maps/dist/maps.css";
import { useLocation } from "@/contexts/LocationContext";
import { Badge } from "@/components/ui/badge";
import { Map as MapIcon, Loader2, AlertTriangle, CheckCircle2, Navigation, Activity } from "lucide-react";

type RiskLevel = "safe" | "low" | "medium" | "high";

interface DiseaseRisk {
    disease_id: number;
    disease_name: string;
    count: number;
    level: RiskLevel;
}

const getSeverityConfig = (severity: RiskLevel) => {
    switch (severity) {
        case "high": return { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", color: "#e11d48", dot: "bg-rose-500", strip: "bg-rose-400" };
        case "medium": return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", color: "#d97706", dot: "bg-amber-500", strip: "bg-amber-400" };
        case "low": return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", color: "#2563eb", dot: "bg-blue-500", strip: "bg-blue-400" };
        case "safe": return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", color: "#059669", dot: "bg-emerald-500", strip: "bg-emerald-400" };
        default: return { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", color: "#64748b", dot: "bg-slate-500", strip: "bg-slate-300" };
    }
};

const getMaxRiskLevel = (riskLevels: Record<string, DiseaseRisk>): RiskLevel => {
    const priority: Record<RiskLevel, number> = { safe: 0, low: 1, medium: 2, high: 3 };
    return Object.values(riskLevels).reduce<RiskLevel>(
        (max, d) => (priority[d.level] > priority[max] ? d.level : max),
        "safe"
    );
};

export default function MapComponent() {
    const mapElement = useRef<HTMLDivElement>(null);
    const mapRef = useRef<tt.Map | null>(null);
    const nearbyMarkerRef = useRef<tt.Marker | null>(null);
    const userMarkerRef = useRef<tt.Marker | null>(null);

    const { locationData, isLoading: contextLoading, error: contextError } = useLocation();
    const [mapReady, setMapReady] = useState(false);

    const isLoading = contextLoading || !mapReady;

    const area = locationData?.nearest_area;
    const riskList = useMemo(() => {
        if (!area) return [];
        return Object.values(area.risk_levels).sort((a, b) => {
            const p: Record<RiskLevel, number> = { high: 3, medium: 2, low: 1, safe: 0 };
            return p[b.level] - p[a.level];
        });
    }, [area]);

    const overallRisk = useMemo(() => {
        if (!area) return "safe" as RiskLevel;
        return getMaxRiskLevel(area.risk_levels);
    }, [area]);

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

    const upsertCircle = useCallback((map: tt.Map, center: [number, number], radiusMeters: number, color: string) => {
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
                paint: { "fill-color": color, "fill-opacity": 0.15 },
            });
            map.addLayer({
                id: outlineId,
                type: "line",
                source: sourceId,
                paint: { "line-color": color, "line-width": 2, "line-opacity": 0.8 },
            });
        } else {
            const src = map.getSource(sourceId) as tt.GeoJSONSource;
            src.setData(data);
            map.setPaintProperty(fillId, "fill-color", color);
            map.setPaintProperty(outlineId, "line-color", color);
        }
    }, []);

    useEffect(() => {
        if (!mapElement.current) return;
        if (mapRef.current) return;

        const map = tt.map({
            key: process.env.NEXT_PUBLIC_TOMTOM_API_KEY!,
            container: mapElement.current,
            center: [80.7718, 7.8731],
            zoom: 7.5,
            language: "si",
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

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady || !locationData) return;

        const { latitude, longitude } = locationData.user_location;
        const userCoords: [number, number] = [longitude, latitude];

        userMarkerRef.current?.remove();
        nearbyMarkerRef.current?.remove();

        const userPopupHtml = `
            <div style="font-family: inherit; margin: -4px;">
                <div style="font-weight:700; font-size: 13px; margin-bottom: 2px; color: #1e293b;">Your Location</div>
                <div style="font-size:11px; color: #64748b;">${latitude.toFixed(4)}, ${longitude.toFixed(4)}</div>
            </div>`;

        userMarkerRef.current = new tt.Marker({ color: "#2563eb" })
            .setLngLat(userCoords)
            .setPopup(new tt.Popup({ offset: 26, className: "custom-map-popup" }).setHTML(userPopupHtml))
            .addTo(map);

        if (locationData.nearest_area) {
            const a = locationData.nearest_area;
            const areaCoords: [number, number] = [a.longitude, a.latitude];
            const maxRisk = getMaxRiskLevel(a.risk_levels);
            const markerColor = getSeverityConfig(maxRisk).color;
            const riskListHtml = Object.values(a.risk_levels).map(r => `<div style="font-size:11px; margin-bottom:2px;">• ${r.disease_name}: <b>${r.level}</b></div>`).join('');
            const areaPopupHtml = `
                <div style="font-family: inherit; margin: -4px; width: 160px;">
                    <div style="font-weight:700; font-size: 14px; margin-bottom: 2px; color: #0f172a;">${a.district_name}</div>
                    <div style="font-size:11px; color: #64748b; margin-bottom: 8px;">${a.province_name} · ${a.distance.toFixed(1)} km</div>
                    <div style="border-top: 1px solid #e2e8f0; padding-top: 6px;">
                        ${riskListHtml}
                    </div>
                </div>`;

            nearbyMarkerRef.current = new tt.Marker({ color: markerColor })
                .setLngLat(areaCoords)
                .setPopup(new tt.Popup({ offset: 26, className: "custom-map-popup" }).setHTML(areaPopupHtml))
                .addTo(map);

            upsertCircle(map, areaCoords, 5000, markerColor);

            const bounds = new tt.LngLatBounds();
            bounds.extend(userCoords);
            bounds.extend(areaCoords);
            // Slight delay to ensure map layout is ready before fitting bounds
            setTimeout(() => {
                if (mapRef.current) {
                    mapRef.current.fitBounds(bounds, { padding: 80, maxZoom: 12 });
                }
            }, 100);
        } else {
            map.setCenter(userCoords);
            map.setZoom(12);
        }
    }, [locationData, mapReady, upsertCircle]);

    return (
        <div className="space-y-5 py-2">
            {/* ── Page header ──────────────────────────────────────────────── */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#2563eb]
                    flex items-center justify-center shadow-md shrink-0">
                    <MapIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Live Risk Map</h1>
                    <p className="text-xs text-slate-400">Interactive community health intelligence</p>
                </div>
            </div>

            {/* ── Error state ──────────────────────────────────────────────── */}
            {contextError && (
                <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50
                    px-4 py-3 text-sm text-rose-700 animate-fade-in-scale">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{contextError}</span>
                </div>
            )}

            {/* ── Main Layout: Map & Side Panel ────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                
                {/* ── Interactive Map (Col span 2) ─────────────────────────── */}
                <div className="lg:col-span-2 card-panel relative p-0 overflow-hidden h-[450px] sm:h-[550px] lg:h-[650px] flex flex-col group translate-z-0">
                    {/* Map container */}
                    <div ref={mapElement} className="flex-1 w-full" />
                    
                    {/* Overlay loaders */}
                    {isLoading && (
                        <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-sm flex items-center justify-center transition-all duration-300">
                            <div className="bg-white/95 border border-slate-200 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3">
                                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                                <span className="text-slate-800 font-semibold text-sm">
                                    {contextLoading ? "Locating you..." : "Initializing map..."}
                                </span>
                            </div>
                        </div>
                    )}
                    
                    {/* Legend */}
                    <div className="absolute left-3 top-3 z-10 pointer-events-none">
                        <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-xl shadow-md p-2.5 pointer-events-auto">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-1">Risk Legend</p>
                            <div className="flex flex-col gap-1.5">
                                {(["high", "medium", "low", "safe"] as RiskLevel[]).map((lvl) => {
                                    const c = getSeverityConfig(lvl);
                                    return (
                                        <div key={lvl} className="flex items-center gap-2 px-1">
                                            <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: c.color }} />
                                            <span className="text-xs font-semibold text-slate-700 capitalize">{lvl}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Information Panel (Col span 1) ───────────────────────── */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Current Area Insight */}
                    {area ? (
                        <div className="card-panel animate-fade-in-scale shrink-0">
                            <div className="card-panel-header border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500
                                        flex items-center justify-center shadow-sm">
                                        <Navigation className="h-3.5 w-3.5 text-white" />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-900">Area Insights</span>
                                </div>
                                {(() => {
                                    const c = getSeverityConfig(overallRisk);
                                    return (
                                        <Badge className={`text-[10px] font-bold ${c.bg} ${c.text} ${c.border}`}>
                                            {overallRisk} risk
                                        </Badge>
                                    );
                                })()}
                            </div>
                            
                            <div className="p-4 sm:p-5">
                                <h2 className="text-lg font-bold text-slate-900 mb-0.5 shrink-0">{area.district_name}</h2>
                                <p className="text-xs text-slate-500 mb-4">{area.province_name} • {area.distance.toFixed(1)} km away</p>

                                {/* Banner */}
                                {locationData?.warning && locationData.warning !== "Area is safe" ? (
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex gap-2.5 items-start">
                                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                        <p className="text-xs font-semibold text-amber-800 leading-relaxed">{locationData.warning}</p>
                                    </div>
                                ) : (
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4 flex gap-2.5 items-start">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                                        <p className="text-xs font-semibold text-emerald-800 leading-relaxed">
                                            Area is currently safe with normal health activity.
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1.5 shrink-0">
                                        Active Pathogens
                                    </p>
                                    {riskList.length > 0 ? (
                                        <div className="space-y-2">
                                            {riskList.map(risk => {
                                                const c = getSeverityConfig(risk.level);
                                                return (
                                                    <div key={risk.disease_id} className={`relative flex items-center justify-between p-2.5 rounded-lg border ${c.bg} ${c.border} overflow-hidden group hover:shadow-sm transition-all duration-200`}>
                                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${c.strip}`} />
                                                        <div className="pl-1.5 flex flex-col min-w-0 pr-2">
                                                            <span className={`text-sm font-semibold truncate ${c.text}`}>{risk.disease_name}</span>
                                                            <span className={`text-[10px] opacity-80 mt-0.5 ${c.text}`}>{risk.count} projected {risk.count === 1 ? 'case' : 'cases'}</span>
                                                        </div>
                                                        <Badge className={`text-[10px] uppercase shrink-0 ${c.bg} ${c.text} ${c.border}`}>
                                                            {risk.level}
                                                        </Badge>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="py-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                                            No recent reports in this area.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card-panel py-10 px-6 text-center animate-fade-in-scale">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-3 shadow-sm">
                                <Activity className="h-5 w-5 text-slate-300" />
                            </div>
                            <h3 className="text-sm font-semibold text-slate-700">Awaiting Location</h3>
                            <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto">Stand by while we fetch your coordinates to display health insights.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
