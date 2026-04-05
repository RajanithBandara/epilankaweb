"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

const DISTRICT_PRIORITY = DISTRICT_ORDER_GROUPS.reduce<Record<string, number>>((acc, aliases, index) => {
    aliases.forEach((alias) => {
        acc[normalizeDistrictName(alias)] = index;
    });
    return acc;
}, {});

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

    const sortedDistricts = useMemo(() => {
        return [...districts].sort((a, b) => {
            const priorityA = DISTRICT_PRIORITY[normalizeDistrictName(a.district_name)] ?? Number.MAX_SAFE_INTEGER;
            const priorityB = DISTRICT_PRIORITY[normalizeDistrictName(b.district_name)] ?? Number.MAX_SAFE_INTEGER;

            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }

            return a.district_name.localeCompare(b.district_name);
        });
    }, [districts]);

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

    const fetchRecords = useCallback(async () => {
        setLoadingRecords(true);
        try {
            const params = new URLSearchParams();
            params.set("limit", "100");
            if (form.week_number) params.set("week_number", form.week_number);
            if (form.year) params.set("year", form.year);
            if (form.disease_id) params.set("disease_id", form.disease_id);

            const res = await fetch(`/api/officer/reports?${params.toString()}`, { cache: "no-store" });
            const data = (await res.json()) as { reports?: ReportRow[]; error?: string };
            if (!res.ok) throw new Error(data.error || "Failed to load records");
            setRecords(data.reports || []);
        } catch {
            setRecords([]);
        } finally {
            setLoadingRecords(false);
        }
    }, [form.week_number, form.year, form.disease_id]);

    const trendData = useMemo<TrendPoint[]>(() => {
        const grouped = new Map<string, TrendPoint>();

        records.forEach((record) => {
            const week = Number(record.week_number);
            const year = Number(record.year);
            const key = `${year}-W${String(week).padStart(2, "0")}`;
            const sortKey = year * 100 + week;

            if (!grouped.has(key)) {
                grouped.set(key, {
                    period: key,
                    sortKey,
                    predicted: 0,
                    actual: 0,
                });
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

    useEffect(() => {
        void fetchRecords();
    }, [fetchRecords]);

    const onInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);

        if (!form.week_number || !form.year || !form.disease_id) {
            setError("Select week number, year, and disease.");
            return;
        }

        const rowsToSubmit = sortedDistricts
            .map((district) => ({
                district_id: district.district_id,
                actual_count: countsByDistrict[district.district_id],
            }))
            .filter((row) => row.actual_count !== "");

        if (rowsToSubmit.length === 0) {
            setError("Enter at least one district count before saving.");
            return;
        }

        setSaving(true);
        try {
            const results = await Promise.allSettled(
                rowsToSubmit.map(async (row) => {
                    const payload = {
                        week_number: Number(form.week_number),
                        year: Number(form.year),
                        district_id: row.district_id,
                        disease_id: Number(form.disease_id),
                        actual_count: Number(row.actual_count),
                    };

                    const res = await fetch("/api/officer/reports", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                    });

                    const data = (await res.json()) as { error?: string };
                    if (!res.ok) {
                        throw new Error(data.error || `Failed to save district ${row.district_id}`);
                    }
                })
            );

            const failed = results.filter((result) => result.status === "rejected") as PromiseRejectedResult[];
            const successCount = results.length - failed.length;

            if (failed.length > 0) {
                const firstError = failed[0]?.reason;
                const message = firstError instanceof Error ? firstError.message : "Some records failed to save";
                setError(`${failed.length} district record(s) failed. ${message}`);
            }

            if (successCount > 0) {
                setSuccess(`${successCount} district record(s) saved successfully.`);
            }

            await fetchRecords();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to save record");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <Card className="border-black/15 bg-white text-black dark:border-white/20 dark:bg-black dark:text-white">
                <CardHeader>
                    <CardTitle>Bulk Update Weekly Records</CardTitle>
                    <CardDescription className="text-black/65 dark:text-white/65">
                        Select week, year, and disease once, then enter counts for fixed district fields.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-4">
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
                                <select
                                    name="disease_id"
                                    value={form.disease_id}
                                    onChange={onInputChange}
                                    className="mt-1 w-full rounded-md border px-3 py-2 bg-transparent"
                                    disabled={loadingMeta}
                                >
                                    <option value="">Select disease</option>
                                    {diseases.map((disease) => (
                                        <option key={disease.disease_id} value={disease.disease_id}>
                                            {disease.disease_name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <div className="rounded-lg border border-black/10 p-3 dark:border-white/15">
                            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-end">
                                <label className="text-sm">
                                    Fill Same Count In All Districts
                                    <input
                                        type="number"
                                        min={0}
                                        value={applyAllCount}
                                        onChange={(event) => setApplyAllCount(event.target.value)}
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

                        <div className="rounded-lg border border-black/10 dark:border-white/15">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-3 max-h-[460px] overflow-y-auto">
                                {sortedDistricts.map((district) => (
                                    <label key={district.district_id} className="text-sm rounded-md border border-black/10 dark:border-white/10 p-2">
                                        <span className="block font-medium text-black/90 dark:text-white/90">
                                            {district.district_name}
                                        </span>
                                        <span className="block text-[11px] text-black/55 dark:text-white/55 mb-1.5">
                                            {district.province_name}
                                        </span>
                                        <input
                                            type="number"
                                            min={0}
                                            value={countsByDistrict[district.district_id] ?? ""}
                                            onChange={(event) => onDistrictCountChange(district.district_id, event.target.value)}
                                            placeholder="Actual count"
                                            className="w-full rounded-md border px-3 py-2 bg-transparent"
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="submit"
                                disabled={saving || loadingMeta}
                                className="rounded-md bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-sm disabled:opacity-60"
                            >
                                {saving ? "Saving..." : "Save All District Records"}
                            </button>
                        </div>
                    </form>

                    {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
                    {success && <p className="mt-3 text-sm text-green-600">{success}</p>}
                </CardContent>
            </Card>

            <Card className="border-black/15 bg-white text-black dark:border-white/20 dark:bg-black dark:text-white">
                <CardHeader>
                    <CardTitle>Submitted Reports</CardTitle>
                    <CardDescription className="text-black/65 dark:text-white/65">
                        Latest weekly reports with case count and actual count.
                    </CardDescription>
                </CardHeader>
                <CardContent>
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
                                            <linearGradient id="predictedFill" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#374151" stopOpacity={0.35} />
                                                <stop offset="95%" stopColor="#374151" stopOpacity={0.05} />
                                            </linearGradient>
                                            <linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#111827" stopOpacity={0.35} />
                                                <stop offset="95%" stopColor="#111827" stopOpacity={0.05} />
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
                                    <td colSpan={7} className="px-3 py-6 text-center text-black/60 dark:text-white/60">
                                        Loading records...
                                    </td>
                                </tr>
                            ) : records.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-3 py-6 text-center text-black/60 dark:text-white/60">
                                        No records found for this location.
                                    </td>
                                </tr>
                            ) : (
                                records.map((record) => (
                                    <tr key={record.report_id} className="border-t border-black/10 dark:border-white/10">
                                        <td className="px-3 py-2">{record.week_number}</td>
                                        <td className="px-3 py-2">{record.year}</td>
                                        <td className="px-3 py-2">{record.district_name}</td>
                                        <td className="px-3 py-2">{record.province_name}</td>
                                        <td className="px-3 py-2">{record.disease_name}</td>
                                        <td className="px-3 py-2">{record.case_count}</td>
                                        <td className="px-3 py-2">{record.actual_count ?? "-"}</td>
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

