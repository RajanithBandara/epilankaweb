'use client';

import { useEffect, useState } from "react";
import { AlertTriangle, FileText, MapPin, ShieldAlert, Calendar, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Report = {
    report_id: string;
    description: string;
    user_id?: string;
    district_info?: {
        district_name: string;
        province_name: string;
    };
    extracted_data?: {
        disease_name: string;
        cases_reported: number;
        severity: "low" | "medium" | "high" | "critical" | "unknown";
        symptoms: string[];
    };
    created_at: string;
    score: number;
};

export default function OfficerUserReports() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchDistrict, setSearchDistrict] = useState("");
    const [appliedDistrict, setAppliedDistrict] = useState("");
    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
    const [banLoading, setBanLoading] = useState<Record<string, boolean>>({});

    const fetchReports = async (districtFilter: string) => {
        setLoading(true);
        setError("");
        try {
            const query = new URLSearchParams({ limit: "50" });
            if (districtFilter.trim()) {
                query.append("district", districtFilter.trim());
            }
            const res = await fetch(`/api/user-reports?${query.toString()}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to fetch reports");
            setReports(data.reports || []);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to fetch reports");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports(appliedDistrict);
    }, [appliedDistrict]);

    const handleDeleteReport = async (reportId: string, district: string) => {
        if (!confirm("Are you sure you want to delete this report?")) return;
        if (!district) {
            alert("Cannot delete report without a district.");
            return;
        }
        
        setActionLoading(prev => ({ ...prev, [reportId]: true }));
        try {
            const res = await fetch(`/api/officer/user-reports/delete?report_id=${encodeURIComponent(reportId)}&district=${encodeURIComponent(district)}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error("Failed to delete");
            setReports(prev => prev.filter(r => r.report_id !== reportId));
        } catch (err) {
            alert("Failed to delete report.");
        } finally {
            setActionLoading(prev => ({ ...prev, [reportId]: false }));
        }
    };

    const handleBanUser = async (userId: string) => {
        if (!confirm("Are you sure you want to ban this user? They will no longer be able to log in.")) return;
        
        setBanLoading(prev => ({ ...prev, [userId]: true }));
        try {
            const res = await fetch(`/api/officer/users/ban`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId })
            });
            if (!res.ok) throw new Error("Failed to ban");
            alert("User banned successfully.");
        } catch (err) {
            alert("Failed to ban user.");
        } finally {
            setBanLoading(prev => ({ ...prev, [userId]: false }));
        }
    };

    const getSeverityBadge = (severity?: string) => {
        switch (severity?.toLowerCase()) {
            case "critical":
            case "high":
                return <span className="inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[10px] font-bold bg-zinc-950 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950">HIGH</span>;
            case "medium":
                return <span className="inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[10px] font-bold border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-900">MID</span>;
            case "low":
                return <span className="inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[10px] font-bold border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 bg-white dark:bg-black">LOW</span>;
            default:
                return <span className="inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[10px] font-bold border border-dotted border-zinc-300 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500">UNK</span>;
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setAppliedDistrict(searchDistrict);
    };

    return (
        <section className="space-y-6 max-w-7xl mx-auto pb-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <FileText className="h-5 w-5 text-zinc-950 dark:text-zinc-50" />
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                            User Reports Dashboard
                        </h1>
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        View submitted disease reports from civilians across all regions.
                    </p>
                </div>

                <form onSubmit={handleSearch} className="flex items-center w-full sm:w-auto relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input 
                        type="text" 
                        value={searchDistrict}
                        onChange={(e) => setSearchDistrict(e.target.value)}
                        placeholder="Filter by district..."
                        className="pl-9 pr-4 py-2 w-full sm:w-64 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-md text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-zinc-300 transition-all"
                    />
                    <button type="submit" className="sr-only">Search</button>
                </form>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-950 dark:text-zinc-50">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span className="font-medium">{error}</span>
                </div>
            )}

            <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black overflow-hidden shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                                <th className="px-5 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Report Details</th>
                                <th className="px-5 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Analysis</th>
                                <th className="px-5 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Location</th>
                                <th className="px-5 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">Age</th>
                                <th className="px-5 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-5 py-4"><div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-800 rounded mb-2" /><div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-900 rounded" /></td>
                                        <td className="px-5 py-4"><div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-sm" /></td>
                                        <td className="px-5 py-4"><div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" /></td>
                                        <td className="px-5 py-4 flex justify-end"><div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" /></td>
                                        <td className="px-5 py-4"><div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded ml-auto" /></td>
                                    </tr>
                                ))
                            ) : reports.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center text-zinc-500 dark:text-zinc-400">
                                        <ShieldAlert className="h-8 w-8 mx-auto mb-3 text-zinc-300 dark:text-zinc-700" />
                                        <p className="text-sm font-medium">No reports found.</p>
                                        {appliedDistrict && <p className="text-xs mt-1">Try clearing the district filter.</p>}
                                    </td>
                                </tr>
                            ) : (
                                reports.map((r) => (
                                    <tr key={r.report_id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                                        <td className="px-5 py-4 align-top">
                                            <div className="flex flex-col min-w-0 pr-4">
                                                <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                                                    {r.description || "No description provided"}
                                                </p>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 font-mono">
                                                    ID: {r.report_id.slice(-8)} &bull; Score: {r.score}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 align-top">
                                            <div className="flex flex-col items-start gap-1.5">
                                                {getSeverityBadge(r.extracted_data?.severity)}
                                                <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                                                    {r.extracted_data?.disease_name || "Unverified"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 align-top">
                                            {r.district_info ? (
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50 flex items-center gap-1.5">
                                                        <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                                                        {r.district_info.district_name}
                                                    </span>
                                                    <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-5">
                                                        {r.district_info.province_name}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-zinc-500 italic">Unknown Location</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 align-top text-right">
                                            <div className="flex items-center justify-end gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {r.created_at ? formatDistanceToNow(new Date(r.created_at), { addSuffix: true }) : "Unknown"}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 align-top text-right">
                                            <div className="flex flex-col items-end gap-2">
                                                <button 
                                                    onClick={() => handleDeleteReport(r.report_id, r.district_info?.district_name || "")}
                                                    disabled={actionLoading[r.report_id]}
                                                    className="text-xs font-medium text-red-500 hover:text-red-600 disabled:opacity-50 transition-colors"
                                                >
                                                    {actionLoading[r.report_id] ? "Deleting..." : "Delete Report"}
                                                </button>
                                                {r.user_id && (
                                                    <button 
                                                        onClick={() => handleBanUser(r.user_id!)}
                                                        disabled={banLoading[r.user_id]}
                                                        className="text-xs font-medium text-orange-500 hover:text-orange-600 disabled:opacity-50 transition-colors"
                                                    >
                                                        {banLoading[r.user_id] ? "Banning..." : "Ban User"}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}