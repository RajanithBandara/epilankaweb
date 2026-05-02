'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { format } from 'date-fns';
import {
    CheckCircle2,
    Activity,
    X,
    Loader2,
    Info,
    Bell,
    AlertCircle
} from 'lucide-react';
import { FaSyncAlt } from "react-icons/fa";
import { DatePicker } from '@/components/ui/datepicker';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

type RiskLevel = 'safe' | 'low' | 'medium' | 'high';

interface DiseaseRisk {
    disease_id: number;
    disease_name: string;
    count: number;
    level: RiskLevel;
}

interface District {
    district_id: number;
    district_name: string;
    latitude: number;
    longitude: number;
    province_name: string;
    overall_risk: RiskLevel;
    week_number: number;
    year: number;
    risk_levels: Record<string, DiseaseRisk>;
}

interface Alert {
    disease_id: number;
    disease_name: string;
    level: RiskLevel;
    count: number;
    district_name: string;
    province_name: string;
    district_id: number;
}

interface MapData {
    districts: District[];
    current_alerts: Alert[];
    total_alerts: number;
    data_period: string;
    week_number: number;
    year: number;
    selected_date: string;
    high_risk_count: number;
    medium_risk_count: number;
    low_risk_count: number;
    safe_count: number;
}

type DistrictFeatureProperties = Record<string, unknown> & {
    shapeName?: string;
    district_name?: string;
    overall_risk?: RiskLevel;
    fill_color?: string;
};

type RawDistrictFeatureCollection = FeatureCollection<Geometry, Record<string, unknown>>;
type DistrictFeature = Feature<Geometry, DistrictFeatureProperties>;
type DistrictFeatureCollection = FeatureCollection<Geometry, DistrictFeatureProperties>;

const isDistrictFeatureCollection = (value: unknown): value is RawDistrictFeatureCollection => {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as { type?: unknown; features?: unknown };
    return candidate.type === 'FeatureCollection' && Array.isArray(candidate.features);
};

type TomTomMap = import('@tomtom-international/web-sdk-maps').Map;
type MapVariant = 'default' | 'mono';

const getRiskColor = (risk: RiskLevel, variant: MapVariant = 'default') => {
    if (variant === 'mono') {
        switch (risk) {
            case 'high':
                return {
                    cardName: 'bg-white/6 rounded-xl border-l-[4px] border-l-zinc-100 border-y border-r border-white/15 hover:bg-white/10 transition-colors',
                    text: 'text-zinc-100',
                    marker: '#f5f5f5',
                    badgeClass: 'px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider bg-zinc-100/10 text-zinc-100 border border-zinc-100/30 font-sans'
                };
            case 'medium':
                return {
                    cardName: 'bg-white/6 rounded-xl border-l-[4px] border-l-zinc-300 border-y border-r border-white/15 hover:bg-white/10 transition-colors',
                    text: 'text-zinc-300',
                    marker: '#d4d4d4',
                    badgeClass: 'px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider bg-zinc-300/10 text-zinc-200 border border-zinc-300/30 font-sans'
                };
            case 'low':
                return {
                    cardName: 'bg-white/6 rounded-xl border-l-[4px] border-l-zinc-400 border-y border-r border-white/15 hover:bg-white/10 transition-colors',
                    text: 'text-zinc-400',
                    marker: '#a3a3a3',
                    badgeClass: 'px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider bg-zinc-400/10 text-zinc-300 border border-zinc-400/30 font-sans'
                };
            case 'safe':
            default:
                return {
                    cardName: 'bg-white/6 rounded-xl border-l-[4px] border-l-zinc-500 border-y border-r border-white/15 hover:bg-white/10 transition-colors',
                    text: 'text-zinc-500',
                    marker: '#737373',
                    badgeClass: 'px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider bg-zinc-500/10 text-zinc-400 border border-zinc-500/30 font-sans'
                };
        }
    }

    switch (risk) {
        case 'high':
            return {
                cardName: 'bg-white/10 rounded-xl border-l-[4px] border-l-rose-500 border-y border-r border-white/10 hover:bg-white/20 transition-colors',
                text: 'text-rose-400',
                marker: '#DC2626',
                badgeClass: 'px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 font-sans'
            };
        case 'medium':
            return {
                cardName: 'bg-white/10 rounded-xl border-l-[4px] border-l-amber-500 border-y border-r border-white/10 hover:bg-white/20 transition-colors',
                text: 'text-amber-400',
                marker: '#F97316',
                badgeClass: 'px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 font-sans'
            };
        case 'low':
            return {
                cardName: 'bg-white/10 rounded-xl border-l-[4px] border-l-blue-400 border-y border-r border-white/10 hover:bg-white/20 transition-colors',
                text: 'text-blue-300',
                marker: '#3b82f6',
                badgeClass: 'px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 font-sans'
            };
        case 'safe':
        default:
            return {
                cardName: 'bg-white/10 rounded-xl border-l-[4px] border-l-emerald-500 border-y border-r border-white/10 hover:bg-white/20 transition-colors',
                text: 'text-emerald-400',
                marker: '#10B981',
                badgeClass: 'px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-sans'
            };
    }
};

