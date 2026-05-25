'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
    Search,
    MapPin,
    AlertTriangle,
    Shield,
    Activity,
    BarChart3,
    Clock,
    FileText,
    Loader2,
    CheckCircle2,
    Telescope,
    ChevronDown,
    Lock,
} from 'lucide-react';
import { DatePicker } from '@/components/ui/datepicker';

/* ── Types ──────────────────────────────────────────────────────────────── */

type RiskLevel = 'safe' | 'low' | 'medium' | 'high';
type CERIRiskLevel = 'low' | 'moderate' | 'high' | 'critical';

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

interface AllDistrictsResponse {
    districts: District[];
    data_period?: string;
    selected_date?: string;
}

interface CERIScore {
    risk_id: string;
    disease_id: number;
    disease_name: string;
    district_id: number;
    district_name: string;
    week_number: number;
    year: number;
    risk_level: CERIRiskLevel;
    risk_score: number;
    calculated_at: string | null;
}

interface RiskScoresResponse {
    count: number;
    scores: CERIScore[];
}

interface ExtractedData {
    disease_name?: string | null;
    severity?: string;
    cases_reported?: number | null;
}

interface AreaReport {
    report_id: string;
    description?: string;
    status?: string | null;
    score?: number;
    created_at?: string;
    extracted_data?: ExtractedData | null;
}

interface AreaReportsResponse {
    total?: number;
    district?: string;
    reports: AreaReport[];
}

/* ── Style helpers ──────────────────────────────────────────────────────── */

const riskConfig: Record<RiskLevel, {
    bg: string; text: string; border: string; dot: string; strip: string;
    darkBg: string; darkText: string; darkBorder: string; gradient: string;
}> = {
    safe: {
        bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200',
        dot: 'bg-emerald-500', strip: 'bg-emerald-400',
        darkBg: 'dark:bg-emerald-500/10', darkText: 'dark:text-emerald-300', darkBorder: 'dark:border-emerald-500/25',
        gradient: 'from-emerald-500 to-emerald-600',
    },
    low: {
        bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200',
        dot: 'bg-blue-500', strip: 'bg-blue-400',
        darkBg: 'dark:bg-blue-500/10', darkText: 'dark:text-blue-300', darkBorder: 'dark:border-blue-500/25',
        gradient: 'from-blue-500 to-blue-600',
    },
    medium: {
        bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200',
        dot: 'bg-amber-500', strip: 'bg-amber-400',
        darkBg: 'dark:bg-amber-500/10', darkText: 'dark:text-amber-300', darkBorder: 'dark:border-amber-500/25',
        gradient: 'from-amber-500 to-orange-500',
    },
    high: {
        bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200',
        dot: 'bg-rose-500', strip: 'bg-rose-400',
        darkBg: 'dark:bg-rose-500/10', darkText: 'dark:text-rose-300', darkBorder: 'dark:border-rose-500/25',
        gradient: 'from-rose-500 to-rose-600',
    },
};

const ceriConfig: Record<CERIRiskLevel, { bg: string; text: string; border: string; dot: string; darkBg: string; darkText: string; darkBorder: string; gradient: string }> = {
    low: {
        bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500',
        darkBg: 'dark:bg-emerald-500/10', darkText: 'dark:text-emerald-300', darkBorder: 'dark:border-emerald-500/25',
        gradient: 'from-emerald-500 to-emerald-600',
    },
    moderate: {
        bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500',
        darkBg: 'dark:bg-amber-500/10', darkText: 'dark:text-amber-300', darkBorder: 'dark:border-amber-500/25',
        gradient: 'from-amber-500 to-orange-500',
    },
    high: {
        bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500',
        darkBg: 'dark:bg-orange-500/10', darkText: 'dark:text-orange-300', darkBorder: 'dark:border-orange-500/25',
        gradient: 'from-orange-500 to-red-500',
    },
    critical: {
        bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500',
        darkBg: 'dark:bg-rose-500/10', darkText: 'dark:text-rose-300', darkBorder: 'dark:border-rose-500/25',
        gradient: 'from-rose-500 to-rose-600',
    },
};

const riskRank: Record<RiskLevel, number> = { safe: 0, low: 1, medium: 2, high: 3 };
const ceriRank: Record<CERIRiskLevel, number> = { low: 0, moderate: 1, high: 2, critical: 3 };

