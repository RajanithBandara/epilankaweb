"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Activity,
    AlertCircle,
    ChevronDown,
    Loader2,
    MapPin,
    Search,
    X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CeriComponent {
    report_density: number;
    vote_credibility: number;
    temporal_urgency: number;
    base_score: number;
}

interface CeriRecord {
    _id: string;
    disease_id: number;
    disease_name: string;
    district_id: number;
    district_name: string;
    week_number: number;
    year: number;
    ceri_score: number;
    risk_level: string;
    report_count: number;
    vote_total: number;
    components: CeriComponent;
    calculated_at: string;
}

const RISK_LEVELS = ["low", "moderate", "high", "critical"] as const;
type RiskFilter = "all" | (typeof RISK_LEVELS)[number];

const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
        case "low":
            return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
        case "moderate":
            return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
        case "high":
            return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
        case "critical":
            return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
        default:
            return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
};

const getRiskRank = (level: string) => {
    switch (level.toLowerCase()) {
        case "critical":
            return 4;
        case "high":
            return 3;
        case "moderate":
            return 2;
        case "low":
            return 1;
        default:
            return 0;
    }
};

export default function CeriHistoryPage() {
    const [records, setRecords] = useState<CeriRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [query, setQuery] = useState("");
    const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
    const [diseaseFilter, setDiseaseFilter] = useState<string>("all");
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                const res = await fetch("/api/officer/ceri-history?limit=100");
                if (!res.ok) throw new Error("Failed to fetch CERI history");
                const data = await res.json();
                setRecords(data.records || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred");
            } finally {
                setLoading(false);
            }
        };
        void fetchHistory();
    }, []);

    const diseaseOptions = useMemo(() => {
        const map = new Map<number, string>();
        records.forEach((r) => map.set(r.disease_id, r.disease_name));
        return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
    }, [records]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return records.filter((r) => {
            if (riskFilter !== "all" && r.risk_level.toLowerCase() !== riskFilter) return false;
            if (diseaseFilter !== "all" && String(r.disease_id) !== diseaseFilter) return false;
            if (q) {
                const hay = `${r.district_name} ${r.disease_name} ${r.risk_level} week ${r.week_number} ${r.year}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [records, query, riskFilter, diseaseFilter]);

    const grouped = useMemo(() => {
        const map = new Map<string, CeriRecord[]>();
        filtered.forEach((r) => {
            const key = r.district_name || "Unknown district";
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(r);
        });
        return Array.from(map.entries())
            .map(([district, items]) => {
                const sorted = [...items].sort((a, b) => b.ceri_score - a.ceri_score);
                const maxRisk = items.reduce(
                    (m, r) => Math.max(m, getRiskRank(r.risk_level)),
                    0,
                );
                return {
                    district,
                    items: sorted,
                    count: items.length,
                    maxRisk,
                    topRiskLevel: sorted[0]?.risk_level ?? "low",
                };
            })
            .sort(
                (a, b) =>
                    b.maxRisk - a.maxRisk || a.district.localeCompare(b.district),
            );
    }, [filtered]);

    const toggleCollapsed = (district: string) => {
        setCollapsed((prev) => {
            const next = new Set(prev);
            if (next.has(district)) next.delete(district);
            else next.add(district);
            return next;
        });
    };

    const clearFilters = () => {
        setQuery("");
        setRiskFilter("all");
        setDiseaseFilter("all");
    };

    const filtersActive =
        query !== "" || riskFilter !== "all" || diseaseFilter !== "all";

    if (loading) {
        return (
            <div className="flex h-full min-h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-black/50 dark:text-white/50" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 p-8 text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
                <AlertCircle className="mb-4 h-8 w-8" />
                <h3 className="mb-2 text-lg font-semibold">Error Loading History</h3>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Heading */}
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight">CERI Risk History</h1>
                <p className="text-sm text-black/60 dark:text-white/60">
                    Community Epidemic Risk Index calculations, grouped by district.
                </p>
            </div>

            {/* Toolbar: search + filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="relative min-w-[14rem] flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40 dark:text-white/40" />
                    <input
                        type="search"
                        placeholder="Search district, disease, or risk level…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full rounded-lg border border-black/10 bg-white py-2 pl-9 pr-9 text-sm shadow-sm placeholder:text-black/40 focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-black dark:placeholder:text-white/40 dark:focus:border-white/30"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => setQuery("")}
                            aria-label="Clear search"
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-black/40 hover:bg-black/5 hover:text-black/70 dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white/70"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                <select
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value as RiskFilter)}
                    className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-black"
                >
                    <option value="all">All risk levels</option>
                    {RISK_LEVELS.map((l) => (
                        <option key={l} value={l}>
                            {l[0].toUpperCase() + l.slice(1)}
                        </option>
                    ))}
                </select>

                <select
                    value={diseaseFilter}
                    onChange={(e) => setDiseaseFilter(e.target.value)}
                    className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-black"
                >
                    <option value="all">All diseases</option>
                    {diseaseOptions.map(([id, name]) => (
                        <option key={id} value={String(id)}>
                            {name}
                        </option>
                    ))}
                </select>

                {filtersActive && (
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-black/70 hover:bg-black/5 dark:border-white/10 dark:bg-black dark:text-white/70 dark:hover:bg-white/5"
                    >
                        Clear filters
                    </button>
                )}

                <span className="text-xs text-black/50 dark:text-white/50 sm:ml-auto">
                    {filtered.length} {filtered.length === 1 ? "record" : "records"} ·{" "}
                    {grouped.length} {grouped.length === 1 ? "district" : "districts"}
                </span>
            </div>

            {/* Grouped sections */}
            {grouped.length === 0 ? (
                <div className="rounded-xl border border-black/10 bg-white p-12 text-center text-black/50 dark:border-white/10 dark:bg-black dark:text-white/50">
                    {records.length === 0
                        ? "No historical CERI records found."
                        : "No records match your filters."}
                </div>
            ) : (
                <div className="space-y-3">
                    {grouped.map((group) => {
                        const isCollapsed = collapsed.has(group.district);
                        return (
                            <div
                                key={group.district}
                                className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-black"
                            >
                                <button
                                    type="button"
                                    onClick={() => toggleCollapsed(group.district)}
                                    aria-expanded={!isCollapsed}
                                    className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                            <MapPin className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="truncate font-semibold">{group.district}</h2>
                                            <p className="text-xs text-black/50 dark:text-white/50">
                                                {group.count} {group.count === 1 ? "record" : "records"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-shrink-0 items-center gap-2">
                                        <Badge
                                            variant="outline"
                                            className={getRiskColor(group.topRiskLevel)}
                                        >
                                            {group.topRiskLevel.toUpperCase()}
                                        </Badge>
                                        <ChevronDown
                                            className={`h-4 w-4 text-black/40 transition-transform dark:text-white/40 ${
                                                isCollapsed ? "-rotate-90" : ""
                                            }`}
                                        />
                                    </div>
                                </button>

                                {!isCollapsed && (
                                    <div className="overflow-x-auto border-t border-black/10 dark:border-white/10">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-black/5 text-black/60 dark:bg-white/5 dark:text-white/60">
                                                <tr>
                                                    <th className="p-3 font-medium">Timeline</th>
                                                    <th className="p-3 font-medium">Disease</th>
                                                    <th className="p-3 font-medium">Score</th>
                                                    <th className="p-3 font-medium">Risk Level</th>
                                                    <th className="p-3 font-medium">Metrics</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-black/10 dark:divide-white/10">
                                                {group.items.map((record) => (
                                                    <tr
                                                        key={record._id}
                                                        className="hover:bg-black/5 dark:hover:bg-white/5"
                                                    >
                                                        <td className="p-3">
                                                            <div className="font-medium">
                                                                Week {record.week_number}
                                                            </div>
                                                            <div className="text-xs text-black/50 dark:text-white/50">
                                                                {record.year}
                                                            </div>
                                                        </td>
                                                        <td className="p-3">{record.disease_name}</td>
                                                        <td className="p-3">
                                                            <div className="flex items-center gap-2">
                                                                <Activity className="h-4 w-4 text-blue-500" />
                                                                <span className="font-bold">
                                                                    {record.ceri_score.toFixed(1)}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="p-3">
                                                            <Badge
                                                                variant="outline"
                                                                className={getRiskColor(record.risk_level)}
                                                            >
                                                                {record.risk_level.toUpperCase()}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-3 text-xs">
                                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-black/60 dark:text-white/60">
                                                                <span>Reports: {record.report_count}</span>
                                                                <span>Votes: {record.vote_total}</span>
                                                                <span>
                                                                    Density: {record.components.report_density}
                                                                </span>
                                                                <span>
                                                                    Credibility:{" "}
                                                                    {record.components.vote_credibility}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
