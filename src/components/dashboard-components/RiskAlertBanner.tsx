'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Shield,
    AlertTriangle,
    TrendingUp,
    ChevronDown,
    ChevronUp,
    Activity,
    BarChart3,
    ThumbsUp,
    Zap,
    RefreshCw,
} from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';
import { getDashboardCache, setDashboardCache } from '@/lib/dashboardCache';

/* ── Types ──────────────────────────────────────────────────────────────── */

interface CERIScore {
    risk_id: string;
    disease_id: number;
    disease_name: string;
    district_id: number;
    district_name: string;
    week_number: number;
    year: number;
    risk_level: 'low' | 'moderate' | 'high' | 'critical';
    risk_score: number;
    calculated_at: string | null;
}

interface RiskScoresResponse {
    count: number;
    scores: CERIScore[];
}

type CERIRiskLevel = 'low' | 'moderate' | 'high' | 'critical';

/* ── Design tokens ──────────────────────────────────────────────────────── */

const CACHE_KEY_PREFIX = 'ceri-risk-scores';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const riskConfig: Record<CERIRiskLevel, {
    bg: string; text: string; border: string; dot: string; strip: string;
    darkBg: string; darkText: string; darkBorder: string;
    icon: React.ReactNode; label: string; gradient: string;
}> = {
    low: {
        bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200',
        dot: 'bg-emerald-500', strip: 'bg-emerald-400',
        darkBg: 'dark:bg-emerald-500/10', darkText: 'dark:text-emerald-300', darkBorder: 'dark:border-emerald-500/25',
        icon: <Shield className="h-4 w-4" />, label: 'Low Risk',
        gradient: 'from-emerald-500 to-emerald-600',
    },
    moderate: {
        bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200',
        dot: 'bg-amber-500', strip: 'bg-amber-400',
        darkBg: 'dark:bg-amber-500/10', darkText: 'dark:text-amber-300', darkBorder: 'dark:border-amber-500/25',
        icon: <AlertTriangle className="h-4 w-4" />, label: 'Moderate Risk',
        gradient: 'from-amber-500 to-orange-500',
    },
    high: {
        bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200',
        dot: 'bg-orange-500', strip: 'bg-orange-400',
        darkBg: 'dark:bg-orange-500/10', darkText: 'dark:text-orange-300', darkBorder: 'dark:border-orange-500/25',
        icon: <Zap className="h-4 w-4" />, label: 'High Risk',
        gradient: 'from-orange-500 to-red-500',
    },
    critical: {
        bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200',
        dot: 'bg-rose-500', strip: 'bg-rose-400',
        darkBg: 'dark:bg-rose-500/10', darkText: 'dark:text-rose-300', darkBorder: 'dark:border-rose-500/25',
        icon: <AlertTriangle className="h-4 w-4" />, label: 'Critical Risk',
        gradient: 'from-rose-500 to-rose-600',
    },
};

const riskOrder: Record<CERIRiskLevel, number> = { low: 0, moderate: 1, high: 2, critical: 3 };

/* ── Score bar ──────────────────────────────────────────────────────────── */

