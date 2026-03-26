"use client";

import { useState, useEffect, useCallback } from "react";
import { HistoryData, District, Disease } from "@/types/historydata";

const API_BASE = "/api/admin";

const PAGE_SIZE = 20;

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

export default function HistoricalDataManager() {
    const [records, setRecords] = useState<HistoryData[]>([]);
    const [diseases, setDiseases] = useState<Disease[]>([]);
    const [form, setForm] = useState(defaultForm);
    const [filters, setFilters] = useState(defaultFilters);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const [loading, setLoading] = useState(false);
    const [fetchingRecords, setFetchingRecords] = useState(true);
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

    useEffect(() => {
        fetchRecords(0, defaultFilters);
        fetchDiseases();
    }, [fetchDiseases, fetchRecords]);

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
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Delete failed");
        } finally {
            setDeletingId(null);
        }
    };

    // ── Helpers ───────────────────────────────────────────────────────────────

    const getDistrictName = (id: number) =>
        DISTRICTS.find((d) => d.district_id === id)?.district_name ?? `District ${id}`;

    const getDiseaseName = (id: number) =>
        diseases.find((d) => d.disease_id === id)?.disease_name ?? `Disease ${id}`;

    const activeFilterCount = Object.values(filters).filter(Boolean).length;

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="max-w-6xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Historical Disease Data
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage weekly disease case records by district
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setShowFilters(!showFilters);
                            setError(null);
                            setSuccess(null);
                        }}
                        className={`relative px-4 py-2 rounded-lg text-sm font-medium border transition ${
                            showFilters
                                ? "bg-gray-100 border-gray-300 text-gray-700"
                                : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
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
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                    >
                        {showForm ? "Cancel" : "+ Add Record"}
                    </button>
                </div>
            </div>

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
            {showFilters && (
                <div className="mb-6 bg-gray-50 border border-gray-200 rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                        Filter Records
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
            {showForm && (
                <div className="mb-8 bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">Add New Record</h2>
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

            {/* Records Table */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
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
        </div>
    );
}
