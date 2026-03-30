"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
    created_at: string;
}

const getSeverityConfig = (severity: string) => {
    switch (severity.toLowerCase()) {
        case "high":
        case "severe":
            return { bg: "bg-rose-50",   text: "text-rose-700",   border: "border-rose-200",   strip: "bg-rose-400"   };
        case "medium":
        case "moderate":
            return { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", strip: "bg-orange-400" };
        case "low":
        case "mild":
            return { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200",  strip: "bg-amber-400"  };
        default:
            return { bg: "bg-slate-50",  text: "text-slate-700",  border: "border-slate-200",  strip: "bg-slate-300"  };
    }
};

const getStatusConfig = (status: string | null) => {
    switch (status?.toLowerCase()) {
        case "verified":
        case "confirmed":
            return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" };
        case "pending":
            return { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200"    };
        case "investigating":
            return { bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-200"  };
        default:
            return { bg: "bg-slate-50",   text: "text-slate-600",   border: "border-slate-200"   };
    }
};

function InfoChip({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="rounded-xl border px-3 py-2.5 shadow-sm" style={{ background: "var(--dash-card-bg)", borderColor: "var(--dash-card-border)" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "var(--dash-text-muted)" }}>{label}</p>
            <p className="text-sm font-semibold" style={{ color: "var(--dash-text-primary)" }}>{value}</p>
        </div>
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

    const { locationData, isLoading: locationLoading, error: locationError } = useLocation();

    const analyzeAndSubmit = async () => {
        if (!description.trim()) { setError("Please enter a disease report."); return; }
        if (!locationData?.user_location) { setError("Location data not available. Please refresh the page."); return; }
        setLoading(true); setError(null); setExtractedData(null); setSubmitResponse(null);
        try {
            const getCookie = (name: string) => {
                const value = `; ${document.cookie}`;
                const parts = value.split(`; ${name}=`);
                if (parts.length === 2) return parts.pop()?.split(";").shift();
                return null;
            };
            const token  = getCookie("token");
            const userId = localStorage.getItem("user_id");
            if (!token || !userId) throw new Error("Authentication required. Please log in again.");
            const response = await fetch("/api/extract-disease-info", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    description: description.trim(),
                    user_id: userId,
                    latitude:  locationData.user_location.latitude,
                    longitude: locationData.user_location.longitude,
                    token,
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to process report");
            setExtractedData(data.extracted_data);
            if (data.submission) { setSubmitResponse(data.submission); await fetchReportHistory(); }
            setDescription("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unexpected error occurred");
        } finally { setLoading(false); }
    };

    const fetchReportHistory = useCallback(async () => {
        if (!locationData?.nearest_area?.district_name) return;
        try {
            setHistoryLoading(true);
            const response = await axios.get("/api/reports/location", {
                params: { district_name: locationData.nearest_area.district_name },
            });
            setHistory(response.data.reports || []);
        } catch { setHistory([]); }
        finally { setHistoryLoading(false); }
    }, [locationData?.nearest_area?.district_name]);

    useEffect(() => {
        if (locationData?.nearest_area?.district_name) fetchReportHistory();
    }, [locationData?.nearest_area?.district_name, fetchReportHistory]);

    const upvoteReport = async (reportId: string) => {
        try {
            const userId = localStorage.getItem("user_id");
            if (!userId) { setError("Please log in to vote"); return; }
            if (!locationData?.nearest_area?.district_name) { setError("Location data not available"); return; }
            await axios.post("/api/reports/upvote", {
                reportid: reportId,
                userid:   userId,
                location: locationData.nearest_area.district_name,
            });
            await fetchReportHistory();
        } catch { setError("User has already voted for this report"); }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 py-2">

            {/* ── Page header ──────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 pt-1">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-600 to-blue-700
                    flex items-center justify-center shadow-md shadow-blue-500/25 flex-shrink-0">
                    <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--dash-text-primary)" }}>Health Incident Report</h1>
                    <p className="text-xs" style={{ color: "var(--dash-text-muted)" }}>AI-powered community health monitoring</p>
                </div>
            </div>

            {/* ── Location pill ─────────────────────────────────────────────  */}
            {locationLoading ? (
                <div className="flex items-center gap-3 rounded-xl border px-4 py-3 shadow-sm animate-pulse" style={{ background: "var(--dash-card-bg)", borderColor: "var(--dash-card-border)" }}>
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    <span className="text-sm" style={{ color: "var(--dash-text-secondary)" }}>Detecting location…</span>
                </div>
            ) : locationError ? (
                <div className="flex items-center gap-3 rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 px-4 py-3">
                    <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span className="text-sm text-rose-700 dark:text-rose-300">{locationError}</span>
                </div>
            ) : locationData?.nearest_area ? (
                <div className="flex items-center gap-3 rounded-xl border border-blue-100 dark:border-blue-500/25 bg-blue-50/70 dark:bg-blue-500/10 px-4 py-3 shadow-sm">
                    <div className="w-8 h-8 rounded-lg border border-blue-100 dark:border-blue-500/25 flex items-center justify-center shrink-0 shadow-sm" style={{ background: "var(--dash-card-bg)" }}>
                        <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0 text-sm">
                        <span className="font-semibold" style={{ color: "var(--dash-text-primary)" }}>{locationData.nearest_area.district_name}</span>
                        <span style={{ color: "var(--dash-text-secondary)" }}>, {locationData.nearest_area.province_name}</span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 rounded-full px-2.5 py-1 shrink-0">
                        ✓ Detected
                    </span>
                </div>
            ) : null}

            {/* ── Report form card ──────────────────────────────────────────── */}
            <div className="card-panel">
                {/* Gradient header bar */}
                <div className="card-panel-header border-b border-slate-100">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700
                        flex items-center justify-center shadow-sm">
                        <Sparkles className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-slate-900">Describe the Health Incident</h2>
                        <p className="text-xs text-slate-400">Be specific — AI will extract key details</p>
                    </div>
                </div>

                <div className="p-5 space-y-4">
                    <Textarea
                        placeholder="Describe symptoms, number of cases, affected age group, and timeline…"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={5}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200
                            focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100
                            text-slate-800 placeholder:text-slate-400 resize-none transition-all duration-200 text-sm"
                        disabled={loading || locationLoading}
                    />
                    <p className="text-xs text-slate-400">
                        Include symptoms, location specifics, and timeline for accurate AI analysis.
                    </p>

                    <Button
                        onClick={analyzeAndSubmit}
                        disabled={loading || locationLoading || !locationData}
                        className="w-full bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] hover:opacity-90
                            text-white font-semibold py-2.5 rounded-xl shadow-md
                            hover:shadow-blue-200/60 transition-all duration-200 disabled:opacity-60"
                    >
                        {loading ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing with AI…</>
                        ) : (
                            <><Send className="mr-2 h-4 w-4" />Submit Report</>
                        )}
                    </Button>

                    {/* Error */}
                    {error && (
                        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50
                            px-4 py-3 text-sm text-rose-700 animate-fade-in-scale">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Success banner */}
                    {submitResponse && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3 animate-fade-in-scale">
                            <div className="flex items-center gap-2.5">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-emerald-800">Report Submitted Successfully</p>
                                    <p className="text-xs text-emerald-600">ID: #{submitResponse.data.report_id}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <InfoChip label="Disease" value={submitResponse.data.extracted_data.disease_name || "Unknown"} />
                                <InfoChip label="Type"    value={submitResponse.data.extracted_data.disease_type} />
                            </div>
                        </div>
                    )}

                    {/* Analysis preview */}
                    {extractedData && !submitResponse && (
                        <div className="card-panel animate-fade-in-scale">
                            <div className="card-panel-header border-b border-slate-100">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600
                                    flex items-center justify-center shadow-sm">
                                    <BrainCircuit className="h-3.5 w-3.5 text-white" />
                                </div>
                                <span className="text-sm font-semibold text-slate-900">AI Analysis Complete</span>
                                <Badge className="ml-auto bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold">
                                    {extractedData.confidence} confidence
                                </Badge>
                            </div>
                            <div className="p-4 space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <InfoChip label="Disease"  value={extractedData.disease_name || "Unknown"} />
                                    <InfoChip label="Cases"    value={extractedData.cases_reported ?? "N/A"} />
                                    <InfoChip label="Type"     value={extractedData.disease_type} />
                                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Severity</p>
                                        {(() => { const c = getSeverityConfig(extractedData.severity); return (
                                            <Badge className={`text-xs ${c.bg} ${c.text} ${c.border}`}>{extractedData.severity}</Badge>
                                        ); })()}
                                    </div>
                                </div>
                                {extractedData.symptoms.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                            Detected Symptoms
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {extractedData.symptoms.map((s, i) => (
                                                <Badge key={i} className="bg-white border border-slate-200 text-slate-700 text-xs">
                                                    {s}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Recent reports section ─────────────────────────────────────── */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" style={{ color: "var(--dash-text-muted)" }} />
                        <h2 className="text-base font-semibold" style={{ color: "var(--dash-text-primary)" }}>Recent Reports</h2>
                    </div>
                    {locationData?.nearest_area && (
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/25 rounded-full px-2.5 py-1">
                            {locationData.nearest_area.district_name}
                        </span>
                    )}
                </div>

                {historyLoading ? (
                    <div className="flex items-center justify-center gap-3 rounded-2xl border px-6 py-10 shadow-sm" style={{ background: "var(--dash-card-bg)", borderColor: "var(--dash-card-border)" }}>
                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                        <span className="text-sm" style={{ color: "var(--dash-text-secondary)" }}>Loading reports…</span>
                    </div>
                ) : history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border py-14 text-center shadow-sm" style={{ background: "var(--dash-card-bg)", borderColor: "var(--dash-card-border)" }}>
                        <div className="w-12 h-12 rounded-2xl border flex items-center justify-center mb-3 shadow-sm" style={{ background: "var(--dash-panel-bg)", borderColor: "var(--dash-card-border)" }}>
                            <FileText className="h-6 w-6" style={{ color: "var(--dash-text-muted)" }} />
                        </div>
                        <p className="text-sm font-semibold" style={{ color: "var(--dash-text-secondary)" }}>No reports found</p>
                        <p className="text-xs mt-1" style={{ color: "var(--dash-text-muted)" }}>No disease reports for this area yet.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {history.map((report, index) => {
                            const statusCfg   = getStatusConfig(report.status);
                            const severityCfg = report.extracted_data
                                ? getSeverityConfig(report.extracted_data.severity)
                                : null;
                            return (
                                <div
                                    key={report.report_id}
                                    className="card-panel animate-fade-in-scale overflow-hidden"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    {/* Severity left strip */}
                                    {severityCfg && (
                                        <div className={`h-1 w-full ${severityCfg.strip}`} />
                                    )}

                                    <div className="p-4 sm:p-5 space-y-3">
                                        {/* Header */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-semibold text-slate-900 truncate">
                                                    {report.extracted_data?.disease_name || "Unverified Report"}
                                                </h3>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    {new Date(report.created_at).toLocaleDateString("en-US", {
                                                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                                                    })}
                                                </p>
                                            </div>
                                            <Badge className={`text-xs shrink-0 ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                                                {report.status || "pending"}
                                            </Badge>
                                        </div>

                                        {/* Description */}
                                        <p className="text-sm text-slate-600 line-clamp-2">{report.description}</p>

                                        {/* Stats chips */}
                                        {report.extracted_data && (
                                            <div className="grid grid-cols-3 gap-2">
                                                <InfoChip label="Cases"    value={report.extracted_data.cases_reported ?? "N/A"} />
                                                <InfoChip label="Type"     value={report.extracted_data.disease_type} />
                                                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Severity</p>
                                                    {(() => { const c = getSeverityConfig(report.extracted_data.severity); return (
                                                        <Badge className={`text-[10px] ${c.bg} ${c.text} ${c.border}`}>
                                                            {report.extracted_data.severity}
                                                        </Badge>
                                                    ); })()}
                                                </div>
                                            </div>
                                        )}

                                        {/* Vote button */}
                                        <Button
                                            onClick={() => upvoteReport(report.report_id)}
                                            className="w-full bg-slate-50 hover:bg-blue-50 border border-slate-200
                                                hover:border-blue-200 text-slate-600 hover:text-blue-700
                                                shadow-none transition-all duration-200 rounded-xl text-xs font-semibold"
                                            size="sm"
                                        >
                                            <ThumbsUp className="mr-2 h-3.5 w-3.5" />
                                            I have the same problem
                                        </Button>

                                        {/* Location footer */}
                                        {report.district_info && (
                                            <div className="flex items-center gap-2 pt-2.5 border-t border-slate-100 text-xs text-slate-400">
                                                <MapPin className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                                                <span>{report.district_info.district_name}</span>
                                                <ChevronRight className="h-3 w-3 text-slate-200" />
                                                <span>{report.district_info.distance_km.toFixed(1)} km away</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
