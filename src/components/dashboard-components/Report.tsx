"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import {
    MapPin,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Send,
    ThumbsUp,
    Sparkles,
    FileText,
    Clock,
    ChevronRight,
    BrainCircuit,
} from "lucide-react";
import { useLocation } from "@/contexts/LocationContext";
import { useAuth } from "@/contexts/AuthContext";
import { account } from "@/lib/appwrite";
import { getDashboardCache, setDashboardCache } from "@/lib/dashboardCache";
import axios from "axios";

interface ExtractedData {
    disease_name: string | null;
    disease_type: string;
    cases_reported: number | null;
    severity: string;
    symptoms: string[];
    time_period: string | null;
    age_group: string | null;
    location_specifics: string | null;
    confidence: string;
}

interface SubmitResponse {
    status: string;
    message: string;
    data: {
        report_id: number;
        collection: string;
        nearest_location: {
            district_name: string;
            province_name: string;
            distance_km: number;
        };
        extracted_data: ExtractedData;
    };
}

interface HistoryReport {
    report_id: string;
    user_id: string | number;
    description: string;
    district_info: {
        district_name: string;
        province_name: string;
        distance_km: number;
    } | null;
    extracted_data: ExtractedData | null;
    status: string | null;
    score?: number;
    has_voted?: boolean;
    created_at: string;
}

type SeverityConfig = { color: string; bg: string; border: string };
type StatusConfig  = { color: string; bg: string; border: string };

const HISTORY_CACHE_TTL_MS = 2 * 60 * 1000;

const getSeverityConfig = (severity: string): SeverityConfig => {
    switch (severity.toLowerCase()) {
        case "high":
        case "severe":
            return { color: "#be123c", bg: "rgba(225,29,72,0.08)",  border: "rgba(225,29,72,0.25)"  };
        case "medium":
        case "moderate":
            return { color: "#c2410c", bg: "rgba(234,88,12,0.08)",  border: "rgba(234,88,12,0.25)"  };
        case "low":
        case "mild":
            return { color: "#b45309", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)" };
        default:
            return { color: "var(--dash-text-secondary)", bg: "var(--dash-card-header-bg)", border: "var(--dash-card-border)" };
    }
};

const getSeverityStripColor = (severity: string): string => {
    switch (severity.toLowerCase()) {
        case "high":   case "severe":   return "#f43f5e";
        case "medium": case "moderate": return "#f97316";
        case "low":    case "mild":     return "#f59e0b";
        default: return "var(--dash-card-border)";
    }
};

const getStatusConfig = (status: string | null): StatusConfig => {
    switch (status?.toLowerCase()) {
        case "verified":
        case "confirmed":
            return { color: "#15803d", bg: "rgba(22,163,74,0.09)",  border: "rgba(22,163,74,0.28)"  };
        case "pending":
            return { color: "var(--color-primary)", bg: "rgba(30,58,138,0.09)", border: "rgba(30,58,138,0.22)" };
        case "investigating":
            return { color: "#7c3aed", bg: "rgba(124,58,237,0.09)", border: "rgba(124,58,237,0.25)" };
        default:
            return { color: "var(--dash-text-secondary)", bg: "var(--dash-card-header-bg)", border: "var(--dash-card-border)" };
    }
};

function InfoChip({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div
            className="rounded-xl border px-3 py-2.5"
            style={{ background: "var(--dash-card-bg)", borderColor: "var(--dash-card-border)" }}
        >
            <p
                className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                style={{ color: "var(--dash-text-muted)" }}
            >
                {label}
            </p>
            <p className="text-sm font-semibold" style={{ color: "var(--dash-text-primary)" }}>
                {value}
            </p>
        </div>
    );
}

function SeverityBadge({ severity }: { severity: string }) {
    const cfg = getSeverityConfig(severity);
    return (
        <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border"
            style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
        >
            {severity}
        </span>
    );
}

