'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle,
    FileText,
    MapPin,
    RefreshCw,
    ShieldAlert,
    TrendingUp,
    Clock,
    ChevronRight,
    Activity,
    Zap,
} from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';
import HistoricalTrendChart from './HistoricalTrendChart';
import RiskAlertBanner from './RiskAlertBanner';
import { getDashboardCache, setDashboardCache } from '@/lib/dashboardCache';

type RiskLevel = 'safe' | 'low' | 'medium' | 'high';

interface RiskItem {
    disease_id: string | number;
    disease_name: string;
    level: RiskLevel;
    count: number;
}

const LOCATION_REPORTS_CACHE_TTL_MS = 2 * 60 * 1000;

interface LocationReport {
    report_id: string;
    description?: string;
    status?: string;
    created_at?: string;
    extracted_data?: {
        disease_name?: string;
    };
}

interface LocationReportsResponse {
    total: number;
    district?: string;
    reports: LocationReport[];
}

const levelRank: Record<RiskLevel, number> = { safe: 0, low: 1, medium: 2, high: 3 };

const levelConfig: Record<RiskLevel, {
    bg: string; text: string; border: string; dot: string; strip: string;
    darkBg: string; darkText: string; darkBorder: string;
}> = {
    safe: {
        bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', strip: 'bg-emerald-400',
        darkBg: 'dark:bg-emerald-500/10', darkText: 'dark:text-emerald-300', darkBorder: 'dark:border-emerald-500/25',
    },
    low: {
        bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500', strip: 'bg-blue-400',
        darkBg: 'dark:bg-blue-500/10', darkText: 'dark:text-blue-300', darkBorder: 'dark:border-blue-500/25',
    },
    medium: {
        bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', strip: 'bg-amber-400',
        darkBg: 'dark:bg-amber-500/10', darkText: 'dark:text-amber-300', darkBorder: 'dark:border-amber-500/25',
    },
    high: {
        bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500', strip: 'bg-rose-400',
        darkBg: 'dark:bg-rose-500/10', darkText: 'dark:text-rose-300', darkBorder: 'dark:border-rose-500/25',
    },
};

function Skeleton({ className = '' }: { className?: string }) {
    return (
        <div
            className={`rounded-lg animate-pulse ${className}`}
            style={{ background: "var(--dash-skeleton-bg)" }}
        />
    );
}

