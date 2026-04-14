"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
    HeartPulse,
    ShieldCheck,
    AlertCircle,
    Search,
    ChevronDown,
    ChevronUp,
    RefreshCw,
    Stethoscope,
    CheckCircle2,
    Sparkles,
    Loader2,
    TriangleAlert,
    Hospital,
    Info,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────────────────────────── */

type Disease = {
    disease_id: number;
    disease_name: string;
    description: string | null;
};

type DiseaseDetail = {
    disease_id: number;
    symptoms: string[];
    precautions: string[];
    createdAt: string;
    updatedAt: string;
};

type MergedDisease = Disease & { details: DiseaseDetail | null };

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

/* ── Fetch helpers ─────────────────────────────────────────────────────────── */

async function fetchDiseases(): Promise<Disease[]> {
    try {
        const res = await fetch("/api/public/diseases", { cache: "no-store" });
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : (data?.diseases ?? []);
    } catch {
        return [];
    }
}

async function fetchDiseaseDetails(): Promise<DiseaseDetail[]> {
    const res = await fetch("/api/public/disease-details", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to fetch disease details");
    return Array.isArray(data) ? data : [];
}

async function enhanceDisease(disease: MergedDisease): Promise<EnhancedInfo | null> {
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

/* ── Severity config ────────────────────────────────────────────────────────── */

type SeverityLevel = "low" | "moderate" | "high" | "critical";

const severityConfig: Record<SeverityLevel, {
    label: string; bg: string; border: string; text: string; badgeBg: string;
}> = {
    low: {
        label: "Low Risk", bg: "rgba(16,185,129,0.07)", border: "rgba(16,185,129,0.25)",
        text: "#059669", badgeBg: "rgba(16,185,129,0.12)",
    },
    moderate: {
        label: "Moderate Risk", bg: "rgba(245,158,11,0.07)", border: "rgba(245,158,11,0.28)",
        text: "#d97706", badgeBg: "rgba(245,158,11,0.12)",
    },
    high: {
        label: "High Risk", bg: "rgba(239,68,68,0.07)", border: "rgba(239,68,68,0.25)",
        text: "#dc2626", badgeBg: "rgba(239,68,68,0.12)",
    },
    critical: {
        label: "Critical", bg: "rgba(139,0,0,0.07)", border: "rgba(139,0,0,0.30)",
        text: "#991b1b", badgeBg: "rgba(139,0,0,0.12)",
    },
};

/* ── Sub-components ─────────────────────────────────────────────────────────── */

function SeverityBadge({ level }: { level: SeverityLevel }) {
    const cfg = severityConfig[level] ?? severityConfig.low;
    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold capitalize"
            style={{ background: cfg.badgeBg, borderColor: cfg.border, color: cfg.text }}
        >
            <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: cfg.text }} />
            {cfg.label}
        </span>
    );
}

