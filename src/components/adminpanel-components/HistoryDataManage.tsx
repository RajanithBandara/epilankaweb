"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { HistoryData, District, Disease } from "@/types/historydata";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";

const API_BASE = "/api/admin";

const PAGE_SIZE = 20;
const CHART_FETCH_SIZE = 200;

const DISTRICTS: District[] = [
    { district_id: 1, district_name: "Colombo" },
    { district_id: 2, district_name: "Gampaha" },
    { district_id: 3, district_name: "Kalutara" },
    { district_id: 4, district_name: "Kandy" },
    { district_id: 5, district_name: "Matale" },
    { district_id: 6, district_name: "Nuwara Eliya" },
    { district_id: 7, district_name: "Galle" },
    { district_id: 8, district_name: "Hambantota" },
    { district_id: 9, district_name: "Matara" },
    { district_id: 10, district_name: "Jaffna" },
    { district_id: 11, district_name: "Kilinochchi" },
    { district_id: 12, district_name: "Mannar" },
    { district_id: 13, district_name: "Vavuniya" },
    { district_id: 14, district_name: "Mullaitivu" },
    { district_id: 15, district_name: "Batticaloa" },
    { district_id: 16, district_name: "Ampara" },
    { district_id: 17, district_name: "Trincomalee" },
    { district_id: 18, district_name: "Kurunegala" },
    { district_id: 19, district_name: "Puttalam" },
    { district_id: 20, district_name: "Anuradhapura" },
    { district_id: 21, district_name: "Polonnaruwa" },
    { district_id: 22, district_name: "Badulla" },
    { district_id: 23, district_name: "Monaragala" },
    { district_id: 24, district_name: "Ratnapura" },
    { district_id: 25, district_name: "Kegalle" },
    { district_id: 26, district_name: "Kalmunai" },
];

const defaultForm = {
    week_number: "",
    year: "",
    district_id: "",
    disease_id: "",
    case_count: "",
};

const defaultFilters = {
    week_number: "",
    year: "",
    district_id: "",
    disease_id: "",
};

const CHART_COLORS = ["#2563eb", "#0ea5e9", "#14b8a6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#d946ef"];

type AggregationType = "daily" | "weekly" | "monthly" | "yearly";
type TabType = "history" | "charts";

