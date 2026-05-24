"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, ExternalLink, Loader2 } from "lucide-react";

type UploadedReport = {
    id: string;
    file_url: string;
    filename?: string | null;
    year?: number | null;
    uploaded_at: string | null;
};

export default function UserReportsListPage() {
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
        <div className="mx-auto w-full max-w-4xl space-y-6">
            <header className="space-y-1">
                <h1
                    className="text-xl font-semibold tracking-tight sm:text-2xl"
                    style={{ color: "var(--dash-text-primary)" }}
                >
                    Reports
                </h1>
                <p className="text-sm" style={{ color: "var(--dash-text-secondary)" }}>
                    Official PDF reports shared by health officers.
                </p>
            </header>

            {loading ? (
                <div
                    className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm"
                    style={{
                        background: "var(--dash-card-bg)",
                        borderColor: "var(--dash-card-border)",
                        color: "var(--dash-text-secondary)",
                    }}
                >
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading reports…
                </div>
            ) : error ? (
                <div
                    className="rounded-xl border px-4 py-3 text-sm"
                    style={{
                        background: "rgba(220,38,38,0.06)",
                        borderColor: "rgba(220,38,38,0.25)",
                        color: "var(--color-danger)",
                    }}
                >
                    {error}
                </div>
            ) : reports.length === 0 ? (
                <div
                    className="rounded-xl border border-dashed px-4 py-10 text-center text-sm"
                    style={{
                        background: "var(--dash-card-bg)",
                        borderColor: "var(--dash-card-border)",
                        color: "var(--dash-text-muted)",
                    }}
                >
                    No reports have been published yet.
                </div>
            ) : (
                <div className="space-y-8">
                    {grouped.map((group) => (
                        <div key={group.year} className="space-y-3">
                            <div className="flex items-center gap-3">
                                <h2
                                    className="text-base font-semibold tracking-tight"
                                    style={{ color: "var(--dash-text-primary)" }}
                                >
                                    {group.year}
                                </h2>
                                <span className="text-xs" style={{ color: "var(--dash-text-muted)" }}>
                                    {group.items.length} report
                                    {group.items.length === 1 ? "" : "s"}
                                </span>
                                <div
                                    className="h-px flex-1"
                                    style={{ background: "var(--dash-card-border)" }}
                                />
                            </div>

                            <ul className="space-y-2.5">
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
                                                className="group flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors"
                                                style={{
                                                    background: "var(--dash-card-bg)",
                                                    borderColor: "var(--dash-card-border)",
                                                }}
                                            >
                                                <div
                                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
                                                    style={{
                                                        background: "var(--dash-card-header-bg)",
                                                        borderColor: "var(--dash-card-border)",
                                                        color: "var(--dash-text-secondary)",
                                                    }}
                                                >
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p
                                                        className="truncate text-sm font-semibold"
                                                        style={{ color: "var(--dash-text-primary)" }}
                                                    >
                                                        {name}
                                                    </p>
                                                    <p
                                                        className="truncate text-xs"
                                                        style={{ color: "var(--dash-text-muted)" }}
                                                    >
                                                        Uploaded {formatDate(r.uploaded_at)}
                                                    </p>
                                                </div>
                                                <span
                                                    className="inline-flex items-center gap-1 text-xs font-medium opacity-70 transition-opacity group-hover:opacity-100"
                                                    style={{ color: "var(--color-primary)" }}
                                                >
                                                    View
                                                    <ExternalLink className="h-3 w-3" />
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
    );
}
