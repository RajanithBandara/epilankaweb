'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { FileText, Upload, Loader2, Trash2 } from 'lucide-react';

type UploadedReport = {
    id: string;
    file_url: string;
    filename?: string | null;
    year?: number | null;
    uploaded_at: string | null;
};

const currentYear = new Date().getFullYear();

export default function OfficerUploadReportsPage() {
    const [file, setFile] = useState<File | null>(null);
    const [year, setYear] = useState<string>(String(currentYear));
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [reports, setReports] = useState<UploadedReport[]>([]);
    const [loadingList, setLoadingList] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchReports = async () => {
        setLoadingList(true);
        try {
            const res = await fetch('/api/officer/reports/uploaded?limit=200');
            if (!res.ok) throw new Error('Failed to fetch uploaded reports');
            const data = await res.json();
            setReports(data.reports ?? []);
        } catch {
            setReports([]);
        } finally {
            setLoadingList(false);
        }
    };

    useEffect(() => {
        void fetchReports();
    }, []);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError('Please choose a PDF first.');
            return;
        }
        const parsedYear = Number(year);
        if (!Number.isInteger(parsedYear) || parsedYear < 1900 || parsedYear > 2100) {
            setError('Enter a valid year (e.g. 2026).');
            return;
        }

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('year', String(parsedYear));

        try {
            const res = await fetch('/api/officer/reports/upload', {
                method: 'POST',
                body: formData,
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.detail || errorData.error || 'Upload failed');
            }
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            await fetchReports();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (report: UploadedReport) => {
        const confirmed = window.confirm(
            `Delete this report?\n\n${report.filename || report.file_url}`
        );
        if (!confirmed) return;

        setDeletingId(report.id);
        try {
            const res = await fetch(
                `/api/officer/reports/uploaded/${encodeURIComponent(report.id)}`,
                { method: 'DELETE' }
            );
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.detail || 'Delete failed');
            }
            setReports((prev) => prev.filter((r) => r.id !== report.id));
        } catch (err) {
            window.alert(err instanceof Error ? err.message : 'Delete failed');
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (iso: string | null) => {
        if (!iso) return '';
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '';
        return d.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const grouped = useMemo(() => {
        const map = new Map<string, UploadedReport[]>();
        for (const r of reports) {
            const key = r.year != null ? String(r.year) : 'Unspecified';
            const bucket = map.get(key) ?? [];
            bucket.push(r);
            map.set(key, bucket);
        }
        const sortedKeys = Array.from(map.keys()).sort((a, b) => {
            if (a === 'Unspecified') return 1;
            if (b === 'Unspecified') return -1;
            return Number(b) - Number(a);
        });
        return sortedKeys.map((k) => ({ year: k, items: map.get(k)! }));
    }, [reports]);

    return (
        <section className="mx-auto max-w-3xl space-y-8 text-black dark:text-white">
            <header className="space-y-1">
                <h1 className="text-xl font-semibold tracking-tight">Upload Report</h1>
                <p className="text-sm text-black/60 dark:text-white/60">
                    Add a PDF report under a specific year. Existing reports are listed below.
                </p>
            </header>

            <form
                onSubmit={handleUpload}
                className="space-y-4 rounded-lg border border-black/15 bg-white p-5 dark:border-white/20 dark:bg-black"
            >
                <div className="space-y-1.5">
                    <label htmlFor="report-year" className="block text-sm font-medium">
                        Year
                    </label>
                    <input
                        id="report-year"
                        type="number"
                        inputMode="numeric"
                        min={1900}
                        max={2100}
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        disabled={uploading}
                        className="w-full rounded-md border border-black/25 bg-white px-3 py-2 text-sm outline-none focus:border-black disabled:opacity-50 dark:border-white/25 dark:bg-black dark:focus:border-white"
                    />
                </div>

                <label
                    htmlFor="report-file"
                    className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-black/30 px-6 py-10 text-center text-sm transition-colors hover:bg-black/[0.03] dark:border-white/30 dark:hover:bg-white/5"
                >
                    <Upload className="h-6 w-6" />
                    <span className="font-medium">
                        {file ? file.name : 'Click to choose a PDF'}
                    </span>
                    <span className="text-xs text-black/50 dark:text-white/50">PDF only</span>
                    <input
                        id="report-file"
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf,.pdf"
                        className="hidden"
                        disabled={uploading}
                        onChange={(e) => {
                            const next = e.target.files?.[0] ?? null;
                            setFile(next);
                            setError(null);
                        }}
                    />
                </label>

                {error && <p className="text-sm">{error}</p>}

                <button
                    type="submit"
                    disabled={!file || uploading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-black bg-black px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white dark:bg-white dark:text-black dark:hover:bg-white/85"
                >
                    {uploading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Uploading…
                        </>
                    ) : (
                        <>
                            <Upload className="h-4 w-4" />
                            Upload PDF
                        </>
                    )}
                </button>
            </form>

            <section className="space-y-4">
                <div className="flex items-end justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-black/70 dark:text-white/70">
                        Uploaded Reports
                    </h2>
                    {!loadingList && (
                        <span className="text-xs text-black/55 dark:text-white/55">
                            {reports.length} total
                        </span>
                    )}
                </div>

                {loadingList ? (
                    <div className="rounded-lg border border-black/15 bg-white p-4 text-sm text-black/60 dark:border-white/20 dark:bg-black dark:text-white/60">
                        Loading…
                    </div>
                ) : reports.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-black/20 bg-white p-6 text-center text-sm text-black/55 dark:border-white/25 dark:bg-black dark:text-white/55">
                        No reports uploaded yet.
                    </div>
                ) : (
                    <div className="space-y-6">
                        {grouped.map((group) => (
                            <div key={group.year} className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-sm font-semibold tracking-wide">
                                        {group.year}
                                    </h3>
                                    <span className="text-xs text-black/50 dark:text-white/50">
                                        {group.items.length} report
                                        {group.items.length === 1 ? '' : 's'}
                                    </span>
                                    <div className="h-px flex-1 bg-black/10 dark:bg-white/15" />
                                </div>

                                <ul className="divide-y divide-black/10 rounded-lg border border-black/15 bg-white dark:divide-white/15 dark:border-white/20 dark:bg-black">
                                    {group.items.map((r) => {
                                        const name =
                                            r.filename ||
                                            r.file_url.split('/').pop()?.split('?')[0] ||
                                            'Report.pdf';
                                        const deleting = deletingId === r.id;
                                        return (
                                            <li
                                                key={r.id}
                                                className="flex items-center gap-3 px-4 py-3"
                                            >
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-black/20 dark:border-white/30">
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium">
                                                        {name}
                                                    </p>
                                                    <p className="text-xs text-black/55 dark:text-white/55">
                                                        Uploaded {formatDate(r.uploaded_at)}
                                                    </p>
                                                </div>
                                                <a
                                                    href={r.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-medium underline"
                                                >
                                                    View
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => void handleDelete(r)}
                                                    disabled={deleting}
                                                    className="inline-flex items-center gap-1 rounded-md border border-black/25 px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-black hover:text-white disabled:opacity-50 dark:border-white/25 dark:hover:bg-white dark:hover:text-black"
                                                    aria-label="Delete report"
                                                >
                                                    {deleting ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    )}
                                                    Delete
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </section>
    );
}