function EnhancedDiseasePanel({ enhanced }: { enhanced: EnhancedInfo }) {
    const sev = severityConfig[enhanced.severity_level] ?? severityConfig.low;

    return (
        <div className="space-y-5">
            {/* Summary banner */}
            {enhanced.brief_summary && (
                <div
                    className="flex items-start gap-3 rounded-xl border px-4 py-3"
                    style={{ background: sev.bg, borderColor: sev.border }}
                >
                    <Info className="h-4 w-4 shrink-0 mt-0.5" style={{ color: sev.text }} />
                    <p className="text-sm leading-relaxed" style={{ color: "var(--dash-text-secondary)" }}>
                        {enhanced.brief_summary}
                    </p>
                </div>
            )}

            {/* Symptoms */}
            {enhanced.symptom_categories.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--dash-text-muted)" }}>
                            Symptoms
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {enhanced.symptom_categories.map((cat) => (
                            <div
                                key={cat.category}
                                className="rounded-xl border p-3.5"
                                style={{
                                    background: "rgba(239,68,68,0.04)",
                                    borderColor: "rgba(239,68,68,0.18)",
                                }}
                            >
                                <p className="text-xs font-bold mb-2.5 flex items-center gap-1.5" style={{ color: "#dc2626" }}>
                                    <span className="text-base leading-none">{cat.icon}</span>
                                    {cat.category}
                                </p>
                                <ul className="space-y-1.5">
                                    {cat.items.map((item) => (
                                        <li key={item} className="flex items-start gap-2 text-xs" style={{ color: "var(--dash-text-secondary)" }}>
                                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
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
                <div className="border-t" style={{ borderColor: "var(--dash-card-border)" }} />
            )}

            {/* Precautions */}
            {enhanced.precaution_categories.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--dash-text-muted)" }}>
                            Precautions
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {enhanced.precaution_categories.map((cat) => (
                            <div
                                key={cat.category}
                                className="rounded-xl border p-3.5"
                                style={{
                                    background: "rgba(16,185,129,0.04)",
                                    borderColor: "rgba(16,185,129,0.18)",
                                }}
                            >
                                <p className="text-xs font-bold mb-2.5 flex items-center gap-1.5" style={{ color: "#059669" }}>
                                    <span className="text-base leading-none">{cat.icon}</span>
                                    {cat.category}
                                </p>
                                <ol className="space-y-1.5">
                                    {cat.items.map((item, ii) => (
                                        <li key={item} className="flex items-start gap-2 text-xs" style={{ color: "var(--dash-text-secondary)" }}>
                                            <span
                                                className="shrink-0 mt-0.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-[9px] font-bold"
                                                style={{
                                                    background: "rgba(16,185,129,0.15)",
                                                    color: "#059669",
                                                    border: "1px solid rgba(16,185,129,0.30)",
                                                }}
                                            >
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
                <div
                    className="flex items-start gap-3 rounded-xl border px-4 py-3.5"
                    style={{
                        background: "rgba(239,68,68,0.05)",
                        borderColor: "rgba(239,68,68,0.20)",
                    }}
                >
                    <Hospital className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1">
                            When to seek medical help
                        </p>
                        <p className="text-sm leading-relaxed" style={{ color: "var(--dash-text-secondary)" }}>
                            {enhanced.when_to_seek_help}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Fallback plain display (if Groq fails) ─────────────────────────────────── */

function PlainDiseasePanel({ details }: { details: DiseaseDetail }) {
    return (
        <div className="space-y-4">
            {details.symptoms.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--dash-text-muted)" }}>Symptoms</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {details.symptoms.map((s) => (
                            <span key={s} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
                                style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.22)", color: "#dc2626" }}>
                                <span className="mr-1 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />{s}
                            </span>
                        ))}
                    </div>
                </div>
            )}
            {details.precautions.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--dash-text-muted)" }}>Precautions</p>
                    </div>
                    <ol className="space-y-2">
                        {details.precautions.map((p, i) => (
                            <li key={p} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--dash-text-secondary)" }}>
                                <span className="shrink-0 mt-0.5 inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold"
                                    style={{ background: "rgba(16,185,129,0.12)", color: "#059669", border: "1px solid rgba(16,185,129,0.25)" }}>
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

/* ── Disease card with Groq enhancement ─────────────────────────────────────── */

function DiseaseCard({ disease, defaultOpen }: { disease: MergedDisease; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen ?? false);
    const [enhanced, setEnhanced] = useState<EnhancedInfo | null>(null);
    const [enhancing, setEnhancing] = useState(false);
    const [enhanceFailed, setEnhanceFailed] = useState(false);

    const hasDetails = disease.details !== null &&
        (disease.details.symptoms.length > 0 || disease.details.precautions.length > 0);

    const handleToggle = useCallback(async () => {
        const nextOpen = !open;
        setOpen(nextOpen);

        // Load enhanced info when first opened and details exist
        if (nextOpen && hasDetails && !enhanced && !enhancing && !enhanceFailed) {
            setEnhancing(true);
            try {
                const result = await enhanceDisease(disease);
                if (result) {
                    setEnhanced(result);
                } else {
                    setEnhanceFailed(true);
                }
            } catch {
                setEnhanceFailed(true);
            } finally {
                setEnhancing(false);
            }
        }
    }, [open, hasDetails, enhanced, enhancing, enhanceFailed, disease]);

    const sev = enhanced?.severity_level
        ? (severityConfig[enhanced.severity_level] ?? severityConfig.low)
        : null;

    return (
        <div className="card-panel animate-fade-in-scale overflow-hidden" style={{ animationDelay: "0ms" }}>
            {/* Header */}
            <button
                type="button"
                onClick={() => void handleToggle()}
                className="w-full card-panel-header flex items-center justify-between gap-3 cursor-pointer"
                aria-expanded={open}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div
                        className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
                        style={{ background: sev ? sev.bg === severityConfig.critical.bg ? "#991b1b" : sev.text : "var(--color-primary)" }}
                    >
                        <HeartPulse className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0 text-left">
                        <p className="text-sm font-bold truncate" style={{ color: "var(--dash-text-primary)" }}>
                            {disease.disease_name}
                        </p>
                        {disease.description && (
                            <p className="text-xs truncate" style={{ color: "var(--dash-text-muted)" }}>
                                {disease.description}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {enhanced?.severity_level && <SeverityBadge level={enhanced.severity_level} />}
                    {!hasDetails && (
                        <span className="hidden sm:inline text-[10px] font-semibold rounded-full border px-2.5 py-0.5"
                            style={{ background: "var(--dash-card-header-bg)", borderColor: "var(--dash-card-border)", color: "var(--dash-text-muted)" }}>
                            No details yet
                        </span>
                    )}
                    {open
                        ? <ChevronUp className="h-4 w-4" style={{ color: "var(--dash-text-muted)" }} />
                        : <ChevronDown className="h-4 w-4" style={{ color: "var(--dash-text-muted)" }} />}
                </div>
            </button>

            {/* Expanded content */}
            {open && (
                <div className="px-5 pb-5 pt-4">
                    {!hasDetails ? (
                        <div className="flex flex-col items-center py-8 rounded-xl border border-dashed text-center"
                            style={{ background: "var(--dash-card-header-bg)", borderColor: "var(--dash-card-border)", color: "var(--dash-text-muted)" }}>
                            <Stethoscope className="h-6 w-6 mb-2 opacity-50" />
                            <p className="text-sm font-medium">No details added yet</p>
                        </div>
                    ) : enhancing ? (
                        /* Groq loading state */
                        <div className="flex flex-col items-center py-10 gap-3">
                            <div className="flex items-center gap-2.5 rounded-xl border px-5 py-3"
                                style={{ background: "var(--dash-card-bg)", borderColor: "var(--dash-card-border)" }}>
                                <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--color-primary)" }} />
                                <span className="text-sm font-medium" style={{ color: "var(--dash-text-secondary)" }}>
                                    Analyzing with AI…
                                </span>
                                <Sparkles className="h-4 w-4 text-violet-500" />
                            </div>
                        </div>
                    ) : enhanced ? (
                        /* Groq-enhanced display */
                        <div>
                            <div className="flex items-center gap-1.5 mb-4 text-[10px] font-semibold uppercase tracking-widest"
                                style={{ color: "var(--dash-text-muted)" }}>
                                <Sparkles className="h-3 w-3 text-violet-500" />
                                AI-organized by Groq · LLaMA 3.3
                            </div>
                            <EnhancedDiseasePanel enhanced={enhanced} />
                        </div>
                    ) : (
                        /* Fallback if Groq failed */
                        <div>
                            {enhanceFailed && (
                                <div className="flex items-center gap-2 mb-3 text-xs rounded-lg border px-3 py-2"
                                    style={{ background: "rgba(245,158,11,0.07)", borderColor: "rgba(245,158,11,0.22)", color: "#d97706" }}>
                                    <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
                                    AI enhancement unavailable — showing raw data
                                </div>
                            )}
                            <PlainDiseasePanel details={disease.details!} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ── Main Component ─────────────────────────────────────────────────────────── */

export default function TakeCare() {
    const [diseases, setDiseases] = useState<Disease[]>([]);
    const [details, setDetails] = useState<DiseaseDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    const load = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);
        try {
            const [diseaseList, detailList] = await Promise.all([
                fetchDiseases(),
                fetchDiseaseDetails(),
            ]);
            setDiseases(diseaseList);
            setDetails(detailList);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load data");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { void load(); }, []);

    // Build from union of all known IDs — details-driven
    const merged = useMemo<MergedDisease[]>(() => {
        const detailMap = new Map(details.map((d) => [d.disease_id, d]));
        const diseaseMap = new Map(diseases.map((d) => [d.disease_id, d]));
        const allIds = new Set([...details.map((d) => d.disease_id), ...diseases.map((d) => d.disease_id)]);
        return Array.from(allIds).map((id) => {
            const disease = diseaseMap.get(id);
            const detail = detailMap.get(id) ?? null;
            return {
                disease_id: id,
                disease_name: disease?.disease_name ?? `Disease #${id}`,
                description: disease?.description ?? null,
                details: detail,
            };
        }).sort((a, b) => {
            if (a.details && !b.details) return -1;
            if (!a.details && b.details) return 1;
            return a.disease_name.localeCompare(b.disease_name);
        });
    }, [diseases, details]);

    const filtered = useMemo(() => {
        if (!search.trim()) return merged;
        const q = search.toLowerCase();
        return merged.filter((d) =>
            d.disease_name.toLowerCase().includes(q) ||
            (d.description ?? "").toLowerCase().includes(q)
        );
    }, [merged, search]);

    const withDetails = filtered.filter((d) => d.details !== null);
    const withoutDetails = filtered.filter((d) => d.details === null);

    return (
        <section className="space-y-6">
            {/* ── Page heading ────────────────────────────────── */}
            <div className="flex flex-wrap items-start justify-between gap-3 pt-1">
                <div>
                    <div className="flex items-center gap-2.5 mb-1">
                        <div className="w-8 h-8 rounded-xl bg-linear-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-md shadow-rose-500/25">
                            <HeartPulse className="h-4 w-4 text-white" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--dash-text-primary)" }}>
                            Take Care
                        </h1>
                    </div>
                    <p className="text-sm ml-[2.6rem]" style={{ color: "var(--dash-text-secondary)" }}>
                        AI-organized disease symptoms &amp; precautions — powered by Groq &amp; LLaMA 3.3
                    </p>
                </div>

                <button
                    onClick={() => void load(true)}
                    disabled={refreshing || loading}
                    className="btn-secondary text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 disabled:opacity-60"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                    {refreshing ? "Refreshing…" : "Refresh"}
                </button>
            </div>

            {/* ── AI badge ───────────────────────────────────── */}
            <div className="flex items-center gap-2 rounded-xl border px-4 py-3"
                style={{ background: "rgba(139,92,246,0.06)", borderColor: "rgba(139,92,246,0.20)" }}>
                <Sparkles className="h-4 w-4 text-violet-500 shrink-0" />
                <p className="text-xs font-medium" style={{ color: "var(--dash-text-secondary)" }}>
                    <span className="font-bold text-violet-600 dark:text-violet-400">AI-powered</span> — Click any disease to let Groq AI organize symptoms and precautions into clear, structured categories.
                </p>
            </div>

            {/* ── Error banner ──────────────────────────────── */}
            {error && (
                <div className="flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm animate-fade-in-scale"
                    style={{ background: "rgba(220,38,38,0.08)", borderColor: "rgba(220,38,38,0.28)", color: "#dc2626" }}>
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* ── Search bar ─────────────────────────────────── */}
            {!loading && merged.length > 0 && (
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                        style={{ color: "var(--dash-text-muted)" }} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search diseases…"
                        className="input-primary pl-10"
                    />
                </div>
            )}

            {/* ── Loading skeletons ──────────────────────────── */}
            {loading && (
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="rounded-[1.125rem] border h-16 animate-pulse"
                            style={{ background: "var(--dash-skeleton-bg)", borderColor: "var(--dash-card-border)", animationDelay: `${i * 60}ms` }} />
                    ))}
                </div>
            )}

            {/* ── Empty state ────────────────────────────────── */}
            {!loading && filtered.length === 0 && !error && (
                <div className="card-panel py-14 px-6 flex flex-col items-center justify-center text-center">
                    <div className="w-14 h-14 rounded-2xl border flex items-center justify-center mb-4"
                        style={{ background: "var(--dash-card-header-bg)", borderColor: "var(--dash-card-border)" }}>
                        <HeartPulse className="h-6 w-6" style={{ color: "var(--dash-text-muted)" }} />
                    </div>
                    <p className="text-sm font-semibold" style={{ color: "var(--dash-text-primary)" }}>
                        {search ? "No diseases match your search" : "No diseases found"}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--dash-text-muted)" }}>
                        {search ? "Try a different keyword." : "Health officers haven't added any diseases yet."}
                    </p>
                </div>
            )}

            {/* ── Diseases with details ─────────────────────── */}
            {!loading && withDetails.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--dash-text-muted)" }}>
                            With Symptoms &amp; Precautions ({withDetails.length})
                        </p>
                    </div>
                    {withDetails.map((d) => (
                        <DiseaseCard key={d.disease_id} disease={d} defaultOpen={withDetails.length === 1} />
                    ))}
                </div>
            )}

            {/* ── Diseases without details ─────────────────── */}
            {!loading && withoutDetails.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4" style={{ color: "var(--dash-text-muted)" }} />
                        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--dash-text-muted)" }}>
                            Pending Details ({withoutDetails.length})
                        </p>
                    </div>
                    {withoutDetails.map((d) => (
                        <DiseaseCard key={d.disease_id} disease={d} />
                    ))}
                </div>
            )}
        </section>
    );
}