export default function HistoricalDataManager() {
    const [records, setRecords] = useState<HistoryData[]>([]);
    const [chartRecords, setChartRecords] = useState<HistoryData[]>([]);
    const [diseases, setDiseases] = useState<Disease[]>([]);
    const [form, setForm] = useState(defaultForm);
    const [filters, setFilters] = useState(defaultFilters);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const [activeTab, setActiveTab] = useState<TabType>("history");
    const [timeAggregation, setTimeAggregation] = useState<AggregationType>("weekly");

    const [loading, setLoading] = useState(false);
    const [fetchingRecords, setFetchingRecords] = useState(true);
    const [fetchingCharts, setFetchingCharts] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // ── Data Fetching ─────────────────────────────────────────────��───────────

    const fetchRecords = useCallback(
        async (currentPage = 0, currentFilters = defaultFilters) => {
            setFetchingRecords(true);
            setError(null);
            try {
                const params = new URLSearchParams();
                params.set("skip", String(currentPage * PAGE_SIZE));
                params.set("limit", String(PAGE_SIZE));
                if (currentFilters.week_number) params.set("week_number", currentFilters.week_number);
                if (currentFilters.year) params.set("year", currentFilters.year);
                if (currentFilters.district_id) params.set("district_id", currentFilters.district_id);
                if (currentFilters.disease_id) params.set("disease_id", currentFilters.disease_id);

                const res = await fetch(`${API_BASE}/historical-data?${params.toString()}`);
                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || "Failed to fetch records");
                }
                const data: HistoryData[] = await res.json();
                setRecords(data);
                setHasMore(data.length === PAGE_SIZE);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Failed to load records");
            } finally {
                setFetchingRecords(false);
            }
        },
        []
    );

    const fetchDiseases = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/diseases`);
            if (!res.ok) return;
            const data: Disease[] = await res.json();
            setDiseases(data);
        } catch {
            // fallback: leave diseases empty
        }
    }, []);

    const fetchAllChartRecords = useCallback(async () => {
        setFetchingCharts(true);
        try {
            let skip = 0;
            const allRecords: HistoryData[] = [];

            while (true) {
                const params = new URLSearchParams();
                params.set("skip", String(skip));
                params.set("limit", String(CHART_FETCH_SIZE));

                const res = await fetch(`${API_BASE}/historical-data?${params.toString()}`);
                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || "Failed to fetch chart records");
                }

                const batch: HistoryData[] = await res.json();
                allRecords.push(...batch);

                if (batch.length < CHART_FETCH_SIZE) {
                    break;
                }

                skip += CHART_FETCH_SIZE;
            }

            setChartRecords(allRecords);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to load chart data");
        } finally {
            setFetchingCharts(false);
        }
    }, []);

    useEffect(() => {
        fetchRecords(0, defaultFilters);
        fetchAllChartRecords();
        fetchDiseases();
    }, [fetchAllChartRecords, fetchDiseases, fetchRecords]);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleFilterChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const applyFilters = () => {
        setPage(0);
        fetchRecords(0, filters);
    };

    const clearFilters = () => {
        setFilters(defaultFilters);
        setPage(0);
        fetchRecords(0, defaultFilters);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        fetchRecords(newPage, filters);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleFormChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setError(null);
        setSuccess(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch(`${API_BASE}/historical-data`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    week_number: Number(form.week_number),
                    year: Number(form.year),
                    district_id: Number(form.district_id),
                    disease_id: Number(form.disease_id),
                    case_count: Number(form.case_count),
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || errData.error || "Failed to create record");
            }

            setSuccess("Historical data record added successfully!");
            setForm(defaultForm);
            setShowForm(false);
            fetchRecords(page, filters);
            fetchAllChartRecords();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (dataId: string) => {
        if (!confirm("Are you sure you want to delete this record?")) return;
        setDeletingId(dataId);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch(`${API_BASE}/historical-data/${dataId}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || errData.error || "Failed to delete record");
            }
            setSuccess("Record deleted successfully.");
            fetchRecords(page, filters);
            fetchAllChartRecords();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Delete failed");
        } finally {
            setDeletingId(null);
        }
    };

    // ── Helpers ───────────────────────────────────────────────────────────────

    const getDistrictName = useCallback(
        (id: number) => DISTRICTS.find((d) => d.district_id === id)?.district_name ?? `District ${id}`,
        []
    );

    const getDiseaseName = useCallback(
        (id: number) => diseases.find((d) => d.disease_id === id)?.disease_name ?? `Disease ${id}`,
        [diseases]
    );

    const activeFilterCount = Object.values(filters).filter(Boolean).length;

    const getDateKey = useCallback((record: HistoryData): string => {
        const date = new Date(record.year, 0, 1);
        date.setDate(date.getDate() + (record.week_number - 1) * 7);

        switch (timeAggregation) {
            case "daily":
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
            case "weekly":
                return `${date.getFullYear()}-W${String(record.week_number).padStart(2, "0")}`;
            case "monthly":
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            case "yearly":
                return `${date.getFullYear()}`;
            default:
                return "";
        }
    }, [timeAggregation]);

    const getDateLabel = useCallback((record: HistoryData): string => {
        const date = new Date(record.year, 0, 1);
        date.setDate(date.getDate() + (record.week_number - 1) * 7);

        switch (timeAggregation) {
            case "daily":
                return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            case "weekly":
                return `W${String(record.week_number).padStart(2, "0")} ${date.getFullYear()}`;
            case "monthly":
                return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
            case "yearly":
                return `${date.getFullYear()}`;
            default:
                return "";
        }
    }, [timeAggregation]);

    const weeklyTrendData = useMemo(() => {
        const grouped = new Map<string, { label: string; order: number; cases: number }>();

        chartRecords.forEach((record) => {
            const key = getDateKey(record);
            const existing = grouped.get(key);

            if (existing) {
                existing.cases += record.case_count;
                return;
            }

            grouped.set(key, {
                label: getDateLabel(record),
                order: new Date(record.year, 0, 1).getTime() + (record.week_number - 1) * 7 * 24 * 60 * 60 * 1000,
                cases: record.case_count,
            });
        });

        return Array.from(grouped.values())
            .sort((a, b) => a.order - b.order)
            .map(({ label, cases }) => ({ label, cases }));
    }, [chartRecords, getDateKey, getDateLabel]);

    const districtCasesData = useMemo(() => {
        const totals = new Map<number, number>();

        chartRecords.forEach((record) => {
            totals.set(record.district_id, (totals.get(record.district_id) ?? 0) + record.case_count);
        });

        return Array.from(totals.entries())
            .map(([districtId, totalCases]) => ({
                district: getDistrictName(districtId),
                cases: totalCases,
            }))
            .sort((a, b) => b.cases - a.cases)
            .slice(0, 10);
    }, [chartRecords, getDistrictName]);

    const diseaseCasesData = useMemo(() => {
        const totals = new Map<number, number>();

        chartRecords.forEach((record) => {
            totals.set(record.disease_id, (totals.get(record.disease_id) ?? 0) + record.case_count);
        });

        const sorted = Array.from(totals.entries())
            .map(([diseaseId, totalCases]) => ({
                disease: getDiseaseName(diseaseId),
                cases: totalCases,
            }))
            .sort((a, b) => b.cases - a.cases);

        if (sorted.length <= 6) {
            return sorted;
        }

        const topDiseases = sorted.slice(0, 6);
        const otherCases = sorted.slice(6).reduce((acc, item) => acc + item.cases, 0);

        return [...topDiseases, { disease: "Other", cases: otherCases }];
    }, [chartRecords, getDiseaseName]);

    // ── Render ────────────────────────────────────────────────────────────────

    const tabClasses = (tabName: TabType) =>
        `px-1 pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === tabName
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
        }`;

    return (
        <div className="animate-in fade-in duration-300">
            {/* Tabs */}
            <div className="mb-6 flex gap-6 border-b border-slate-100">
                <button
                    onClick={() => setActiveTab("history")}
                    className={tabClasses("history")}
                >
                    History view
                </button>
                <button
                    onClick={() => setActiveTab("charts")}
                    className={tabClasses("charts")}
                >
                    Charts &amp; analytics
                </button>
            </div>

            {/* Time Aggregation Controls for Charts Tab */}
            {activeTab === "charts" && (
                <div className="mb-6 border border-slate-100 rounded-lg p-4 bg-white">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Time aggregation</span>
                        <div className="flex gap-1">
                            {(["daily", "weekly", "monthly", "yearly"] as AggregationType[]).map((agg) => (
                                <button
                                    key={agg}
                                    onClick={() => setTimeAggregation(agg)}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                        timeAggregation === agg
                                            ? "bg-slate-900 text-white"
                                            : "bg-white text-slate-600 border border-slate-100 hover:bg-slate-50"
                                    }`}
                                >
                                    {agg.charAt(0).toUpperCase() + agg.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* History Tab Controls */}
            {activeTab === "history" && (
                <div className="mb-6 flex gap-2">
                    <button
                        onClick={() => {
                            setShowFilters(!showFilters);
                            setError(null);
                            setSuccess(null);
                        }}
                        className={`relative h-9 px-3 rounded-md text-sm font-medium border transition-colors ${
                            showFilters
                                ? "bg-slate-100 border-slate-200 text-slate-700"
                                : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-slate-900 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-medium">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => {
                            setShowForm(!showForm);
                            setError(null);
                            setSuccess(null);
                        }}
                        className="h-9 px-3 rounded-md text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                    >
                        {showForm ? "Cancel" : "Add record"}
                    </button>
                </div>
            )}

            {/* Feedback messages */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex justify-between items-start">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="ml-4 text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                </div>
            )}
            {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex justify-between items-start">
                    <span>{success}</span>
                    <button onClick={() => setSuccess(null)} className="ml-4 text-green-400 hover:text-green-600 text-lg leading-none">×</button>
                </div>
            )}

            {/* Filter Panel */}
            {activeTab === "history" && showFilters && (
                <div className="mb-6 bg-slate-50/50 border border-slate-100 rounded-lg p-5">
                    <h2 className="text-[11px] font-medium text-slate-500 mb-3 uppercase tracking-widest">
                        Filter records
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Week</label>
                            <input
                                type="number"
                                name="week_number"
                                value={filters.week_number}
                                onChange={handleFilterChange}
                                min={1}
                                max={53}
                                placeholder="1 – 53"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
                            <input
                                type="number"
                                name="year"
                                value={filters.year}
                                onChange={handleFilterChange}
                                min={1900}
                                max={2100}
                                placeholder="e.g. 2025"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">District</label>
                            <select
                                name="district_id"
                                value={filters.district_id}
                                onChange={handleFilterChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All districts</option>
                                {DISTRICTS.map((d) => (
                                    <option key={d.district_id} value={d.district_id}>
                                        {d.district_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Disease</label>
                            <select
                                name="disease_id"
                                value={filters.disease_id}
                                onChange={handleFilterChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All diseases</option>
                                {diseases.map((d) => (
                                    <option key={d.disease_id} value={d.disease_id}>
                                        {d.disease_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                        <button
                            onClick={applyFilters}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                        >
                            Apply Filters
                        </button>
                        {activeFilterCount > 0 && (
                            <button
                                onClick={clearFilters}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Add Record Form */}
            {activeTab === "history" && showForm && (
                <div className="mb-8 bg-white border border-slate-100 rounded-lg p-6">
                    <h2 className="text-sm font-semibold text-slate-700 mb-4">Add new record</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Week Number</label>
                                <input
                                    type="number"
                                    name="week_number"
                                    value={form.week_number}
                                    onChange={handleFormChange}
                                    min={1}
                                    max={53}
                                    required
                                    placeholder="1 – 53"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Year</label>
                                <input
                                    type="number"
                                    name="year"
                                    value={form.year}
                                    onChange={handleFormChange}
                                    min={1900}
                                    max={2100}
                                    required
                                    placeholder="e.g. 2025"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">District</label>
                                <select
                                    name="district_id"
                                    value={form.district_id}
                                    onChange={handleFormChange}
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select district</option>
                                    {DISTRICTS.map((d) => (
                                        <option key={d.district_id} value={d.district_id}>
                                            {d.district_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Disease</label>
                                <select
                                    name="disease_id"
                                    value={form.disease_id}
                                    onChange={handleFormChange}
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select disease</option>
                                    {diseases.map((d) => (
                                        <option key={d.disease_id} value={d.disease_id}>
                                            {d.disease_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Case Count</label>
                                <input
                                    type="number"
                                    name="case_count"
                                    value={form.case_count}
                                    onChange={handleFormChange}
                                    min={0}
                                    required
                                    placeholder="e.g. 42"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="mt-5 flex gap-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-medium transition"
                            >
                                {loading ? "Saving..." : "Save Record"}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false);
                                    setForm(defaultForm);
                                    setError(null);
                                }}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg text-sm font-medium transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Charts Tab Content */}
            {activeTab === "charts" && (
            <>
            {fetchingCharts ? (
                <div className="mb-8 bg-white border border-slate-100 rounded-lg p-8 text-center">
                    <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-gray-500 text-sm">Loading full historical dataset for charts...</p>
                </div>
            ) : chartRecords.length > 0 ? (
                <div className="mb-8 grid grid-cols-1 gap-5">
                    <div className="bg-white border border-slate-100 rounded-lg p-5">
                        <h3 className="text-base font-semibold text-gray-700 mb-1">Weekly Case Trend</h3>
                        <p className="text-xs text-gray-400 mb-3">Based on all historical records in the database</p>
                        <div className="h-[360px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={weeklyTrendData} margin={{ top: 12, right: 20, left: 8, bottom: 16 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={22} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                    <Tooltip formatter={(value) => Number(value ?? 0).toLocaleString()} />
                                    <Line
                                        type="monotone"
                                        dataKey="cases"
                                        stroke="#2563eb"
                                        strokeWidth={2.5}
                                        dot={{ r: 2.5 }}
                                        activeDot={{ r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-lg p-5">
                        <h3 className="text-base font-semibold text-gray-700 mb-3">Cases by District (Top 10)</h3>
                        <div className="h-[380px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={districtCasesData} margin={{ top: 12, right: 20, left: 8, bottom: 44 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="district" tick={{ fontSize: 11 }} angle={-16} textAnchor="end" height={62} interval={0} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                    <Tooltip formatter={(value) => Number(value ?? 0).toLocaleString()} />
                                    <Bar dataKey="cases" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-lg p-5">
                        <h3 className="text-base font-semibold text-gray-700 mb-3">Cases by Disease</h3>
                        <div className="h-[420px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={diseaseCasesData}
                                        dataKey="cases"
                                        nameKey="disease"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={140}
                                        label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                                    >
                                        {diseaseCasesData.map((entry, index) => (
                                            <Cell key={`${entry.disease}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => Number(value ?? 0).toLocaleString()} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="mb-8 bg-white border border-slate-100 rounded-lg p-8 text-center text-slate-400 text-sm">
                    No historical records available for charts.
                </div>
            )}
            </>
            )}

            {/* History Tab Content */}
            {activeTab === "history" && (
            <>

            {/* Records Table */}
            <div className="bg-white border border-slate-100 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-gray-700">
                        Records{" "}
                        {activeFilterCount > 0 && (
                            <span className="text-xs text-blue-600 font-normal ml-1">(filtered)</span>
                        )}
                        <span className="text-gray-400 font-normal text-sm ml-1">
                            ({records.length}{hasMore ? "+" : ""})
                        </span>
                    </h2>
                    <button
                        onClick={() => fetchRecords(page, filters)}
                        disabled={fetchingRecords}
                        className="text-sm text-blue-600 hover:underline disabled:opacity-40"
                    >
                        {fetchingRecords ? "Refreshing..." : "Refresh"}
                    </button>
                </div>

                {fetchingRecords ? (
                    <div className="p-10 text-center">
                        <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
                        <p className="text-gray-400 text-sm">Loading records...</p>
                    </div>
                ) : records.length === 0 ? (
                    <div className="p-10 text-center text-gray-400 text-sm">
                        {activeFilterCount > 0
                            ? "No records match the current filters."
                            : "No records found. Add one above."}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Week</th>
                                        <th className="px-4 py-3 text-left">Year</th>
                                        <th className="px-4 py-3 text-left">District</th>
                                        <th className="px-4 py-3 text-left">Disease</th>
                                        <th className="px-4 py-3 text-right">Cases</th>
                                        <th className="px-4 py-3 text-left">Record ID</th>
                                        <th className="px-4 py-3 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {records.map((record) => (
                                        <tr
                                            key={record.data_id}
                                            className="hover:bg-gray-50 transition"
                                        >
                                            <td className="px-4 py-3 font-medium text-gray-700">
                                                W{record.week_number}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{record.year}</td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {getDistrictName(record.district_id)}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {getDiseaseName(record.disease_id)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                                                    {record.case_count.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 font-mono text-xs truncate max-w-[140px]">
                                                {record.data_id}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleDelete(record.data_id)}
                                                    disabled={deletingId === record.data_id}
                                                    className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40 transition font-medium"
                                                >
                                                    {deletingId === record.data_id ? "Deleting..." : "Delete"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                                Page {page + 1} · showing {records.length} records
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 0 || fetchingRecords}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-200 disabled:opacity-40 transition"
                                >
                                    ← Previous
                                </button>
                                <button
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={!hasMore || fetchingRecords}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-200 disabled:opacity-40 transition"
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
            </>
            )}
        </div>
    );
}
