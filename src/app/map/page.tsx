'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useMemo } from 'react';
import { HeartPulse, ShieldCheck, AlertCircle, Stethoscope } from 'lucide-react';

// Dynamically import MapComponent to prevent SSR "window is not defined" issues
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center w-full h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
    )
});

/* ── Types ──────────────────────────────────────────────────────── */
type Disease = { disease_id: number; disease_name: string; description: string | null };
type DiseaseDetail = { disease_id: number; symptoms: string[]; precautions: string[] };
type Merged = Disease & { details: DiseaseDetail | null };

type SymptomCategory = { category: string; icon: string; items: string[] };
type PrecautionCategory = { category: string; icon: string; items: string[] };

type EnhancedInfo = {
    disease_name: string;
    severity_level: "low" | "moderate" | "high" | "critical";
    brief_summary: string;
    symptom_categories: SymptomCategory[];
    precaution_categories: PrecautionCategory[];
    when_to_seek_help: string;
};

/* ── Fetch Helper ────────────────────────────────────────────────── */
async function enhanceDisease(disease: Merged): Promise<EnhancedInfo | null> {
    try {
        const res = await fetch("/api/groq/enhance-disease", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                disease_name: disease.disease_name,
                symptoms: disease.details?.symptoms ?? [],
                precautions: disease.details?.precautions ?? [],
            }),
        });
        if (!res.ok) return null;
        return await res.json() as EnhancedInfo;
    } catch {
        return null;
    }
}

/* ── Sub-components for Enhanced UI ─────────────────────────────── */

import { Sparkles, Loader2, Hospital, Info, TriangleAlert } from "lucide-react";

type SeverityLevel = "low" | "moderate" | "high" | "critical";
const severityConfig: Record<SeverityLevel, { label: string; text: string; bg: string; border: string }> = {
    low: { label: "Low Risk", text: "#34d399", bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.3)" },
    moderate: { label: "Moderate Risk", text: "#fbbf24", bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.3)" },
    high: { label: "High Risk", text: "#f87171", bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.3)" },
    critical: { label: "Critical", text: "#ef4444", bg: "rgba(220,38,38,0.25)", border: "rgba(220,38,38,0.4)" },
};

function SeverityBadge({ level }: { level: SeverityLevel }) {
    const cfg = severityConfig[level] ?? severityConfig.low;
    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold capitalize shadow-sm"
            style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.text }}
        >
            <span className="h-1.5 w-1.5 rounded-full shrink-0 shadow-sm" style={{ background: cfg.text, boxShadow: `0 0 4px ${cfg.text}` }} />
            {cfg.label}
        </span>
    );
}

