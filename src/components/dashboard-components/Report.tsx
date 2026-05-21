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
    ShieldAlert,
    XCircle,
    Link2Off,
    MessageSquareWarning,
    HeartPulse,
    Flame,
    Info,
    Trash2,
    Edit2,
    X,
    Activity,
    User,
    Tag,
    BarChart2,
    Search,
    TrendingUp,
    Filter as FilterIcon,
    Users,
    Plus,
    RefreshCw,
} from "lucide-react";
import { useLocation } from "@/contexts/LocationContext";
import { useAuth } from "@/contexts/AuthContext";
import { account } from "@/lib/appwrite";
import { getDashboardCache, setDashboardCache } from "@/lib/dashboardCache";
import axios from "axios";

// ── Content moderation — Layers 1 & 2 (client-side, instant) ────────────────
// Layers 3 (Detoxify ML) & 4 (Groq AI) run server-side only during submission.

import { Filter } from "bad-words";

const MIN_CHARS = 20;
const MAX_CHARS = 2000;

// Layer 2 — bad-words 1300+ word dataset + domain-specific extras
const _filter = new Filter();
_filter.addWords(
    "buy now", "free offer", "limited time offer", "act now",
    "make money", "earn cash", "work from home", "weight loss",
    "casino", "lottery", "jackpot", "winner", "prize", "cash prize",
    "discount", "subscribe", "unsubscribe", "free trial", "risk free",
    "guaranteed", "no cost", "earn money",
    "send me your", "give me your", "share your details",
    "personal information", "credit card", "bank account",
    "asdf", "qwerty", "zxcv", "test123", "hello world",
    "bomb", "terrorist", "massacre", "genocide",
    "public shame", "expose you", "humiliate", "name and shame",
);

// Layer 1 — link & call-to-action regex (mirrors backend content_filter.py exactly)
const _LINK_RE = new RegExp(
    [
        "https?://",
        "ftp://",
        "www\\.",
        "mailto:",
        "\\b\\w{2,}\\.(?:com|net|org|io|lk|gov|edu|info|biz|co|app|me|tv|uk|au)\\b",
        "\\bbit\\.ly\\b", "\\btinyurl\\b", "\\bt\\.co\\b", "\\bgoo\\.gl\\b",
        "\\bfollow\\s+(?:this\\s+)?link\\b",
        "\\bclick\\s+here\\b",
        "\\bget\\s+here\\b",
        "\\bvisit\\s+(?:this\\s+)?(?:site|page|url|link|website)\\b",
        "\\bcheck\\s+(?:this\\s+)?out\\b",
        "\\bmy\\s+(?:profile|page|website|data|info|details)\\b",
        "\\bshare\\s+(?:your|my)\\s+(?:data|info|details|link)\\b",
        "\\bget\\s+(?:your|my)\\s+(?:data|info|details)\\b",
        "\\bdownload\\s+(?:now|here|this)\\b",
        "\\bjoin\\s+(?:now|here|us)\\b",
        "\\bregister\\s+(?:now|here)\\b",
        "\\bsign\\s+up\\s+(?:now|here)\\b",
    ].join("|"),
    "i"
);

/**
 * Client-side validation: Layers 1 & 2 only.
 * Returns null if valid, or a user-facing error string.
 * Layers 3 (Detoxify) & 4 (Groq) run server-side during submission.
 */
function validateReportContent(text: string): string | null {
    const t = text.trim();
    if (t.length === 0) return null;
    if (t.length < MIN_CHARS)
        return `Too short — add at least ${MIN_CHARS - t.length} more character${MIN_CHARS - t.length !== 1 ? "s" : ""}.`;
    if (t.length > MAX_CHARS)
        return `Too long — remove ${t.length - MAX_CHARS} character${t.length - MAX_CHARS !== 1 ? "s" : ""}.`;
    // Layer 1
    const linkMatch = _LINK_RE.exec(t);
    if (linkMatch) return `Links and promotional phrases are not allowed (found: "${linkMatch[0].trim()}").`;
    // Layer 2
    if (_filter.isProfane(t)) return "Inappropriate language or spam detected. Health reports only.";
    if (/(.)\1{6,}/.test(t)) return "Repeated characters detected — looks like spam.";
    const symbolRatio = (t.match(/[^\w\s]/g) ?? []).length / Math.max(t.length, 1);
    if (symbolRatio > 0.35) return "Too many special characters. Please use plain text.";
    const letters = t.match(/[a-zA-Z]/g) ?? [];
    if (letters.length > 30) {
        const capsRatio = letters.filter((c) => c === c.toUpperCase()).length / letters.length;
        if (capsRatio > 0.75) return "Please avoid writing in ALL CAPS.";
    }
    const words = t.toLowerCase().match(/\w+/g) ?? [];
    if (words.length >= 10 && new Set(words).size / words.length < 0.3)
        return "Too much repeated text — please describe the incident in your own words.";
    return null;
}


// ── Rejection feedback system ─────────────────────────────────────────────────
// Maps the pipeline error message to a rich structured rejection object.

type RejectionLayer = "link" | "spam" | "toxicity" | "health" | "validation" | "system";

interface RejectionInfo {
    layer:   RejectionLayer;
    title:   string;
    message: string;
    hint:    string;
    example: string;
}

