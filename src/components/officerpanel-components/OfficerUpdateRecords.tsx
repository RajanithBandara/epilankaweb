"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Area,
    AreaChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

/* ─── Types ─────────────────────────────────────────────────────────────── */

type District = {
    district_id: number;
    district_name: string;
    province_name: string;
    latitude: number;
    longitude: number;
};

type Disease = {
    disease_id: number;
    disease_name: string;
};

type ReportRow = {
    report_id: string;
    week_number: number;
    year: number;
    district_id: number;
    district_name: string;
    province_name: string;
    disease_id: number;
    disease_name: string;
    case_count: number;
    actual_count: number | null;
};

type MetadataResponse = {
    districts: District[];
    diseases: Disease[];
};

type ChartRange = "all" | "past_week" | "past_4_months";

type TrendPoint = {
    period: string;
    sortKey: number;
    predicted: number;
    actual: number;
};

/* ─── District ordering ─────────────────────────────────────────────────── */

const currentYear = new Date().getFullYear();

const normalizeDistrictName = (name: string) =>
    name.toLowerCase().replace(/[^a-z]/g, "");

const DISTRICT_ORDER_GROUPS: string[][] = [
    ["colombo"],
    ["gampaha"],
    ["kalutara"],
    ["kandy"],
    ["matale"],
    ["nuwaraeliya"],
    ["galle"],
    ["hambantota"],
    ["matara"],
    ["jaffna"],
    ["kilinochchi"],
    ["mannar"],
    ["vavuniya"],
    ["mullativiu", "mullaitivu"],
    ["battcaloa", "batticaloa"],
    ["ampara"],
    ["trincomalee"],
    ["kurunegala"],
    ["puttalam"],
    ["anuradhapura"],
    ["polonnaruwa"],
    ["badulla"],
    ["monragala", "monaragala"],
    ["ratnapura"],
    ["kegalle"],
    ["kalmunai"],
];