interface MapComponentProps {
    variant?: MapVariant;
}

export default function MapComponent({ variant = 'default' }: MapComponentProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapPanelRef = useRef<HTMLDivElement>(null);
    const map = useRef<TomTomMap | null>(null);
    const districtGeoJsonRef = useRef<RawDistrictFeatureCollection | null>(null);
    const districtHandlersBoundRef = useRef(false);
    const districtDataRef = useRef<District[]>([]);

    const [mapReady, setMapReady] = useState(false);
    const [mapError, setMapError] = useState<string | null>(null);
    const [dataLoading, setDataLoading] = useState(true);
    const [mapData, setMapData] = useState<MapData | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [tooltipDistrict, setTooltipDistrict] = useState<District | null>(null);
    const [tooltipPoint, setTooltipPoint] = useState<{ x: number; y: number } | null>(null);
    const [tooltipOpen, setTooltipOpen] = useState(false);
    const [tooltipPinned, setTooltipPinned] = useState(false);
    const tooltipPinnedRef = useRef(false);
    const tooltipRafRef = useRef<number | null>(null);
    const pendingTooltipRef = useRef<{ district: District; point: { x: number; y: number } } | null>(null);
    const [expandedAlert, setExpandedAlert] = useState<number | null>(null);
    const [legendOpen, setLegendOpen] = useState(false);

    useEffect(() => {
        tooltipPinnedRef.current = tooltipPinned;
    }, [tooltipPinned]);

    useEffect(() => {
        return () => {
            if (tooltipRafRef.current !== null) {
                cancelAnimationFrame(tooltipRafRef.current);
                tooltipRafRef.current = null;
            }
        };
    }, []);

    const normalizeDistrictName = (name: string) =>
        name.toLowerCase().replace(/\bdistrict\b/g, '').replace(/[^a-z]/g, '');

    const isMono = variant === 'mono';
    const getRiskHexColor = useCallback((risk: RiskLevel) => getRiskColor(risk, variant).marker, [variant]);

    // Initialize map — runs once AFTER the map container div is in the DOM.
    // We always render the map div (just hidden while data loads), so the ref
    // is available immediately on first render.
    useEffect(() => {
        let cancelled = false;

        const initMap = async () => {
            // Wait for the container element to exist in DOM
            if (!mapContainer.current) return;
            // Guard against double init
            if (map.current) return;

            try {
                // Inject TomTom CSS as a <link> tag (avoids TypeScript issues with CSS dynamic imports)
                if (!document.getElementById('tomtom-css')) {
                    const link = document.createElement('link');
                    link.id = 'tomtom-css';
                    link.rel = 'stylesheet';
                    link.href = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps.css';
                    document.head.appendChild(link);
                }

                // Dynamically import TomTom SDK (client-side only)
                const tt = await import('@tomtom-international/web-sdk-maps');
                if (cancelled || !mapContainer.current) return;

                const apiKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY;
                if (!apiKey) {
                    setMapError('Map API key is missing.');
                    return;
                }

                // Initialize with no custom style URL — use TomTom default
                const mapInstance = tt.map({
                    key: apiKey,
                    container: mapContainer.current,
                    center: [80.7718, 7.8731],
                    zoom: 7.2,
                    language: 'en-GB',
                });

                map.current = mapInstance;

                mapInstance.on('load', () => {
                    if (!cancelled) {
                        setMapReady(true);
                    }
                });

                mapInstance.on('error', (errorEvent: unknown) => {
                    console.error('TomTom map error:', errorEvent);
                });

            } catch (error) {
                console.error('Failed to initialize map:', error);
                if (!cancelled) {
                    setMapError('Failed to load the map. Please refresh the page.');
                }
            }
        };

        // Small timeout to ensure DOM is fully painted before initializing
        const timer = setTimeout(initMap, 100);

        return () => {
            cancelled = true;
            clearTimeout(timer);
            if (map.current) {
                try { map.current.remove(); } catch { /* ignore */ }
                map.current = null;
            }
        };
    }, []);

    // Fetch map data
    useEffect(() => {
        const fetchMapData = async () => {
            try {
                setDataLoading(true);
                const params = new URLSearchParams({
                    target_date: format(selectedDate, 'yyyy-MM-dd'),
                });
                const response = await fetch(`/api/map/alldistricts?${params}`);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                setMapData(data);
                districtDataRef.current = data?.districts ?? [];
                setTooltipDistrict(null);
                setTooltipPoint(null);
                setTooltipOpen(false);
                setTooltipPinned(false);
                setExpandedAlert(null);
            } catch (error) {
                console.error('Failed to fetch map data:', error);
            } finally {
                setDataLoading(false);
            }
        };
        fetchMapData();
    }, [selectedDate]);

    // Add district polygon highlighting by risk level
    useEffect(() => {
        const mapInstance = map.current;
        if (!mapInstance || !mapReady || !mapData) return;

        const sourceId = 'district-risk-source';
        const fillLayerId = 'district-risk-fill';
        const lineLayerId = 'district-risk-line';

        const upsertDistrictPolygons = async () => {
            try {
                if (!districtGeoJsonRef.current) {
                    const response = await fetch('/geo/lka-districts.geojson');
                    if (!response.ok) {
                        throw new Error(`Failed to load district geometry: ${response.status}`);
                    }
                    const geoJsonPayload: unknown = await response.json();
                    if (!isDistrictFeatureCollection(geoJsonPayload)) {
                        throw new Error('Invalid district geometry format.');
                    }
                    districtGeoJsonRef.current = geoJsonPayload;
                }

                const riskByDistrict = new Map<string, District>();
                mapData.districts.forEach((district) => {
                    riskByDistrict.set(normalizeDistrictName(district.district_name), district);
                });
                districtDataRef.current = mapData.districts;

                const rawGeoJson = districtGeoJsonRef.current;

                const enrichedGeoJson: DistrictFeatureCollection = {
                    type: 'FeatureCollection',
                    features: rawGeoJson.features.map((feature): DistrictFeature => {
                        const shapeName = String(feature.properties?.shapeName ?? '');
                        const districtName = shapeName.replace(/\s+District\s*$/i, '').trim();
                        const matchedDistrict = riskByDistrict.get(normalizeDistrictName(districtName));
                        const overallRisk: RiskLevel = matchedDistrict?.overall_risk ?? 'safe';

                        return {
                            type: 'Feature',
                            geometry: feature.geometry,
                            properties: {
                                ...feature.properties,
                                district_name: districtName,
                                overall_risk: overallRisk,
                                fill_color: getRiskHexColor(overallRisk),
                            },
                        };
                    }),
                };

                if (!mapInstance.getSource(sourceId)) {
                    mapInstance.addSource(sourceId, {
                        type: 'geojson',
                        data: enrichedGeoJson,
                    });

                    mapInstance.addLayer({
                        id: fillLayerId,
                        type: 'fill',
                        source: sourceId,
                        paint: {
                            'fill-color': ['coalesce', ['get', 'fill_color'], isMono ? '#737373' : '#10b981'],
                            'fill-opacity': 0.38,
                        },
                    });

                    mapInstance.addLayer({
                        id: lineLayerId,
                        type: 'line',
                        source: sourceId,
                        paint: {
                            'line-color': isMono ? '#ffffff' : '#1E3A8A',
                            'line-width': 1.1,
                            'line-opacity': 0.45,
                        },
                    });
                } else {
                    const existingSource = mapInstance.getSource(sourceId) as {
                        setData: (data: DistrictFeatureCollection) => void;
                    };
                    existingSource.setData(enrichedGeoJson);
                }

                if (!districtHandlersBoundRef.current) {
                    const extractPoint = (event: unknown) => {
                        const mapEvent = event as { point?: { x?: number; y?: number } };
                        return {
                            x: Number(mapEvent.point?.x ?? 0),
                            y: Number(mapEvent.point?.y ?? 0),
                        };
                    };

                    const scheduleTooltipUpdate = (district: District, point: { x: number; y: number }) => {
                        pendingTooltipRef.current = { district, point };
                        if (tooltipRafRef.current !== null) return;

                        tooltipRafRef.current = requestAnimationFrame(() => {
                            tooltipRafRef.current = null;
                            const pending = pendingTooltipRef.current;
                            if (!pending) return;

                            setTooltipDistrict(pending.district);
                            setTooltipPoint(pending.point);
                            setTooltipOpen(true);
                        });
                    };

                    mapInstance.on('click', fillLayerId, (event: unknown) => {
                        const mapEvent = event as {
                            features?: Array<{ properties?: Record<string, unknown> }>;
                        };
                        const feature = mapEvent.features?.[0];
                        const districtName = String(feature?.properties?.district_name ?? '');
                        if (!districtName) return;

                        const match = districtDataRef.current.find(
                            (d) => normalizeDistrictName(d.district_name) === normalizeDistrictName(districtName)
                        );
                        if (match) {
                            scheduleTooltipUpdate(match, extractPoint(event));
                            setTooltipPinned(true);
                        }
                    });

                    mapInstance.on('mouseenter', fillLayerId, (event: unknown) => {
                        const mapEvent = event as {
                            features?: Array<{ properties?: Record<string, unknown> }>;
                        };
                        const feature = mapEvent.features?.[0];
                        const districtName = String(feature?.properties?.district_name ?? '');
                        if (!districtName) return;

                        const match = districtDataRef.current.find(
                            (d) => normalizeDistrictName(d.district_name) === normalizeDistrictName(districtName)
                        );
                        if (match) {
                            scheduleTooltipUpdate(match, extractPoint(event));
                            setTooltipPinned(false);
                        }
                    });

                    mapInstance.on('mousemove', fillLayerId, (event: unknown) => {
                        const mapEvent = event as {
                            features?: Array<{ properties?: Record<string, unknown> }>;
                        };
                        const feature = mapEvent.features?.[0];
                        const districtName = String(feature?.properties?.district_name ?? '');
                        if (!districtName) return;

                        const match = districtDataRef.current.find(
                            (d) => normalizeDistrictName(d.district_name) === normalizeDistrictName(districtName)
                        );
                        if (match) {
                            scheduleTooltipUpdate(match, extractPoint(event));
                        }
                    });

                    mapInstance.on('mouseenter', fillLayerId, () => {
                        mapInstance.getCanvas().style.cursor = 'pointer';
                    });

                    mapInstance.on('mouseleave', fillLayerId, () => {
                        mapInstance.getCanvas().style.cursor = '';
                        if (!tooltipPinnedRef.current) {
                            setTooltipOpen(false);
                            setTooltipDistrict(null);
                            setTooltipPoint(null);
                            pendingTooltipRef.current = null;
                        }
                    });

                    districtHandlersBoundRef.current = true;
                }
            } catch (error) {
                console.error('Failed to render district polygons:', error);
            }
        };

        upsertDistrictPolygons();
    }, [mapReady, mapData, isMono, getRiskHexColor]);

    return (
        <div className={`w-full h-full flex flex-col md:flex-row backdrop-blur-md ${isMono ? 'bg-black/80 text-white' : 'bg-white/5'}`}>

            {/* ─── Left: Map area ─────────────────── */}
            <div ref={mapPanelRef} className="flex-1 relative overflow-hidden" style={{ minHeight: 400 }}>

                {/* The TomTom map mounts into this div via ref.  
                    It MUST always be in the DOM (never conditionally removed).
                    We overlay the loading state on top instead. */}
                <div
                    ref={mapContainer}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                />

                {/* Loading overlay — sits on top of the map div, doesn't remove it */}
                {(!mapReady || dataLoading) && !mapError && (
                    <div
                        className={`absolute inset-0 z-20 flex items-center justify-center backdrop-blur-md ${isMono ? 'bg-black/60' : 'bg-[#1E3A8A]/30'}`}
                    >
                        <div className={`text-center p-6 rounded-2xl border shadow-xl backdrop-blur-lg ${isMono ? 'bg-black/70 border-white/25' : 'bg-white/10 border-white/20'}`}>
                            <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3 text-white" />
                            <p className="font-medium text-sm text-white drop-shadow-md">
                                {dataLoading ? 'Loading map data...' : 'Initializing map...'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Error overlay */}
                {mapError && (
                    <div className={`absolute inset-0 z-20 flex items-center justify-center backdrop-blur-md ${isMono ? 'bg-black/60' : 'bg-[#1E3A8A]/30'}`}>
                        <div className={`text-center p-8 rounded-2xl border backdrop-blur-lg ${isMono ? 'bg-black/80 border-white/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                            <AlertCircle className={`w-12 h-12 mx-auto mb-3 ${isMono ? 'text-zinc-200' : 'text-rose-400'}`} />
                            <p className="font-bold mb-1 text-white text-lg">Map Could Not Load</p>
                            <p className="text-sm text-white/80">{mapError}</p>
                        </div>
                    </div>
                )}

                {/* Risk legend — only shown once map is ready */}
                {mapReady && (
                    <div className="absolute top-4 left-4 z-10 flex flex-col items-start gap-2">
                        {!legendOpen ? (
                            <button
                                onClick={() => setLegendOpen(true)}
                                className={`backdrop-blur-xl border shadow-xl p-3 rounded-xl flex items-center justify-center transition-all animate-fade-in text-white group ${isMono ? 'bg-black/70 border-white/25 hover:bg-white/10' : 'bg-blue-900/10 border-white/20 hover:bg-white/25'}`}
                                aria-label="Show map options and details"
                            >
                                <Activity className="w-5 h-5 text-white mr-2 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-bold tracking-wide">Options & Details</span>
                            </button>
                        ) : (
                            <div className={`backdrop-blur-2xl border shadow-2xl p-5 rounded-2xl animate-fade-in-up text-white ${isMono ? 'bg-black/75 border-white/25' : 'bg-blue-900/10 border-white/20'}`} style={{ maxWidth: 280 }}>
                                <div className="flex items-center justify-between gap-3 mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-2 rounded-lg border ${isMono ? 'bg-white/5 border-white/25' : 'bg-white/10 border-white/20'}`}>
                                            <Activity className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-sm tracking-wide">Sri Lanka Risk Map</h2>
                                            <p className="text-xs text-white/70 font-medium">{mapData?.data_period}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setLegendOpen(false)}
                                        className="text-white/60 hover:text-white hover:bg-white/10 p-1.5 rounded-md transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className={`mb-4 rounded-xl border p-3 ${isMono ? 'border-white/25 bg-white/5' : 'border-white/20 bg-white/5'}`}>
                                    <label htmlFor="risk-date" className="block text-xs font-semibold mb-1.5 text-white/90">
                                        Select Date
                                    </label>
                                    <div className="light-theme-forced-if-needed">
                                        <DatePicker date={selectedDate} onDateChange={setSelectedDate} className={`h-8 text-xs w-full text-white placeholder:text-white/50 ${isMono ? 'bg-black/60 border-white/25 hover:bg-white/10' : 'bg-white/10 border-white/30 hover:bg-white/20'}`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        {
                                            count: mapData?.high_risk_count,
                                            label: 'High',
                                            color: isMono ? 'bg-zinc-100' : 'bg-rose-400',
                                            bg: isMono ? 'bg-zinc-100/10 border border-zinc-100/30' : 'bg-rose-500/20 border border-rose-500/30',
                                            text: isMono ? 'text-zinc-100' : 'text-rose-200',
                                        },
                                        {
                                            count: mapData?.medium_risk_count,
                                            label: 'Medium',
                                            color: isMono ? 'bg-zinc-300' : 'bg-amber-400',
                                            bg: isMono ? 'bg-zinc-300/10 border border-zinc-300/30' : 'bg-amber-500/20 border border-amber-500/30',
                                            text: isMono ? 'text-zinc-200' : 'text-amber-200',
                                        },
                                        {
                                            count: mapData?.low_risk_count,
                                            label: 'Low',
                                            color: isMono ? 'bg-zinc-400' : 'bg-blue-400',
                                            bg: isMono ? 'bg-zinc-400/10 border border-zinc-400/30' : 'bg-blue-500/20 border border-blue-500/30',
                                            text: isMono ? 'text-zinc-300' : 'text-blue-200',
                                        },
                                        {
                                            count: mapData?.safe_count,
                                            label: 'Safe',
                                            color: isMono ? 'bg-zinc-500' : 'bg-emerald-400',
                                            bg: isMono ? 'bg-zinc-500/10 border border-zinc-500/30' : 'bg-emerald-500/20 border border-emerald-500/30',
                                            text: isMono ? 'text-zinc-400' : 'text-emerald-200',
                                        },
                                    ].map(({ count, label, color, bg, text }) => (
                                        <div key={label} className={`flex items-center gap-2 p-2.5 rounded-xl ${bg}`}>
                                            <div className={`w-2 h-2 rounded-full ${color} shrink-0 shadow-[0_0_8px_${color}]`}></div>
                                            <div>
                                                <div className={`font-bold text-sm ${text}`}>{count ?? '–'}</div>
                                                <div className={`text-[10px] uppercase tracking-wider ${text} opacity-80 font-semibold`}>{label}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* District Tooltip */}
                <TooltipProvider delayDuration={0} skipDelayDuration={0}>
                    <Tooltip
                        open={tooltipOpen && Boolean(tooltipDistrict && tooltipPoint)}
                        onOpenChange={(open) => {
                            if (!open) {
                                tooltipPinnedRef.current = false;
                                setTooltipPinned(false);
                                setTooltipOpen(false);
                                setTooltipDistrict(null);
                                setTooltipPoint(null);
                                pendingTooltipRef.current = null;
                            }
                        }}
                    >
                        <TooltipTrigger asChild>
                            <div
                                className="absolute z-30 h-0 w-0"
                                style={{
                                    left: tooltipPoint?.x ?? 0,
                                    top: tooltipPoint?.y ?? 0,
                                    transform: 'translate(-50%, -50%)',
                                    pointerEvents: 'none',
                                }}
                            />
                        </TooltipTrigger>
                        <TooltipContent
                            container={mapPanelRef.current ?? undefined}
                            side="top"
                            sideOffset={10}
                            className="z-40 w-[min(calc(100vw-1.5rem),14rem)] rounded-md border border-white/30 bg-black px-2.5 py-2 text-white shadow-lg"
                        >
                            {tooltipDistrict && (() => {
                                const activeDiseases = Object.values(tooltipDistrict.risk_levels || {})
                                    .filter(d => d.count > 0)
                                    .sort((a, b) => b.count - a.count);
                                
                                return (
                                    <div className="space-y-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="truncate text-xs font-bold tracking-wide">{tooltipDistrict.district_name}</p>
                                            {tooltipPinned && (
                                                <button
                                                    onClick={() => {
                                                        tooltipPinnedRef.current = false;
                                                        setTooltipPinned(false);
                                                        setTooltipOpen(false);
                                                        setTooltipDistrict(null);
                                                        setTooltipPoint(null);
                                                        pendingTooltipRef.current = null;
                                                    }}
                                                    className="rounded p-0.5 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                                                    aria-label="Close district tooltip"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="text-[11px] text-white/80 font-medium tracking-wide">Overall Risk:</p>
                                            <p className={`text-[10px] font-bold uppercase ${getRiskColor(tooltipDistrict.overall_risk, variant).text}`}>
                                                {tooltipDistrict.overall_risk}
                                            </p>
                                        </div>
                                        <p className="text-[10px] text-white/60 mb-1 font-medium">As of Week {tooltipDistrict.week_number}, {tooltipDistrict.year}</p>

                                        {activeDiseases.length > 0 && (
                                            <div className="pt-1.5 mt-1.5 border-t border-white/20 space-y-0.5">
                                                <p className="text-[9px] text-white/50 uppercase font-bold tracking-wider mb-1">Active Conditions</p>
                                                {activeDiseases.map(d => {
                                                    const dColor = getRiskColor(d.level, variant);
                                                    return (
                                                        <div key={d.disease_id} className="flex justify-between items-center py-px">
                                                            <span className="text-[11px] text-white/90">{d.disease_name}</span>
                                                            <span className={`text-[9px] font-bold uppercase ${dColor.text}`}>{d.level}</span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            {/* ─── Right: Alerts Sidebar ─────────── */}
            <div className={`w-full md:w-80 lg:w-96 flex flex-col border-t md:border-t-0 md:border-l backdrop-blur-xl ${isMono ? 'border-white/25 bg-black/70' : 'border-white/20 bg-white/5'}`} style={{ maxHeight: '100%' }}>
                {/* Header */}
                <div className={`p-4 border-b shrink-0 flex items-center gap-3 ${isMono ? 'border-white/25 bg-black/60' : 'border-white/20 bg-white/5'}`}>
                    <div className={`flex shrink-0 w-9 h-9 items-center justify-center rounded-xl ${isMono ? 'bg-zinc-800 shadow-lg shadow-black/40' : 'bg-blue-500 shadow-lg shadow-purple-500/30'}`}>
                        <Bell className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-white tracking-wide">Active Alerts</h3>
                        <p className="text-xs text-white/70 font-medium mt-0.5">
                            {mapData?.current_alerts.length || 0} alert{(mapData?.current_alerts.length || 0) !== 1 ? 's' : ''} across the nation
                        </p>
                    </div>
                </div>

                {/* Alerts List */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {dataLoading ? (
                        <div className="flex items-center justify-center h-32">
                            <Loader2 className="w-6 h-6 animate-spin text-white" />
                        </div>
                    ) : mapData?.current_alerts && mapData.current_alerts.length > 0 ? (
                        <div className="space-y-3">
                            {mapData.current_alerts.map((alert, idx) => {
                                const rc = getRiskColor(alert.level, variant);
                                const isExpanded = expandedAlert === idx;
                                
                                // Find other diseases in the same district
                                const districtData = mapData.districts.find(d => d.district_id === alert.district_id);
                                const otherDiseases = Object.values(districtData?.risk_levels || {})
                                    .filter(d => d.disease_id !== alert.disease_id && d.count > 0)
                                    .sort((a, b) => b.count - a.count);

                                return (
                                    <div key={idx} className={`${rc.cardName} p-0 overflow-hidden shadow-lg`}>
                                        <button
                                            onClick={() => setExpandedAlert(isExpanded ? null : idx)}
                                            className="w-full text-left p-3.5 focus:outline-none"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                        <span className={rc.badgeClass}>
                                                            {alert.level.toUpperCase()}
                                                        </span>
                                                        <p className="font-bold text-sm text-white truncate drop-shadow-sm">
                                                            {alert.disease_name}
                                                        </p>
                                                    </div>
                                                    <p className={`text-xs ${rc.text} truncate font-semibold`}>
                                                        {alert.district_name}, {alert.province_name}
                                                    </p>
                                                    <p className="text-xs mt-1 text-white/60 font-medium">
                                                        {alert.count} case{alert.count !== 1 ? 's' : ''} reported
                                                    </p>
                                                </div>
                                                <Info className={`w-4 h-4 shrink-0 mt-0.5 ${rc.text}`} />
                                            </div>
                                            {isExpanded && (
                                                <div className="mt-3 pt-3 space-y-2 text-xs text-left border-t border-white/10">
                                                    <p className="text-white/80">
                                                        <span className="font-bold text-white">Location: </span>
                                                        {alert.district_name}, {alert.province_name}
                                                    </p>
                                                    <p className="text-white/80 pb-1">
                                                        <span className="font-bold text-white">Risk Profile: </span>
                                                        {alert.level === 'high'
                                                            ? 'Critical — immediate action required'
                                                            : alert.level === 'medium'
                                                                ? 'Significant outbreak — close monitoring needed'
                                                                : 'Watch for further developments'}
                                                    </p>
                                                    
                                                    {otherDiseases.length > 0 && (
                                                        <div className="pt-2 border-t border-white/10">
                                                            <p className="font-bold text-white mb-2 tracking-wide">Other Active Conditions</p>
                                                            <div className="space-y-1.5">
                                                                {otherDiseases.map(od => {
                                                                    const odColor = getRiskColor(od.level, variant);
                                                                    return (
                                                                        <div key={od.disease_id} className={`flex items-center justify-between px-2 py-1.5 rounded-lg ${isMono ? 'bg-white/10 border border-white/10' : 'bg-white/5 border border-white/5'}`}>
                                                                            <span className="text-white/90 font-medium">
                                                                                {od.disease_name} <span className="text-white/50">({od.count})</span>
                                                                            </span>
                                                                            <span className={`text-[10px] font-bold tracking-wider ${odColor.text}`}>
                                                                                {od.level.toUpperCase()}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center flex flex-col items-center justify-center h-full">
                            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-3 shadow-xl backdrop-blur-md ${isMono ? 'border-white/30 bg-white/10' : 'border-white/20 bg-white/10'}`}>
                                <CheckCircle2 className={`h-6 w-6 ${isMono ? 'text-zinc-200' : 'text-emerald-400'}`} />
                            </div>
                            <p className="font-bold text-sm text-white drop-shadow-sm">No Active Alerts</p>
                            <p className="text-xs mt-1 text-white/70 font-medium">All districts currently safe</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={`border-t p-3 flex items-center justify-between shrink-0 backdrop-blur-md ${isMono ? 'border-white/25 bg-black/60' : 'border-white/20 bg-white/5'}`}>
                    <span className="text-[11px] font-medium text-white/60">Real-time surveillance active</span>
                    <button
                        onClick={() => window.location.reload()}
                        className={`text-white font-semibold text-xs py-1.5 px-4 rounded-xl transition-all shadow-md ${isMono ? 'bg-white/10 hover:bg-white/20 border border-white/25' : 'bg-white/15 hover:bg-white/25 border border-white/30'}`}
                    >
                        <FaSyncAlt size={20} />
                    </button>
                </div>
            </div>

        </div>
    );
}
