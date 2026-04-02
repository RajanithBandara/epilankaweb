'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import * as tt from "@tomtom-international/web-sdk-maps";
import "@tomtom-international/web-sdk-maps/dist/maps.css";
import { useLocation } from "@/contexts/LocationContext";
import { Loader2, AlertTriangle, CheckCircle2, Navigation, Activity } from "lucide-react";

type RiskLevel = "safe" | "low" | "medium" | "high";

interface DiseaseRisk {
    disease_id: number;
    disease_name: string;
    count: number;
    level: RiskLevel;
}

type SeverityConfig = {
    color: string;
    bg: string;
    border: string;
    textColor: string;
    stripColor: string;
};

const getSeverityConfig = (severity: RiskLevel): SeverityConfig => {
    switch (severity) {
        case "high":
            return {
                color: "#e11d48",
                bg: "rgba(225,29,72,0.09)",
                border: "rgba(225,29,72,0.28)",
                textColor: "#be123c",
                stripColor: "#f43f5e",
            };
        case "medium":
            return {
                color: "#d97706",
                bg: "rgba(217,119,6,0.09)",
                border: "rgba(217,119,6,0.28)",
                textColor: "#b45309",
                stripColor: "#f59e0b",
            };
        case "low":
            return {
                color: "#2563eb",
                bg: "rgba(37,99,235,0.09)",
                border: "rgba(37,99,235,0.22)",
                textColor: "var(--color-primary)",
                stripColor: "#3b82f6",
            };
        case "safe":
            return {
                color: "#059669",
                bg: "rgba(5,150,105,0.09)",
                border: "rgba(5,150,105,0.25)",
                textColor: "#047857",
                stripColor: "#10b981",
            };
        default:
            return {
                color: "#64748b",
                bg: "var(--dash-card-header-bg)",
                border: "var(--dash-card-border)",
                textColor: "var(--dash-text-secondary)",
                stripColor: "var(--dash-card-border)",
            };
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
            map.addLayer({ id: fillId, type: "fill", source: sourceId, paint: { "fill-color": color, "fill-opacity": 0.15 } });
            map.addLayer({ id: outlineId, type: "line", source: sourceId, paint: { "line-color": color, "line-width": 2, "line-opacity": 0.8 } });
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
            setTimeout(() => {
                if (mapRef.current) mapRef.current.fitBounds(bounds, { padding: 80, maxZoom: 12 });
            }, 100);
        } else {
            map.setCenter(userCoords);
            map.setZoom(12);
        }
    }, [locationData, mapReady, upsertCircle]);

    const overallCfg = getSeverityConfig(overallRisk);

    return (
        <div className="space-y-5">

            {/* ── Page header ─────────────────────────────────────────────── */}
            <div className="flex items-center gap-3">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
                    style={{ background: "var(--color-primary)" }}
                >
                    <Navigation className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--dash-text-primary)" }}>
                        Disease Risk Map
                    </h1>
                    <p className="text-xs" style={{ color: "var(--dash-text-muted)" }}>
                        Real-time health risk visualization for your area
                    </p>
                </div>
            </div>

            {/* ── Error state ───────────────────────────────────────────── */}
            {contextError && (
                <div
                    className="flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm animate-fade-in-scale"
                    style={{
                        background: "rgba(220,38,38,0.08)",
                        borderColor: "rgba(220,38,38,0.28)",
                        color: "var(--color-danger)",
                    }}
                >
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{contextError}</span>
                </div>
            )}

            {/* ── Main layout ───────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

                {/* ── Interactive Map ───────────────────────────────────── */}
                <div
                    className="lg:col-span-2 card-panel relative p-0 overflow-hidden h-[450px] sm:h-[550px] lg:h-[650px] flex flex-col"
                >
                    <div ref={mapElement} className="flex-1 w-full" />

                    {/* Loading overlay */}
                    {isLoading && (
                        <div
                            className="absolute inset-0 z-10 flex items-center justify-center transition-all duration-300"
                            style={{ backdropFilter: "blur(4px)", background: "rgba(var(--dash-bg), 0.4)" }}
                        >
                            <div
                                className="px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border"
                                style={{
                                    background: "var(--dash-card-bg)",
                                    borderColor: "var(--dash-card-border)",
                                }}
                            >
                                <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--color-primary)" }} />
                                <span className="font-semibold text-sm" style={{ color: "var(--dash-text-primary)" }}>
                                    {contextLoading ? "Locating you..." : "Initializing map..."}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Risk legend overlay */}
                    <div className="absolute left-3 top-3 z-10 pointer-events-none">
                        <div
                            className="rounded-xl border p-2.5 pointer-events-auto"
                            style={{
                                background: "var(--dash-card-bg)",
                                borderColor: "var(--dash-card-border)",
                                backdropFilter: "blur(12px)",
                                boxShadow: "var(--shadow-md)",
                            }}
                        >
                            <p
                                className="text-[10px] font-bold uppercase tracking-widest mb-1.5 px-1"
                                style={{ color: "var(--dash-text-muted)" }}
                            >
                                Risk Legend
                            </p>
                            <div className="flex flex-col gap-1.5">
                                {(["high", "medium", "low", "safe"] as RiskLevel[]).map((lvl) => {
                                    const c = getSeverityConfig(lvl);
                                    return (
                                        <div key={lvl} className="flex items-center gap-2 px-1">
                                            <span
                                                className="w-2.5 h-2.5 rounded-full shadow-sm flex-shrink-0"
                                                style={{ backgroundColor: c.color }}
                                            />
                                            <span
                                                className="text-xs font-semibold capitalize"
                                                style={{ color: "var(--dash-text-secondary)" }}
                                            >
                                                {lvl}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Information panel ─────────────────────────────────── */}
                <div className="lg:col-span-1 space-y-4">
                    {area ? (
                        <div className="card-panel animate-fade-in-scale">
                            {/* Panel header */}
                            <div className="card-panel-header flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm"
                                        style={{ background: "var(--color-primary)" }}
                                    >
                                        <Navigation className="h-3.5 w-3.5 text-white" />
                                    </div>
                                    <span
                                        className="text-sm font-semibold"
                                        style={{ color: "var(--dash-text-primary)" }}
                                    >
                                        Area Insights
                                    </span>
                                </div>
                                {/* Overall risk badge */}
                                <span
                                    className="text-[10px] font-bold rounded-full px-2.5 py-1 border capitalize"
                                    style={{
                                        color: overallCfg.textColor,
                                        background: overallCfg.bg,
                                        borderColor: overallCfg.border,
                                    }}
                                >
                                    {overallRisk} risk
                                </span>
                            </div>

                            <div className="p-4 sm:p-5 space-y-4">
                                {/* District info */}
                                <div>
                                    <h2
                                        className="text-lg font-bold"
                                        style={{ color: "var(--dash-text-primary)" }}
                                    >
                                        {area.district_name}
                                    </h2>
                                    <p className="text-xs" style={{ color: "var(--dash-text-muted)" }}>
                                        {area.province_name} • {area.distance.toFixed(1)} km away
                                    </p>
                                </div>

                                {/* Warning / safe banner */}
                                {locationData?.warning && locationData.warning !== "Area is safe" ? (
                                    <div
                                        className="rounded-xl border p-3 flex gap-2.5 items-start"
                                        style={{
                                            background: "rgba(217,119,6,0.09)",
                                            borderColor: "rgba(217,119,6,0.28)",
                                        }}
                                    >
                                        <AlertTriangle
                                            className="h-4 w-4 shrink-0 mt-0.5"
                                            style={{ color: "#b45309" }}
                                        />
                                        <p
                                            className="text-xs font-semibold leading-relaxed"
                                            style={{ color: "#92400e" }}
                                        >
                                            {locationData.warning}
                                        </p>
                                    </div>
                                ) : (
                                    <div
                                        className="rounded-xl border p-3 flex gap-2.5 items-start"
                                        style={{
                                            background: "rgba(5,150,105,0.09)",
                                            borderColor: "rgba(5,150,105,0.25)",
                                        }}
                                    >
                                        <CheckCircle2
                                            className="h-4 w-4 shrink-0 mt-0.5"
                                            style={{ color: "#059669" }}
                                        />
                                        <p
                                            className="text-xs font-semibold leading-relaxed"
                                            style={{ color: "#047857" }}
                                        >
                                            Area is currently safe with normal health activity.
                                        </p>
                                    </div>
                                )}

                                {/* Active pathogens list */}
                                <div>
                                    <p
                                        className="text-[10px] font-bold uppercase tracking-widest mb-2 border-b pb-1.5"
                                        style={{
                                            color: "var(--dash-text-muted)",
                                            borderColor: "var(--dash-card-border)",
                                        }}
                                    >
                                        Active Pathogens
                                    </p>
                                    {riskList.length > 0 ? (
                                        <div className="space-y-2">
                                            {riskList.map(risk => {
                                                const c = getSeverityConfig(risk.level);
                                                return (
                                                    <div
                                                        key={risk.disease_id}
                                                        className="relative flex items-center justify-between p-2.5 rounded-lg border overflow-hidden transition-all duration-200"
                                                        style={{
                                                            background: c.bg,
                                                            borderColor: c.border,
                                                        }}
                                                    >
                                                        {/* Severity left strip */}
                                                        <div
                                                            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
                                                            style={{ background: c.stripColor }}
                                                        />
                                                        <div className="pl-2.5 flex flex-col min-w-0 pr-2">
                                                            <span
                                                                className="text-sm font-semibold truncate"
                                                                style={{ color: c.textColor }}
                                                            >
                                                                {risk.disease_name}
                                                            </span>
                                                            <span
                                                                className="text-[10px] mt-0.5"
                                                                style={{ color: c.textColor, opacity: 0.8 }}
                                                            >
                                                                {risk.count} projected {risk.count === 1 ? 'case' : 'cases'}
                                                            </span>
                                                        </div>
                                                        <span
                                                            className="text-[10px] font-bold uppercase rounded-full px-2.5 py-0.5 border shrink-0"
                                                            style={{
                                                                color: c.textColor,
                                                                background: "rgba(255,255,255,0.35)",
                                                                borderColor: c.border,
                                                            }}
                                                        >
                                                            {risk.level}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div
                                            className="py-4 text-center text-xs rounded-xl border border-dashed"
                                            style={{
                                                color: "var(--dash-text-muted)",
                                                background: "var(--dash-card-header-bg)",
                                                borderColor: "var(--dash-card-border)",
                                            }}
                                        >
                                            No recent reports in this area.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Awaiting location state */
                        <div className="card-panel py-10 px-6 text-center animate-fade-in-scale">
                            <div
                                className="w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto mb-3"
                                style={{
                                    background: "var(--dash-card-header-bg)",
                                    borderColor: "var(--dash-card-border)",
                                }}
                            >
                                <Activity className="h-5 w-5" style={{ color: "var(--dash-text-muted)" }} />
                            </div>
                            <h3 className="text-sm font-semibold" style={{ color: "var(--dash-text-primary)" }}>
                                Awaiting Location
                            </h3>
                            <p
                                className="text-xs mt-1 max-w-[200px] mx-auto"
                                style={{ color: "var(--dash-text-muted)" }}
                            >
                                Stand by while we fetch your coordinates to display health insights.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
