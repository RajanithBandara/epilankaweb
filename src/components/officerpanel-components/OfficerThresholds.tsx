"use client";

import { MouseEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    Calculator,
    CheckCircle2,
    Loader2,
    RefreshCw,
    Save,
    Search,
    Sigma,
    Undo2,
    X,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/* ── Types ──────────────────────────────────────────────────────────────── */

type District = {
    district_id: number;
    district_name: string;
    province_name: string;
};

type Disease = {
    disease_id: number;
    disease_name: string;
};

type ThresholdRow = {
    year: number;
    district_id: number;
    district_name: string;
    province_name: string;
    disease_id: number;
    disease_name: string;
    lower_threshold: number;
    upper_threshold: number;
    outbreak_threshold: number;
    week_count: number;
    calculated_at: string | null;
};

type YearsResponse = { count: number; years: number[] };
type ListResponse = { year: number; count: number; items: ThresholdRow[] };
type RecomputeResponse = {
    year: number;
    pairs_recomputed: number;
    rows_upserted: number;
    rows_inserted: number;
    rows_updated: number;
    rows_reclassified: number;
    data_source?: string;
    message?: string;
};

type RowKey = string; // `${disease_id}:${district_id}`

interface DraftValues {
    lower: string;
    upper: string;
    outbreak: string;
}

const rowKey = (r: { disease_id: number; district_id: number }): RowKey =>
    `${r.disease_id}:${r.district_id}`;

const currentYear = new Date().getFullYear();

/* ── Component ──────────────────────────────────────────────────────────── */

export default function OfficerThresholdsPage() {
    const [districts, setDistricts] = useState<District[]>([]);
    const [diseases, setDiseases] = useState<Disease[]>([]);
    const [metaLoading, setMetaLoading] = useState(true);

    const [years, setYears] = useState<number[]>([]);
    const [yearsLoading, setYearsLoading] = useState(true);

    const [year, setYear] = useState<string>(String(currentYear));
    const [diseaseId, setDiseaseId] = useState<string>("all");
    const [districtId, setDistrictId] = useState<string>("all");

    const [rows, setRows] = useState<ThresholdRow[]>([]);
    const [rowsLoading, setRowsLoading] = useState(false);

    const [drafts, setDrafts] = useState<Record<RowKey, DraftValues>>({});
    const [savingKey, setSavingKey] = useState<RowKey | null>(null);
    const [recomputing, setRecomputing] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [recomputeDialogOpen, setRecomputeDialogOpen] = useState(false);
    const [recomputeStartedAt, setRecomputeStartedAt] = useState<number | null>(null);
    const [recomputeElapsedMs, setRecomputeElapsedMs] = useState(0);

    /* ── Initial metadata + years ─────────────────────────────────────────── */

    useEffect(() => {
        let cancelled = false;
        async function loadMeta() {
            setMetaLoading(true);
            try {
                const res = await fetch("/api/officer/reports/metadata", { cache: "no-store" });
                const data = await res.json();
                if (!res.ok) throw new Error(data?.error || "Failed to load metadata");
                if (cancelled) return;
                setDistricts((data.districts || []) as District[]);
                setDiseases((data.diseases || []) as Disease[]);
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : "Failed to load metadata");
                }
            } finally {
                if (!cancelled) setMetaLoading(false);
            }
        }
        async function loadYears() {
            setYearsLoading(true);
            try {
                const res = await fetch("/api/officer/thresholds/years", { cache: "no-store" });
                const data = (await res.json()) as YearsResponse & { error?: string };
                if (!res.ok) throw new Error(data?.error || "Failed to load years");
                if (cancelled) return;
                const ys = data.years && data.years.length > 0 ? data.years : [currentYear];
                setYears(ys);
                if (!ys.includes(Number(year))) {
                    setYear(String(ys[0]));
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : "Failed to load years");
                    setYears([currentYear]);
                }
            } finally {
                if (!cancelled) setYearsLoading(false);
            }
        }
        void loadMeta();
        void loadYears();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ── Load thresholds when filters change ──────────────────────────────── */

    const fetchRows = useCallback(async () => {
        if (!year) return;
        setRowsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (diseaseId !== "all") params.set("disease_id", diseaseId);
            if (districtId !== "all") params.set("district_id", districtId);
            const qs = params.toString();
            const url = `/api/officer/thresholds/year/${year}${qs ? `?${qs}` : ""}`;
            const res = await fetch(url, { cache: "no-store" });
            const data = (await res.json()) as ListResponse & { error?: string };
            if (!res.ok) throw new Error(data?.error || "Failed to load thresholds");
            setRows(data.items || []);
            setDrafts({});
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load thresholds");
            setRows([]);
        } finally {
            setRowsLoading(false);
        }
    }, [year, diseaseId, districtId]);

    useEffect(() => {
        void fetchRows();
    }, [fetchRows]);

    /* ── Elapsed timer for the recompute overlay ──────────────────────────── */

    useEffect(() => {
        if (!recomputing || recomputeStartedAt === null) {
            setRecomputeElapsedMs(0);
            return;
        }
        setRecomputeElapsedMs(Date.now() - recomputeStartedAt);
        const id = window.setInterval(() => {
            setRecomputeElapsedMs(Date.now() - recomputeStartedAt);
        }, 250);
        return () => window.clearInterval(id);
    }, [recomputing, recomputeStartedAt]);

    /* ── Helpers ──────────────────────────────────────────────────────────── */

    const getDraft = (row: ThresholdRow): DraftValues => {
        const k = rowKey(row);
        return (
            drafts[k] ?? {
                lower: String(row.lower_threshold),
                upper: String(row.upper_threshold),
                outbreak: String(row.outbreak_threshold),
            }
        );
    };

    const isDirty = (row: ThresholdRow): boolean => {
        const d = drafts[rowKey(row)];
        if (!d) return false;
        return (
            d.lower !== String(row.lower_threshold) ||
            d.upper !== String(row.upper_threshold) ||
            d.outbreak !== String(row.outbreak_threshold)
        );
    };

    const setDraftField = (row: ThresholdRow, field: keyof DraftValues, value: string) => {
        const k = rowKey(row);
        setDrafts((prev) => {
            const current = prev[k] ?? {
                lower: String(row.lower_threshold),
                upper: String(row.upper_threshold),
                outbreak: String(row.outbreak_threshold),
            };
            return { ...prev, [k]: { ...current, [field]: value } };
        });
    };

    const resetDraft = (row: ThresholdRow) => {
        setDrafts((prev) => {
            const copy = { ...prev };
            delete copy[rowKey(row)];
            return copy;
        });
    };

    const parsePositiveInt = (value: string): number | null => {
        if (!value.trim()) return null;
        const n = Number(value);
        if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) return null;
        return n;
    };

    const saveRow = async (row: ThresholdRow) => {
        const draft = getDraft(row);
        const lower = parsePositiveInt(draft.lower);
        const upper = parsePositiveInt(draft.upper);
        const outbreak = parsePositiveInt(draft.outbreak);
        if (lower === null || upper === null || outbreak === null) {
            setError("All three thresholds must be non-negative integers.");
            return;
        }
        if (!(lower <= upper && upper <= outbreak)) {
            setError("Thresholds must satisfy lower ≤ upper ≤ outbreak.");
            return;
        }

        const k = rowKey(row);
        setSavingKey(k);
        setError(null);
        setSuccess(null);
        try {
            const res = await fetch("/api/officer/thresholds", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    year: row.year,
                    disease_id: row.disease_id,
                    district_id: row.district_id,
                    lower_threshold: lower,
                    upper_threshold: upper,
                    outbreak_threshold: outbreak,
                    reclassify: true,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Save failed");

            setRows((prev) =>
                prev.map((r) =>
                    rowKey(r) === k
                        ? {
                              ...r,
                              lower_threshold: lower,
                              upper_threshold: upper,
                              outbreak_threshold: outbreak,
                          }
                        : r
                )
            );
            resetDraft(row);
            setSuccess(
                `Updated ${row.disease_name} · ${row.district_name} — ${data.rows_updated} weekly row${data.rows_updated === 1 ? "" : "s"} touched, ${data.rows_reclassified} reclassified.`
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "Save failed");
        } finally {
            setSavingKey(null);
        }
    };

    const runRecompute = async () => {
        if (!year) return;
        setRecomputing(true);
        setRecomputeStartedAt(Date.now());
        setError(null);
        setSuccess(null);
        try {
            // Recompute always covers the whole year — every (disease × district)
            // pair — regardless of the disease/district filters currently shown
            // in the table. Filters only affect the view, not the computation.
            const body: Record<string, number | boolean> = {
                year: Number(year),
                reclassify: true,
            };
            const res = await fetch("/api/officer/thresholds/recompute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = (await res.json()) as RecomputeResponse & { error?: string };
            if (!res.ok) throw new Error(data?.error || "Recompute failed");

            if (data.pairs_recomputed === 0) {
                setError(
                    data.message ||
                        `No case-count data available for ${year}. Load historical or predicted reports first, then recompute.`
                );
            } else {
                const source = data.data_source ? ` from ${data.data_source}` : "";
                setSuccess(
                    `Recomputed ${year}${source} — ${data.pairs_recomputed} (disease × district) pair${data.pairs_recomputed === 1 ? "" : "s"}, ${data.rows_inserted} weekly rows inserted, ${data.rows_updated} updated.`
                );
            }
            await fetchRows();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Recompute failed");
        } finally {
            setRecomputing(false);
            setRecomputeStartedAt(null);
        }
    };

    const confirmRecompute = async (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        // Close the dialog first so the full-screen progress overlay can take
        // over uninterrupted.
        setRecomputeDialogOpen(false);
        await runRecompute();
    };

    /* ── Stats summary ────────────────────────────────────────────────────── */

    const summary = useMemo(() => {
        if (rows.length === 0) {
            return { pairs: 0, avgLower: 0, avgUpper: 0, avgOutbreak: 0 };
        }
        const sumL = rows.reduce((acc, r) => acc + r.lower_threshold, 0);
        const sumU = rows.reduce((acc, r) => acc + r.upper_threshold, 0);
        const sumO = rows.reduce((acc, r) => acc + r.outbreak_threshold, 0);
        return {
            pairs: rows.length,
            avgLower: Math.round(sumL / rows.length),
            avgUpper: Math.round(sumU / rows.length),
            avgOutbreak: Math.round(sumO / rows.length),
        };
    }, [rows]);

    const dirtyCount = Object.keys(drafts).filter((k) => {
        const r = rows.find((row) => rowKey(row) === k);
        return r ? isDirty(r) : false;
    }).length;

    /* ── Render ───────────────────────────────────────────────────────────── */

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-2">
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                        <Sigma className="h-5 w-5" />
                        Threshold Manager
                    </h1>
                    <p className="text-sm text-black/60 dark:text-white/60">
                        Edit per-year disease incidence thresholds (mean ± σ) for every district.
                        Updates apply to every weekly row in <code>risk_levels</code>.
                    </p>
                </div>
                <Button
                    onClick={() => setRecomputeDialogOpen(true)}
                    disabled={recomputing || rowsLoading || !year}
                    className="gap-2"
                >
                    {recomputing ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Recomputing…
                        </>
                    ) : (
                        <>
                            <Calculator className="h-4 w-4" /> Recompute whole year
                        </>
                    )}
                </Button>
            </div>

            {/* Filters */}
            <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black">
                <div className="mb-3">
                    <h2 className="text-sm font-semibold">Filters</h2>
                    <p className="text-xs text-black/60 dark:text-white/60">
                        Year is required. Disease and district are optional.
                    </p>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
                    <FilterField label="Year">
                        <Select value={year} onValueChange={setYear} disabled={yearsLoading}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map((y) => (
                                    <SelectItem key={y} value={String(y)}>
                                        {y}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FilterField>

                    <FilterField label="Disease">
                        <Select value={diseaseId} onValueChange={setDiseaseId} disabled={metaLoading}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="All diseases" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All diseases</SelectItem>
                                {diseases.map((d) => (
                                    <SelectItem key={d.disease_id} value={String(d.disease_id)}>
                                        {d.disease_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FilterField>

                    <FilterField label="District">
                        <Select value={districtId} onValueChange={setDistrictId} disabled={metaLoading}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="All districts" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All districts</SelectItem>
                                {districts.map((d) => (
                                    <SelectItem key={d.district_id} value={String(d.district_id)}>
                                        {d.district_name} — {d.province_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FilterField>

                    <Button
                        variant="outline"
                        onClick={() => void fetchRows()}
                        disabled={rowsLoading}
                        className="gap-2"
                    >
                        {rowsLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Search className="h-4 w-4" />
                        )}
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Status banners */}
            {error && (
                <Banner tone="error" onDismiss={() => setError(null)} icon={<AlertCircle className="h-4 w-4" />}>
                    {error}
                </Banner>
            )}
            {success && (
                <Banner tone="success" onDismiss={() => setSuccess(null)} icon={<CheckCircle2 className="h-4 w-4" />}>
                    {success}
                </Banner>
            )}
            <AlertDialog
                open={recomputeDialogOpen}
                onOpenChange={(open) => {
                    if (!open && !recomputing) {
                        setRecomputeDialogOpen(false);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Recompute whole year</AlertDialogTitle>
                        <AlertDialogDescription>
                            {year
                                ? `Recompute thresholds for every (disease × district) pair across all 52 weeks of ${year} using historical case counts and population. This overwrites edited values — disease and district filters are ignored.`
                                : "Recompute thresholds for every (disease × district) pair across the year using historical case counts and population. This overwrites edited values — disease and district filters are ignored."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={recomputing}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRecompute} disabled={recomputing}>
                            {recomputing ? "Recomputing..." : "Recompute whole year"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatTile label="(Disease × District) pairs" value={summary.pairs.toString()} />
                <StatTile label="Avg lower" value={summary.avgLower.toString()} />
                <StatTile label="Avg upper" value={summary.avgUpper.toString()} />
                <StatTile label="Avg outbreak" value={summary.avgOutbreak.toString()} />
            </div>

            {/* Table */}
            <div className="rounded-xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-black">
                <div className="flex items-center justify-between gap-3 border-b border-black/10 px-4 py-3 dark:border-white/10">
                    <div>
                        <h2 className="text-sm font-semibold">Thresholds for {year}</h2>
                        <p className="text-xs text-black/60 dark:text-white/60">
                            Values are integers in incidence-per-100k. A row applies to every weekly entry for that pair.
                        </p>
                    </div>
                    {dirtyCount > 0 && (
                        <span className="inline-flex shrink-0 items-center rounded-full border border-black/20 bg-black/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black/70 dark:border-white/20 dark:bg-white/5 dark:text-white/70">
                            {dirtyCount} unsaved
                        </span>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-black/10 bg-black/5 text-black/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
                            <tr>
                                <th className="p-4 font-medium">Disease</th>
                                <th className="p-4 font-medium">District</th>
                                <th className="p-4 font-medium">Province</th>
                                <th className="p-4 text-right font-medium">Lower</th>
                                <th className="p-4 text-right font-medium">Upper</th>
                                <th className="p-4 text-right font-medium">Outbreak</th>
                                <th className="p-4 text-right font-medium">Weeks</th>
                                <th className="p-4 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/10 dark:divide-white/10">
                            {rowsLoading ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center">
                                        <Loader2 className="mx-auto h-5 w-5 animate-spin text-black/40 dark:text-white/40" />
                                    </td>
                                </tr>
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-black/50 dark:text-white/50">
                                        No thresholds found for the selected filters.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((row) => {
                                    const draft = getDraft(row);
                                    const dirty = isDirty(row);
                                    const k = rowKey(row);
                                    const saving = savingKey === k;
                                    return (
                                        <tr key={k} className="hover:bg-black/5 dark:hover:bg-white/5">
                                            <td className="p-4 font-medium">{row.disease_name}</td>
                                            <td className="p-4">{row.district_name}</td>
                                            <td className="p-4 text-black/60 dark:text-white/60">
                                                {row.province_name}
                                            </td>
                                            <td className="p-2 text-right">
                                                <ThresholdInput
                                                    value={draft.lower}
                                                    onChange={(v) => setDraftField(row, "lower", v)}
                                                />
                                            </td>
                                            <td className="p-2 text-right">
                                                <ThresholdInput
                                                    value={draft.upper}
                                                    onChange={(v) => setDraftField(row, "upper", v)}
                                                />
                                            </td>
                                            <td className="p-2 text-right">
                                                <ThresholdInput
                                                    value={draft.outbreak}
                                                    onChange={(v) => setDraftField(row, "outbreak", v)}
                                                />
                                            </td>
                                            <td className="p-4 text-right tabular-nums text-black/60 dark:text-white/60">
                                                {row.week_count}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {dirty && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => resetDraft(row)}
                                                            aria-label="Discard"
                                                            title="Discard changes"
                                                        >
                                                            <Undo2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        disabled={!dirty || saving}
                                                        onClick={() => void saveRow(row)}
                                                        className="gap-1.5"
                                                    >
                                                        {saving ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <Save className="h-3.5 w-3.5" />
                                                        )}
                                                        Save
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Formula reference */}
            <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <RefreshCw className="h-4 w-4" />
                    How recompute works
                </div>
                <div className="space-y-2 text-sm text-black/70 dark:text-white/70">
                    <p>
                        Recompute always runs across the <strong>whole year</strong> — every
                        (disease × district) pair, all 52 weeks — regardless of the disease or
                        district filter you have selected above. It pulls every
                        <code> historicaldata </code> row for the year, divides each weekly
                        <code> case_count </code> by the district&apos;s population (from
                        <code> perdistrictpopulation</code>), and multiplies by 100&nbsp;000 to
                        get incidence-per-100k.
                    </p>
                    <p>
                        For each (disease × district) pair the mean and σ are taken across all
                        weeks of the year, and these are then written to every weekly row:
                    </p>
                    <ul className="ml-5 list-disc space-y-0.5 text-xs">
                        <li>
                            <code>lower_threshold = max(0, round(mean − σ))</code>
                        </li>
                        <li>
                            <code>upper_threshold = round(mean + σ)</code>
                        </li>
                        <li>
                            <code>outbreak_threshold = round(mean + 2σ)</code>
                        </li>
                    </ul>
                    <p className="text-black/60 dark:text-white/60">
                        Rows labeled with the ML scheme (Normal / Warning / High Risk / Below Expected)
                        are reclassified against the new thresholds. CERI-augmented rows
                        (low / moderate / high / critical) keep their labels.
                    </p>
                </div>
            </div>

            {/* Full-screen recompute progress overlay */}
            {recomputing && (
                <RecomputeOverlay year={year} elapsedMs={recomputeElapsedMs} />
            )}
        </div>
    );
}

/* ── Subcomponents ──────────────────────────────────────────────────────── */

function RecomputeOverlay({ year, elapsedMs }: { year: string; elapsedMs: number }) {
    const seconds = Math.floor(elapsedMs / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const elapsedLabel =
        mins > 0 ? `${mins}m ${secs.toString().padStart(2, "0")}s` : `${secs}s`;

    // Stage hints — synthetic since the backend doesn't stream progress.
    // Each stage is a believable phase the recompute is currently in.
    const stages = [
        { at: 0, label: "Pulling case counts from historicaldata + reports…" },
        { at: 4, label: "Joining with per-district population…" },
        { at: 8, label: "Computing per-pair mean and σ across all 52 weeks…" },
        { at: 14, label: "Upserting weekly rows into risk_levels…" },
        { at: 30, label: "Still upserting — large years take a moment…" },
        { at: 60, label: "Almost done — finalising and refreshing caches…" },
    ];
    const activeStage = stages.reduce(
        (acc, s) => (seconds >= s.at ? s.label : acc),
        stages[0].label
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm dark:bg-black/70">
            <div className="mx-4 w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-black">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 dark:border-white/10">
                        <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-base font-semibold">
                            Recomputing thresholds for {year}
                        </h3>
                        <p className="text-xs text-black/60 dark:text-white/60">
                            Don&apos;t close this tab — this can take a minute or two.
                        </p>
                    </div>
                </div>

                <div className="mt-5 space-y-3">
                    {/* Indeterminate progress bar — slides L → R while the job runs */}
                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                        <div className="absolute inset-y-0 left-0 w-1/3 animate-[indeterminate_1.6s_ease-in-out_infinite] rounded-full bg-black dark:bg-white" />
                    </div>

                    <div className="flex items-baseline justify-between text-xs">
                        <span className="text-black/70 dark:text-white/70">{activeStage}</span>
                        <span className="font-mono tabular-nums text-black/60 dark:text-white/60">
                            {elapsedLabel}
                        </span>
                    </div>
                </div>
            </div>

            {/* Keyframes for the indeterminate bar */}
            <style jsx>{`
                @keyframes indeterminate {
                    0% {
                        transform: translateX(-100%);
                    }
                    50% {
                        transform: translateX(150%);
                    }
                    100% {
                        transform: translateX(350%);
                    }
                }
            `}</style>
        </div>
    );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-black/60 dark:text-white/60">
                {label}
            </label>
            {children}
        </div>
    );
}

function ThresholdInput({
    value,
    onChange,
}: {
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <input
            type="number"
            min={0}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="ml-auto h-8 w-20 rounded-md border border-black/15 bg-transparent px-2 text-right text-sm text-black tabular-nums outline-none focus:border-black/40 dark:border-white/20 dark:text-white dark:focus:border-white/40"
        />
    );
}

function StatTile({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-black/10 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-black">
            <div className="text-[11px] font-bold uppercase tracking-wider text-black/50 dark:text-white/50">
                {label}
            </div>
            <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
        </div>
    );
}

function Banner({
    tone,
    icon,
    onDismiss,
    children,
}: {
    tone: "error" | "success";
    icon: React.ReactNode;
    onDismiss: () => void;
    children: React.ReactNode;
}) {
    const toneClass =
        tone === "error"
            ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
            : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300";
    return (
        <div className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${toneClass}`}>
            <div className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0">{icon}</span>
                <span>{children}</span>
            </div>
            <button onClick={onDismiss} className="opacity-60 hover:opacity-100" aria-label="Dismiss">
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