function parseRejection(errorMsg: string): RejectionInfo {
    const m = errorMsg.toLowerCase();

    // Layer 1 — Link / CTA detection
    if (m.includes("links and promotional") || m.includes("follow this link") ||
        m.includes("cannot contain links") || m.includes("urls or links") ||
        m.includes("url") || m.includes("website")) {
        return {
            layer:   "link",
            title:   "Link or Promotional Phrase Detected",
            message: errorMsg,
            hint:    "Remove all URLs, website addresses, and phrases like \"click here\", \"follow this link\", \"get here\", or \"visit this site\".",
            example: "\"10 children in Gampaha reported dengue with high fever and rash over the past 3 days.\"",
        };
    }

    // Layer 2 — Spam / profanity
    if (m.includes("inappropriate language") || m.includes("spam") ||
        m.includes("profanity") || m.includes("offensive")) {
        return {
            layer:   "spam",
            title:   "Inappropriate Language or Spam Detected",
            message: errorMsg,
            hint:    "Use respectful, clinical language. Avoid profanity, promotional words, or marketing phrases.",
            example: "\"Several adults in Colombo 05 are experiencing vomiting and diarrhoea since yesterday.\"",
        };
    }

    // Layer 2 — Structural spam
    if (m.includes("repeated characters") || m.includes("special characters") ||
        m.includes("all caps") || m.includes("repeated text")) {
        return {
            layer:   "spam",
            title:   "Spam Pattern Detected",
            message: errorMsg,
            hint:    "Write in normal sentence case, avoid repeating characters or words, and use plain text without excessive punctuation.",
            example: "\"Residents in Kandy reported flu-like symptoms with fever above 38°C.\"",
        };
    }

    // Layer 2 — Length
    if (m.includes("too short") || m.includes("at least 20")) {
        return {
            layer:   "validation",
            title:   "Report Too Short",
            message: errorMsg,
            hint:    "Include the disease name or symptoms, number of people affected, and a rough timeline.",
            example: "\"3 cases of suspected typhoid in Jaffna — patients have high fever, headache, and abdominal pain for 5 days.\"",
        };
    }
    if (m.includes("too long") || m.includes("2,000 characters") || m.includes("2000 characters")) {
        return {
            layer:   "validation",
            title:   "Report Too Long",
            message: errorMsg,
            hint:    "Shorten your description to the key facts: disease, symptoms, case count, and location.",
            example: "\"Dengue outbreak in Ratnapura — 12 cases, fever and joint pain, past 2 weeks.\"",
        };
    }

    // Layer 3 — Detoxify toxicity
    if (m.includes("harmful") || m.includes("threatening") || m.includes("toxic") ||
        m.includes("offensive content") || m.includes("factual and respectful")) {
        return {
            layer:   "toxicity",
            title:   "Harmful or Offensive Content Detected",
            message: errorMsg,
            hint:    "Keep your report factual and respectful. Avoid threats, insults, or language targeting individuals or groups.",
            example: "\"School children in Matara are showing signs of food poisoning — vomiting and nausea after lunch.\"",
        };
    }

    // Layer 4 — Groq health relevance
    if (m.includes("doesn\u2019t appear") || m.includes("health or disease") ||
        m.includes("real health") || m.includes("genuine health") ||
        m.includes("health incident") || m.includes("epilanka only accepts")) {
        return {
            layer:   "health",
            title:   "Not a Health Incident Report",
            message: errorMsg,
            hint:    "EpiLanka only accepts genuine disease and health incident reports. Describe actual symptoms, patient counts, or health concerns in your community.",
            example: "\"A cluster of dengue cases has been identified in Wattala — 7 confirmed, fever and rash reported.\"",
        };
    }

    // Fallback — generic system error
    return {
        layer:   "system",
        title:   "Submission Failed",
        message: errorMsg,
        hint:    "Please check your report content and try again. If the problem persists, refresh the page.",
        example: "",
    };
}

const LAYER_STYLES: Record<RejectionLayer, { bg: string; border: string; accent: string; badge: string }> = {
    link:       { bg: "rgba(234,88,12,0.07)",  border: "rgba(234,88,12,0.30)",  accent: "#c2410c", badge: "bg-orange-100 text-orange-700" },
    spam:       { bg: "rgba(220,38,38,0.07)",  border: "rgba(220,38,38,0.30)",  accent: "#dc2626", badge: "bg-red-100 text-red-700" },
    toxicity:   { bg: "rgba(168,85,247,0.07)", border: "rgba(168,85,247,0.30)", accent: "#9333ea", badge: "bg-purple-100 text-purple-700" },
    health:     { bg: "rgba(37,99,235,0.07)",  border: "rgba(37,99,235,0.30)",  accent: "#1d4ed8", badge: "bg-blue-100 text-blue-700" },
    validation: { bg: "rgba(245,158,11,0.07)", border: "rgba(245,158,11,0.30)", accent: "#d97706", badge: "bg-amber-100 text-amber-700" },
    system:     { bg: "rgba(100,116,139,0.07)",border: "rgba(100,116,139,0.30)",accent: "#475569", badge: "bg-slate-100 text-slate-700" },
};

const LAYER_ICON: Record<RejectionLayer, React.ReactNode> = {
    link:       <Link2Off className="h-5 w-5 shrink-0" />,
    spam:       <MessageSquareWarning className="h-5 w-5 shrink-0" />,
    toxicity:   <Flame className="h-5 w-5 shrink-0" />,
    health:     <HeartPulse className="h-5 w-5 shrink-0" />,
    validation: <AlertCircle className="h-5 w-5 shrink-0" />,
    system:     <XCircle className="h-5 w-5 shrink-0" />,
};

const LAYER_LABEL: Record<RejectionLayer, string> = {
    link:       "Layer 1 • Link Detection",
    spam:       "Layer 2 • Spam Filter",
    toxicity:   "Layer 3 • Toxicity Detection",
    health:     "Layer 4 • Health Relevance",
    validation: "Validation",
    system:     "System Error",
};

function RejectionCard({ errorMsg, onDismiss }: { errorMsg: string; onDismiss: () => void }) {
    const rej    = parseRejection(errorMsg);
    const styles = LAYER_STYLES[rej.layer];
    const icon   = LAYER_ICON[rej.layer];
    const label  = LAYER_LABEL[rej.layer];

    return (
        <div
            className="rounded-2xl border overflow-hidden animate-fade-in-scale"
            style={{ background: styles.bg, borderColor: styles.border }}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between px-4 py-3 border-b"
                style={{ borderColor: styles.border }}
            >
                <div className="flex items-center gap-2.5" style={{ color: styles.accent }}>
                    {icon}
                    <span className="text-sm font-bold">{rej.title}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span
                        className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ background: styles.border, color: styles.accent }}
                    >
                        {label}
                    </span>
                    <button
                        onClick={onDismiss}
                        className="rounded-lg p-1 transition-opacity hover:opacity-70"
                        style={{ color: styles.accent }}
                        aria-label="Dismiss"
                    >
                        <XCircle className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="px-4 py-3 space-y-3">
                {/* Error detail */}
                <p className="text-sm" style={{ color: styles.accent }}>
                    {rej.message}
                </p>

                {/* Fix hint */}
                <div
                    className="flex items-start gap-2 rounded-xl px-3 py-2.5"
                    style={{ background: "var(--dash-card-bg)", border: `1px solid ${styles.border}` }}
                >
                    <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: styles.accent }} />
                    <p className="text-xs" style={{ color: "var(--dash-text-secondary)" }}>
                        <span className="font-semibold" style={{ color: styles.accent }}>How to fix: </span>
                        {rej.hint}
                    </p>
                </div>

                {/* Example */}
                {rej.example && (
                    <div
                        className="rounded-xl px-3 py-2.5"
                        style={{ background: "var(--dash-card-bg)", border: `1px solid ${styles.border}` }}
                    >
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: styles.accent }}>
                            ✓ Example of a valid report
                        </p>
                        <p className="text-xs italic" style={{ color: "var(--dash-text-secondary)" }}>
                            {rej.example}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

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