function EnhancedDiseasePanel({ enhanced }: { enhanced: EnhancedInfo }) {
    return (
        <div className="space-y-5 animate-fade-in">
            {/* Summary banner */}
            {enhanced.brief_summary && (
                <div className="flex items-start gap-3 rounded-xl border border-white/10 px-4 py-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-300" />
                    <p className="text-sm leading-relaxed text-white/80">
                        {enhanced.brief_summary}
                    </p>
                </div>
            )}

            {/* Symptoms */}
            {enhanced.symptom_categories.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="h-4 w-4 text-red-300 shrink-0" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Symptoms</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {enhanced.symptom_categories.map((cat) => (
                            <div key={cat.category} className="rounded-xl border border-red-400/20 p-3.5" style={{ background: "rgba(239,68,68,0.08)" }}>
                                <p className="text-xs font-bold mb-2.5 flex items-center gap-1.5 text-red-300">
                                    <span className="text-base leading-none">{cat.icon}</span>
                                    {cat.category}
                                </p>
                                <ul className="space-y-1.5">
                                    {cat.items.map((item) => (
                                        <li key={item} className="flex items-start gap-2 text-xs text-white/80">
                                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0 shadow-sm" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Divider */}
            {enhanced.symptom_categories.length > 0 && enhanced.precaution_categories.length > 0 && (
                <div className="border-t border-white/10" />
            )}

            {/* Precautions */}
            {enhanced.precaution_categories.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <ShieldCheck className="h-4 w-4 text-emerald-300 shrink-0" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Precautions</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {enhanced.precaution_categories.map((cat) => (
                            <div key={cat.category} className="rounded-xl border border-emerald-400/20 p-3.5" style={{ background: "rgba(16,185,129,0.08)" }}>
                                <p className="text-xs font-bold mb-2.5 flex items-center gap-1.5 text-emerald-300">
                                    <span className="text-base leading-none">{cat.icon}</span>
                                    {cat.category}
                                </p>
                                <ol className="space-y-1.5">
                                    {cat.items.map((item, ii) => (
                                        <li key={item} className="flex items-start gap-2 text-xs text-white/80">
                                            <span className="shrink-0 mt-0.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-[9px] font-bold text-emerald-200 border border-emerald-400/40 shadow-sm" style={{ background: "rgba(16,185,129,0.25)" }}>
                                                {ii + 1}
                                            </span>
                                            {item}
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* When to seek help */}
            {enhanced.when_to_seek_help && (
                <div className="flex items-start gap-3 rounded-xl border border-red-500/30 px-4 py-3.5" style={{ background: "rgba(239,68,68,0.1)" }}>
                    <Hospital className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-red-300 mb-1">
                            When to seek medical help
                        </p>
                        <p className="text-sm leading-relaxed text-white/80">
                            {enhanced.when_to_seek_help}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Fallback Panel ─────────────────────────────────────────────── */

function PlainDiseasePanel({ details }: { details: DiseaseDetail }) {
    return (
        <div className="space-y-4">
            {details.symptoms.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-3.5 w-3.5 text-red-300" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Symptoms</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {details.symptoms.map(s => (
                            <span key={s} className="inline-flex items-center rounded-full border border-red-300/30 px-2.5 py-0.5 text-xs font-medium text-red-200" style={{ background: 'rgba(239,68,68,0.15)' }}>
                                <span className="mr-1 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                                {s}
                            </span>
                        ))}
                    </div>
                </div>
            )}
            {details.symptoms.length > 0 && details.precautions.length > 0 && (
                <div className="border-t border-white/10" />
            )}
            {details.precautions.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Precautions</p>
                    </div>
                    <ol className="space-y-2">
                        {details.precautions.map((p, i) => (
                            <li key={p} className="flex items-start gap-2 text-sm text-white/80">
                                <span className="shrink-0 mt-0.5 inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold text-emerald-200 border border-emerald-400/40" style={{ background: 'rgba(16,185,129,0.20)' }}>
                                    {i + 1}
                                </span>
                                {p}
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
}

/* ── Disease card ───────────────────────────────────────────────── */
function DiseaseGuideCard({ disease }: { disease: Merged }) {
    const [enhanced, setEnhanced] = useState<EnhancedInfo | null>(null);
    const hasDetails = disease.details && (disease.details.symptoms.length > 0 || disease.details.precautions.length > 0);
    const [enhancing, setEnhancing] = useState(Boolean(hasDetails));
    const [enhanceFailed, setEnhanceFailed] = useState(false);

    useEffect(() => {
        if (!hasDetails || !enhancing || enhanced || enhanceFailed) return;

        enhanceDisease(disease)
            .then((result) => {
                if (result) setEnhanced(result);
                else setEnhanceFailed(true);
            })
            .catch(() => setEnhanceFailed(true))
            .finally(() => setEnhancing(false));
    }, [hasDetails, enhancing, enhanced, enhanceFailed, disease]);

    return (
        <div className="rounded-2xl border border-white/20 overflow-hidden backdrop-blur-sm flex flex-col h-[380px]" style={{ background: 'rgba(255,255,255,0.08)' }}>
            {/* Header (Sticky) */}
            <div className="w-full flex items-center justify-between gap-3 px-5 py-4 shrink-0 bg-black/10 border-b border-white/10">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                        <HeartPulse className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{disease.disease_name}</p>
                        {disease.description && (
                            <p className="text-xs text-white/60 truncate">{disease.description}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {enhanced?.severity_level && <SeverityBadge level={enhanced.severity_level} />}
                    {!hasDetails && (
                        <span className="hidden sm:inline text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-white/20 text-white/50">
                            No details yet
                        </span>
                    )}
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="px-5 pb-5 pt-4 flex-1 overflow-y-auto min-h-0 custom-scrollbar">
                {!hasDetails ? (
                    <div className="flex flex-col items-center justify-center h-full py-6 text-center text-white/50">
                        <Stethoscope className="h-5 w-5 mb-2 opacity-50" />
                        <p className="text-sm">No details added by health officers yet.</p>
                    </div>
                ) : enhancing ? (
                    <div className="flex flex-col items-center justify-center h-full py-8 gap-3">
                        <div className="flex items-center gap-2.5 rounded-xl border border-white/10 px-5 py-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <Loader2 className="h-4 w-4 animate-spin text-white" />
                            <span className="text-sm font-medium text-white/80">Analyzing with AI...</span>
                            <Sparkles className="h-4 w-4 text-violet-400" />
                        </div>
                    </div>
                ) : enhanced ? (
                    <div>
                        <div className="flex items-center gap-1.5 mb-4 text-[10px] font-semibold uppercase tracking-widest text-white/50">
                            <Sparkles className="h-3 w-3 text-violet-400" />
                            AI-organized by Groq (Redis Cached)
                        </div>
                        <EnhancedDiseasePanel enhanced={enhanced} />
                    </div>
                ) : (
                    <div>
                        {enhanceFailed && (
                            <div className="flex items-center gap-2 mb-3 text-xs rounded-lg border border-amber-400/30 px-3 py-2 text-amber-300" style={{ background: "rgba(245,158,11,0.15)" }}>
                                <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
                                AI enhancement unavailable — showing raw data
                            </div>
                        )}
                        <PlainDiseasePanel details={disease.details!} />
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Main page ──────────────────────────────────────────────────── */
export default function MapPage() {
    const [diseases, setDiseases] = useState<Disease[]>([]);
    const [details, setDetails] = useState<DiseaseDetail[]>([]);
    const [loadingGuide, setLoadingGuide] = useState(true);

    useEffect(() => {
        // Fetch details first (critical — from MongoDB directly)
        // Fetch diseases separately (supplementary — from Python backend)
        Promise.all([
            fetch('/api/public/disease-details')
                .then(r => r.json())
                .then((d: unknown) => Array.isArray(d) ? d as DiseaseDetail[] : [])
                .catch(() => [] as DiseaseDetail[]),
            fetch('/api/public/diseases')
                .then(r => r.json())
                .then((d: unknown) => {
                    if (Array.isArray(d)) return d as Disease[];
                    const obj = d as { diseases?: Disease[] };
                    return obj?.diseases ?? [];
                })
                .catch(() => [] as Disease[]),
        ]).then(([ddList, dList]) => {
            setDetails(ddList);
            setDiseases(dList);
        }).finally(() => setLoadingGuide(false));
    }, []);

    // Build from union of all known IDs — details-driven so they always show
    const merged = useMemo<Merged[]>(() => {
        const detailMap = new Map(details.map(d => [d.disease_id, d]));
        const diseaseMap = new Map(diseases.map(d => [d.disease_id, d]));
        const allIds = new Set([...details.map(d => d.disease_id), ...diseases.map(d => d.disease_id)]);
        return Array.from(allIds).map(id => ({
            disease_id: id,
            disease_name: diseaseMap.get(id)?.disease_name ?? `Disease #${id}`,
            description: diseaseMap.get(id)?.description ?? null,
            details: detailMap.get(id) ?? null,
        })).sort((a, b) => {
            if (a.details && !b.details) return -1;
            if (!a.details && b.details) return 1;
            return a.disease_name.localeCompare(b.disease_name);
        });
    }, [diseases, details]);

    return (
        <main className="min-h-screen flex flex-col relative text-white">
            {/* Fixed background */}
            <div className="fixed inset-0 bg-gradient-to-br from-[#1E3A8A] via-[#1e40af] to-[#0EA5A4] overflow-hidden -z-10">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                </div>
            </div>

            {/* Page header */}
            <div className="w-full max-w-7xl mx-auto px-4 pt-28 pb-4 relative z-10">
                <h1 className="text-3xl font-bold mb-2 tracking-tight text-white drop-shadow-md">Sri Lanka Disease Risk Map</h1>
                <p className="text-white/80 text-lg font-medium drop-shadow-sm max-w-2xl">
                    View real-time disease risk levels across all districts of Sri Lanka.
                </p>
            </div>

            {/* Map container */}
            <div className="w-full max-w-7xl mx-auto px-4 pb-8 flex-1 relative z-10">
                <div className="w-full rounded-2xl overflow-hidden glass-panel p-0 h-[70vh] min-h-[500px] border border-white/20 shadow-2xl">
                    <MapComponent />
                </div>
            </div>

            {/* ── Disease Prevention Guide ──────────────────── */}
            <div className="w-full max-w-7xl mx-auto px-4 pb-16 relative z-10">
                <div className="rounded-2xl border border-white/20 p-6 sm:p-8" style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
                    {/* Section header */}
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                                <ShieldCheck className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Disease Prevention Guide</h2>
                                <p className="text-sm text-white/60">Symptoms &amp; precautions — updated by health officers</p>
                            </div>
                        </div>
                    </div>

                    {/* Loading */}
                    {loadingGuide && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-[380px] rounded-2xl border border-white/15 animate-pulse" style={{ background: 'rgba(255,255,255,0.08)', animationDelay: `${i * 50}ms` }} />
                            ))}
                        </div>
                    )}

                    {/* Disease cards */}
                    {!loadingGuide && merged.length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {merged.map(d => <DiseaseGuideCard key={d.disease_id} disease={d} />)}
                        </div>
                    )}

                    {/* Empty state */}
                    {!loadingGuide && merged.length === 0 && (
                        <div className="flex flex-col items-center py-10 text-center text-white/50">
                            <Stethoscope className="h-8 w-8 mb-3 opacity-50" />
                            <p className="text-sm font-medium">No disease information available yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
