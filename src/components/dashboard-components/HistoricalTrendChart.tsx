'use client';

import { useEffect, useState, useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { Activity, AlertTriangle, TrendingUp } from 'lucide-react';
import { getDashboardCache, setDashboardCache } from '@/lib/dashboardCache';

interface ChartDataPoint {
    period: string;
    year: number;
    week: number;
    [key: string]: string | number;
}

interface TuberculosisPoint {
    period: string;
    value: number;
}

// Define a type for the tooltip payload entry
interface CustomTooltipPayload {
    color?: string;
    name?: string;
    value?: string | number;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: CustomTooltipPayload[];
    label?: string;
}

const HISTORICAL_CHART_CACHE_TTL_MS = 10 * 60 * 1000;
const TUBERCULOSIS_KEY_PATTERN = /(tuberculosis|\btb\b)/i;
const TUBERCULOSIS_PREVIEW_POINTS = 8;
const TARGET_HISTORY_YEAR = 2024;
const MAX_DISEASES_TO_SHOW = 3;

const COLORS = [
    '#3b82f6', // blue-500
    '#ec4899', // pink-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#8b5cf6', // violet-500
    '#ef4444', // red-500
    '#06b6d4', // cyan-500
];

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-xl border border-gray-200/50 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 p-3 shadow-xl backdrop-blur-md">
                <p className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</p>
                <div className="space-y-1.5">
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                            <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-slate-600 dark:text-slate-400 capitalize">
                                {entry.name}:
                            </span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                                {entry.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
}

export default function HistoricalTrendChart({ districtName }: { districtName: string }) {
    const [data, setData] = useState<ChartDataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!districtName) return;

        const cacheKey = `reports-historical-chart:${districtName}`;
        const cached = getDashboardCache<ChartDataPoint[]>(cacheKey, HISTORICAL_CHART_CACHE_TTL_MS);
        if (cached) {
            setData(cached);
            setError(null);
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams({ district_name: districtName });
                const res = await fetch(`/api/reports/historical-chart?${params.toString()}`);
                const result = await res.json().catch(() => null);
                if (!res.ok) {
                    setError(result?.error || 'Failed to fetch historical data');
                    setData([]);
                    return;
                }
                const nextData = result as ChartDataPoint[];
                setData(nextData);
                setDashboardCache(cacheKey, nextData);
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message || 'Error fetching chart data');
                } else {
                    setError('Error fetching chart data');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [districtName]);

    const filteredData = useMemo(() => {
        const yearFiltered = data.filter((item) => item.year === TARGET_HISTORY_YEAR);
        if (yearFiltered.length === 0) {
            return yearFiltered;
        }

        const diseaseTotals = new Map<string, number>();
        yearFiltered.forEach((item) => {
            Object.entries(item).forEach(([key, value]) => {
                if (key === 'period' || key === 'year' || key === 'week') {
                    return;
                }
                const numericValue = typeof value === 'number' ? value : Number(value) || 0;
                diseaseTotals.set(key, (diseaseTotals.get(key) ?? 0) + numericValue);
            });
        });

        const selectedDiseaseKeys = Array.from(diseaseTotals.entries())
            .sort((a, b) => {
                const totalDiff = b[1] - a[1];
                return totalDiff !== 0 ? totalDiff : a[0].localeCompare(b[0]);
            })
            .slice(0, MAX_DISEASES_TO_SHOW)
            .map(([key]) => key);

        return yearFiltered.map((item) => {
            const nextPoint: ChartDataPoint = {
                period: item.period,
                year: item.year,
                week: item.week,
            };

            selectedDiseaseKeys.forEach((diseaseKey) => {
                const rawValue = item[diseaseKey];
                nextPoint[diseaseKey] = typeof rawValue === 'number' ? rawValue : Number(rawValue) || 0;
            });

            return nextPoint;
        });
    }, [data]);

    // Extract all unique disease names from the data to render dynamic areas
    const diseaseKeys = useMemo(() => {
        const keys = new Set<string>();
        filteredData.forEach(item => {
            Object.keys(item).forEach(k => {
                if (k !== 'period' && k !== 'year' && k !== 'week') {
                    keys.add(k);
                }
            });
        });
        return Array.from(keys);
    }, [filteredData]);

    const tuberculosisSeries = useMemo<TuberculosisPoint[]>(() => {
        const tuberculosisKey = diseaseKeys.find((key) => TUBERCULOSIS_KEY_PATTERN.test(key));
        if (!tuberculosisKey) return [];

        return filteredData
            .map((item) => {
                const rawValue = item[tuberculosisKey];
                return {
                    period: item.period,
                    value: typeof rawValue === 'number' ? rawValue : Number(rawValue) || 0,
                };
            })
            .slice(-TUBERCULOSIS_PREVIEW_POINTS);
    }, [filteredData, diseaseKeys]);

    const tuberculosisTotal = useMemo(
        () => tuberculosisSeries.reduce((sum, point) => sum + point.value, 0),
        [tuberculosisSeries]
    );

    if (!districtName) return null;

    return (
        <div className="card-panel mt-6">
            <div className="card-panel-header">
                <div className="flex shrink-0 w-8 h-8 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/20">
                    <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold" style={{ color: "var(--dash-text-primary)" }}>
                        Historical Disease Trends
                    </h3>
                    <p className="text-xs" style={{ color: "var(--dash-text-muted)" }}>
                        Showing {TARGET_HISTORY_YEAR} only (top {MAX_DISEASES_TO_SHOW} diseases) in {districtName}
                    </p>
                </div>
            </div>

            <div className="p-4 sm:p-5 h-80 w-full relative group">
                {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-transparent z-10">
                        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-3"></div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium animate-pulse">Analyzing historical data...</p>
                    </div>
                ) : error ? (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center text-rose-500">
                        <AlertTriangle className="h-6 w-6 opacity-80" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="flex h-full w-full flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 rounded-2xl border flex items-center justify-center mb-3 shadow-sm border-slate-200 bg-slate-50 dark:border-white/5 dark:bg-white/5">
                            <Activity className="h-5 w-5 text-slate-400" />
                        </div>
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No 2024 historical data</p>
                        <p className="mt-1 text-xs text-slate-500">There are no localized disease records available for {TARGET_HISTORY_YEAR}.</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={filteredData}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                            <defs>
                                {diseaseKeys.map((key, index) => {
                                    const color = COLORS[index % COLORS.length];
                                    return (
                                        <linearGradient key={key} id={`color${index}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                                        </linearGradient>
                                    );
                                })}
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="currentColor"
                                className="text-slate-200 dark:text-slate-800 opacity-50"
                            />
                            <XAxis
                                dataKey="period"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: 'currentColor' }}
                                tickMargin={10}
                                className="text-slate-500 dark:text-slate-400"
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: 'currentColor' }}
                                tickMargin={10}
                                className="text-slate-500 dark:text-slate-400"
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                            <Legend
                                iconType="circle"
                                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                            />
                            {diseaseKeys.map((key, index) => {
                                const color = COLORS[index % COLORS.length];
                                return (
                                    <Area
                                        key={key}
                                        type="monotone"
                                        dataKey={key}
                                        stroke={color}
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill={`url(#color${index})`}
                                        activeDot={{ r: 4, strokeWidth: 0, fill: color }}
                                    />
                                );
                            })}
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>

            {!loading && !error && (
                <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                    <div
                        className="rounded-xl border p-3.5 sm:p-4"
                        style={{
                            background: 'var(--dash-card-bg)',
                            borderColor: 'var(--dash-card-border)',
                        }}
                    >
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <p className="text-sm font-semibold" style={{ color: 'var(--dash-text-primary)' }}>
                                Tuberculosis History
                            </p>
                            <span
                                className="text-xs font-semibold rounded-full px-2.5 py-1 border"
                                style={{
                                    color: 'var(--color-primary)',
                                    borderColor: 'rgba(30,58,138,0.22)',
                                    background: 'rgba(30,58,138,0.08)',
                                }}
                            >
                                Total: {tuberculosisTotal}
                            </span>
                        </div>

                        {tuberculosisSeries.length === 0 ? (
                            <p className="text-xs" style={{ color: 'var(--dash-text-muted)' }}>
                                No tuberculosis-specific records found in the current historical dataset.
                            </p>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {tuberculosisSeries.map((point) => (
                                    <div
                                        key={`tb-${point.period}`}
                                        className="rounded-lg border px-2.5 py-2"
                                        style={{
                                            borderColor: 'var(--dash-card-border)',
                                            background: 'var(--dash-card-header-bg)',
                                        }}
                                    >
                                        <p className="text-[11px] font-medium" style={{ color: 'var(--dash-text-muted)' }}>
                                            {point.period}
                                        </p>
                                        <p className="text-sm font-bold" style={{ color: 'var(--dash-text-primary)' }}>
                                            {point.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
