"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import {
    Plus,
    Trash2,
    BarChart2,
    TrendingUp,
    Activity,
    Loader2,
    CheckSquare,
    Square,
    Search,
    Sparkles,
    AlertCircle,
    RefreshCw,
    Calendar,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useChartBuilderStore } from "@/store/useChartBuilderStore";

// ─── Types ───────────────────────────────────────────────────────────────────
type Disease = { disease_id: number; disease_name: string };

type HistoryPatternRow = {
    year: number;
    week_number: number;
    case_count: number;
    disease_id: number;
    disease_name: string;
    district_id?: number;
};

type ReportRow = {
    year: number;
    week_number: number;
    disease_id: number;
    disease_name: string;
    case_count: number;
    actual_count: number | null;
    district_id?: number;
};

export type ChartType = "line" | "bar" | "area";
export type TimeGranularity = "weekly" | "yearly";

export interface ChartWidgetConfig {
    id: string;
    title: string;
    type: ChartType;
    granularity: TimeGranularity;
    diseaseIds: number[];
    years: number[];
}

interface CustomChartBuilderProps {
    historyRows: HistoryPatternRow[];
    reports: ReportRow[];
    diseases: Disease[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const COLORS = [
    "#6366f1", "#f97316", "#22c55e", "#eab308", "#ef4444",
    "#2563eb", "#ec4899", "#14b8a6", "#8b5cf6", "#f43f5e",
];

const CHART_TYPE_OPTIONS: { value: ChartType; label: string; icon: React.ReactNode; hint: string }[] = [
    { value: "line", label: "Line", icon: <TrendingUp className="h-4 w-4" />, hint: "Trends" },
    { value: "bar", label: "Bar", icon: <BarChart2 className="h-4 w-4" />, hint: "Compare" },
    { value: "area", label: "Area", icon: <Activity className="h-4 w-4" />, hint: "Volume" },
];

function getDiseaseColor(index: number) {
    return COLORS[index % COLORS.length];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildChartSeries(
    widget: ChartWidgetConfig,
    historyRows: HistoryPatternRow[],
    reports: ReportRow[],
    diseases: Disease[]
) {
    const { granularity, diseaseIds, years } = widget;
    const sourceData: Array<HistoryPatternRow | ReportRow> =
        granularity === "yearly" ? reports : historyRows;

    const yearSet = new Set(years);
    const diseaseSet = new Set(diseaseIds);

    const filtered = sourceData.filter(
        (row) => yearSet.has(row.year) && diseaseSet.has(row.disease_id)
    );

    const grouped = new Map<string, Record<string, number | string>>();
    filtered.forEach((row) => {
        const period =
            granularity === "yearly"
                ? String(row.year)
                : `${row.year}-W${String(row.week_number).padStart(2, "0")}`;
        const order = granularity === "yearly" ? row.year : row.year * 100 + row.week_number;

        if (!grouped.has(period)) grouped.set(period, { period, _order: order });

        const item = grouped.get(period)!;
        const disease =
            diseases.find((d) => d.disease_id === row.disease_id)?.disease_name ??
            `Disease ${row.disease_id}`;
        item[disease] = ((item[disease] as number) || 0) + (row.case_count || 0);
    });

    return Array.from(grouped.values()).sort((a, b) => (a._order as number) - (b._order as number));
}

// ─── Sub-Components ───────────────────────────────────────────────────────────
function Pill({
    label,
    selected,
    onClick,
    disabled,
}: {
    label: string;
    selected: boolean;
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                border transition-all duration-150 select-none
                ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
                ${selected
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                    : "bg-white dark:bg-neutral-900 border-black/15 dark:border-white/15 text-black/75 dark:text-white/75 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300"
                }
            `}
        >
            {selected ? <CheckSquare className="h-3 w-3" /> : <Square className="h-3 w-3" />}
            {label}
        </button>
    );
}

function SectionLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
    return (
        <div className="mb-2 flex items-baseline justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-black/50 dark:text-white/50">
                {children}
            </p>
            {hint && <span className="text-[10px] text-black/40 dark:text-white/40">{hint}</span>}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CustomChartBuilder({
    historyRows,
    reports,
    diseases: propDiseases,
}: CustomChartBuilderProps) {
    // ── Metadata ──
    const [dbDiseases, setDbDiseases] = useState<Disease[]>(propDiseases);
    const [dbYears, setDbYears] = useState<number[]>([]);
    const [diseaseYearsMap, setDiseaseYearsMap] = useState<Record<string, number[]>>({});
    const [metaLoading, setMetaLoading] = useState(true);
    const [metaError, setMetaError] = useState<string | null>(null);

    // ── Source data (used for rendering charts). Lazily backfilled from /analytics. ──
    const [sourceHistory, setSourceHistory] = useState<HistoryPatternRow[]>(historyRows);
    const [sourceReports, setSourceReports] = useState<ReportRow[]>(reports);
    const [dataLoading, setDataLoading] = useState(false);

    // ── Widget state (using Zustand store) ──
    const { widgets, addWidget, updateWidget, removeWidget, setWidgets: setWidgetsStore } = useChartBuilderStore();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);

    // ── Form state ──
    const [formTitle, setFormTitle] = useState("");
    const [formType, setFormType] = useState<ChartType>("line");
    const [formGranularity, setFormGranularity] = useState<TimeGranularity>("yearly");
    const [formDiseaseIds, setFormDiseaseIds] = useState<number[]>([]);
    const [formYears, setFormYears] = useState<number[]>([]);
    const [diseaseQuery, setDiseaseQuery] = useState("");
    const [saving, setSaving] = useState(false);

    // ── Sync props if they change ──
    useEffect(() => {
        if (propDiseases.length > 0) setDbDiseases(propDiseases);
    }, [propDiseases]);

    // ── One-time migration from legacy localStorage key to Zustand persist store ──
    useEffect(() => {
        try {
            const hasPersistedStore = localStorage.getItem("chart-builder-storage");
            if (hasPersistedStore) return;

            const legacy = localStorage.getItem("officer_custom_charts_v2");
            if (!legacy) return;

            const parsed = JSON.parse(legacy) as unknown;
            if (Array.isArray(parsed)) {
                setWidgetsStore(parsed as ChartWidgetConfig[]);
            }

            // Remove legacy key once migrated to avoid future state overwrites.
            localStorage.removeItem("officer_custom_charts_v2");
        } catch (e) {
            console.error("Failed to migrate legacy custom charts", e);
        }
    }, [setWidgetsStore]);

    // ── Fetch metadata ──
    const fetchMetadata = useCallback(async () => {
        setMetaLoading(true);
        setMetaError(null);
        try {
            const res = await fetch("/api/officer/chart-builder/metadata", { cache: "no-store" });
            const data = (await res.json()) as {
                diseases?: Disease[];
                years?: number[];
                disease_years?: Record<string, number[]>;
                error?: string;
            };
            if (!res.ok) throw new Error(data.error ?? "Failed to load chart builder metadata");
            if (data.diseases && data.diseases.length > 0) setDbDiseases(data.diseases);
            setDbYears(data.years ?? []);
            setDiseaseYearsMap(data.disease_years ?? {});
        } catch (e) {
            setMetaError(e instanceof Error ? e.message : "Unknown error");
        } finally {
            setMetaLoading(false);
        }
    }, []);

    // ── Fetch full analytics snapshot for chart rendering ──
    const fetchAnalyticsSnapshot = useCallback(async () => {
        setDataLoading(true);
        try {
            const res = await fetch("/api/officer/analytics", { cache: "no-store" });
            const payload = await res.json();
            if (res.ok) {
                if (Array.isArray(payload.history)) setSourceHistory(payload.history);
                if (Array.isArray(payload.reports)) setSourceReports(payload.reports);
            }
        } catch (e) {
            console.error("Failed to fetch analytics for chart builder", e);
        } finally {
            setDataLoading(false);
        }
    }, []);

     // ── On-demand fetch for a saved widget: pulls fresh data for the
     //    selected disease + year range so the chart isn't capped by the analytics
     //    snapshot's row limit. Fetches from the appropriate endpoint based on granularity. ──
     const enrichDataForWidget = useCallback(async (widget: ChartWidgetConfig) => {
         if (widget.diseaseIds.length === 0 || widget.years.length === 0) return;
         const yearFrom = Math.min(...widget.years);
         const yearTo = Math.max(...widget.years);

         try {
             await Promise.all(
                 widget.diseaseIds.map(async (diseaseId) => {
                     if (widget.granularity === "yearly") {
                         // For yearly granularity, fetch from reports endpoint
                         const params = new URLSearchParams({
                             disease_id: String(diseaseId),
                             year_from: String(yearFrom),
                             year_to: String(yearTo),
                             limit: "2000",
                         });
                         const res = await fetch(
                             `/api/officer/reports?${params.toString()}`,
                             { cache: "no-store" }
                         );
                         if (!res.ok) return;
                         const data = await res.json();
                         const fresh = data.reports || [];
                         if (fresh.length === 0) return;

                         setSourceReports((prev) => {
                             const seen = new Set(
                                 prev.map(
                                     (r) => `${r.year}-${r.week_number}-${r.disease_id}-${r.district_id ?? "x"}`
                                 )
                             );
                             const merged = [...prev];
                             for (const r of fresh) {
                                 const k = `${r.year}-${r.week_number}-${r.disease_id}-${r.district_id ?? "x"}`;
                                 if (!seen.has(k)) {
                                     merged.push(r);
                                     seen.add(k);
                                 }
                             }
                             return merged;
                         });
                     } else {
                         // For weekly granularity, fetch from history-pattern endpoint
                         const params = new URLSearchParams({
                             disease_id: String(diseaseId),
                             year_from: String(yearFrom),
                             year_to: String(yearTo),
                             limit: "2000",
                         });
                         const res = await fetch(
                             `/api/officer/reports/history-pattern?${params.toString()}`,
                             { cache: "no-store" }
                         );
                         if (!res.ok) return;
                         const data = (await res.json()) as { records?: HistoryPatternRow[] };
                         const fresh = data.records || [];
                         if (fresh.length === 0) return;

                         setSourceHistory((prev) => {
                             const seen = new Set(
                                 prev.map(
                                     (r) => `${r.year}-${r.week_number}-${r.disease_id}-${(r as HistoryPatternRow & { district_id?: number }).district_id ?? "x"}`
                                 )
                             );
                 const merged = [...prev];
                         for (const r of fresh) {
                             const districtId = (r as HistoryPatternRow & { district_id?: number }).district_id;
                             const k = `${r.year}-${r.week_number}-${r.disease_id}-${districtId ?? "x"}`;
                             if (!seen.has(k)) {
                                 merged.push(r);
                                 seen.add(k);
                             }
                         }
                             return merged;
                         });
                     }
                 })
             );
         } catch (e) {
             console.error("Failed to enrich chart data", e);
         }
     }, []);

    useEffect(() => {
        void fetchMetadata();
        void fetchAnalyticsSnapshot();
    }, [fetchMetadata, fetchAnalyticsSnapshot]);


    // ── Derived: years available for the currently-selected diseases ──
    const availableYearsForSelection = useMemo<number[]>(() => {
        if (formDiseaseIds.length === 0) return dbYears;

        const yearSets = formDiseaseIds.map((id) => {
            const list = diseaseYearsMap[String(id)] || [];
            return new Set(list);
        });

        // union of years (year is available if ANY selected disease has it)
        const union = new Set<number>();
        yearSets.forEach((s) => s.forEach((y) => union.add(y)));
        return Array.from(union).sort((a, b) => b - a);
    }, [formDiseaseIds, diseaseYearsMap, dbYears]);

    // Drop any selected years that are no longer valid for the chosen diseases.
    useEffect(() => {
        if (formYears.length === 0) return;
        const valid = new Set(availableYearsForSelection);
        const filtered = formYears.filter((y) => valid.has(y));
        if (filtered.length !== formYears.length) setFormYears(filtered);
    }, [availableYearsForSelection, formYears]);

    const filteredDiseases = useMemo(() => {
        const q = diseaseQuery.trim().toLowerCase();
        if (!q) return dbDiseases;
        return dbDiseases.filter((d) => d.disease_name.toLowerCase().includes(q));
    }, [dbDiseases, diseaseQuery]);

    // ── Sheet handlers ──
    const openSheet = () => {
        setFormTitle("");
        setFormType("line");
        setFormGranularity("yearly");
        setFormDiseaseIds([]);
        setFormYears([]);
        setDiseaseQuery("");
        setEditingWidgetId(null);
        setIsSheetOpen(true);
    };

    const handleSave = async () => {
        if (!formTitle.trim() || formDiseaseIds.length === 0 || formYears.length === 0) return;

        setSaving(true);
        const widget: ChartWidgetConfig = {
            id: editingWidgetId ?? Math.random().toString(36).slice(2),
            title: formTitle.trim(),
            type: formType,
            granularity: formGranularity,
            diseaseIds: formDiseaseIds,
            years: [...formYears].sort((a, b) => a - b),
        };

        // Pull fresh data scoped to this widget before showing it.
        await enrichDataForWidget(widget);
        
        if (editingWidgetId) {
            // Update existing widget
            updateWidget(editingWidgetId, widget);
            setEditingWidgetId(null);
        } else {
            // Add new widget
            addWidget(widget);
        }
        
        setSaving(false);
        setIsSheetOpen(false);
    };


    const editWidget = (id: string) => {
        const widget = widgets.find((w) => w.id === id);
        if (!widget) return;

        setFormTitle(widget.title);
        setFormType(widget.type);
        setFormGranularity(widget.granularity);
        setFormDiseaseIds([...widget.diseaseIds]);
        setFormYears([...widget.years]);
        setEditingWidgetId(id);
        setIsSheetOpen(true);
    };

    const toggleId = <T,>(arr: T[], val: T): T[] =>
        arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

    const selectAllDiseases = () => setFormDiseaseIds(filteredDiseases.map((d) => d.disease_id));
    const clearDiseases = () => setFormDiseaseIds([]);
    const selectAllYears = () => setFormYears(availableYearsForSelection);
    const clearYears = () => setFormYears([]);
    const selectRecentYears = (n: number) =>
        setFormYears(availableYearsForSelection.slice(0, n));

    // ── Render Chart ──
    const renderChart = (widget: ChartWidgetConfig) => {
        const data = buildChartSeries(widget, sourceHistory, sourceReports, dbDiseases);
        const activeDiseases = dbDiseases.filter((d) => widget.diseaseIds.includes(d.disease_id));

        if (data.length === 0) {
            return (
                <div className="flex h-[280px] flex-col items-center justify-center gap-2 rounded-md border border-dashed border-black/10 dark:border-white/10 text-sm text-black/45 dark:text-white/45">
                    <BarChart2 className="h-8 w-8 opacity-40" />
                    <p className="font-medium">No data for selected filters</p>
                    <p className="text-[11px]">Try a different year or disease combination</p>
                </div>
            );
        }

        const axes = (
            <>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, padding: "6px 10px" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
            </>
        );

        const series = activeDiseases.map((d, idx) => {
            const color = getDiseaseColor(idx);
            if (widget.type === "bar")
                return <Bar key={d.disease_id} dataKey={d.disease_name} fill={color} radius={[4, 4, 0, 0]} />;
            if (widget.type === "area")
                return (
                    <Area
                        key={d.disease_id}
                        type="monotone"
                        dataKey={d.disease_name}
                        stroke={color}
                        fill={color}
                        fillOpacity={0.18}
                        strokeWidth={2}
                    />
                );
            return (
                <Line
                    key={d.disease_id}
                    type="monotone"
                    dataKey={d.disease_name}
                    stroke={color}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                />
            );
        });

        return (
            <ResponsiveContainer width="100%" height={300}>
                {widget.type === "bar" ? (
                    <BarChart data={data}>{axes}{series}</BarChart>
                ) : widget.type === "area" ? (
                    <AreaChart data={data}>{axes}{series}</AreaChart>
                ) : (
                    <LineChart data={data}>{axes}{series}</LineChart>
                )}
            </ResponsiveContainer>
        );
    };

    const canSave =
        formTitle.trim().length > 0 && formDiseaseIds.length > 0 && formYears.length > 0;

    // ── JSX ──
    return (
        <div className="mt-10 space-y-5">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="rounded-md bg-indigo-50 dark:bg-indigo-950/50 p-1.5">
                            <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight">Custom Chart Builder</h2>
                    </div>
                    <p className="text-sm text-black/55 dark:text-white/55 ml-1">
                        Compare diseases across years or weeks with fully customizable charts.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => {
                            void fetchMetadata();
                            void fetchAnalyticsSnapshot();
                        }}
                        disabled={metaLoading || dataLoading}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${dataLoading || metaLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                    <Button
                        onClick={openSheet}
                        disabled={metaLoading}
                        className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        {metaLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Add Chart
                    </Button>
                </div>
            </div>

            {metaError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-medium">Couldn&apos;t load metadata</p>
                        <p className="text-xs opacity-80">{metaError}</p>
                    </div>
                </div>
            )}

            {/* Empty state */}
            {widgets.length === 0 && !metaLoading && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-black/15 dark:border-white/15 bg-black/[0.015] dark:bg-white/[0.02] py-16 gap-3 text-center">
                    <div className="rounded-full bg-indigo-50 dark:bg-indigo-950/50 p-3">
                        <BarChart2 className="h-7 w-7 text-indigo-500 dark:text-indigo-400" />
                    </div>
                    <p className="text-sm font-semibold text-black/70 dark:text-white/70">No custom charts yet</p>
                    <p className="text-xs text-black/45 dark:text-white/45 max-w-xs">
                        Create comparison charts across diseases, years, and weeks to spot trends.
                    </p>
                    <Button onClick={openSheet} variant="default" className="mt-2 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white" size="sm">
                        <Plus className="h-3.5 w-3.5" /> Create your first chart
                    </Button>
                </div>
            )}

            {/* Widget Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {widgets.map((widget) => (
                    <Card
                        key={widget.id}
                        className="border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2 pt-4 px-5">
                            <div className="flex-1 min-w-0 space-y-1.5">
                                <CardTitle className="text-sm font-semibold truncate">{widget.title}</CardTitle>
                                <div className="flex flex-wrap items-center gap-1">
                                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 capitalize">
                                        {widget.type}
                                    </Badge>
                                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 capitalize">
                                        {widget.granularity}
                                    </Badge>
                                    <span className="text-[10px] text-black/40 dark:text-white/40 ml-1">·</span>
                                    <span className="text-[10px] text-black/55 dark:text-white/55">
                                        {widget.diseaseIds.length} disease{widget.diseaseIds.length === 1 ? "" : "s"}
                                    </span>
                                    <span className="text-[10px] text-black/40 dark:text-white/40">·</span>
                                    <span className="text-[10px] text-black/55 dark:text-white/55">
                                        {widget.years.length === 1
                                            ? widget.years[0]
                                            : `${Math.min(...widget.years)}–${Math.max(...widget.years)}`}
                                    </span>
                                </div>
                            </div>
                             <div className="flex gap-2">
                                 <Button
                                     variant="ghost"
                                     size="icon"
                                     className="h-7 w-7 shrink-0 text-black/40 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                                     onClick={() => editWidget(widget.id)}
                                     title="Edit chart"
                                 >
                                     <Sparkles className="h-3.5 w-3.5" />
                                 </Button>
                                 <Button
                                     variant="ghost"
                                     size="icon"
                                     className="h-7 w-7 shrink-0 text-black/40 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                                     onClick={() => removeWidget(widget.id)}
                                     title="Remove chart"
                                 >
                                     <Trash2 className="h-3.5 w-3.5" />
                                 </Button>
                             </div>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            {renderChart(widget)}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* ── Side Panel ── */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent
                    side="right"
                    className="w-full sm:max-w-[520px] flex flex-col gap-0 p-0 bg-white dark:bg-neutral-950 border-l border-black/10 dark:border-white/10"
                >
                    {/* Header */}
                    <div className="px-6 pt-6 pb-4 border-b border-black/8 dark:border-white/10">
                        <div className="flex items-center gap-2">
                            <div className="rounded-md bg-indigo-50 dark:bg-indigo-950/50 p-1.5">
                                <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <SheetTitle className="text-base font-semibold">
                             {editingWidgetId ? 'Edit chart' : 'Build a custom chart'}
                         </SheetTitle>
                        </div>
                        <SheetDescription className="text-xs mt-1.5 text-black/55 dark:text-white/55">
                            Pick diseases first, then choose from the years where data exists.
                        </SheetDescription>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                        {/* Title */}
                        <div>
                            <SectionLabel>Chart Title</SectionLabel>
                            <Input
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                placeholder="e.g. Dengue vs Malaria 2022–2024"
                                className="text-sm"
                            />
                        </div>

                        {/* Chart Type */}
                        <div>
                            <SectionLabel>Chart Type</SectionLabel>
                            <div className="grid grid-cols-3 gap-2">
                                {CHART_TYPE_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setFormType(opt.value)}
                                        className={`
                                            flex flex-col items-center gap-1 py-3 px-2 rounded-lg border text-xs font-medium
                                            transition-all duration-150 cursor-pointer
                                            ${formType === opt.value
                                                ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-sm"
                                                : "border-black/12 dark:border-white/12 text-black/65 dark:text-white/65 hover:border-indigo-300 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20"
                                            }
                                        `}
                                    >
                                        {opt.icon}
                                        <span>{opt.label}</span>
                                        <span className="text-[9px] opacity-60">{opt.hint}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Granularity */}
                        <div>
                            <SectionLabel>Time Granularity</SectionLabel>
                            <Select
                                value={formGranularity}
                                onValueChange={(v) => setFormGranularity(v as TimeGranularity)}
                            >
                                <SelectTrigger className="text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="yearly">Yearly — Historical overview</SelectItem>
                                    <SelectItem value="weekly">Weekly — Recent trend</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-[11px] text-black/45 dark:text-white/45 mt-1.5">
                                {formGranularity === "yearly"
                                    ? "Uses historical archive data grouped per year."
                                    : "Uses weekly reports — only recent weeks are available."}
                            </p>
                        </div>

                        {/* Diseases */}
                        <div>
                            <SectionLabel hint={`${formDiseaseIds.length} selected`}>Diseases</SectionLabel>
                            <div className="relative mb-2">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-black/40 dark:text-white/40" />
                                <Input
                                    value={diseaseQuery}
                                    onChange={(e) => setDiseaseQuery(e.target.value)}
                                    placeholder="Search diseases..."
                                    className="pl-8 text-sm h-9"
                                />
                            </div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={selectAllDiseases}
                                        className="text-[10px] uppercase font-semibold tracking-wider text-indigo-600 dark:text-indigo-400 hover:underline"
                                    >
                                        Select all
                                    </button>
                                    <span className="text-[10px] text-black/30 dark:text-white/30">·</span>
                                    <button
                                        type="button"
                                        onClick={clearDiseases}
                                        className="text-[10px] uppercase font-semibold tracking-wider text-black/50 dark:text-white/50 hover:underline"
                                    >
                                        Clear
                                    </button>
                                </div>
                                {metaLoading && (
                                    <Loader2 className="h-3 w-3 animate-spin text-black/40 dark:text-white/40" />
                                )}
                            </div>
                            {filteredDiseases.length === 0 ? (
                                <p className="text-xs text-black/40 dark:text-white/40 italic text-center py-4 rounded-md border border-dashed border-black/10 dark:border-white/10">
                                    {diseaseQuery ? "No diseases match your search." : "No diseases found."}
                                </p>
                            ) : (
                                <div className="flex flex-wrap gap-2 max-h-[180px] overflow-y-auto pr-1 rounded-md border border-black/8 dark:border-white/10 p-2 bg-black/[0.02] dark:bg-white/[0.02]">
                                    {filteredDiseases.map((d) => (
                                        <Pill
                                            key={d.disease_id}
                                            label={d.disease_name}
                                            selected={formDiseaseIds.includes(d.disease_id)}
                                            onClick={() =>
                                                setFormDiseaseIds((prev) => toggleId(prev, d.disease_id))
                                            }
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Years (filtered by selected diseases) */}
                        <div>
                            <SectionLabel hint={`${formYears.length} selected`}>
                                <span className="inline-flex items-center gap-1.5">
                                    <Calendar className="h-3 w-3" />
                                    Years {formDiseaseIds.length > 0 && (
                                        <span className="ml-1 normal-case tracking-normal text-[10px] text-black/40 dark:text-white/40 font-normal">
                                            (for selected diseases)
                                        </span>
                                    )}
                                </span>
                            </SectionLabel>

                            {formDiseaseIds.length === 0 ? (
                                <p className="text-xs text-black/45 dark:text-white/45 italic text-center py-6 rounded-md border border-dashed border-black/10 dark:border-white/10">
                                    Select at least one disease to see available years.
                                </p>
                            ) : availableYearsForSelection.length === 0 ? (
                                <p className="text-xs text-black/45 dark:text-white/45 italic text-center py-6 rounded-md border border-dashed border-black/10 dark:border-white/10">
                                    No years available for the selected disease(s).
                                </p>
                            ) : (
                                <>
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <button
                                            type="button"
                                            onClick={() => selectRecentYears(3)}
                                            className="text-[10px] uppercase font-semibold tracking-wider text-indigo-600 dark:text-indigo-400 hover:underline"
                                        >
                                            Last 3
                                        </button>
                                        <span className="text-[10px] text-black/30 dark:text-white/30">·</span>
                                        <button
                                            type="button"
                                            onClick={() => selectRecentYears(5)}
                                            className="text-[10px] uppercase font-semibold tracking-wider text-indigo-600 dark:text-indigo-400 hover:underline"
                                        >
                                            Last 5
                                        </button>
                                        <span className="text-[10px] text-black/30 dark:text-white/30">·</span>
                                        <button
                                            type="button"
                                            onClick={selectAllYears}
                                            className="text-[10px] uppercase font-semibold tracking-wider text-indigo-600 dark:text-indigo-400 hover:underline"
                                        >
                                            All
                                        </button>
                                        <span className="text-[10px] text-black/30 dark:text-white/30">·</span>
                                        <button
                                            type="button"
                                            onClick={clearYears}
                                            className="text-[10px] uppercase font-semibold tracking-wider text-black/50 dark:text-white/50 hover:underline"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 rounded-md border border-black/8 dark:border-white/10 p-2 bg-black/[0.02] dark:bg-white/[0.02] max-h-[150px] overflow-y-auto">
                                        {availableYearsForSelection.map((y) => (
                                            <Pill
                                                key={y}
                                                label={String(y)}
                                                selected={formYears.includes(y)}
                                                onClick={() => setFormYears((prev) => toggleId(prev, y))}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-black/8 dark:border-white/10 bg-black/[0.015] dark:bg-white/[0.015]">
                        {!canSave && (
                            <p className="text-[11px] text-black/45 dark:text-white/45 mb-2 text-center">
                                {!formTitle.trim()
                                    ? "Add a title."
                                    : formDiseaseIds.length === 0
                                        ? "Pick at least one disease."
                                        : "Pick at least one year."}
                            </p>
                        )}
                        <div className="flex items-center justify-between gap-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setIsSheetOpen(false)}
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                             <Button
                                 className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                                 onClick={handleSave}
                                 disabled={!canSave || saving}
                             >
                                 {saving ? (
                                     <>
                                         <Loader2 className="h-4 w-4 animate-spin" />
                                         Saving
                                     </>
                                 ) : (
                                     <>
                                         <Plus className="h-4 w-4" />
                                         {editingWidgetId ? 'Update Chart' : 'Add Chart'}
                                     </>
                                 )}
                             </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