function formatRelativeTime(iso?: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const diffMs = Date.now() - d.getTime();
    const sec = Math.round(diffMs / 1000);
    if (sec < 60) return 'just now';
    const min = Math.round(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.round(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const days = Math.round(hr / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ── Component ──────────────────────────────────────────────────────────── */

export default function ResearchPanel() {
    const [districts, setDistricts] = useState<District[]>([]);
    const [districtsLoading, setDistrictsLoading] = useState(true);
    const [districtsError, setDistrictsError] = useState<string | null>(null);

    const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    const [researching, setResearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    const [areaDetail, setAreaDetail] = useState<District | null>(null);
    const [ceriScores, setCeriScores] = useState<CERIScore[]>([]);
    const [areaReports, setAreaReports] = useState<AreaReport[]>([]);
    const [reportsTotal, setReportsTotal] = useState<number>(0);

    // Initial fetch of district list for the dropdown
    useEffect(() => {
        let cancelled = false;
        async function fetchDistricts() {
            try {
                setDistrictsLoading(true);
                const res = await fetch('/api/map/alldistricts');
                if (!res.ok) throw new Error(`Failed to load areas (${res.status})`);
                const data = (await res.json()) as AllDistrictsResponse;
                if (cancelled) return;
                const sorted = [...(data.districts || [])].sort((a, b) =>
                    a.district_name.localeCompare(b.district_name)
                );
                setDistricts(sorted);
            } catch (err) {
                if (!cancelled) {
                    setDistrictsError(err instanceof Error ? err.message : 'Failed to load areas');
                }
            } finally {
                if (!cancelled) setDistrictsLoading(false);
            }
        }
        void fetchDistricts();
        return () => {
            cancelled = true;
        };
    }, []);

    const selectedDistrict = useMemo(
        () => districts.find((d) => String(d.district_id) === selectedDistrictId) ?? null,
        [districts, selectedDistrictId]
    );

    const handleResearch = useCallback(async () => {
        if (!selectedDistrict) {
            setSearchError('Please select an area first.');
            return;
        }
        setResearching(true);
        setSearchError(null);
        setAreaDetail(null);
        setCeriScores([]);
        setAreaReports([]);
        setReportsTotal(0);

        const targetDate = format(selectedDate, 'yyyy-MM-dd');

        try {
            const [allRes, ceriRes, reportsRes] = await Promise.all([
                fetch(`/api/map/alldistricts?target_date=${targetDate}`),
                fetch(`/api/reports/risk-scores?district_id=${selectedDistrict.district_id}`),
                fetch(
                    `/api/reports/location?district_name=${encodeURIComponent(selectedDistrict.district_name)}` +
                        `&province_name=${encodeURIComponent(selectedDistrict.province_name)}&days=30&limit=50`
                ),
            ]);

            if (allRes.ok) {
                const allData = (await allRes.json()) as AllDistrictsResponse;
                const match = (allData.districts || []).find(
                    (d) => d.district_id === selectedDistrict.district_id
                );
                setAreaDetail(match ?? selectedDistrict);
            } else {
                setAreaDetail(selectedDistrict);
            }

            if (ceriRes.ok) {
                const ceriData = (await ceriRes.json()) as RiskScoresResponse;
                setCeriScores(ceriData.scores || []);
            }

            if (reportsRes.ok) {
                const reportData = (await reportsRes.json()) as AreaReportsResponse;
                setAreaReports(reportData.reports || []);
                setReportsTotal(reportData.total ?? reportData.reports?.length ?? 0);
            }
        } catch (err) {
            setSearchError(err instanceof Error ? err.message : 'Research failed. Please try again.');
        } finally {
            setResearching(false);
        }
    }, [selectedDistrict, selectedDate]);

    /* ── Derived: overall risk + active disease list ───────────────────── */

    const overallRisk: RiskLevel = useMemo(() => {
        if (!areaDetail) return 'safe';
        return Object.values(areaDetail.risk_levels).reduce<RiskLevel>(
            (max, d) => (d.count > 0 && riskRank[d.level] > riskRank[max] ? d.level : max),
            'safe'
        );
    }, [areaDetail]);

    const activeRiskList = useMemo(() => {
        if (!areaDetail) return [] as DiseaseRisk[];
        return Object.values(areaDetail.risk_levels)
            .filter((d) => d.count > 0)
            .sort((a, b) => {
                const p = riskRank[b.level] - riskRank[a.level];
                return p !== 0 ? p : b.count - a.count;
            });
    }, [areaDetail]);

    const elevatedCeri = useMemo(
        () => ceriScores.filter((s) => ceriRank[s.risk_level] >= 1).sort((a, b) => b.risk_score - a.risk_score),
        [ceriScores]
    );

    const highestCeri: CERIRiskLevel = elevatedCeri[0]?.risk_level ?? 'low';
    const overallCfg = riskConfig[overallRisk];
    const ceriCfg = ceriConfig[highestCeri];

    const hasResearched = areaDetail !== null;

    return (
        <section className="space-y-6">
            {/* ── Page heading ─────────────────────────────────── */}
            <div className="flex flex-wrap items-start justify-between gap-3 pt-1">
                <div>
                    <div className="flex items-center gap-2.5 mb-1">
                        <div className="w-8 h-8 rounded-xl bg-linear-to-br from-violet-600 to-blue-700 flex items-center justify-center shadow-md shadow-violet-500/25">
                            <Telescope className="h-4 w-4 text-white" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--dash-text-primary)' }}>
                            Area Research
                        </h1>
                    </div>
                    <p className="text-sm ml-[2.6rem]" style={{ color: 'var(--dash-text-secondary)' }}>
                        Look up the CERI level, reports, and disease risk for any district.
                    </p>
                </div>
            </div>

            {/* ── Search form ─────────────────────────────────── */}
            <div
                className="rounded-2xl border p-4 sm:p-5"
                style={{ background: 'var(--dash-card-bg)', borderColor: 'var(--dash-card-border)' }}
            >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
                    {/* Area select */}
                    <div className="space-y-1.5">
                        <label
                            className="text-[11px] font-bold uppercase tracking-wider"
                            style={{ color: 'var(--dash-text-muted)' }}
                        >
                            Area
                        </label>
                        <div className="relative">
                            <MapPin
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                                style={{ color: 'var(--dash-text-muted)' }}
                            />
                            <select
                                value={selectedDistrictId}
                                onChange={(e) => setSelectedDistrictId(e.target.value)}
                                disabled={districtsLoading}
                                className="w-full appearance-none rounded-xl border pl-9 pr-9 py-2.5 text-sm outline-none disabled:opacity-60"
                                style={{
                                    background: 'var(--dash-input-bg)',
                                    borderColor: 'var(--dash-input-border)',
                                    color: 'var(--dash-input-text)',
                                }}
                            >
                                <option value="">
                                    {districtsLoading ? 'Loading areas…' : 'Select a district'}
                                </option>
                                {districts.map((d) => (
                                    <option key={d.district_id} value={d.district_id}>
                                        {d.district_name} — {d.province_name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown
                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4"
                                style={{ color: 'var(--dash-text-muted)' }}
                            />
                        </div>
                    </div>

                    {/* Date picker (optional, default today) */}
                    <div className="space-y-1.5">
                        <label
                            className="text-[11px] font-bold uppercase tracking-wider"
                            style={{ color: 'var(--dash-text-muted)' }}
                        >
                            Date <span className="font-normal lowercase opacity-70">(optional · today by default)</span>
                        </label>
                        <DatePicker
                            date={selectedDate}
                            onDateChange={setSelectedDate}
                            className="rounded-xl"
                        />
                    </div>

                    {/* Research button */}
                    <button
                        onClick={() => void handleResearch()}
                        disabled={researching || !selectedDistrictId}
                        className="group inline-flex h-[42px] items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{
                            background:
                                'linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%)',
                        }}
                    >
                        {researching ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" /> Researching…
                            </>
                        ) : (
                            <>
                                <Search className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Research
                            </>
                        )}
                    </button>
                </div>

                {districtsError && (
                    <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: 'var(--color-danger)' }}>
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {districtsError}
                    </div>
                )}
                {searchError && (
                    <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: 'var(--color-danger)' }}>
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {searchError}
                    </div>
                )}
            </div>

            {/* ── Empty state ─────────────────────────────────── */}
            {!hasResearched && !researching && (
                <div
                    className="rounded-2xl border border-dashed px-6 py-12 text-center"
                    style={{ background: 'var(--dash-card-bg)', borderColor: 'var(--dash-card-border)' }}
                >
                    <div
                        className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border"
                        style={{
                            background: 'var(--dash-card-header-bg)',
                            borderColor: 'var(--dash-card-border)',
                        }}
                    >
                        <Telescope className="h-5 w-5" style={{ color: 'var(--dash-text-muted)' }} />
                    </div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--dash-text-primary)' }}>
                        Pick an area to start researching
                    </p>
                    <p className="mx-auto mt-1 max-w-md text-xs" style={{ color: 'var(--dash-text-muted)' }}>
                        Choose a district and (optionally) a date, then hit Research to see the CERI level,
                        published reports, and overall disease risk for that area.
                    </p>
                </div>
            )}

            {/* ── Loading state ───────────────────────────────── */}
            {researching && (
                <div
                    className="rounded-2xl border px-6 py-12 text-center"
                    style={{ background: 'var(--dash-card-bg)', borderColor: 'var(--dash-card-border)' }}
                >
                    <Loader2
                        className="mx-auto h-6 w-6 animate-spin"
                        style={{ color: 'var(--color-primary)' }}
                    />
                    <p className="mt-3 text-sm font-semibold" style={{ color: 'var(--dash-text-primary)' }}>
                        Gathering intelligence for {selectedDistrict?.district_name}…
                    </p>
                </div>
            )}

            {/* ── Results ─────────────────────────────────────── */}
            {hasResearched && !researching && areaDetail && (
                <>
                    {/* Area summary card */}
                    <div
                        className={`rounded-2xl border overflow-hidden ${overallCfg.border} ${overallCfg.darkBorder}`}
                        style={{ background: 'var(--dash-card-bg)' }}
                    >
                        <div
                            className={`px-5 py-4 flex flex-wrap items-center gap-3 border-b ${overallCfg.bg} ${overallCfg.darkBg} ${overallCfg.border} ${overallCfg.darkBorder}`}
                        >
                            <div
                                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${overallCfg.gradient} flex items-center justify-center text-white shadow-md`}
                            >
                                <MapPin className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2
                                    className={`text-base font-bold ${overallCfg.text} ${overallCfg.darkText}`}
                                >
                                    {areaDetail.district_name}
                                </h2>
                                <p
                                    className={`text-xs opacity-75 ${overallCfg.text} ${overallCfg.darkText}`}
                                >
                                    {areaDetail.province_name} · Week {areaDetail.week_number}, {areaDetail.year} ·{' '}
                                    {format(selectedDate, 'PP')}
                                </p>
                            </div>
                            <span
                                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold capitalize ${overallCfg.bg} ${overallCfg.text} ${overallCfg.border} ${overallCfg.darkBg} ${overallCfg.darkText} ${overallCfg.darkBorder}`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${overallCfg.dot}`} />
                                {overallRisk} risk
                            </span>
                        </div>

                        <div className="p-4 sm:p-5">
                            <p
                                className="text-[10px] font-bold uppercase tracking-widest mb-3"
                                style={{ color: 'var(--dash-text-muted)' }}
                            >
                                Active Pathogens
                            </p>
                            {activeRiskList.length === 0 ? (
                                <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 dark:border-emerald-500/25 bg-emerald-50/60 dark:bg-emerald-500/5 px-4 py-3">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                    <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                                        No active disease activity for this area on the selected date.
                                    </span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    {activeRiskList.map((risk) => {
                                        const c = riskConfig[risk.level];
                                        return (
                                            <div
                                                key={risk.disease_id}
                                                className={`relative flex items-center justify-between rounded-xl border px-4 py-3 overflow-hidden ${c.bg} ${c.border} ${c.darkBg} ${c.darkBorder}`}
                                            >
                                                <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${c.strip}`} />
                                                <div className="pl-2 min-w-0">
                                                    <p className={`text-sm font-semibold truncate ${c.text} ${c.darkText}`}>
                                                        {risk.disease_name}
                                                    </p>
                                                    <p className={`text-xs mt-0.5 opacity-75 ${c.text} ${c.darkText}`}>
                                                        {risk.count} projected {risk.count === 1 ? 'case' : 'cases'}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${c.bg} ${c.text} ${c.border} ${c.darkBg} ${c.darkText} ${c.darkBorder}`}
                                                >
                                                    <span className={`w-1 h-1 rounded-full ${c.dot}`} />
                                                    {risk.level}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CERI section */}
                    <div
                        className={`rounded-2xl border overflow-hidden ${ceriCfg.border} ${ceriCfg.darkBorder}`}
                        style={{ background: 'var(--dash-card-bg)' }}
                    >
                        <div
                            className={`px-5 py-4 flex items-center gap-3 border-b ${ceriCfg.bg} ${ceriCfg.darkBg} ${ceriCfg.border} ${ceriCfg.darkBorder}`}
                        >
                            <div
                                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${ceriCfg.gradient} flex items-center justify-center text-white shadow-md`}
                            >
                                <Activity className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className={`text-sm font-bold ${ceriCfg.text} ${ceriCfg.darkText}`}>
                                    CERI Risk Assessment
                                </h3>
                                <p className={`text-[11px] mt-0.5 opacity-70 ${ceriCfg.text} ${ceriCfg.darkText}`}>
                                    {elevatedCeri.length > 0
                                        ? `${elevatedCeri.length} elevated risk${elevatedCeri.length === 1 ? '' : 's'} detected · Algorithm-powered`
                                        : 'All clear — no elevated CERI signals'}
                                </p>
                            </div>
                            {elevatedCeri.length > 0 && (
                                <span
                                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold capitalize ${ceriCfg.bg} ${ceriCfg.text} ${ceriCfg.border} ${ceriCfg.darkBg} ${ceriCfg.darkText} ${ceriCfg.darkBorder}`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${ceriCfg.dot}`} />
                                    {highestCeri}
                                </span>
                            )}
                        </div>

                        <div className="p-3 sm:p-4 space-y-2">
                            {elevatedCeri.length === 0 ? (
                                <div className="flex items-center gap-2.5 px-2 py-3">
                                    <Shield className="h-4 w-4 text-emerald-600" />
                                    <span className="text-sm" style={{ color: 'var(--dash-text-secondary)' }}>
                                        No elevated CERI risks detected for this district.
                                    </span>
                                </div>
                            ) : (
                                elevatedCeri.map((score) => {
                                    const cfg = ceriConfig[score.risk_level];
                                    return (
                                        <div
                                            key={score.risk_id}
                                            className={`relative flex items-center gap-3 rounded-xl border px-4 py-3 overflow-hidden ${cfg.bg} ${cfg.border} ${cfg.darkBg} ${cfg.darkBorder}`}
                                        >
                                            <div
                                                className={`shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br ${cfg.gradient} flex items-center justify-center text-white shadow-sm`}
                                            >
                                                <BarChart3 className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <p
                                                        className={`text-sm font-semibold ${cfg.text} ${cfg.darkText}`}
                                                    >
                                                        {score.disease_name}
                                                    </p>
                                                    <span
                                                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.text} ${cfg.border} ${cfg.darkBg} ${cfg.darkText} ${cfg.darkBorder}`}
                                                    >
                                                        <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
                                                        {score.risk_level}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2.5 w-full">
                                                    <div className="flex-1 h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-white/5">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-700 ease-out ${cfg.dot}`}
                                                            style={{
                                                                width: `${Math.min(100, Math.max(2, score.risk_score))}%`,
                                                            }}
                                                        />
                                                    </div>
                                                    <span
                                                        className={`text-xs font-bold tabular-nums min-w-[2.5rem] text-right ${cfg.text} ${cfg.darkText}`}
                                                    >
                                                        {score.risk_score.toFixed(1)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p
                                                    className={`text-lg font-bold tabular-nums leading-tight ${cfg.text} ${cfg.darkText}`}
                                                >
                                                    {score.risk_score.toFixed(0)}
                                                </p>
                                                <p className={`text-[10px] opacity-60 ${cfg.text} ${cfg.darkText}`}>
                                                    CERI
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Reports section (READ ONLY — voting blocked) */}
                    <div
                        className="rounded-2xl border overflow-hidden"
                        style={{ background: 'var(--dash-card-bg)', borderColor: 'var(--dash-card-border)' }}
                    >
                        <div
                            className="px-5 py-4 flex items-center gap-3 border-b"
                            style={{
                                background: 'var(--dash-card-header-bg)',
                                borderColor: 'var(--dash-card-border)',
                            }}
                        >
                            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-md">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3
                                    className="text-sm font-bold"
                                    style={{ color: 'var(--dash-text-primary)' }}
                                >
                                    Community Reports
                                </h3>
                                <p className="text-[11px] mt-0.5" style={{ color: 'var(--dash-text-muted)' }}>
                                    {areaReports.length > 0
                                        ? `${reportsTotal || areaReports.length} report${(reportsTotal || areaReports.length) === 1 ? '' : 's'} in the past 30 days`
                                        : 'No recent submissions for this area'}
                                </p>
                            </div>
                            <span
                                className="inline-flex items-center gap-1.5 rounded-full border bg-slate-100/70 dark:bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                                style={{
                                    borderColor: 'var(--dash-card-border)',
                                    color: 'var(--dash-text-muted)',
                                }}
                                title="Voting is disabled in research mode"
                            >
                                <Lock className="h-3 w-3" />
                                Read only
                            </span>
                        </div>

                        <div className="p-3 sm:p-4 space-y-2">
                            {areaReports.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <div
                                        className="w-11 h-11 rounded-2xl border flex items-center justify-center mb-3 shadow-sm"
                                        style={{
                                            background: 'var(--dash-card-bg)',
                                            borderColor: 'var(--dash-card-border)',
                                        }}
                                    >
                                        <FileText
                                            className="h-5 w-5"
                                            style={{ color: 'var(--dash-text-muted)' }}
                                        />
                                    </div>
                                    <p
                                        className="text-sm font-semibold"
                                        style={{ color: 'var(--dash-text-secondary)' }}
                                    >
                                        No reports in this area
                                    </p>
                                    <p className="text-xs mt-1" style={{ color: 'var(--dash-text-muted)' }}>
                                        Nothing submitted for this district within the last 30 days.
                                    </p>
                                </div>
                            ) : (
                                areaReports.map((r) => (
                                    <article
                                        key={r.report_id}
                                        className="rounded-xl border px-4 py-3"
                                        style={{
                                            background: 'var(--dash-card-bg)',
                                            borderColor: 'var(--dash-card-border)',
                                        }}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <p
                                                        className="text-sm font-semibold truncate"
                                                        style={{ color: 'var(--dash-text-primary)' }}
                                                    >
                                                        {r.extracted_data?.disease_name || 'Unspecified disease'}
                                                    </p>
                                                    {r.status && (
                                                        <span
                                                            className="inline-flex items-center rounded-full border bg-slate-100/70 dark:bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                                                            style={{
                                                                borderColor: 'var(--dash-card-border)',
                                                                color: 'var(--dash-text-secondary)',
                                                            }}
                                                        >
                                                            {r.status}
                                                        </span>
                                                    )}
                                                </div>
                                                <p
                                                    className="text-xs line-clamp-3"
                                                    style={{ color: 'var(--dash-text-secondary)' }}
                                                >
                                                    {r.description || 'No description provided.'}
                                                </p>
                                                <div
                                                    className="mt-2 flex flex-wrap items-center gap-3 text-[11px]"
                                                    style={{ color: 'var(--dash-text-muted)' }}
                                                >
                                                    {r.created_at && (
                                                        <span className="inline-flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {formatRelativeTime(r.created_at)}
                                                        </span>
                                                    )}
                                                    {typeof r.score === 'number' && (
                                                        <span className="inline-flex items-center gap-1">
                                                            <BarChart3 className="h-3 w-3" />
                                                            {r.score} {r.score === 1 ? 'vote' : 'votes'}
                                                        </span>
                                                    )}
                                                    {r.extracted_data?.cases_reported != null && (
                                                        <span className="inline-flex items-center gap-1">
                                                            <Activity className="h-3 w-3" />
                                                            {r.extracted_data.cases_reported} cases
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                ))
                            )}
                        </div>

                        {areaReports.length > 0 && (
                            <div
                                className="px-4 py-2.5 border-t flex items-center gap-2 text-[11px]"
                                style={{
                                    borderColor: 'var(--dash-card-border)',
                                    color: 'var(--dash-text-muted)',
                                }}
                            >
                                <Lock className="h-3 w-3" />
                                Voting is disabled on the research page. Use the Submit Report page to contribute.
                            </div>
                        )}
                    </div>
                </>
            )}
        </section>
    );
}