function StatusBadge({ status }: { status: string | null }) {
    const cfg = getStatusConfig(status);
    return (
        <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border shrink-0"
            style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
        >
            {status || "pending"}
        </span>
    );
}

export default function DiseaseReportPage() {
    const [description,    setDescription]    = useState("");
    const [loading,        setLoading]        = useState(false);
    const [extractedData,  setExtractedData]  = useState<ExtractedData | null>(null);
    const [submitResponse, setSubmitResponse] = useState<SubmitResponse | null>(null);
    const [error,          setError]          = useState<string | null>(null);
    const [history,        setHistory]        = useState<HistoryReport[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [voteLoadingByReport, setVoteLoadingByReport] = useState<Record<string, boolean>>({});

    const { user } = useAuth();
    const { locationData, isLoading: locationLoading, error: locationError } = useLocation();

    const historyCacheKey = useMemo(() => {
        const district = locationData?.nearest_area?.district_name;
        if (!district) return null;
        return `reports-history:${district}:user:${user?.$id ?? "guest"}`;
    }, [locationData?.nearest_area?.district_name, user?.$id]);

    const analyzeAndSubmit = async () => {
        if (!description.trim()) { setError("Please enter a disease report."); return; }
        if (!locationData?.user_location) { setError("Location data not available. Please refresh the page."); return; }
        setLoading(true); setError(null); setExtractedData(null); setSubmitResponse(null);
        try {
            if (!user?.$id) throw new Error("Authentication required. Please log in again.");
            const jwtObj = await account.createJWT();
            const response = await fetch("/api/extract-disease-info", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${jwtObj.jwt}`,
                },
                body: JSON.stringify({
                    description: description.trim(),
                    user_id: user.$id,
                    latitude:  locationData.user_location.latitude,
                    longitude: locationData.user_location.longitude,
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to process report");
            setExtractedData(data.extracted_data);
            if (data.submission) { setSubmitResponse(data.submission); await fetchReportHistory(true); }
            setDescription("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unexpected error occurred");
        } finally { setLoading(false); }
    };

    const fetchReportHistory = useCallback(async (forceRefresh = false) => {
        if (!locationData?.nearest_area?.district_name) return;

        if (!forceRefresh && historyCacheKey) {
            const cached = getDashboardCache<HistoryReport[]>(historyCacheKey, HISTORY_CACHE_TTL_MS);
            if (cached) {
                setHistory(cached);
                setHistoryLoading(false);
                return;
            }
        }

        try {
            setHistoryLoading(true);
            const response = await axios.get("/api/reports/location", {
                params: {
                    district_name: locationData.nearest_area.district_name,
                    user_id: user?.$id,
                },
            });
            const nextHistory = (response.data.reports || []) as HistoryReport[];
            setHistory(nextHistory);
            if (historyCacheKey) {
                setDashboardCache(historyCacheKey, nextHistory);
            }
        } catch { setHistory([]); }
        finally { setHistoryLoading(false); }
    }, [locationData?.nearest_area?.district_name, user?.$id, historyCacheKey]);

    useEffect(() => {
        if (locationData?.nearest_area?.district_name) fetchReportHistory();
    }, [locationData?.nearest_area?.district_name, fetchReportHistory]);

    const toggleVoteReport = async (reportId: string, isCurrentlyVoted: boolean) => {
        try {
            if (!user?.$id) { setError("Please log in to vote"); return; }
            if (!locationData?.nearest_area?.district_name) { setError("Location data not available"); return; }

            setVoteLoadingByReport((prev) => ({ ...prev, [reportId]: true }));

            await axios.post("/api/reports/upvote", {
                reportid: reportId,
                userid:   user.$id,
                location: locationData.nearest_area.district_name,
                action: isCurrentlyVoted ? "unvote" : "vote",
            });

            setHistory((prev) =>
                {
                    const updated = prev.map((report) => {
                    if (report.report_id !== reportId) return report;
                    const currentScore = report.score ?? 0;
                    return {
                        ...report,
                        has_voted: !isCurrentlyVoted,
                        score: isCurrentlyVoted
                            ? Math.max(0, currentScore - 1)
                            : currentScore + 1,
                    };
                });

                    if (historyCacheKey) {
                        setDashboardCache(historyCacheKey, updated);
                    }

                    return updated;
                }
            );
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const msg =
                    (err.response?.data as { error?: string })?.error ||
                    "Failed to update vote. Please try again.";
                setError(msg);
            } else {
                setError("Failed to update vote. Please try again.");
            }
        } finally {
            setVoteLoadingByReport((prev) => {
                const copy = { ...prev };
                delete copy[reportId];
                return copy;
            });
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto space-y-5">

            {/* ── Page header ─────────────────────────────────────────────── */}
            <div className="flex items-center gap-3">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md shrink-0"
                    style={{ background: "var(--color-primary)" }}
                >
                    <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--dash-text-primary)" }}>
                        Health Incident Report
                    </h1>
                    <p className="text-xs" style={{ color: "var(--dash-text-muted)" }}>
                        AI-powered community health monitoring
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">

                {/* ── Left column: form ─────────────────────────────────────── */}
                <div className="xl:col-span-5 space-y-4">

                    {/* Location pill */}
                    {locationLoading ? (
                        <div
                            className="flex items-center gap-3 rounded-xl border px-4 py-3 animate-pulse"
                            style={{ background: "var(--dash-card-bg)", borderColor: "var(--dash-card-border)" }}
                        >
                            <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--color-primary)" }} />
                            <span className="text-sm" style={{ color: "var(--dash-text-secondary)" }}>
                                Detecting location…
                            </span>
                        </div>
                    ) : locationError ? (
                        <div
                            className="flex items-center gap-3 rounded-xl border px-4 py-3"
                            style={{
                                background: "rgba(220,38,38,0.08)",
                                borderColor: "rgba(220,38,38,0.28)",
                            }}
                        >
                            <AlertCircle className="h-4 w-4 shrink-0" style={{ color: "var(--color-danger)" }} />
                            <span className="text-sm" style={{ color: "var(--color-danger)" }}>
                                {locationError}
                            </span>
                        </div>
                    ) : locationData?.nearest_area ? (
                        <div
                            className="flex items-center gap-3 rounded-xl border px-4 py-3"
                            style={{
                                background: "rgba(30,58,138,0.07)",
                                borderColor: "rgba(30,58,138,0.2)",
                            }}
                        >
                            <div
                                className="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0"
                                style={{
                                    background: "var(--dash-card-bg)",
                                    borderColor: "rgba(30,58,138,0.18)",
                                }}
                            >
                                <MapPin className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
                            </div>
                            <div className="flex-1 min-w-0 text-sm">
                                <span className="font-semibold" style={{ color: "var(--dash-text-primary)" }}>
                                    {locationData.nearest_area.district_name}
                                </span>
                                <span style={{ color: "var(--dash-text-secondary)" }}>
                                    , {locationData.nearest_area.province_name}
                                </span>
                            </div>
                            <span
                                className="text-xs font-semibold rounded-full px-2.5 py-1 shrink-0 border"
                                style={{
                                    color: "var(--color-success)",
                                    background: "rgba(22,163,74,0.09)",
                                    borderColor: "rgba(22,163,74,0.28)",
                                }}
                            >
                                ✓ Detected
                            </span>
                        </div>
                    ) : null}

                    {/* Report form card */}
                    <div className="card-panel">
                        <div className="card-panel-header">
                            <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm"
                                style={{ background: "var(--color-primary)" }}
                            >
                                <Sparkles className="h-3.5 w-3.5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold" style={{ color: "var(--dash-text-primary)" }}>
                                    Describe the Health Incident
                                </h2>
                                <p className="text-xs" style={{ color: "var(--dash-text-muted)" }}>
                                    Be specific — AI will extract key details
                                </p>
                            </div>
                        </div>

                        <div className="p-5 space-y-4">
                            <Textarea
                                placeholder="Describe symptoms, number of cases, affected age group, and timeline…"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={5}
                                className="w-full px-4 py-3 rounded-xl resize-none transition-all duration-200 text-sm border outline-none"
                                style={{
                                    background: "var(--dash-input-bg)",
                                    borderColor: "var(--dash-input-border)",
                                    color: "var(--dash-input-text)",
                                }}
                                disabled={loading || locationLoading}
                            />
                            <p className="text-xs" style={{ color: "var(--dash-text-muted)" }}>
                                Include symptoms, location specifics, and timeline for accurate AI analysis.
                            </p>

                            <Button
                                onClick={analyzeAndSubmit}
                                disabled={loading || locationLoading || !locationData}
                                className="cursor-pointer w-full text-white font-semibold py-2.5 rounded-xl shadow-md transition-all duration-200 disabled:opacity-60"
                                style={{
                                    background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)",
                                }}
                            >
                                {loading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing with AI…</>
                                ) : (
                                    <><Send className="mr-2 h-4 w-4" />Submit Report</>
                                )}
                            </Button>

                            {/* Error */}
                            {error && (
                                <div
                                    className="flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm animate-fade-in-scale"
                                    style={{
                                        background: "rgba(220,38,38,0.08)",
                                        borderColor: "rgba(220,38,38,0.28)",
                                        color: "var(--color-danger)",
                                    }}
                                >
                                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Success banner */}
                            {submitResponse && (
                                <div
                                    className="rounded-xl border p-4 space-y-3 animate-fade-in-scale"
                                    style={{
                                        background: "rgba(22,163,74,0.08)",
                                        borderColor: "rgba(22,163,74,0.28)",
                                    }}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: "var(--color-success)" }} />
                                        <div>
                                            <p className="text-sm font-semibold" style={{ color: "var(--color-success)" }}>
                                                Report Submitted Successfully
                                            </p>
                                            <p className="text-xs" style={{ color: "var(--dash-text-secondary)" }}>
                                                ID: #{submitResponse.data.report_id}
                                            </p>
                                        </div>
                                    </div>
                                
                                </div>
                            )}

                            {/* Analysis preview */}
                            {extractedData && !submitResponse && (
                                <div className="card-panel animate-fade-in-scale">
                                    <div className="card-panel-header">
                                        <div
                                            className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm"
                                            style={{
                                                background: "linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%)",
                                            }}
                                        >
                                            <BrainCircuit className="h-3.5 w-3.5 text-white" />
                                        </div>
                                        <span
                                            className="text-sm font-semibold"
                                            style={{ color: "var(--dash-text-primary)" }}
                                        >
                                            AI Analysis Complete
                                        </span>
                                        <span
                                            className="ml-auto text-[10px] font-bold rounded-full px-2.5 py-1 border"
                                            style={{
                                                color: "var(--color-primary)",
                                                background: "rgba(30,58,138,0.09)",
                                                borderColor: "rgba(30,58,138,0.22)",
                                            }}
                                        >
                                            {extractedData.confidence} confidence
                                        </span>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        <div className="grid grid-cols-2 gap-2">
                                            <InfoChip label="Disease" value={extractedData.disease_name || "Unknown"} />
                                            <InfoChip label="Cases"   value={extractedData.cases_reported ?? "N/A"} />
                                            <InfoChip label="Type"    value={extractedData.disease_type} />
                                            <div
                                                className="rounded-xl border px-3 py-2.5"
                                                style={{
                                                    background: "var(--dash-card-bg)",
                                                    borderColor: "var(--dash-card-border)",
                                                }}
                                            >
                                                <p
                                                    className="text-[10px] font-bold uppercase tracking-wider mb-1"
                                                    style={{ color: "var(--dash-text-muted)" }}
                                                >
                                                    Severity
                                                </p>
                                                <SeverityBadge severity={extractedData.severity} />
                                            </div>
                                        </div>
                                        {extractedData.symptoms.length > 0 && (
                                            <div>
                                                <p
                                                    className="text-[10px] font-bold uppercase tracking-wider mb-2"
                                                    style={{ color: "var(--dash-text-muted)" }}
                                                >
                                                    Detected Symptoms
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {extractedData.symptoms.map((s, i) => (
                                                        <span
                                                            key={i}
                                                            className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
                                                            style={{
                                                                background: "var(--dash-card-bg)",
                                                                borderColor: "var(--dash-card-border)",
                                                                color: "var(--dash-text-secondary)",
                                                            }}
                                                        >
                                                            {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Right column: recent reports ─────────────────────────── */}
                <aside className="xl:col-span-7 space-y-3 xl:sticky xl:top-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" style={{ color: "var(--dash-text-muted)" }} />
                            <h2 className="text-base font-semibold" style={{ color: "var(--dash-text-primary)" }}>
                                Recent Reports
                            </h2>
                        </div>
                        {locationData?.nearest_area && (
                            <span
                                className="text-xs font-medium rounded-full px-2.5 py-1 border"
                                style={{
                                    color: "var(--color-primary)",
                                    background: "rgba(30,58,138,0.08)",
                                    borderColor: "rgba(30,58,138,0.2)",
                                }}
                            >
                                {locationData.nearest_area.district_name}
                            </span>
                        )}
                    </div>

                    {historyLoading ? (
                        <div
                            className="rounded-2xl border space-y-3 p-6"
                            style={{ background: "var(--dash-card-bg)", borderColor: "var(--dash-card-border)" }}
                        >
                            <div className="h-12 w-3/4 bg-foreground/10 rounded-md animate-pulse" />
                            <div className="h-12 w-full bg-foreground/10 rounded-md animate-pulse" />
                            <div className="h-12 w-full bg-foreground/10 rounded-md animate-pulse" />
                            <div className="h-12 w-5/6 bg-foreground/10 rounded-md animate-pulse" />
                        </div>
                    ) : history.length === 0 ? (
                        <div
                            className="flex flex-col items-center justify-center rounded-2xl border py-14 text-center"
                            style={{ background: "var(--dash-card-bg)", borderColor: "var(--dash-card-border)" }}
                        >
                            <div
                                className="w-12 h-12 rounded-2xl border flex items-center justify-center mb-3"
                                style={{
                                    background: "var(--dash-card-header-bg)",
                                    borderColor: "var(--dash-card-border)",
                                }}
                            >
                                <FileText className="h-6 w-6" style={{ color: "var(--dash-text-muted)" }} />
                            </div>
                            <p className="text-sm font-semibold" style={{ color: "var(--dash-text-secondary)" }}>
                                No reports found
                            </p>
                            <p className="text-xs mt-1" style={{ color: "var(--dash-text-muted)" }}>
                                No disease reports for this area yet.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3 xl:max-h-[calc(100vh-13rem)] xl:overflow-y-auto xl:pr-1">
                            {(() => {
                                const twoWeeksAgo = new Date();
                                twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

                                const displayedHistory = [...history]
                                    .filter(r => new Date(r.created_at) >= twoWeeksAgo)
                                    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

                                if (displayedHistory.length === 0) {
                                    return (
                                        <div className="text-center py-6 text-sm" style={{ color: "var(--dash-text-muted)" }}>
                                            No recent reports scored or found within the last 14 days.
                                        </div>
                                    );
                                }

                                return displayedHistory.map((report, index) => {
                                    const severityStripColor = report.extracted_data
                                    ? getSeverityStripColor(report.extracted_data.severity)
                                    : null;
                                return (
                                    <div
                                        key={report.report_id}
                                        className="card-panel animate-fade-in-scale overflow-hidden"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        {/* Severity top strip */}
                                        {severityStripColor && (
                                            <div
                                                className="h-1 w-full"
                                                style={{ background: severityStripColor }}
                                            />
                                        )}

                                        <div className="p-4 sm:p-5 space-y-3">
                                            {/* Header */}
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <h3
                                                        className="text-sm font-semibold truncate"
                                                        style={{ color: "var(--dash-text-primary)" }}
                                                    >
                                                        {report.extracted_data?.disease_name || "Unverified Report"}
                                                    </h3>
                                                    <p
                                                        className="text-xs mt-0.5"
                                                        style={{ color: "var(--dash-text-muted)" }}
                                                    >
                                                        {new Date(report.created_at).toLocaleDateString("en-US", {
                                                            month: "short",
                                                            day: "numeric",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end gap-1.5">
                                                    <StatusBadge status={report.status} />
                                                    <div
                                                        className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border"
                                                        style={{
                                                            background: "rgba(30,58,138,0.08)",
                                                            borderColor: "rgba(30,58,138,0.22)",
                                                            color: "var(--color-primary)"
                                                        }}
                                                    >
                                                        <ThumbsUp className="h-3 w-3" />
                                                        {report.score ?? 0} Votes
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Description */}
                                            <p
                                                className="text-sm line-clamp-2"
                                                style={{ color: "var(--dash-text-secondary)" }}
                                            >
                                                {report.description}
                                            </p>

                                            {/* Stats chips */}
                                            {report.extracted_data && (
                                                <div className="grid grid-cols-3 gap-2">
                                                    <InfoChip label="Cases" value={report.extracted_data.cases_reported ?? "N/A"} />
                                                    <InfoChip label="Type"  value={report.extracted_data.disease_type} />
                                                    <div
                                                        className="rounded-xl border px-3 py-2.5"
                                                        style={{
                                                            background: "var(--dash-card-bg)",
                                                            borderColor: "var(--dash-card-border)",
                                                        }}
                                                    >
                                                        <p
                                                            className="text-[10px] font-bold uppercase tracking-wider mb-1"
                                                            style={{ color: "var(--dash-text-muted)" }}
                                                        >
                                                            Severity
                                                        </p>
                                                        <SeverityBadge severity={report.extracted_data.severity} />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Vote toggle */}
                                            <Toggle
                                                pressed={Boolean(report.has_voted)}
                                                disabled={Boolean(voteLoadingByReport[report.report_id]) || !user?.$id}
                                                onPressedChange={() =>
                                                    toggleVoteReport(report.report_id, Boolean(report.has_voted))
                                                }
                                                className="cursor-pointer w-full flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition-all duration-200"
                                                style={
                                                    report.has_voted
                                                        ? {
                                                            background: "rgba(30,58,138,0.12)",
                                                            borderColor: "rgba(30,58,138,0.32)",
                                                            color: "var(--color-primary)",
                                                        }
                                                        : {
                                                            background: "var(--dash-card-header-bg)",
                                                            borderColor: "var(--dash-card-border)",
                                                            color: "var(--dash-text-secondary)",
                                                        }
                                                }
                                            >
                                                {voteLoadingByReport[report.report_id] ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : report.has_voted ? (
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                ) : (
                                                    <ThumbsUp className="h-3.5 w-3.5" />
                                                )}
                                                <span>
                                                    {report.has_voted ? "Voted • Remove vote" : "I have the same problem"}
                                                </span>
                                            </Toggle>

                                            {/* Location footer */}
                                            {report.district_info && (
                                                <div
                                                    className="flex items-center gap-2 pt-2.5 border-t text-xs"
                                                    style={{
                                                        borderColor: "var(--dash-card-border)",
                                                        color: "var(--dash-text-muted)",
                                                    }}
                                                >
                                                    <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--dash-text-muted)" }} />
                                                    <span>{report.district_info.district_name}</span>
                                                    <ChevronRight className="h-3 w-3" style={{ opacity: 0.4 }} />
                                                    <span>{report.district_info.distance_km.toFixed(1)} km away</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}
