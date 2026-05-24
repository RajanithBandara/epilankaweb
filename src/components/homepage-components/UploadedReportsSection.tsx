"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type UploadedReport = {
    id: string;
    file_url: string;
    filename?: string | null;
    year?: number | null;
    uploaded_at: string | null;
};

export default function UploadedReportsSection() {
    const [reports, setReports] = useState<UploadedReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchReports() {
            try {
                setLoading(true);
                const response = await fetch("/api/reports/uploaded-records?limit=12");
                if (!response.ok) {
                    throw new Error("Failed to fetch uploaded reports");
                }
                const data = await response.json();
                setReports(data.reports || []);
            } catch {
                setError("Could not load uploaded reports");
            } finally {
                setLoading(false);
            }
        }
        fetchReports();
    }, []);

    const grouped = useMemo(() => {
        const map = new Map<string, UploadedReport[]>();
        for (const r of reports) {
            const key = r.year != null ? String(r.year) : "Unspecified";
            const bucket = map.get(key) ?? [];
            bucket.push(r);
            map.set(key, bucket);
        }
        const sortedKeys = Array.from(map.keys()).sort((a, b) => {
            if (a === "Unspecified") return 1;
            if (b === "Unspecified") return -1;
            return Number(b) - Number(a);
        });
        return sortedKeys.map((k) => ({ year: k, items: map.get(k)! }));
    }, [reports]);

    return (
        <section className="py-12">
            <div className="container mx-auto px-4">
                <div className="mx-auto max-w-5xl rounded-2xl border border-white/15 bg-white/95 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
                    <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
                        <div>
                            <h2 className="text-2xl font-bold text-black sm:text-3xl">
                                Reports
                            </h2>
                            <p className="mt-1 text-sm text-black/65">
                                Latest PDF reports published by health officers.
                            </p>
                        </div>
                        <Link
                            href="/reports"
                            className="inline-flex items-center gap-2 rounded-lg border border-black bg-black px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-black/85"
                        >
                            View all
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                    </div>

                    {loading ? (
                        <p className="text-sm text-black/55">Loading reports…</p>
                    ) : error ? (
                        <p className="text-sm text-black">{error}</p>
                    ) : reports.length === 0 ? (
                        <p className="text-sm text-black/55">No reports have been published yet.</p>
                    ) : (
                        <div className="space-y-6">
                            {grouped.map((group) => (
                                <div key={group.year} className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-sm font-semibold text-black">
                                            {group.year}
                                        </h3>
                                        <span className="text-xs text-black/55">
                                            {group.items.length} report
                                            {group.items.length === 1 ? "" : "s"}
                                        </span>
                                        <div className="h-px flex-1 bg-black/10" />
                                    </div>
                                    <ul className="grid gap-2 sm:grid-cols-2">
                                        {group.items.map((r) => {
                                            const name =
                                                r.filename ||
                                                r.file_url.split("/").pop()?.split("?")[0] ||
                                                "Report.pdf";
                                            return (
                                                <li key={r.id}>
                                                    <a
                                                        href={r.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-3 rounded-md border border-black/15 bg-white px-3 py-2.5 transition-colors hover:border-black"
                                                    >
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-black/20">
                                                            <svg className="h-4 w-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M9 8h6M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
                                                            </svg>
                                                        </div>
                                                        <p className="min-w-0 flex-1 truncate text-sm font-medium text-black">
                                                            {name}
                                                        </p>
                                                        <span className="text-xs font-medium text-black underline">
                                                            View
                                                        </span>
                                                    </a>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