// Relative time helper — "2h ago", "3d ago", etc.
function formatRelativeTime(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const diffMs = Date.now() - d.getTime();
    const sec = Math.round(diffMs / 1000);
    if (sec < 60) return "just now";
    const min = Math.round(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.round(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const days = Math.round(hr / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.round(days / 7);
    if (weeks < 5) return `${weeks}w ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Quick-fill suggestion templates — speed up reporting common scenarios
const QUICK_SUGGESTIONS: { label: string; icon: React.ReactNode; template: string }[] = [
    {
        label: "Fever cluster",
        icon: <Flame className="h-3 w-3" />,
        template: "Multiple people in our area are reporting high fever (above 38°C) with body aches over the last ",
    },
    {
        label: "Dengue symptoms",
        icon: <HeartPulse className="h-3 w-3" />,
        template: "Cases of dengue-like symptoms — fever, severe headache, joint pain, and skin rash — have been observed in ",
    },
    {
        label: "Stomach illness",
        icon: <Activity className="h-3 w-3" />,
        template: "Several residents are experiencing vomiting, diarrhoea, and abdominal pain since ",
    },
    {
        label: "Respiratory",
        icon: <ShieldAlert className="h-3 w-3" />,
        template: "A cluster of respiratory infections with cough, sore throat, and fatigue has appeared in ",
    },
];

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
    const [validating,     setValidating]     = useState(false);
    const [extractedData,  setExtractedData]  = useState<ExtractedData | null>(null);
    const [submitResponse, setSubmitResponse] = useState<SubmitResponse | null>(null);
    const [error,          setError]          = useState<string | null>(null);
    const [history,        setHistory]        = useState<HistoryReport[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [voteLoadingByReport, setVoteLoadingByReport] = useState<Record<string, boolean>>({});

    // New state for Edit/Delete
    const [editingReportId, setEditingReportId] = useState<string | null>(null);
    const [editingDescription, setEditingDescription] = useState("");
    const [editingLoading, setEditingLoading] = useState<Record<string, boolean>>({});
    const [deletingLoading, setDeletingLoading] = useState<Record<string, boolean>>({});
    const [selectedReport, setSelectedReport] = useState<HistoryReport | null>(null);

    // Filter / search state for recent reports
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "verified" | "pending" | "investigating">("all");
    const [textareaFocused, setTextareaFocused] = useState(false);

    const handleDeleteReport = async (reportId: string) => {
        if (!confirm("Are you sure you want to delete this report?")) return;
        
        try {
            if (!locationData?.nearest_area?.district_name) throw new Error("Location data not available");
            
            setDeletingLoading(prev => ({ ...prev, [reportId]: true }));
            await axios.delete(`/api/user-reports/delete?reportid=${reportId}&location=${locationData.nearest_area.district_name}`);
            
            setHistory(prev => {
                const updated = prev.filter(r => r.report_id !== reportId);
                if (historyCacheKey) setDashboardCache(historyCacheKey, updated);
                return updated;
            });
        } catch (err) {
            setError("Failed to delete report. Please try again.");
        } finally {
            setDeletingLoading(prev => {
                const copy = { ...prev };
                delete copy[reportId];
                return copy;
            });
        }
    };

    const handleUpdateReport = async (reportId: string) => {
        if (!editingDescription.trim()) return;
        const err = validateReportContent(editingDescription);
        if (err) {
            setError(err);
            return;
        }

        try {
            if (!locationData?.nearest_area?.district_name) throw new Error("Location data not available");
            
            setEditingLoading(prev => ({ ...prev, [reportId]: true }));
            
            await axios.put(`/api/user-reports/update`, {
                reportid: reportId,
                location: locationData.nearest_area.district_name,
                description: editingDescription.trim()
            });
            
            setHistory(prev => {
                const updated = prev.map(r => r.report_id === reportId ? { ...r, description: editingDescription.trim() } : r);
                if (historyCacheKey) setDashboardCache(historyCacheKey, updated);
                return updated;
            });
            setEditingReportId(null);
        } catch (err) {
            setError("Failed to update report. Please try again.");
        } finally {
            setEditingLoading(prev => {
                const copy = { ...prev };
                delete copy[reportId];
                return copy;
            });
        }
    };

    // Live content validation
    const contentError = useMemo(() => validateReportContent(description), [description]);
    const charCount = description.trim().length;
    const charCountColor =
        charCount > MAX_CHARS ? "var(--color-danger)" :
        charCount >= MAX_CHARS * 0.9 ? "#f97316" :
        "var(--dash-text-muted)";

    const { user } = useAuth();
    const { locationData, isLoading: locationLoading, error: locationError } = useLocation();
    const provinceName = locationData?.nearest_area?.province_name;

    const historyCacheKey = useMemo(() => {
        const district = locationData?.nearest_area?.district_name;
        if (!district) return null;
        return `reports-history:${district}:user:${user?.$id ?? "guest"}`;
    }, [locationData?.nearest_area?.district_name, user?.$id]);

    const analyzeAndSubmit = async () => {
        if (!description.trim()) { setError("Please enter a disease report."); return; }
        if (contentError) { setError(contentError); return; }
        if (!locationData?.user_location) { setError("Location data not available. Please refresh the page."); return; }
        setLoading(true); setValidating(true); setError(null); setExtractedData(null); setSubmitResponse(null);
        try {
            if (!user?.$id) throw new Error("Authentication required. Please log in again.");
            const jwtObj = await account.createJWT();
            // Server runs Layers 1-2 (guard), then Detoxify (Layer 3), then Groq health check (Layer 4)
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
            setValidating(false); // layers 3-4 complete
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to process report");
            setExtractedData(data.extracted_data);
            if (data.submission) { setSubmitResponse(data.submission); await fetchReportHistory(true); }
            setDescription("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unexpected error occurred");
        } finally { setLoading(false); setValidating(false); }
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
                    province_name: provinceName,
                    user_id: user?.$id,
                    days: 30,
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

    // Compute overview stats from history
    const overviewStats = useMemo(() => {
        const myReports = history.filter(r => r.user_id === user?.$id).length;
        const verified = history.filter(r => r.status?.toLowerCase() === "verified" || r.status?.toLowerCase() === "confirmed").length;
        const totalVotes = history.reduce((sum, r) => sum + (r.score ?? 0), 0);
        // Most reported disease
        const diseaseCounts = new Map<string, number>();
        history.forEach(r => {
            const name = r.extracted_data?.disease_name;
            if (name && !name.toLowerCase().includes("unknown")) {
                diseaseCounts.set(name, (diseaseCounts.get(name) ?? 0) + 1);
            }
        });
        let topDisease: string | null = null;
        let topCount = 0;
        diseaseCounts.forEach((c, name) => { if (c > topCount) { topCount = c; topDisease = name; } });
        return { total: history.length, myReports, verified, totalVotes, topDisease, topCount };
    }, [history, user?.$id]);

    const applySuggestion = (template: string) => {
        const next = description.trim().length === 0 ? template : description.trim() + " " + template;
        setDescription(next);
    };

    return (
        <div className="w-full max-w-7xl mx-auto space-y-5">

            {/* ── Page header with gradient hero ─────────────────────────── */}
            <div
                className="relative overflow-hidden rounded-2xl border p-5 sm:p-6 animate-fade-in"
                style={{
                    background: "linear-gradient(135deg, rgba(30,58,138,0.10) 0%, rgba(124,58,237,0.06) 50%, rgba(30,58,138,0.04) 100%)",
                    borderColor: "var(--dash-card-border)",
                }}
            >
                {/* Decorative blobs */}
                <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-30 blur-3xl"
                    style={{ background: "radial-gradient(circle, var(--color-primary) 0%, transparent 70%)" }} />
                <div className="pointer-events-none absolute -bottom-20 -left-10 w-56 h-56 rounded-full opacity-20 blur-3xl"
                    style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }} />

                <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
                    <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shrink-0 ring-4 ring-white/40 dark:ring-white/5"
                        style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%)" }}
                    >
                        <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: "var(--dash-text-primary)" }}>
                                Health Incident Report
                            </h1>
                            <span className="hidden sm:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border"
                                style={{ background: "rgba(124,58,237,0.10)", color: "#7c3aed", borderColor: "rgba(124,58,237,0.28)" }}>
                                <Sparkles className="h-2.5 w-2.5" /> AI
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm" style={{ color: "var(--dash-text-secondary)" }}>
                            Report an outbreak in your area — AI extracts disease, severity, and cases automatically.
                        </p>
                    </div>
                    <button
                        onClick={() => fetchReportHistory(true)}
                        disabled={historyLoading}
                        className="hidden sm:inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                        style={{
                            background: "var(--dash-card-bg)",
                            borderColor: "var(--dash-card-border)",
                            color: "var(--dash-text-secondary)",
                        }}
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${historyLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                </div>

                {/* Stats strip */}
                <div className="relative mt-5 grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    {[
                        { icon: <FileText className="h-3.5 w-3.5" />, label: "In your area", value: overviewStats.total, color: "var(--color-primary)", bg: "rgba(30,58,138,0.08)" },
                        { icon: <User className="h-3.5 w-3.5" />,     label: "Your reports", value: overviewStats.myReports, color: "#7c3aed", bg: "rgba(124,58,237,0.08)" },
                        { icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: "Verified", value: overviewStats.verified, color: "#15803d", bg: "rgba(22,163,74,0.08)" },
                        { icon: <ThumbsUp className="h-3.5 w-3.5" />, label: "Total votes", value: overviewStats.totalVotes, color: "#c2410c", bg: "rgba(234,88,12,0.08)" },
                    ].map((s, i) => (
                        <div
                            key={s.label}
                            className="rounded-xl border px-3 py-2.5 backdrop-blur-sm transition-transform hover:-translate-y-0.5 animate-fade-in-up"
                            style={{
                                background: "var(--dash-card-bg)",
                                borderColor: "var(--dash-card-border)",
                                animationDelay: `${i * 60}ms`,
                            }}
                        >
                            <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider truncate" style={{ color: "var(--dash-text-muted)" }}>
                                    {s.label}
                                </span>
                                <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                                    style={{ background: s.bg, color: s.color }}>
                                    {s.icon}
                                </div>
                            </div>
                            <p className="text-lg font-bold tabular-nums" style={{ color: "var(--dash-text-primary)" }}>
                                {historyLoading && history.length === 0 ? (
                                    <span className="inline-block w-8 h-5 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                                ) : s.value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Trending disease pill */}
                {overviewStats.topDisease && overviewStats.topCount > 1 && (
                    <div className="relative mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 animate-fade-in-up"
                        style={{
                            background: "rgba(244,63,94,0.08)",
                            borderColor: "rgba(244,63,94,0.25)",
                            animationDelay: "240ms",
                        }}>
                        <TrendingUp className="h-3 w-3" style={{ color: "#e11d48" }} />
                        <span className="text-[11px] font-semibold" style={{ color: "#be123c" }}>
                            Trending: <span className="font-bold">{overviewStats.topDisease}</span> ({overviewStats.topCount} reports)
                        </span>
                    </div>
                )}
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
                                style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%)" }}
                            >
                                <Sparkles className="h-3.5 w-3.5 text-white" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-sm font-semibold" style={{ color: "var(--dash-text-primary)" }}>
                                    Describe the Health Incident
                                </h2>
                                <p className="text-xs" style={{ color: "var(--dash-text-muted)" }}>
                                    Be specific — AI will extract key details
                                </p>
                            </div>
                            {description.trim().length > 0 && (
                                <button
                                    onClick={() => { setDescription(""); setError(null); setExtractedData(null); setSubmitResponse(null); }}
                                    className="ml-auto text-[10px] font-semibold rounded-md px-2 py-1 transition-colors hover:opacity-70"
                                    style={{ color: "var(--dash-text-muted)" }}
                                    aria-label="Clear text"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Quick suggestion chips — speed up common reports */}
                            {description.trim().length === 0 && !loading && (
                                <div className="space-y-2 animate-fade-in">
                                    <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                                        style={{ color: "var(--dash-text-muted)" }}>
                                        <Sparkles className="h-3 w-3" /> Quick start templates
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {QUICK_SUGGESTIONS.map((s) => (
                                            <button
                                                key={s.label}
                                                onClick={() => applySuggestion(s.template)}
                                                className="group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all hover:scale-105 active:scale-95"
                                                style={{
                                                    background: "var(--dash-card-bg)",
                                                    borderColor: "var(--dash-card-border)",
                                                    color: "var(--dash-text-secondary)",
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.borderColor = "rgba(30,58,138,0.4)";
                                                    e.currentTarget.style.color = "var(--color-primary)";
                                                    e.currentTarget.style.background = "rgba(30,58,138,0.06)";
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.borderColor = "var(--dash-card-border)";
                                                    e.currentTarget.style.color = "var(--dash-text-secondary)";
                                                    e.currentTarget.style.background = "var(--dash-card-bg)";
                                                }}
                                            >
                                                {s.icon}
                                                {s.label}
                                                <Plus className="h-2.5 w-2.5 opacity-50 transition-transform group-hover:rotate-90" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Textarea with animated focus ring */}
                            <div className="relative">
                                <div
                                    className="pointer-events-none absolute inset-0 rounded-xl transition-opacity duration-300"
                                    style={{
                                        background: "linear-gradient(135deg, rgba(30,58,138,0.18) 0%, rgba(124,58,237,0.12) 100%)",
                                        opacity: textareaFocused ? 1 : 0,
                                        padding: "1.5px",
                                        WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                                        WebkitMaskComposite: "xor",
                                        maskComposite: "exclude",
                                    }}
                                />
                                <Textarea
                                    placeholder="Describe symptoms, number of cases, affected age group, and timeline…"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    onFocus={() => setTextareaFocused(true)}
                                    onBlur={() => setTextareaFocused(false)}
                                    rows={5}
                                    className="w-full px-4 py-3 rounded-xl resize-none transition-all duration-200 text-sm border outline-none relative"
                                    style={{
                                        background: "var(--dash-input-bg)",
                                        borderColor: contentError && description.trim().length > 0
                                            ? "rgba(220,38,38,0.55)"
                                            : !contentError && description.trim().length > 0
                                            ? "rgba(22,163,74,0.45)"
                                            : textareaFocused
                                            ? "transparent"
                                            : "var(--dash-input-border)",
                                        color: "var(--dash-input-text)",
                                    }}
                                    disabled={loading || locationLoading}
                                />
                            </div>

                            {/* Character progress bar */}
                            <div className="space-y-1.5">
                                <div className="relative h-1 w-full rounded-full overflow-hidden"
                                    style={{ background: "var(--dash-card-header-bg)" }}>
                                    <div
                                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
                                        style={{
                                            width: `${Math.min(100, (charCount / MAX_CHARS) * 100)}%`,
                                            background: charCount > MAX_CHARS
                                                ? "linear-gradient(90deg, #f59e0b, var(--color-danger))"
                                                : charCount >= MIN_CHARS
                                                ? "linear-gradient(90deg, var(--color-primary), #7c3aed)"
                                                : "linear-gradient(90deg, #cbd5e1, #94a3b8)",
                                        }}
                                    />
                                    {/* Minimum threshold marker */}
                                    <div className="absolute top-0 bottom-0 w-px"
                                        style={{
                                            left: `${(MIN_CHARS / MAX_CHARS) * 100}%`,
                                            background: "var(--dash-text-muted)",
                                            opacity: 0.4,
                                        }} />
                                </div>

                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 text-xs">
                                        {contentError && description.trim().length > 0 ? (
                                            <span className="flex items-start gap-1.5" style={{ color: "var(--color-danger)" }}>
                                                <ShieldAlert className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                                {contentError}
                                            </span>
                                        ) : !contentError && description.trim().length > 0 ? (
                                            <span className="flex items-center gap-1.5" style={{ color: "var(--color-success)" }}>
                                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                                Looks good — ready to submit.
                                            </span>
                                        ) : (
                                            <span style={{ color: "var(--dash-text-muted)" }}>
                                                Include symptoms, location specifics, and timeline for accurate AI analysis.
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs font-mono tabular-nums shrink-0" style={{ color: charCountColor }}>
                                        {charCount}<span className="opacity-50">/{MAX_CHARS}</span>
                                    </span>
                                </div>
                            </div>

                            <Button
                                onClick={analyzeAndSubmit}
                                disabled={loading || locationLoading || !locationData || Boolean(contentError && description.trim().length > 0)}
                                className="group relative cursor-pointer w-full text-white font-semibold py-3 rounded-xl shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden"
                                style={{
                                    background: loading || validating
                                        ? "linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%)"
                                        : "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 50%, #7c3aed 100%)",
                                    backgroundSize: "200% 200%",
                                    animation: loading || validating ? "gradient-shift 3s ease infinite" : undefined,
                                }}
                            >
                                <span className="relative inline-flex items-center justify-center">
                                    {validating ? (
                                        <><ShieldAlert className="mr-2 h-4 w-4 animate-pulse" />Validating content…</>
                                    ) : loading ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing with AI…</>
                                    ) : (
                                        <><Send className="mr-2 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />Submit Report</>
                                    )}
                                </span>
                            </Button>

                            {/* Error — rich rejection card */}
                            {error && (
                                <RejectionCard
                                    errorMsg={error}
                                    onDismiss={() => setError(null)}
                                />
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
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" style={{ color: "var(--dash-text-muted)" }} />
                            <h2 className="text-base font-semibold" style={{ color: "var(--dash-text-primary)" }}>
                                Recent Reports
                            </h2>
                            {history.length > 0 && (
                                <span className="text-[10px] font-bold rounded-full px-2 py-0.5"
                                    style={{ background: "var(--dash-card-header-bg)", color: "var(--dash-text-muted)" }}>
                                    {history.length}
                                </span>
                            )}
                        </div>
                        {locationData?.nearest_area && (
                            <span
                                className="text-xs font-medium rounded-full px-2.5 py-1 border inline-flex items-center gap-1"
                                style={{ color: "var(--color-primary)", background: "rgba(30,58,138,0.08)", borderColor: "rgba(30,58,138,0.2)" }}
                            >
                                <MapPin className="h-3 w-3" />
                                {locationData.nearest_area.district_name}
                            </span>
                        )}
                    </div>

                    {/* Search + filter chips */}
                    {history.length > 0 && (
                        <div className="space-y-2 animate-fade-in">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none"
                                    style={{ color: "var(--dash-text-muted)" }} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search by disease, symptom, or description…"
                                    className="w-full rounded-xl border pl-9 pr-9 py-2 text-sm outline-none transition-all focus:ring-2"
                                    style={{
                                        background: "var(--dash-input-bg)",
                                        borderColor: "var(--dash-input-border)",
                                        color: "var(--dash-input-text)",
                                    }}
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md transition-opacity hover:opacity-70"
                                        style={{ color: "var(--dash-text-muted)" }}
                                        aria-label="Clear search"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap">
                                <FilterIcon className="h-3 w-3 mr-0.5" style={{ color: "var(--dash-text-muted)" }} />
                                {(["all", "verified", "pending", "investigating"] as const).map(f => {
                                    const active = statusFilter === f;
                                    return (
                                        <button
                                            key={f}
                                            onClick={() => setStatusFilter(f)}
                                            className="text-[10px] font-semibold rounded-full px-2.5 py-1 border transition-all capitalize active:scale-95"
                                            style={
                                                active
                                                    ? { background: "var(--color-primary)", borderColor: "var(--color-primary)", color: "#fff" }
                                                    : { background: "var(--dash-card-bg)", borderColor: "var(--dash-card-border)", color: "var(--dash-text-secondary)" }
                                            }
                                        >
                                            {f}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {historyLoading ? (
                        <div className="rounded-2xl border p-5 space-y-3" style={{ background: "var(--dash-card-bg)", borderColor: "var(--dash-card-border)" }}>
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="flex gap-3 animate-pulse">
                                    <div className="w-1 rounded-full shrink-0 bg-slate-200 dark:bg-slate-700" style={{ minHeight: "56px" }} />
                                    <div className="flex-1 space-y-2 py-1">
                                        <div className="h-4 rounded bg-slate-200 dark:bg-slate-700" style={{ width: "55%" }} />
                                        <div className="h-3 rounded bg-slate-100 dark:bg-slate-800" style={{ width: "85%" }} />
                                        <div className="h-3 rounded bg-slate-100 dark:bg-slate-800" style={{ width: "38%" }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border py-14 text-center"
                            style={{ background: "var(--dash-card-bg)", borderColor: "var(--dash-card-border)" }}>
                            <div className="w-12 h-12 rounded-2xl border flex items-center justify-center mb-3"
                                style={{ background: "var(--dash-card-header-bg)", borderColor: "var(--dash-card-border)" }}>
                                <FileText className="h-6 w-6" style={{ color: "var(--dash-text-muted)" }} />
                            </div>
                            <p className="text-sm font-semibold" style={{ color: "var(--dash-text-secondary)" }}>No reports found</p>
                            <p className="text-xs mt-1" style={{ color: "var(--dash-text-muted)" }}>No disease reports for this area yet.</p>
                        </div>
                    ) : (() => {
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        const q = searchQuery.trim().toLowerCase();
                        const baseList = [...history]
                            .filter(r => {
                                const createdAt = new Date(r.created_at);
                                const dn = r.extracted_data?.disease_name?.toLowerCase() || "";
                                if (Number.isNaN(createdAt.getTime()) || createdAt < thirtyDaysAgo || dn.includes("unknown")) return false;
                                if (statusFilter !== "all") {
                                    const s = r.status?.toLowerCase() ?? "pending";
                                    if (statusFilter === "verified" && s !== "verified" && s !== "confirmed") return false;
                                    if (statusFilter === "pending" && s !== "pending") return false;
                                    if (statusFilter === "investigating" && s !== "investigating") return false;
                                }
                                if (q) {
                                    const haystack = [
                                        r.description ?? "",
                                        r.extracted_data?.disease_name ?? "",
                                        r.extracted_data?.disease_type ?? "",
                                        ...(r.extracted_data?.symptoms ?? []),
                                    ].join(" ").toLowerCase();
                                    if (!haystack.includes(q)) return false;
                                }
                                return true;
                            })
                            .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

                        // Top voted reports (>=3 votes) are flagged as trending
                        const topScore = baseList[0]?.score ?? 0;
                        const TRENDING_THRESHOLD = 3;

                        const displayedHistory = baseList;

                        if (displayedHistory.length === 0) {
                            return (
                                <div className="flex flex-col items-center justify-center rounded-2xl border py-12 px-6 text-center"
                                    style={{ background: "var(--dash-card-bg)", borderColor: "var(--dash-card-border)" }}>
                                    <div className="w-14 h-14 rounded-2xl border flex items-center justify-center mb-3"
                                        style={{ background: "var(--dash-card-header-bg)", borderColor: "var(--dash-card-border)" }}>
                                        <Search className="h-6 w-6" style={{ color: "var(--dash-text-muted)" }} />
                                    </div>
                                    <p className="text-sm font-semibold" style={{ color: "var(--dash-text-secondary)" }}>
                                        {q || statusFilter !== "all" ? "No matching reports" : "No verified reports yet"}
                                    </p>
                                    <p className="text-xs mt-1" style={{ color: "var(--dash-text-muted)" }}>
                                        {q || statusFilter !== "all"
                                            ? "Try a different search term or filter."
                                            : "Be the first to report an incident in your area."}
                                    </p>
                                    {(q || statusFilter !== "all") && (
                                        <button
                                            onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}
                                            className="mt-3 text-xs font-semibold rounded-full px-3 py-1 border transition-colors hover:opacity-80"
                                            style={{ background: "var(--dash-card-header-bg)", borderColor: "var(--dash-card-border)", color: "var(--color-primary)" }}
                                        >
                                            Reset filters
                                        </button>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <div className="space-y-2 xl:max-h-[calc(100vh-15rem)] xl:overflow-y-auto xl:pr-1">
                                {displayedHistory.map((report, index) => {
                                    const stripColor = report.extracted_data ? getSeverityStripColor(report.extracted_data.severity) : "var(--dash-card-border)";
                                    const sevCfg = getSeverityConfig(report.extracted_data?.severity ?? "unknown");
                                    const statCfg = getStatusConfig(report.status);
                                    const isOwn = report.user_id === user?.$id;
                                    const score = report.score ?? 0;
                                    const isTrending = score >= TRENDING_THRESHOLD && score === topScore;

                                    return (
                                        <div
                                            key={report.report_id}
                                            className="animate-fade-in-scale group relative overflow-hidden rounded-2xl border cursor-pointer select-none"
                                            style={{
                                                background: "var(--dash-card-bg)",
                                                borderColor: "var(--dash-card-border)",
                                                animationDelay: String(index * 40) + "ms",
                                                transition: "box-shadow 0.22s ease, transform 0.22s ease, border-color 0.22s ease",
                                            }}
                                            onMouseEnter={e => {
                                                const el = e.currentTarget as HTMLElement;
                                                el.style.boxShadow = "0 12px 36px -10px rgba(30,58,138,0.22)";
                                                el.style.transform = "translateY(-2px)";
                                                el.style.borderColor = "rgba(30,58,138,0.32)";
                                            }}
                                            onMouseLeave={e => {
                                                const el = e.currentTarget as HTMLElement;
                                                el.style.boxShadow = "";
                                                el.style.transform = "";
                                                el.style.borderColor = "var(--dash-card-border)";
                                            }}
                                            onClick={() => setSelectedReport(report)}
                                        >
                                            {/* Subtle gradient overlay on hover */}
                                            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                                style={{ background: "linear-gradient(135deg, rgba(30,58,138,0.04) 0%, transparent 60%)" }} />

                                            {/* Severity left accent bar */}
                                            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-all group-hover:w-1.5"
                                                style={{ background: stripColor }} />

                                            <div className="relative pl-5 pr-4 py-3.5 flex items-start gap-3">
                                                {/* Severity icon */}
                                                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-transform group-hover:scale-110"
                                                    style={{ background: sevCfg.bg, borderColor: sevCfg.border }}>
                                                    <HeartPulse className="h-4 w-4" style={{ color: sevCfg.color }} />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2 mb-1">
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <h3 className="text-sm font-semibold truncate" style={{ color: "var(--dash-text-primary)" }}>
                                                                {report.extracted_data?.disease_name || "Health Report"}
                                                            </h3>
                                                            {isTrending && (
                                                                <span
                                                                    className="inline-flex items-center gap-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold border"
                                                                    style={{
                                                                        background: "rgba(244,63,94,0.10)",
                                                                        color: "#e11d48",
                                                                        borderColor: "rgba(244,63,94,0.28)",
                                                                        animation: "pulse-glow 2.4s ease-in-out infinite",
                                                                    }}
                                                                    title="Trending — most votes in your area"
                                                                >
                                                                    <TrendingUp className="h-2.5 w-2.5" /> HOT
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="shrink-0 text-[10px] font-bold rounded-full px-2 py-0.5 border capitalize"
                                                            style={{ color: statCfg.color, background: statCfg.bg, borderColor: statCfg.border }}>
                                                            {report.status || "pending"}
                                                        </span>
                                                    </div>

                                                    <p className="text-xs line-clamp-2 mb-2.5" style={{ color: "var(--dash-text-secondary)" }}>
                                                        {report.description}
                                                    </p>

                                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            {report.extracted_data && (
                                                                <span className="text-[10px] font-semibold rounded-md px-1.5 py-0.5 border capitalize"
                                                                    style={{ color: sevCfg.color, background: sevCfg.bg, borderColor: sevCfg.border }}>
                                                                    {report.extracted_data.severity}
                                                                </span>
                                                            )}
                                                            {report.extracted_data?.cases_reported != null && (
                                                                <span className="inline-flex items-center gap-1 text-[10px] rounded-md px-1.5 py-0.5"
                                                                    style={{ background: "var(--dash-card-header-bg)", color: "var(--dash-text-secondary)" }}>
                                                                    <Users className="h-2.5 w-2.5" />
                                                                    {report.extracted_data.cases_reported}
                                                                </span>
                                                            )}
                                                            {isOwn && (
                                                                <span className="text-[10px] font-bold rounded-md px-1.5 py-0.5 border"
                                                                    style={{ background: "rgba(30,58,138,0.08)", color: "var(--color-primary)", borderColor: "rgba(30,58,138,0.22)" }}>
                                                                    Mine
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (!voteLoadingByReport[report.report_id] && user?.$id) {
                                                                        toggleVoteReport(report.report_id, Boolean(report.has_voted));
                                                                    }
                                                                }}
                                                                disabled={Boolean(voteLoadingByReport[report.report_id]) || !user?.$id}
                                                                className="flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-md transition-all border active:scale-95"
                                                                style={
                                                                    report.has_voted
                                                                        ? { background: "rgba(30,58,138,0.10)", borderColor: "rgba(30,58,138,0.28)", color: "var(--color-primary)" }
                                                                        : { background: "transparent", borderColor: "var(--dash-card-border)", color: "var(--dash-text-muted)" }
                                                                }
                                                            >
                                                                {voteLoadingByReport[report.report_id] ? (
                                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                                ) : report.has_voted ? (
                                                                    <CheckCircle2 className="h-3 w-3" />
                                                                ) : (
                                                                    <ThumbsUp className="h-3 w-3" />
                                                                )}
                                                                <span className="tabular-nums">{report.score ?? 0}</span>
                                                            </button>
                                                            <span
                                                                className="text-[10px] tabular-nums"
                                                                style={{ color: "var(--dash-text-muted)" }}
                                                                title={new Date(report.created_at).toLocaleString()}
                                                            >
                                                                {formatRelativeTime(report.created_at)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <ChevronRight className="h-4 w-4 shrink-0 mt-3 opacity-20 group-hover:opacity-80 transition-all group-hover:translate-x-1"
                                                    style={{ color: "var(--color-primary)" }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })()}
                </aside>
            </div>

            {/* ── Report Detail Modal Drawer ────────────────────────────────── */}
            {selectedReport && (() => {
                const r = selectedReport;
                const stripColor = r.extracted_data ? getSeverityStripColor(r.extracted_data.severity) : "var(--color-primary)";
                const sevCfg = getSeverityConfig(r.extracted_data?.severity ?? "unknown");
                const statCfg = getStatusConfig(r.status);
                const isOwn = r.user_id === user?.$id;

                return (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                            style={{ animation: "fade-in 0.18s ease forwards" }}
                            onClick={() => { if (editingReportId !== r.report_id) { setSelectedReport(null); setEditingReportId(null); } }}
                        />

                        {/* Slide-in drawer */}
                        <div
                            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg flex flex-col overflow-hidden"
                            style={{
                                background: "var(--dash-panel-bg)",
                                borderLeft: "1px solid var(--dash-panel-border)",
                                boxShadow: "-24px 0 60px -10px rgba(0,0,0,0.22)",
                                animation: "slide-in-right 0.3s cubic-bezier(0.16,1,0.3,1) forwards",
                            }}
                        >
                            {/* Gradient top accent */}
                            <div className="h-1.5 w-full shrink-0"
                                style={{ background: "linear-gradient(90deg," + stripColor + ", var(--color-secondary))" }} />

                            {/* Header */}
                            <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 border-b shrink-0"
                                style={{ borderColor: "var(--dash-card-border)" }}>
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                                        style={{ background: sevCfg.bg, borderColor: sevCfg.border }}>
                                        <HeartPulse className="h-5 w-5" style={{ color: sevCfg.color }} />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-base font-bold truncate" style={{ color: "var(--dash-text-primary)" }}>
                                            {r.extracted_data?.disease_name || "Health Report"}
                                        </h2>
                                        <p className="text-xs" style={{ color: "var(--dash-text-muted)" }}>
                                            {new Date(r.created_at).toLocaleDateString("en-US", {
                                                weekday: "short", year: "numeric", month: "short",
                                                day: "numeric", hour: "2-digit", minute: "2-digit"
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setSelectedReport(null); setEditingReportId(null); }}
                                    className="shrink-0 rounded-xl p-2 transition-all hover:opacity-70"
                                    style={{ background: "var(--dash-card-header-bg)", color: "var(--dash-text-muted)", border: "1px solid var(--dash-card-border)" }}
                                    aria-label="Close"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Scrollable content */}
                            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                                {/* Status + Severity badges row */}
                                <div className="flex flex-wrap gap-2">
                                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border"
                                        style={{ color: statCfg.color, background: statCfg.bg, borderColor: statCfg.border }}>
                                        <CheckCircle2 className="h-3 w-3" /> {r.status || "pending"}
                                    </span>
                                    {r.extracted_data && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border"
                                            style={{ color: sevCfg.color, background: sevCfg.bg, borderColor: sevCfg.border }}>
                                            <ShieldAlert className="h-3 w-3" /> {r.extracted_data.severity} severity
                                        </span>
                                    )}
                                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border"
                                        style={{ color: "var(--color-primary)", background: "rgba(30,58,138,0.08)", borderColor: "rgba(30,58,138,0.2)" }}>
                                        <ThumbsUp className="h-3 w-3" /> {r.score ?? 0} votes
                                    </span>
                                </div>

                                {/* Full description */}
                                <div className="rounded-xl border p-4 space-y-2"
                                    style={{ background: "var(--dash-card-header-bg)", borderColor: "var(--dash-card-border)" }}>
                                    <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                                        style={{ color: "var(--dash-text-muted)" }}>
                                        <FileText className="h-3 w-3" /> Description
                                    </p>
                                    {editingReportId === r.report_id ? (
                                        <div className="space-y-2">
                                            <Textarea
                                                value={editingDescription}
                                                onChange={e => setEditingDescription(e.target.value)}
                                                className="w-full text-sm min-h-[120px] rounded-lg"
                                                style={{ background: "var(--dash-input-bg)", borderColor: "var(--dash-input-border)", color: "var(--dash-text-primary)" }}
                                            />
                                            <div className="flex justify-end gap-2">
                                                <Button variant="outline" size="sm"
                                                    onClick={() => setEditingReportId(null)}
                                                    disabled={editingLoading[r.report_id]}>
                                                    Cancel
                                                </Button>
                                                <Button size="sm"
                                                    onClick={() => handleUpdateReport(r.report_id)}
                                                    disabled={editingLoading[r.report_id] || !editingDescription.trim()}
                                                    style={{ background: "var(--color-primary)", color: "white" }}>
                                                    {editingLoading[r.report_id] ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap"
                                            style={{ color: "var(--dash-text-secondary)" }}>
                                            {r.description}
                                        </p>
                                    )}
                                </div>

                                {/* AI extracted data */}
                                {r.extracted_data && (
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                                            style={{ color: "var(--dash-text-muted)" }}>
                                            <BrainCircuit className="h-3 w-3" /> AI Analysis
                                        </p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <InfoChip label="Cases Reported" value={r.extracted_data.cases_reported ?? "N/A"} />
                                            <InfoChip label="Disease Type" value={r.extracted_data.disease_type} />
                                            {r.extracted_data.time_period && (
                                                <InfoChip label="Time Period" value={r.extracted_data.time_period} />
                                            )}
                                            {r.extracted_data.age_group && (
                                                <InfoChip label="Age Group" value={r.extracted_data.age_group} />
                                            )}
                                            <div className="rounded-xl border px-3 py-2.5"
                                                style={{ background: "var(--dash-card-bg)", borderColor: "var(--dash-card-border)" }}>
                                                <p className="text-[10px] font-bold uppercase tracking-wider mb-1"
                                                    style={{ color: "var(--dash-text-muted)" }}>Severity</p>
                                                <SeverityBadge severity={r.extracted_data.severity} />
                                            </div>
                                            <div className="rounded-xl border px-3 py-2.5"
                                                style={{ background: "var(--dash-card-bg)", borderColor: "var(--dash-card-border)" }}>
                                                <p className="text-[10px] font-bold uppercase tracking-wider mb-1"
                                                    style={{ color: "var(--dash-text-muted)" }}>Confidence</p>
                                                <span className="text-sm font-semibold" style={{ color: "var(--dash-text-primary)" }}>
                                                    {r.extracted_data.confidence}
                                                </span>
                                            </div>
                                            {r.extracted_data.location_specifics && (
                                                <div className="col-span-2">
                                                    <InfoChip label="Location Specifics" value={r.extracted_data.location_specifics} />
                                                </div>
                                            )}
                                        </div>

                                        {r.extracted_data.symptoms.length > 0 && (
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-wider mb-2"
                                                    style={{ color: "var(--dash-text-muted)" }}>Detected Symptoms</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {r.extracted_data.symptoms.map((s, i) => (
                                                        <span key={i}
                                                            className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
                                                            style={{ background: "var(--dash-card-bg)", borderColor: "var(--dash-card-border)", color: "var(--dash-text-secondary)" }}>
                                                            {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Location footer */}
                                {r.district_info && (
                                    <div className="flex items-center gap-2 rounded-xl border px-4 py-3"
                                        style={{ background: "var(--dash-card-header-bg)", borderColor: "var(--dash-card-border)" }}>
                                        <MapPin className="h-4 w-4 shrink-0" style={{ color: "var(--color-primary)" }} />
                                        <span className="text-sm font-medium" style={{ color: "var(--dash-text-primary)" }}>
                                            {r.district_info.district_name}
                                        </span>
                                        <ChevronRight className="h-3.5 w-3.5 opacity-40" />
                                        <span className="text-xs" style={{ color: "var(--dash-text-muted)" }}>
                                            {r.district_info.distance_km.toFixed(1)} km away
                                        </span>
                                    </div>
                                )}

                                {/* Vote toggle */}
                                <Toggle
                                    pressed={Boolean(r.has_voted)}
                                    disabled={Boolean(voteLoadingByReport[r.report_id]) || !user?.$id}
                                    onPressedChange={() => toggleVoteReport(r.report_id, Boolean(r.has_voted))}
                                    className="cursor-pointer w-full flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200"
                                    style={r.has_voted
                                        ? { background: "rgba(30,58,138,0.12)", borderColor: "rgba(30,58,138,0.32)", color: "var(--color-primary)" }
                                        : { background: "var(--dash-card-header-bg)", borderColor: "var(--dash-card-border)", color: "var(--dash-text-secondary)" }
                                    }
                                >
                                    {voteLoadingByReport[r.report_id] ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : r.has_voted ? (
                                        <CheckCircle2 className="h-4 w-4" />
                                    ) : (
                                        <ThumbsUp className="h-4 w-4" />
                                    )}
                                    <span>{r.has_voted ? "Voted • Remove vote" : "I have the same problem"}</span>
                                </Toggle>

                                {/* Owner actions */}
                                {isOwn && editingReportId !== r.report_id && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { setEditingReportId(r.report_id); setEditingDescription(r.description); }}
                                            className="flex-1 flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition-all hover:opacity-80"
                                            style={{ borderColor: "rgba(30,58,138,0.22)", color: "var(--color-primary)", background: "rgba(30,58,138,0.06)" }}>
                                            <Edit2 className="h-3.5 w-3.5" /> Edit Report
                                        </button>
                                        <button
                                            onClick={async () => { await handleDeleteReport(r.report_id); setSelectedReport(null); }}
                                            disabled={deletingLoading[r.report_id]}
                                            className="flex-1 flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                                            style={{ borderColor: "rgba(220,38,38,0.25)", color: "var(--color-danger)", background: "rgba(220,38,38,0.06)" }}>
                                            {deletingLoading[r.report_id] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                );
            })()}
        </div>
    );
}