function StatCard({
    icon,
    iconGradient,
    label,
    value,
    sub,
    badge,
    accentClass,
    delay = '0ms',
    loading = false,
}: {
    icon: React.ReactNode;
    iconGradient: string;
    label: string;
    value: React.ReactNode;
    sub?: React.ReactNode;
    badge?: React.ReactNode;
    accentClass: string;
    delay?: string;
    loading?: boolean;
}) {
    return (
        <article
            className={`card-stat ${accentClass} group animate-fade-in-scale`}
            style={{ animationDelay: delay }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md bg-linear-to-br ${iconGradient}`}>
                    {icon}
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1 shrink-0 opacity-60 animate-pulse" />
            </div>
            <div className="mt-3.5">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--dash-text-muted)" }}>{label}</p>
                {loading ? (
                    <>
                        <Skeleton className="h-7 w-20 mb-1.5" />
                        <Skeleton className="h-3.5 w-28" />
                    </>
                ) : (
                    <>
                        <p className="text-2xl font-bold leading-tight" style={{ color: "var(--dash-text-primary)" }}>{value}</p>
                        {sub && <p className="text-xs mt-1 leading-snug" style={{ color: "var(--dash-text-secondary)" }}>{sub}</p>}
                        {badge && <div className="mt-2.5">{badge}</div>}
                    </>
                )}
            </div>
        </article>
    );
}

export default function DashboardHomeOverview() {
    const { locationData, isLoading, error, refetchLocation } = useLocation();
    const [reportsData, setReportsData] = useState<LocationReportsResponse | null>(null);
    const [reportsLoading, setReportsLoading] = useState(false);
    const [reportsError, setReportsError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const districtName = locationData?.nearest_area?.district_name;
    const provinceName = locationData?.nearest_area?.province_name;

    const fetchReportsForDistrict = useCallback(async (district: string, province?: string, forceRefresh = false) => {
        const cacheKey = `reports-location:${district}:${province || 'all'}:limit-5:days-30`;

        if (!forceRefresh) {
            const cached = getDashboardCache<LocationReportsResponse>(cacheKey, LOCATION_REPORTS_CACHE_TTL_MS);
            if (cached) {
                setReportsData(cached);
                setReportsError(null);
                setReportsLoading(false);
                return;
            }
        }

        setReportsLoading(true);
        setReportsError(null);
        try {
            const params = new URLSearchParams({ limit: '5', skip: '0', days: '30' });
            params.set('district_name', district);
            if (province?.trim()) params.set('province_name', province.trim());
            const response = await fetch(`/api/reports/location?${params.toString()}`);
            const payload = await response.json().catch(() => null);
            if (!response.ok) {
                setReportsError(payload?.error || 'Failed to fetch reports for current location');
                setReportsData(null);
                return;
            }
            const nextData = payload as LocationReportsResponse;
            setReportsData(nextData);
            setDashboardCache(cacheKey, nextData);
        } catch (fetchError: unknown) {
            setReportsError(fetchError instanceof Error ? fetchError.message : 'Failed to load local reports');
            setReportsData(null);
        } finally {
            setReportsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (districtName) fetchReportsForDistrict(districtName, provinceName);
    }, [districtName, provinceName, fetchReportsForDistrict]);

    const activeAlerts = useMemo<RiskItem[]>(() => {
        const riskLevels = (locationData?.nearest_area?.risk_levels ?? {}) as Record<string, RiskItem>;
        return Object.values(riskLevels)
            .filter((risk) => risk.level === 'high' || risk.level === 'medium')
            .sort((a, b) => {
                const severity = levelRank[b.level] - levelRank[a.level];
                return severity !== 0 ? severity : b.count - a.count;
            });
    }, [locationData]);

    const highestAlertLevel: RiskLevel = activeAlerts[0]?.level ?? 'safe';
    const lvl = levelConfig[highestAlertLevel];

    const onRefresh = async () => {
        setRefreshing(true);
        await refetchLocation();
        if (districtName) await fetchReportsForDistrict(districtName, provinceName, true);
        setRefreshing(false);
    };

    return (
        <section className="space-y-6">

            {/* ── Page heading ─────────────────────────────── */}
            <div className="flex flex-wrap items-start justify-between gap-3 pt-1">
                <div>
                    <div className="flex items-center gap-2.5 mb-1">
                        <div className="w-8 h-8 rounded-xl bg-linear-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-md shadow-blue-500/25">
                            <Activity className="h-4 w-4 text-white" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--dash-text-primary)" }}>
                            Situation Overview
                        </h1>
                    </div>
                    <p className="text-sm ml-[2.6rem]" style={{ color: "var(--dash-text-secondary)" }}>
                        Real-time location intelligence, report activity &amp; alerts.
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {districtName && !isLoading && (
                        <div className="flex items-center gap-1.5 rounded-full border border-blue-200 dark:border-blue-500/30
                            bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 animate-fade-in-scale">
                            <MapPin className="h-3.5 w-3.5" />
                            {districtName}
                        </div>
                    )}
                    <button
                        onClick={onRefresh}
                        disabled={refreshing || isLoading}
                        className="btn-secondary text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 disabled:opacity-60"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Refreshing…' : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* ── Error banner ──────────────────────────────── */}
            {(error || reportsError) && (
                <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 dark:border-rose-500/30
                    bg-rose-50 dark:bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300 animate-fade-in-scale">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{error || reportsError}</span>
                </div>
            )}

            {/* ── Stat cards ───────────────────────────────── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard
                    delay="0ms"
                    icon={<MapPin className="h-5 w-5" />}
                    iconGradient="from-blue-500 to-blue-600"
                    accentClass="card-stat-blue"
                    label="Current Location"
                    loading={isLoading}
                    value={locationData?.nearest_area?.district_name ?? '—'}
                    sub={locationData?.nearest_area?.province_name ?? 'No province data'}
                />
                <StatCard
                    delay="60ms"
                    icon={<FileText className="h-5 w-5" />}
                    iconGradient="from-violet-500 to-purple-600"
                    accentClass="card-stat-violet"
                    label="Reports (30 days)"
                    loading={isLoading || reportsLoading}
                    value={reportsLoading ? '…' : (reportsData?.total ?? 0)}
                    sub="Total area reports"
                />
                <StatCard
                    delay="120ms"
                    icon={<ShieldAlert className="h-5 w-5" />}
                    iconGradient="from-amber-500 to-orange-500"
                    accentClass="card-stat-amber"
                    label="Active Alerts"
                    loading={isLoading}
                    value={activeAlerts.length}
                    badge={
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold
                            ${lvl.bg} ${lvl.text} ${lvl.border} ${lvl.darkBg} ${lvl.darkText} ${lvl.darkBorder}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${lvl.dot}`} />
                            Highest: {highestAlertLevel}
                        </span>
                    }
                />
            </div>

            {/* ── Lower two-column grid ─────────────────────── */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

                {/* ── Alert section ──────────────────────────── */}
                <div className="card-panel">
                    <div className="card-panel-header">
                        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-linear-to-br from-amber-500 to-orange-500 shadow-md shadow-amber-500/20">
                            <Zap className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold" style={{ color: "var(--dash-text-primary)" }}>Alert Section</h3>
                            <p className="text-xs" style={{ color: "var(--dash-text-muted)" }}>Medium &amp; high-risk diseases nearby</p>
                        </div>
                        {activeAlerts.length > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 rounded-full
                                bg-rose-500 text-white text-[10px] font-bold px-1.5">
                                {activeAlerts.length}
                            </span>
                        )}
                    </div>

                    <div className="p-4 space-y-2">
                        {isLoading ? (
                            Array.from({ length: 2 }).map((_, i) => (
                                <Skeleton key={i} className="h-14 w-full" />
                            ))
                        ) : activeAlerts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <div
                                    className="w-12 h-12 rounded-2xl border flex items-center justify-center mb-3 shadow-sm"
                                    style={{ background: "var(--dash-card-bg)", borderColor: "var(--dash-card-border)" }}
                                >
                                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                                </div>
                                <p className="text-sm font-semibold" style={{ color: "var(--dash-text-primary)" }}>All clear in your area</p>
                                <p className="text-xs mt-1" style={{ color: "var(--dash-text-muted)" }}>No medium or high-risk alerts detected.</p>
                            </div>
                        ) : (
                            activeAlerts.map((alert) => {
                                const c = levelConfig[alert.level];
                                return (
                                    <div
                                        key={alert.disease_id}
                                        className={`relative flex items-center justify-between rounded-xl border
                                            px-4 py-3.5 overflow-hidden ${c.bg} ${c.border} ${c.darkBg} ${c.darkBorder}`}
                                    >
                                        <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${c.strip}`} />
                                        <div className="pl-2">
                                            <p className={`text-sm font-semibold ${c.text} ${c.darkText}`}>{alert.disease_name}</p>
                                            <p className={`text-xs mt-0.5 opacity-75 ${c.text} ${c.darkText}`}>
                                                {alert.count} detected {alert.count === 1 ? 'case' : 'cases'}
                                            </p>
                                        </div>
                                        <span className={`inline-flex items-center gap-1 rounded-full border
                                            px-2.5 py-1 text-xs font-bold ${c.bg} ${c.text} ${c.border} ${c.darkBg} ${c.darkText} ${c.darkBorder}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                                            {alert.level}
                                        </span>
                                    </div>
                                );
                            })
                        )}

                        {locationData?.warning && (
                            <div className="mt-2 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-3
                                text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                                <span>{locationData.warning}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Recent Reports ─────────────────────────── */}
                <div className="card-panel">
                    <div className="card-panel-header">
                        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-linear-to-br from-blue-500 to-blue-600 shadow-md shadow-blue-500/20">
                            <Clock className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold" style={{ color: "var(--dash-text-primary)" }}>Recent Reports</h3>
                            <p className="text-xs" style={{ color: "var(--dash-text-muted)" }}>
                                {districtName ? `In ${districtName}` : 'Your area'}
                            </p>
                        </div>
                        {(reportsData?.total ?? 0) > 0 && (
                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10
                                border border-blue-200 dark:border-blue-500/25 rounded-full px-2.5 py-1">
                                {reportsData?.total} total
                            </span>
                        )}
                    </div>

                    <div className="p-4 space-y-2">
                        {reportsLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full" />
                            ))
                        ) : (reportsData?.reports?.length ?? 0) === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <div
                                    className="w-12 h-12 rounded-2xl border flex items-center justify-center mb-3 shadow-sm"
                                    style={{ background: "var(--dash-card-bg)", borderColor: "var(--dash-card-border)" }}
                                >
                                    <FileText className="h-5 w-5" style={{ color: "var(--dash-text-muted)" }} />
                                </div>
                                <p className="text-sm font-semibold" style={{ color: "var(--dash-text-secondary)" }}>No recent reports</p>
                                <p className="text-xs mt-1" style={{ color: "var(--dash-text-muted)" }}>Nothing submitted for this location yet.</p>
                            </div>
                        ) : (
                            reportsData?.reports.map((report, idx) => (
                                <div
                                    key={report.report_id}
                                    className="flex items-start gap-3 rounded-xl border px-4 py-3
                                        hover:border-blue-200 dark:hover:border-blue-500/30
                                        hover:shadow-sm transition-all duration-150 group animate-fade-in-scale cursor-pointer"
                                    style={{
                                        background: "var(--dash-card-bg)",
                                        borderColor: "var(--dash-card-border)",
                                        animationDelay: `${idx * 40}ms`,
                                    }}
                                    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.background = "var(--dash-nav-hover-bg)")}
                                    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.background = "var(--dash-card-bg)")}
                                >
                                    <div className="mt-1 w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0 ring-2 ring-blue-100 dark:ring-blue-400/20" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate" style={{ color: "var(--dash-text-primary)" }}>
                                            {report.extracted_data?.disease_name || 'Unspecified disease'}
                                        </p>
                                        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--dash-text-secondary)" }}>
                                            {report.description || 'No description provided'}
                                        </p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 mt-0.5 shrink-0 transition-colors group-hover:text-blue-400"
                                        style={{ color: "var(--dash-text-muted)" }} />
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* ── Historical Trends Chart ─────────────────────── */}
            <div className="animate-fade-in-scale" style={{ animationDelay: '200ms' }}>
                <HistoricalTrendChart districtName={districtName || ''} />
            </div>

        </section>
    );
}
