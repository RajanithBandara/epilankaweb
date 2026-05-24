"use client";

import { useEffect, useState } from "react";
import { Activity, AlertCircle, Loader2 } from "lucide-react";
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

export default function CeriHistoryPage() {
    const [records, setRecords] = useState<CeriRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    useEffect(() => {
        void fetchHistory();
    }, []);

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
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight">CERI Risk History</h1>
                <p className="text-sm text-black/60 dark:text-white/60">
                    Comprehensive log of Community Epidemic Risk Index calculations across districts.
                </p>
            </div>

            <div className="rounded-xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-black">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-black/10 bg-black/5 text-black/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
                            <tr>
                                <th className="p-4 font-medium">Timeline</th>
                                <th className="p-4 font-medium">Location</th>
                                <th className="p-4 font-medium">Disease</th>
                                <th className="p-4 font-medium">Score</th>
                                <th className="p-4 font-medium">Risk Level</th>
                                <th className="p-4 font-medium">Metrics</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/10 dark:divide-white/10">
                            {records.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-black/50 dark:text-white/50">
                                        No historical CERI records found.
                                    </td>
                                </tr>
                            ) : (
                                records.map((record) => (
                                    <tr key={record._id} className="hover:bg-black/5 dark:hover:bg-white/5">
                                        <td className="p-4">
                                            <div className="font-medium">Week {record.week_number}</div>
                                            <div className="text-xs text-black/50 dark:text-white/50">{record.year}</div>
                                        </td>
                                        <td className="p-4 font-medium">{record.district_name}</td>
                                        <td className="p-4">{record.disease_name}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Activity className="h-4 w-4 text-blue-500" />
                                                <span className="font-bold">{record.ceri_score.toFixed(1)}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <Badge variant="outline" className={getRiskColor(record.risk_level)}>
                                                {record.risk_level.toUpperCase()}
                                            </Badge>
                                        </td>
                                        <td className="p-4 text-xs">
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-black/60 dark:text-white/60">
                                                <span>Reports: {record.report_count}</span>
                                                <span>Votes: {record.vote_total}</span>
                                                <span>Density: {record.components.report_density}</span>
                                                <span>Credibility: {record.components.vote_credibility}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