function ScoreBar({ score, level }: { score: number; level: CERIRiskLevel }) {
    const cfg = riskConfig[level];
    return (
        <div className="flex items-center gap-2.5 w-full">
            <div className="flex-1 h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-white/5">
                <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${cfg.dot}`}
                    style={{ width: `${Math.min(100, Math.max(2, score))}%` }}
                />
            </div>
            <span className={`text-xs font-bold tabular-nums min-w-[2.5rem] text-right ${cfg.text} ${cfg.darkText}`}>
                {score.toFixed(1)}
            </span>
        </div>
    );
}

/* ── Main Component ─────────────────────────────────────────────────────── */

export default function RiskAlertBanner() {
    const { locationData, isLoading: locationLoading } = useLocation();
    const [scores, setScores] = useState<CERIScore[]>([]);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const districtId = locationData?.nearest_area?.district_id;
    const districtName = locationData?.nearest_area?.district_name;

    const fetchRiskScores = useCallback(async (distId?: number | string, forceRefresh = false) => {
        const cacheKey = `${CACHE_KEY_PREFIX}:${distId || 'all'}`;

        if (!forceRefresh) {
            const cached = getDashboardCache<RiskScoresResponse>(cacheKey, CACHE_TTL_MS);
            if (cached) {
                setScores(cached.scores || []);
                setError(null);
                return;
            }
        }

        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (distId) params.set('district_id', String(distId));
            const res = await fetch(`/api/reports/risk-scores?${params.toString()}`);
            const data = await res.json().catch(() => null);
            if (!res.ok) {
                setError(data?.error || 'Failed to fetch risk scores');
                return;
            }
            const payload = data as RiskScoresResponse;
            setScores(payload.scores || []);
            setDashboardCache(cacheKey, payload);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load risk scores');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!locationLoading) {
            fetchRiskScores(districtId);
        }
    }, [districtId, locationLoading, fetchRiskScores]);

    // Only show elevated risks (moderate, high, critical)
    const elevatedScores = useMemo(() =>
        scores
            .filter(s => riskOrder[s.risk_level] >= 1)
            .sort((a, b) => b.risk_score - a.risk_score),
        [scores]
    );

    const highestLevel: CERIRiskLevel = elevatedScores[0]?.risk_level ?? 'low';

    if (locationLoading || loading) {
        return (
            <div className="rounded-2xl border p-4 animate-pulse"
                style={{ background: 'var(--dash-card-bg)', borderColor: 'var(--dash-card-border)' }}>
                <div className="h-5 w-48 rounded-lg mb-2" style={{ background: 'var(--dash-skeleton-bg)' }} />
                <div className="h-3 w-64 rounded-lg" style={{ background: 'var(--dash-skeleton-bg)' }} />
            </div>
        );
    }

    if (error) return null; // Silently fail — don't block the dashboard
    if (elevatedScores.length === 0) {
        // All clear — show a subtle positive indicator
        return (
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/25
                bg-emerald-50/50 dark:bg-emerald-500/5 p-4 flex items-center gap-3 animate-fade-in-scale">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600
                    flex items-center justify-center shadow-md shadow-emerald-500/20">
                    <Shield className="h-4.5 w-4.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                        CERI Risk Assessment — All Clear
                    </p>
                    <p className="text-xs text-emerald-600/70 dark:text-emerald-400/60 mt-0.5">
                        No elevated disease risks detected {districtName ? `in ${districtName}` : 'in your area'}.
                    </p>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 dark:border-emerald-500/30
                    bg-emerald-100/60 dark:bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-300 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Safe
                </div>
            </div>
        );
    }

    const topCfg = riskConfig[highestLevel];
    const visibleScores = expanded ? elevatedScores : elevatedScores.slice(0, 3);

    return (
        <div className={`rounded-2xl border overflow-hidden animate-fade-in-scale
            ${topCfg.border} ${topCfg.darkBorder}`}
            style={{ background: 'var(--dash-card-bg)' }}>

            {/* ── Header strip ─────────────────────────────────── */}
            <div className={`px-4 py-3 flex items-center gap-3 border-b ${topCfg.bg} ${topCfg.darkBg} ${topCfg.border} ${topCfg.darkBorder}`}>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${topCfg.gradient}
                    flex items-center justify-center shadow-md text-white`}>
                    <Activity className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-bold ${topCfg.text} ${topCfg.darkText}`}>
                        CERI Risk Assessment {districtName ? `— ${districtName}` : ''}
                    </h3>
                    <p className={`text-[11px] mt-0.5 opacity-70 ${topCfg.text} ${topCfg.darkText}`}>
                        {elevatedScores.length} elevated risk{elevatedScores.length !== 1 ? 's' : ''} detected • Algorithm-powered
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold
                        ${topCfg.bg} ${topCfg.text} ${topCfg.border} ${topCfg.darkBg} ${topCfg.darkText} ${topCfg.darkBorder}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${topCfg.dot} ${highestLevel === 'critical' ? 'animate-pulse' : ''}`} />
                        {topCfg.label}
                    </span>
                    <button
                        onClick={() => fetchRiskScores(districtId, true)}
                        className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        title="Refresh risk scores"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${topCfg.text} ${topCfg.darkText} opacity-60`} />
                    </button>
                </div>
            </div>

            {/* ── Risk items ──────────────────────────────────── */}
            <div className="p-3 space-y-2">
                {visibleScores.map((score, idx) => {
                    const cfg = riskConfig[score.risk_level];
                    return (
                        <div
                            key={score.risk_id}
                            className={`relative flex items-center gap-3 rounded-xl border px-4 py-3 overflow-hidden
                                transition-all duration-200 hover:shadow-sm
                                ${cfg.bg} ${cfg.border} ${cfg.darkBg} ${cfg.darkBorder} animate-fade-in-scale`}
                            style={{ animationDelay: `${idx * 50}ms` }}
                        >
                            {/* Left accent strip */}
                            <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${cfg.strip}`} />

                            {/* Icon */}
                            <div className={`shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br ${cfg.gradient}
                                flex items-center justify-center text-white shadow-sm`}>
                                {cfg.icon}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <p className={`text-sm font-semibold ${cfg.text} ${cfg.darkText}`}>
                                        {score.disease_name}
                                    </p>
                                    <span className={`inline-flex items-center gap-1 rounded-full border
                                        px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider
                                        ${cfg.bg} ${cfg.text} ${cfg.border} ${cfg.darkBg} ${cfg.darkText} ${cfg.darkBorder}`}>
                                        <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
                                        {score.risk_level}
                                    </span>
                                </div>
                                <ScoreBar score={score.risk_score} level={score.risk_level} />
                            </div>

                            {/* Score */}
                            <div className="text-right shrink-0">
                                <p className={`text-lg font-bold tabular-nums leading-tight ${cfg.text} ${cfg.darkText}`}>
                                    {score.risk_score.toFixed(0)}
                                </p>
                                <p className={`text-[10px] opacity-60 ${cfg.text} ${cfg.darkText}`}>CERI</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Expand/collapse toggle ──────────────────────── */}
            {elevatedScores.length > 3 && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold
                        border-t transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                    style={{ color: 'var(--dash-text-secondary)', borderColor: 'var(--dash-card-border)' }}
                >
                    {expanded ? (
                        <>Show Less <ChevronUp className="h-3.5 w-3.5" /></>
                    ) : (
                        <>Show {elevatedScores.length - 3} More <ChevronDown className="h-3.5 w-3.5" /></>
                    )}
                </button>
            )}

            {/* ── Footer legend ───────────────────────────────── */}
            <div className="px-4 py-2.5 border-t flex items-center gap-4 flex-wrap"
                style={{ borderColor: 'var(--dash-card-border)' }}>
                <div className="flex items-center gap-1.5 text-[10px] font-medium" style={{ color: 'var(--dash-text-muted)' }}>
                    <BarChart3 className="h-3 w-3" />
                    <span>Report density</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-medium" style={{ color: 'var(--dash-text-muted)' }}>
                    <ThumbsUp className="h-3 w-3" />
                    <span>Vote credibility</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-medium" style={{ color: 'var(--dash-text-muted)' }}>
                    <TrendingUp className="h-3 w-3" />
                    <span>Temporal urgency</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-medium" style={{ color: 'var(--dash-text-muted)' }}>
                    <Activity className="h-3 w-3" />
                    <span>Disease severity</span>
                </div>
            </div>
        </div>
    );
}