const DISTRICT_PRIORITY = DISTRICT_ORDER_GROUPS.reduce<Record<string, number>>(
    (acc, aliases, index) => {
        aliases.forEach((alias) => {
            acc[normalizeDistrictName(alias)] = index;
        });
        return acc;
    },
    {}
);

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function UpdateRecordsPage() {
    const [districts, setDistricts] = useState<District[]>([]);
    const [diseases, setDiseases] = useState<Disease[]>([]);
    const [records, setRecords] = useState<ReportRow[]>([]);
    const [countsByDistrict, setCountsByDistrict] = useState<Record<number, string>>({});
    const [applyAllCount, setApplyAllCount] = useState("");

    const [loadingMeta, setLoadingMeta] = useState(true);
    const [loadingRecords, setLoadingRecords] = useState(false);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [chartRange, setChartRange] = useState<ChartRange>("all");

    const [form, setForm] = useState({
        week_number: "",
        year: String(currentYear),
        disease_id: "",
    });

    // Map district_id → predicted case_count for the current filter
    const predictedByDistrict = useMemo<Record<number, number | null>>(() => {
        const map: Record<number, number | null> = {};
        records.forEach((r) => {
            map[r.district_id] = r.case_count ?? null;
        });
        return map;
    }, [records]);

    const sortedDistricts = useMemo(() => {
        return [...districts].sort((a, b) => {
            const priorityA =
                DISTRICT_PRIORITY[normalizeDistrictName(a.district_name)] ??
                Number.MAX_SAFE_INTEGER;
            const priorityB =
                DISTRICT_PRIORITY[normalizeDistrictName(b.district_name)] ??
                Number.MAX_SAFE_INTEGER;
            if (priorityA !== priorityB) return priorityA - priorityB;
            return a.district_name.localeCompare(b.district_name);
        });
    }, [districts]);

    /* ── Metadata load ────────────────────────────────────────────────────── */

    useEffect(() => {
        const fetchMetadata = async () => {
            setLoadingMeta(true);
            setError(null);
            try {
                const res = await fetch("/api/officer/reports/metadata", { cache: "no-store" });
                const data = (await res.json()) as MetadataResponse & { error?: string };
                if (!res.ok) throw new Error(data.error || "Failed to load metadata");
                setDistricts(data.districts || []);
                setDiseases(data.diseases || []);

                const initialCounts: Record<number, string> = {};
                (data.districts || []).forEach((district) => {
                    initialCounts[district.district_id] = "";
                });
                setCountsByDistrict(initialCounts);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to load metadata");
            } finally {
                setLoadingMeta(false);
            }
        };
        void fetchMetadata();
    }, []);

    /* ── Records load ─────────────────────────────────────────────────────── */

    const fetchRecords = useCallback(async () => {
        setLoadingRecords(true);
        try {
            const params = new URLSearchParams();
            params.set("limit", "100");
            if (form.week_number) params.set("week_number", form.week_number);
            if (form.year) params.set("year", form.year);
            if (form.disease_id) params.set("disease_id", form.disease_id);

            const res = await fetch(`/api/officer/reports?${params.toString()}`, {
                cache: "no-store",
            });
            const data = (await res.json()) as { reports?: ReportRow[]; error?: string };
            if (!res.ok) throw new Error(data.error || "Failed to load records");
            setRecords(data.reports || []);
        } catch {
            setRecords([]);
        } finally {
            setLoadingRecords(false);
        }
    }, [form.week_number, form.year, form.disease_id]);

    useEffect(() => {
        void fetchRecords();
    }, [fetchRecords]);

    /* ── Chart data ───────────────────────────────────────────────────────── */

    const trendData = useMemo<TrendPoint[]>(() => {
        const grouped = new Map<string, TrendPoint>();
        records.forEach((record) => {
            const week = Number(record.week_number);
            const year = Number(record.year);
            const key = `${year}-W${String(week).padStart(2, "0")}`;
            const sortKey = year * 100 + week;
            if (!grouped.has(key)) {
                grouped.set(key, { period: key, sortKey, predicted: 0, actual: 0 });
            }
            const point = grouped.get(key)!;
            point.predicted += Number(record.case_count ?? 0);
            point.actual += Number(record.actual_count ?? 0);
        });
        return Array.from(grouped.values()).sort((a, b) => a.sortKey - b.sortKey);
    }, [records]);

    const filteredTrendData = useMemo(() => {
        if (chartRange === "all") return trendData;
        if (trendData.length === 0) return [];
        const pointsToKeep = chartRange === "past_week" ? 1 : 16;
        return trendData.slice(-pointsToKeep);
    }, [chartRange, trendData]);

    /* ── Grid helpers ─────────────────────────────────────────────────────── */

    const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const onDistrictCountChange = (districtId: number, value: string) => {
        setCountsByDistrict((prev) => ({ ...prev, [districtId]: value }));
    };

    const applyCountToAllDistricts = () => {
        if (applyAllCount === "") {
            setError("Enter a count before applying to all districts.");
            return;
        }
        setError(null);
        const next: Record<number, string> = {};
        sortedDistricts.forEach((district) => {
            next[district.district_id] = applyAllCount;
        });
        setCountsByDistrict(next);
    };

    const clearAllCounts = () => {
        const next: Record<number, string> = {};
        sortedDistricts.forEach((district) => {
            next[district.district_id] = "";
        });
        setCountsByDistrict(next);
        setApplyAllCount("");
    };

    // Allow Tab to move to the next district input in the grid
    const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});

    const handleKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>,
        currentIndex: number
    ) => {
        if (e.key === "Tab" && !e.shiftKey) {
            const next = sortedDistricts[currentIndex + 1];
            if (next) {
                e.preventDefault();
                inputRefs.current[next.district_id]?.focus();
            }
        }
        if (e.key === "Tab" && e.shiftKey) {
            const prev = sortedDistricts[currentIndex - 1];
            if (prev) {
                e.preventDefault();
                inputRefs.current[prev.district_id]?.focus();
            }
        }
    };

    /* ── Bulk submit ──────────────────────────────────────────────────────── */

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);

        if (!form.week_number || !form.year || !form.disease_id) {
            setError("Select week number, year, and disease.");
            return;
        }

        const entries = sortedDistricts
            .filter((d) => countsByDistrict[d.district_id] !== "")
            .map((d) => ({
                district_id: d.district_id,
                actual_count: Number(countsByDistrict[d.district_id]),
            }));

        if (entries.length === 0) {
            setError("Enter at least one district count before saving.");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch("/api/officer/reports/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    week_number: Number(form.week_number),
                    year: Number(form.year),
                    disease_id: Number(form.disease_id),
                    entries,
                }),
            });

            const data = (await res.json()) as {
                updated?: number;
                skipped?: number[];
                message?: string;
                error?: string;
            };

            if (!res.ok) throw new Error(data.error || "Bulk save failed");

            setSuccess(data.message ?? `${data.updated ?? entries.length} record(s) saved.`);
            if (data.skipped && data.skipped.length > 0) {
                setError(
                    `${data.skipped.length} district(s) had no predicted record for the selected week and were skipped.`
                );
            }
            await fetchRecords();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to save records");
        } finally {
            setSaving(false);
        }
    };

    /* ── Render ───────────────────────────────────────────────────────────── */

    return (
        <div className="space-y-4">
            {/* ── Entry Card ──────────────────────────────────────────────── */}
            <Card className="border-black/15 bg-white text-black dark:border-white/20 dark:bg-black dark:text-white">
                <CardHeader>
                    <CardTitle>Bulk Update Weekly Records</CardTitle>
                    <CardDescription className="text-black/65 dark:text-white/65">
                        Select week, year, and disease — then type actual counts directly in the
                        grid. Tab key moves between rows.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-4">
                        {/* ── Filters row ──────────────────────────────────── */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <label className="text-sm">
                                Week Number *
                                <input
                                    type="number"
                                    min={1}
                                    max={53}
                                    name="week_number"
                                    value={form.week_number}
                                    onChange={onInputChange}
                                    className="mt-1 w-full rounded-md border px-3 py-2 bg-transparent"
                                />
                            </label>

                            <label className="text-sm">
                                Year *
                                <input
                                    type="number"
                                    min={1900}
                                    max={2100}
                                    name="year"
                                    value={form.year}
                                    onChange={onInputChange}
                                    className="mt-1 w-full rounded-md border px-3 py-2 bg-transparent"
                                />
                            </label>

                            <label className="text-sm">
                                Disease *
                                <Select
                                    value={form.disease_id || undefined}
                                    onValueChange={(value) =>
                                        setForm((prev) => ({ ...prev, disease_id: value }))
                                    }
                                    disabled={loadingMeta}
                                >
                                    <SelectTrigger className="mt-1 w-full">
                                        <SelectValue placeholder="Select disease" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {diseases.map((disease) => (
                                            <SelectItem
                                                key={disease.disease_id}
                                                value={String(disease.disease_id)}
                                            >
                                                {disease.disease_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </label>
                        </div>

                        {/* ── Apply-to-all helper ───────────────────────────── */}
                        <div className="rounded-lg border border-black/10 p-3 dark:border-white/15">
                            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-end">
                                <label className="text-sm">
                                    Fill Same Count In All Districts
                                    <input
                                        type="number"
                                        min={0}
                                        value={applyAllCount}
                                        onChange={(e) => setApplyAllCount(e.target.value)}
                                        className="mt-1 w-full rounded-md border px-3 py-2 bg-transparent"
                                    />
                                </label>
                                <button
                                    type="button"
                                    onClick={applyCountToAllDistricts}
                                    className="rounded-md border border-black/20 px-4 py-2 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
                                >
                                    Apply To All
                                </button>
                                <button
                                    type="button"
                                    onClick={clearAllCounts}
                                    className="rounded-md border border-black/20 px-4 py-2 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
                                >
                                    Clear All
                                </button>
                            </div>
                        </div>

                        {/* ── Inline-editable district grid ─────────────────── */}
                        <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="bg-black/[0.04] dark:bg-white/[0.05] text-left text-xs uppercase tracking-wide text-black/55 dark:text-white/50">
                                        <th className="px-3 py-2.5 w-6 text-center">#</th>
                                        <th className="px-3 py-2.5">District</th>
                                        <th className="px-3 py-2.5">Province</th>
                                        <th className="px-3 py-2.5 text-right">
                                            Predicted Cases
                                        </th>
                                        <th className="px-3 py-2.5 min-w-[160px]">
                                            Actual Count
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingMeta ? (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-3 py-6 text-center text-black/50 dark:text-white/50"
                                            >
                                                Loading districts…
                                            </td>
                                        </tr>
                                    ) : (
                                        sortedDistricts.map((district, index) => {
                                            const predicted =
                                                predictedByDistrict[district.district_id];
                                            const value =
                                                countsByDistrict[district.district_id] ?? "";
                                            const isEdited = value !== "";

                                            return (
                                                <tr
                                                    key={district.district_id}
                                                    className={`border-t border-black/[0.07] dark:border-white/[0.07] transition-colors ${
                                                        isEdited
                                                            ? "bg-black/[0.025] dark:bg-white/[0.04]"
                                                            : "hover:bg-black/[0.015] dark:hover:bg-white/[0.02]"
                                                    }`}
                                                >
                                                    <td className="px-3 py-1.5 text-center text-xs text-black/35 dark:text-white/35 tabular-nums">
                                                        {index + 1}
                                                    </td>
                                                    <td className="px-3 py-1.5 font-medium text-black/90 dark:text-white/90">
                                                        {district.district_name}
                                                    </td>
                                                    <td className="px-3 py-1.5 text-black/55 dark:text-white/55">
                                                        {district.province_name}
                                                    </td>
                                                    <td className="px-3 py-1.5 text-right tabular-nums text-black/60 dark:text-white/60">
                                                        {predicted != null ? predicted : "—"}
                                                    </td>
                                                    <td className="px-2 py-1">
                                                        <input
                                                            ref={(el) => {
                                                                inputRefs.current[
                                                                    district.district_id
                                                                ] = el;
                                                            }}
                                                            type="number"
                                                            min={0}
                                                            value={value}
                                                            placeholder="—"
                                                            onChange={(e) =>
                                                                onDistrictCountChange(
                                                                    district.district_id,
                                                                    e.target.value
                                                                )
                                                            }
                                                            onKeyDown={(e) =>
                                                                handleKeyDown(e, index)
                                                            }
                                                            className={`w-full rounded-md border px-3 py-1.5 text-sm bg-transparent tabular-nums transition-colors
                                                                focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/25
                                                                ${
                                                                    isEdited
                                                                        ? "border-black/30 dark:border-white/30"
                                                                        : "border-black/15 dark:border-white/15"
                                                                }`}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* ── Submit ────────────────────────────────────────── */}
                        <div className="flex items-center gap-3">
                            <button
                                type="submit"
                                disabled={saving || loadingMeta}
                                className="rounded-md bg-black text-white dark:bg-white dark:text-black px-5 py-2 text-sm font-medium disabled:opacity-60 hover:opacity-85 transition-opacity"
                            >
                                {saving ? "Saving…" : "Save All District Records"}
                            </button>
                            <span className="text-xs text-black/45 dark:text-white/45">
                                {
                                    sortedDistricts.filter(
                                        (d) => countsByDistrict[d.district_id] !== ""
                                    ).length
                                }{" "}
                                district(s) ready to submit
                            </span>
                        </div>
                    </form>

                    {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
                    {success && <p className="mt-3 text-sm text-green-600">{success}</p>}
                </CardContent>
            </Card>

            {/* ── Submitted Records Card ───────────────────────────────────── */}
            <Card className="border-black/15 bg-white text-black dark:border-white/20 dark:bg-black dark:text-white">
                <CardHeader>
                    <CardTitle>Submitted Reports</CardTitle>
                    <CardDescription className="text-black/65 dark:text-white/65">
                        Latest weekly reports with case count and actual count.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Chart */}
                    <div className="mb-4 rounded-lg border border-black/10 p-3 dark:border-white/15">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            {[
                                { key: "all", label: "All Data" },
                                { key: "past_week", label: "Past Week" },
                                { key: "past_4_months", label: "Past 4 Months" },
                            ].map((option) => {
                                const active = chartRange === option.key;
                                return (
                                    <button
                                        key={option.key}
                                        type="button"
                                        onClick={() => setChartRange(option.key as ChartRange)}
                                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                            active
                                                ? "bg-black text-white dark:bg-white dark:text-black"
                                                : "border border-black/20 text-black/70 hover:bg-black/5 dark:border-white/20 dark:text-white/70 dark:hover:bg-white/10"
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="h-72 w-full">
                            {loadingRecords ? (
                                <div className="flex h-full items-center justify-center text-sm text-black/60 dark:text-white/60">
                                    Loading chart data...
                                </div>
                            ) : filteredTrendData.length === 0 ? (
                                <div className="flex h-full items-center justify-center text-sm text-black/60 dark:text-white/60">
                                    No trend data available for selected range.
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={filteredTrendData}>
                                        <defs>
                                            <linearGradient
                                                id="predictedFill"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="5%"
                                                    stopColor="#374151"
                                                    stopOpacity={0.35}
                                                />
                                                <stop
                                                    offset="95%"
                                                    stopColor="#374151"
                                                    stopOpacity={0.05}
                                                />
                                            </linearGradient>
                                            <linearGradient
                                                id="actualFill"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="5%"
                                                    stopColor="#111827"
                                                    stopOpacity={0.35}
                                                />
                                                <stop
                                                    offset="95%"
                                                    stopColor="#111827"
                                                    stopOpacity={0.05}
                                                />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
                                        <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Legend />
                                        <Area
                                            type="monotone"
                                            dataKey="predicted"
                                            name="Predicted Cases"
                                            stroke="#374151"
                                            fill="url(#predictedFill)"
                                            strokeWidth={2}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="actual"
                                            name="Actual Cases"
                                            stroke="#111827"
                                            fill="url(#actualFill)"
                                            strokeWidth={2}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Records table */}
                    <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
                        <table className="min-w-full text-sm">
                            <thead className="bg-black/3 dark:bg-white/5">
                                <tr>
                                    <th className="px-3 py-2 text-left">Week</th>
                                    <th className="px-3 py-2 text-left">Year</th>
                                    <th className="px-3 py-2 text-left">District</th>
                                    <th className="px-3 py-2 text-left">Province</th>
                                    <th className="px-3 py-2 text-left">Disease</th>
                                    <th className="px-3 py-2 text-left">Case Count</th>
                                    <th className="px-3 py-2 text-left">Actual Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingRecords ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-3 py-6 text-center text-black/60 dark:text-white/60"
                                        >
                                            Loading records...
                                        </td>
                                    </tr>
                                ) : records.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-3 py-6 text-center text-black/60 dark:text-white/60"
                                        >
                                            No records found for this filter.
                                        </td>
                                    </tr>
                                ) : (
                                    records.map((record) => (
                                        <tr
                                            key={record.report_id}
                                            className="border-t border-black/10 dark:border-white/10"
                                        >
                                            <td className="px-3 py-2">{record.week_number}</td>
                                            <td className="px-3 py-2">{record.year}</td>
                                            <td className="px-3 py-2">{record.district_name}</td>
                                            <td className="px-3 py-2">{record.province_name}</td>
                                            <td className="px-3 py-2">{record.disease_name}</td>
                                            <td className="px-3 py-2">{record.case_count}</td>
                                            <td className="px-3 py-2">
                                                {record.actual_count ?? "—"}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
