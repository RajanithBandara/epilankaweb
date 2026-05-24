"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

type UploadedReport = {
    id: string;
    file_url: string;
    filename?: string | null;
    year?: number | null;
    uploaded_at: string | null;
};

export default function PublicReportsPage() {
    const [reports, setReports] = useState<UploadedReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchReports() {
            try {
                const res = await fetch("/api/reports/uploaded-records?limit=500");
                if (!res.ok) throw new Error("Failed to fetch reports");
                const data = await res.json();
                setReports(data.reports || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Could not load reports");
            } finally {
                setLoading(false);
            }
        }
        void fetchReports();
    }, []);

    const formatDate = (iso: string | null) => {
        if (!iso) return "";
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return "";
        return d.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

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
        <main className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#1E3A8A] via-[#1e40af] to-[#0EA5A4] text-white pt-28 pb-20">
            {/* Lottie animated background */}
            <div className="absolute inset-0 z-0 flex items-center justify-center opacity-40 pointer-events-none">
                <iframe 
                    src="https://lottie.host/embed/e1f871db-2a07-4bc1-b2fe-00ce8e04fb70/wUnAkCWVrw.lottie" 
                    className="w-full h-full mix-blend-screen scale-[0.8] md:scale-[0.6] border-none"
                    style={{ background: 'transparent' }}
                    allow="autoplay"
                    title="Medical Shield Lottie Background"
                />
            </div>

            {/* Decorative background elements */}
            <div className="absolute inset-0 opacity-10 pointer-events-none z-0">
                <div className="absolute top-10 left-10 w-72 h-72 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,255,255,1) 0%, transparent 70%)" }}></div>
                <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,255,255,1) 0%, transparent 70%)" }}></div>
            </div>

            <section className="relative z-10 mx-auto max-w-5xl px-6">
                <div className="mb-10 space-y-3">
                    <h1 className="text-3xl font-bold tracking-tight sm:text-5xl text-white">
                        Reports
                    </h1>
                    <p className="text-sm text-white/80 sm:text-lg max-w-2xl">
                        Official PDF reports published by health officers. Browse by year.
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md px-6 py-5 text-sm text-white/90">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Loading reports…
                    </div>
                ) : error ? (
                    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 backdrop-blur-md px-6 py-5 text-sm text-rose-100">
                        {error}
                    </div>
                ) : reports.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 backdrop-blur-md px-6 py-16 text-center text-sm text-white/70">
                        <FileText className="h-10 w-10 mx-auto mb-4 opacity-50" />
                        No reports have been published yet.
                    </div>
                ) : (
                    <div className="space-y-12">
                        {grouped.map((group) => (
                            <div key={group.year} className="space-y-5">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-2xl font-bold tracking-tight text-white">
                                        {group.year}
                                    </h2>
                                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/10 text-white/80 border border-white/10">
                                        {group.items.length} report{group.items.length === 1 ? "" : "s"}
                                    </span>
                                    <div className="h-px flex-1 bg-white/20" />
                                </div>

                                <ul className="grid gap-4 sm:grid-cols-2">
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
                                                    className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition-all hover:border-white/30 hover:bg-white/10 hover:shadow-xl hover:shadow-black/20 backdrop-blur-md"
                                                >
                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 shadow-inner group-hover:bg-white/20 transition-colors">
                                                        <FileText className="h-6 w-6 text-white/90" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-base font-semibold text-white group-hover:text-blue-100 transition-colors">
                                                            {name}
                                                        </p>
                                                        <p className="text-xs text-white/60 mt-0.5">
                                                            Uploaded {formatDate(r.uploaded_at)}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs font-semibold text-white/90 underline-offset-4 group-hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                                                        View PDF
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
            </section>
        </main>
    );
}
