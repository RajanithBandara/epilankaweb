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

interface ChartDataPoint {
    period: string;
    year: number;
    week: number;
    [key: string]: string | number;
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

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams({ district_name: districtName });
                const res = await fetch(`/api/reports/historical-chart?${params.toString()}`);
                const result = await res.json().catch(() => null);
                if (!res.ok) {
                    throw new Error(result?.error || 'Failed to fetch historical data');
                }
                setData(result);
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

    // Extract all unique disease names from the data to render dynamic areas
    const diseaseKeys = useMemo(() => {
        const keys = new Set<string>();
        data.forEach(item => {
            Object.keys(item).forEach(k => {
                if (k !== 'period' && k !== 'year' && k !== 'week') {
                    keys.add(k);
                }
            });
        });
        return Array.from(keys);
    }, [data]);

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
                        Reported cases over time in {districtName}
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
                ) : data.length === 0 ? (
                    <div className="flex h-full w-full flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 rounded-2xl border flex items-center justify-center mb-3 shadow-sm border-slate-200 bg-slate-50 dark:border-white/5 dark:bg-white/5">
                            <Activity className="h-5 w-5 text-slate-400" />
                        </div>
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No historical data</p>
                        <p className="mt-1 text-xs text-slate-500">There are no localized disease records available over time.</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
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
        </div>
    );
}
