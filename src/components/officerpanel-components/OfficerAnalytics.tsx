"use client";

import { useEffect, useMemo, useState } from "react";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    BarChart,
    Bar,
} from "recharts";
import { RotateCw } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCachedData, setCachedData, getCacheAge } from "@/lib/analyticsCache";

type District = {
    district_id: number;
    district_name: string;
    province_name: string;
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

type ThresholdRow = {
    disease_id: number;
    disease_name: string;
    lower_threshold: number;
    upper_threshold: number;
    outbreak_threshold: number;
    risk_level: string;
    week_number: number;
    year: number;
};

type MetadataResponse = {
    districts: District[];
    diseases: Disease[];
};

type HistoryPatternRow = {
    year: number;
    week_number: number;
    case_count: number;
    disease_id: number;
    disease_name: string;
    district_id: number;
    district_name: string;
    province_name: string;
};

type WeekOption = {
    label: string;
    year: number;
    week: number;
};

const PAGE_LIMIT = 200;

function getISOWeekYearAndWeek(date: Date) {
    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = utcDate.getUTCDay() || 7;
    utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return {
        isoYear: utcDate.getUTCFullYear(),
        isoWeek: weekNo,
    };
}

export default function AnalyticsPage() {
    const [districts, setDistricts] = useState<District[]>([]);
    const [diseases, setDiseases] = useState<Disease[]>([]);
    const [reports, setReports] = useState<ReportRow[]>([]);
    const [thresholds, setThresholds] = useState<ThresholdRow[]>([]);
    const [historyRows, setHistoryRows] = useState<HistoryPatternRow[]>([]);

    const [selectedDistrictId, setSelectedDistrictId] = useState<string>("");
    const [selectedDiseaseId, setSelectedDiseaseId] = useState<string>("");
    const [selectedDownloadWeek, setSelectedDownloadWeek] = useState<string>("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cacheAge, setCacheAge] = useState<number | null>(null);

    const { isoYear: currentIsoYear, isoWeek: currentIsoWeek } = useMemo(
        () => getISOWeekYearAndWeek(new Date()),
        []
    );

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const cached = getCachedData("metadata") as MetadataResponse | null;
                if (cached) {
                    setDistricts(cached.districts || []);
                    setDiseases(cached.diseases || []);
                    return;
                }

                const response = await fetch("/api/officer/reports/metadata", { cache: "no-store" });
                const data = (await response.json()) as MetadataResponse & { error?: string };
                if (!response.ok) {
                    throw new Error(data.error || "Failed to load metadata");
                }

                setDistricts(data.districts || []);
                setDiseases(data.diseases || []);
                setCachedData("metadata", data);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Failed to load metadata");
            }
        };

        void fetchMetadata();
    }, []);

    useEffect(() => {
        const fetchAnalyticsData = async (bypassCache = false) => {
            setLoading(true);
            setError(null);
            try {
                // Determine if we should use cache (only when no filters applied)
                const useCache = !selectedDistrictId && !selectedDiseaseId && !bypassCache;
                const cacheKey = "analytics_full_data";

                if (useCache) {
                    const age = getCacheAge(cacheKey);
                    if (age < Infinity) {
                        const cached = getCachedData(cacheKey) as {
                            reports: ReportRow[];
                            thresholds: ThresholdRow[];
                            historyRows: HistoryPatternRow[];
                        } | null;
                        if (cached) {
                            setReports(cached.reports);
                            setThresholds(cached.thresholds);
                            setHistoryRows(cached.historyRows);
                            setCacheAge(age);
                            setLoading(false);
                            return;
                        }
                    }
                }

                const reportRows: ReportRow[] = [];
                let skip = 0;
                let total = 0;

                do {
                    const params = new URLSearchParams();
                    params.set("limit", String(PAGE_LIMIT));
                    params.set("skip", String(skip));
                    if (selectedDistrictId) params.set("district_id", selectedDistrictId);
                    if (selectedDiseaseId) params.set("disease_id", selectedDiseaseId);

                    const response = await fetch(`/api/officer/reports?${params.toString()}`, { cache: "no-store" });
                    const payload = (await response.json()) as {
                        reports?: ReportRow[];
                        total?: number;
                        error?: string;
                    };
                    if (!response.ok) {
                        throw new Error(payload.error || "Failed to load reports");
                    }

                    const batch = payload.reports || [];
                    reportRows.push(...batch);
                    total = payload.total || reportRows.length;
                    skip += PAGE_LIMIT;

                    if (batch.length < PAGE_LIMIT) {
                        break;
                    }
                } while (reportRows.length < total);

                setReports(reportRows);

                const thresholdParams = new URLSearchParams();
                if (selectedDistrictId) thresholdParams.set("district_id", selectedDistrictId);
                if (selectedDiseaseId) thresholdParams.set("disease_id", selectedDiseaseId);

                const thresholdResponse = await fetch(
                    `/api/officer/thresholds${thresholdParams.toString() ? `?${thresholdParams.toString()}` : ""}`,
                    { cache: "no-store" }
                );
                const thresholdPayload = (await thresholdResponse.json()) as {
                    thresholds?: ThresholdRow[];
                    error?: string;
                };

                if (!thresholdResponse.ok) {
                    throw new Error(thresholdPayload.error || "Failed to load thresholds");
                }

                setThresholds(thresholdPayload.thresholds || []);

                const historyParams = new URLSearchParams();
                historyParams.set("limit", "800");
                if (selectedDistrictId) historyParams.set("district_id", selectedDistrictId);
                if (selectedDiseaseId) historyParams.set("disease_id", selectedDiseaseId);

                const historyResponse = await fetch(
                    `/api/officer/reports/history-pattern?${historyParams.toString()}`,
                    { cache: "no-store" }
                );
                const historyPayload = (await historyResponse.json()) as {
                    records?: HistoryPatternRow[];
                    error?: string;
                };
                if (!historyResponse.ok) {
                    throw new Error(historyPayload.error || "Failed to load history patterns");
                }

                const historyData = historyPayload.records || [];
                setHistoryRows(historyData);

                // Cache full data only when no filters applied
                if (!selectedDistrictId && !selectedDiseaseId) {
                    setCachedData(cacheKey, {
                        reports: reportRows,
                        thresholds: thresholdPayload.thresholds || [],
                        historyRows: historyData,
                    });
                    setCacheAge(0);
                } else {
                    setCacheAge(null);
                }
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Failed to load analytics");
                setReports([]);
                setThresholds([]);
                setHistoryRows([]);
            } finally {
                setLoading(false);
            }
        };

        void fetchAnalyticsData();
    }, [selectedDistrictId, selectedDiseaseId]);

    const stats = useMemo(() => {
        const totalCase = reports.reduce((acc, row) => acc + (row.case_count || 0), 0);
        const totalActual = reports.reduce((acc, row) => acc + (row.actual_count ?? row.case_count ?? 0), 0);
        const totalDiff = totalActual - totalCase;
        const avgDiff = reports.length > 0 ? totalDiff / reports.length : 0;
        return {
            totalReports: reports.length,
            totalCase,
            totalActual,
            totalDiff,
            avgDiff,
        };
    }, [reports]);

    const weeklyComparisonData = useMemo(() => {
        const grouped = new Map<string, {
            period: string;
            order: number;
            case_count: number;
            actual_count: number;
            diff: number;
            accuracy_pct: number;
        }>();
        const currentOrder = currentIsoYear * 100 + currentIsoWeek;

        reports.forEach((row) => {
            const rowOrder = row.year * 100 + row.week_number;
            if (rowOrder > currentOrder) return;

            const week = String(row.week_number).padStart(2, "0");
            const key = `${row.year}-W${week}`;
            const order = rowOrder;
            const actual = row.actual_count ?? row.case_count ?? 0;

            if (!grouped.has(key)) {
                grouped.set(key, { period: key, order, case_count: 0, actual_count: 0, diff: 0, accuracy_pct: 0 });
            }

            const item = grouped.get(key)!;
            item.case_count += row.case_count || 0;
            item.actual_count += actual;
            item.diff = item.actual_count - item.case_count;
        });

        return Array.from(grouped.values())
            .map((item) => {
                const denominator = item.actual_count > 0 ? item.actual_count : item.case_count;
                const rawAccuracy = denominator > 0
                    ? 100 - (Math.abs(item.actual_count - item.case_count) / denominator) * 100
                    : 100;

                return {
                    ...item,
                    accuracy_pct: Math.max(0, Math.min(100, Number(rawAccuracy.toFixed(1)))),
                };
            })
            .sort((a, b) => a.order - b.order)
            .slice(-16);
    }, [reports, currentIsoYear, currentIsoWeek]);

    const thresholdChartData = useMemo(() => {
        const latestActualByDisease = new Map<number, { actual: number; order: number }>();

        reports.forEach((row) => {
            const currentOrder = row.year * 100 + row.week_number;
            const currentActual = row.actual_count ?? row.case_count ?? 0;
            const existing = latestActualByDisease.get(row.disease_id);
            if (!existing || currentOrder > existing.order) {
                latestActualByDisease.set(row.disease_id, { actual: currentActual, order: currentOrder });
            }
        });

        return thresholds.map((row) => ({
            disease: row.disease_name,
            lower: row.lower_threshold,
            upper: row.upper_threshold,
            outbreak: row.outbreak_threshold,
            latest_actual: latestActualByDisease.get(row.disease_id)?.actual ?? 0,
        }));
    }, [thresholds, reports]);

    const diseasePatternData = useMemo(() => {
        const currentOrder = currentIsoYear * 100 + currentIsoWeek;
        const totals = new Map<number, number>();
        historyRows.forEach((row) => {
            const rowOrder = row.year * 100 + row.week_number;
            if (rowOrder > currentOrder) return;

            const value = row.case_count || 0;
            totals.set(row.disease_id, (totals.get(row.disease_id) || 0) + value);
        });

        const topDiseaseIds = Array.from(totals.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([id]) => id);

        const grouped = new Map<string, Record<string, number | string>>();

        historyRows.forEach((row) => {
            const rowOrder = row.year * 100 + row.week_number;
            if (rowOrder > currentOrder) return;
            if (!topDiseaseIds.includes(row.disease_id)) return;

            const period = `${row.year}-W${String(row.week_number).padStart(2, "0")}`;
            if (!grouped.has(period)) {
                grouped.set(period, { period });
            }

            const item = grouped.get(period)!;
            const key = row.disease_name;
            const current = Number(item[key] || 0);
            item[key] = current + (row.case_count || 0);
        });

        return Array.from(grouped.values())
            .sort((a, b) => String(a.period).localeCompare(String(b.period)))
            .slice(-16);
    }, [historyRows, currentIsoYear, currentIsoWeek]);

    const patternKeys = useMemo(() => {
        if (!diseasePatternData.length) return [];
        return Object.keys(diseasePatternData[0]).filter((key) => key !== "period");
    }, [diseasePatternData]);

    const weekOptions = useMemo<WeekOption[]>(() => {
        const uniqueWeeks = new Map<string, WeekOption>();

        reports.forEach((row) => {
            const key = `${row.year}-W${String(row.week_number).padStart(2, "0")}`;
            if (!uniqueWeeks.has(key)) {
                uniqueWeeks.set(key, {
                    label: key,
                    year: row.year,
                    week: row.week_number,
                });
            }
        });

        return Array.from(uniqueWeeks.values()).sort((a, b) => {
            const orderA = a.year * 100 + a.week;
            const orderB = b.year * 100 + b.week;
            return orderB - orderA;
        });
    }, [reports]);

    useEffect(() => {
        if (weekOptions.length === 0) {
            setSelectedDownloadWeek("");
            return;
        }

        setSelectedDownloadWeek((current) => {
            if (current && weekOptions.some((w) => w.label === current)) {
                return current;
            }
            return weekOptions[0].label;
        });
    }, [weekOptions]);

    const handleDownloadWeeklyPdf = () => {
        if (!selectedDownloadWeek) {
            setError("Select a week before downloading the PDF.");
            return;
        }

        const selected = weekOptions.find((w) => w.label === selectedDownloadWeek);
        if (!selected) {
            setError("Selected week is not available.");
            return;
        }

        const weeklyRows = reports
            .filter((row) => row.year === selected.year && row.week_number === selected.week)
            .sort((a, b) => a.district_name.localeCompare(b.district_name) || a.disease_name.localeCompare(b.disease_name));

        if (weeklyRows.length === 0) {
            setError("No data found for the selected week.");
            return;
        }

        setError(null);

        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const title = `Officer Weekly Counts Report - ${selected.label}`;

        pdf.setTextColor(0, 0, 0);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.text(title, 14, 16);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.text("Black & White export", 14, 22);

        const totalPredicted = weeklyRows.reduce((sum, row) => sum + (row.case_count || 0), 0);
        const totalActual = weeklyRows.reduce((sum, row) => sum + (row.actual_count ?? 0), 0);

        pdf.text(`Total Predicted (Case Count): ${totalPredicted}`, 14, 28);
        pdf.text(`Total Actual Count: ${totalActual}`, 14, 33);

        autoTable(pdf, {
            startY: 38,
            head: [["District", "Province", "Disease", "Case Count", "Actual Count", "Difference"]],
            body: weeklyRows.map((row) => {
                const predicted = row.case_count || 0;
                const actual = row.actual_count ?? 0;
                return [
                    row.district_name,
                    row.province_name,
                    row.disease_name,
                    String(predicted),
                    String(actual),
                    String(actual - predicted),
                ];
            }),
            theme: "grid",
            styles: {
                font: "helvetica",
                textColor: [0, 0, 0],
                lineColor: [0, 0, 0],
                lineWidth: 0.1,
                fillColor: [255, 255, 255],
                fontSize: 8,
            },
            headStyles: {
                fillColor: [235, 235, 235],
                textColor: [0, 0, 0],
                fontStyle: "bold",
            },
            alternateRowStyles: {
                fillColor: [250, 250, 250],
            },
        });

        pdf.save(`weekly-counts-${selected.label}.pdf`);
    };

    const handleRefresh = async () => {
        // Get the fetchAnalyticsData function reference by re-triggering the useEffect
        // For now, we'll use a simpler approach: reset cache and reload
        setLoading(true);
        try {
            const reportRows: ReportRow[] = [];
            let skip = 0;
            let total = 0;

            do {
                const params = new URLSearchParams();
                params.set("limit", String(PAGE_LIMIT));
                params.set("skip", String(skip));
                if (selectedDistrictId) params.set("district_id", selectedDistrictId);
                if (selectedDiseaseId) params.set("disease_id", selectedDiseaseId);

                const response = await fetch(`/api/officer/reports?${params.toString()}`, { cache: "no-store" });
                const payload = (await response.json()) as {
                    reports?: ReportRow[];
                    total?: number;
                    error?: string;
                };
                if (!response.ok) {
                    throw new Error(payload.error || "Failed to load reports");
                }

                const batch = payload.reports || [];
                reportRows.push(...batch);
                total = payload.total || reportRows.length;
                skip += PAGE_LIMIT;

                if (batch.length < PAGE_LIMIT) {
                    break;
                }
            } while (reportRows.length < total);

            setReports(reportRows);

            const thresholdParams = new URLSearchParams();
            if (selectedDistrictId) thresholdParams.set("district_id", selectedDistrictId);
            if (selectedDiseaseId) thresholdParams.set("disease_id", selectedDiseaseId);

            const thresholdResponse = await fetch(
                `/api/officer/thresholds${thresholdParams.toString() ? `?${thresholdParams.toString()}` : ""}`,
                { cache: "no-store" }
            );
            const thresholdPayload = (await thresholdResponse.json()) as {
                thresholds?: ThresholdRow[];
                error?: string;
            };

            if (!thresholdResponse.ok) {
                throw new Error(thresholdPayload.error || "Failed to load thresholds");
            }

            setThresholds(thresholdPayload.thresholds || []);

            const historyParams = new URLSearchParams();
            historyParams.set("limit", "800");
            if (selectedDistrictId) historyParams.set("district_id", selectedDistrictId);
            if (selectedDiseaseId) historyParams.set("disease_id", selectedDiseaseId);

            const historyResponse = await fetch(
                `/api/officer/reports/history-pattern?${historyParams.toString()}`,
                { cache: "no-store" }
            );
            const historyPayload = (await historyResponse.json()) as {
                records?: HistoryPatternRow[];
                error?: string;
            };
            if (!historyResponse.ok) {
                throw new Error(historyPayload.error || "Failed to load history patterns");
            }

            const historyData = historyPayload.records || [];
            setHistoryRows(historyData);

            // Update cache if no filters
            if (!selectedDistrictId && !selectedDiseaseId) {
                setCachedData("analytics_full_data", {
                    reports: reportRows,
                    thresholds: thresholdPayload.thresholds || [],
                    historyRows: historyData,
                });
                setCacheAge(0);
            }

            setError(null);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to refresh analytics");
        } finally {
            setLoading(false);
        }
    };

    const formatCacheAge = (ms: number): string => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        if (minutes > 0) return `${minutes}m ago`;
        return `${seconds}s ago`;
    };

    return (
        <div className="space-y-4">
            <Card className="border-black/15 bg-white text-black dark:border-white/20 dark:bg-black dark:text-white">
                <CardHeader>
                    <CardTitle>Officer Analytics</CardTitle>
                    <CardDescription className="text-black/65 dark:text-white/65">
                        Compare actual vs case count, threshold positions, and weekly disease patterns.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className="text-sm">
                            District Filter
                            <Select
                                value={selectedDistrictId || "all"}
                                onValueChange={(value) => setSelectedDistrictId(value === "all" ? "" : value)}
                            >
                                <SelectTrigger className="mt-1 w-full">
                                    <SelectValue placeholder="All districts" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All districts</SelectItem>
                                    {districts.map((district) => (
                                        <SelectItem key={district.district_id} value={String(district.district_id)}>
                                            {district.district_name} ({district.province_name})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </label>

                        <label className="text-sm">
                            Disease Filter
                            <Select
                                value={selectedDiseaseId || "all"}
                                onValueChange={(value) => setSelectedDiseaseId(value === "all" ? "" : value)}
                            >
                                <SelectTrigger className="mt-1 w-full">
                                    <SelectValue placeholder="All diseases" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All diseases</SelectItem>
                                    {diseases.map((disease) => (
                                        <SelectItem key={disease.disease_id} value={String(disease.disease_id)}>
                                            {disease.disease_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </label>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="text-xs text-black/60 dark:text-white/60">
                            {cacheAge !== null && !selectedDistrictId && !selectedDiseaseId ? (
                                <span>Cached: {formatCacheAge(cacheAge)}</span>
                            ) : selectedDistrictId || selectedDiseaseId ? (
                                <span>Live data (filtered)</span>
                            ) : null}
                        </div>
                        {!selectedDistrictId && !selectedDiseaseId && (
                            <Button
                                onClick={handleRefresh}
                                disabled={loading}
                                size="sm"
                                variant="outline"
                                className="gap-2"
                            >
                                <RotateCw className="h-4 w-4" />
                                Refresh
                            </Button>
                        )}
                    </div>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
                        <label className="text-sm">
                            Download Week
                            <Select
                                value={selectedDownloadWeek || undefined}
                                onValueChange={setSelectedDownloadWeek}
                                disabled={weekOptions.length === 0}
                            >
                                <SelectTrigger className="mt-1 w-full">
                                    <SelectValue placeholder="No week data available" />
                                </SelectTrigger>
                                <SelectContent>
                                    {weekOptions.map((option) => (
                                        <SelectItem key={option.label} value={option.label}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </label>

                        <Button
                            onClick={handleDownloadWeeklyPdf}
                            variant="outline"
                            disabled={loading || weekOptions.length === 0}
                        >
                            Download B/W PDF
                        </Button>
                    </div>

                    {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
                    {loading && <p className="mt-3 text-sm text-black/60 dark:text-white/60">Loading analytics...</p>}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Card className="border-black/15 bg-white dark:border-white/20 dark:bg-black">
                    <CardContent className="p-4">
                        <p className="text-xs text-black/60 dark:text-white/60">Reports</p>
                        <p className="text-2xl font-semibold">{stats.totalReports}</p>
                    </CardContent>
                </Card>
                <Card className="border-black/15 bg-white dark:border-white/20 dark:bg-black">
                    <CardContent className="p-4">
                        <p className="text-xs text-black/60 dark:text-white/60">Total Case Count</p>
                        <p className="text-2xl font-semibold">{stats.totalCase}</p>
                    </CardContent>
                </Card>
                <Card className="border-black/15 bg-white dark:border-white/20 dark:bg-black">
                    <CardContent className="p-4">
                        <p className="text-xs text-black/60 dark:text-white/60">Total Actual Count</p>
                        <p className="text-2xl font-semibold">{stats.totalActual}</p>
                    </CardContent>
                </Card>
                <Card className="border-black/15 bg-white dark:border-white/20 dark:bg-black">
                    <CardContent className="p-4">
                        <p className="text-xs text-black/60 dark:text-white/60">Average Difference</p>
                        <p className="text-2xl font-semibold">{stats.avgDiff.toFixed(1)}</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-black/15 bg-white text-black dark:border-white/20 dark:bg-black dark:text-white">
                <CardHeader>
                    <CardTitle>Actual vs Case Count Trend</CardTitle>
                    <CardDescription className="text-black/65 dark:text-white/65">
                        Weekly comparison of reported case count and actual count up to the current week.
                    </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={weeklyComparisonData}>
                            <defs>
                                <linearGradient id="caseArea" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
                                </linearGradient>
                                <linearGradient id="actualArea" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Area type="monotone" dataKey="case_count" stroke="#2563eb" fill="url(#caseArea)" strokeWidth={2} name="Case Count" />
                            <Area type="monotone" dataKey="actual_count" stroke="#f97316" fill="url(#actualArea)" strokeWidth={2} name="Actual Count" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="border-black/15 bg-white text-black dark:border-white/20 dark:bg-black dark:text-white">
                <CardHeader>
                    <CardTitle>Difference Analytics</CardTitle>
                    <CardDescription className="text-black/65 dark:text-white/65">
                        Positive area means actual count is above case count (up to current week).
                    </CardDescription>
                </CardHeader>
                <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={weeklyComparisonData}>
                            <defs>
                                <linearGradient id="diffArea" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.06} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Area type="monotone" dataKey="diff" fill="url(#diffArea)" stroke="#22c55e" strokeWidth={2} name="Actual - Case Count" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="border-black/15 bg-white text-black dark:border-white/20 dark:bg-black dark:text-white">
                <CardHeader>
                    <CardTitle>Weekly Accuracy Percentage</CardTitle>
                    <CardDescription className="text-black/65 dark:text-white/65">
                        Accuracy for each week, where 100% means predicted and actual counts match exactly.
                    </CardDescription>
                </CardHeader>
                <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={weeklyComparisonData}>
                            <defs>
                                <linearGradient id="accuracyArea" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0ea5a4" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#0ea5a4" stopOpacity={0.08} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" />
                            <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                            <Tooltip formatter={(value) => [`${value}%`, "Accuracy"]} />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="accuracy_pct"
                                fill="url(#accuracyArea)"
                                stroke="#0ea5a4"
                                strokeWidth={2}
                                name="Accuracy %"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="border-black/15 bg-white text-black dark:border-white/20 dark:bg-black dark:text-white">
                <CardHeader>
                    <CardTitle>Threshold Analytics</CardTitle>
                    <CardDescription className="text-black/65 dark:text-white/65">
                        Compare latest actual values against configured lower, upper, and outbreak thresholds.
                    </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                    {thresholdChartData.length === 0 ? (
                        <p className="text-sm text-black/60 dark:text-white/60">No threshold data found for current filter.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={thresholdChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="disease" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="lower" fill="#60a5fa" name="Lower Threshold" />
                                <Bar dataKey="upper" fill="#fbbf24" name="Upper Threshold" />
                                <Bar dataKey="outbreak" fill="#ef4444" name="Outbreak Threshold" />
                                <Bar dataKey="latest_actual" fill="#22c55e" name="Latest Actual" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            <Card className="border-black/15 bg-white text-black dark:border-white/20 dark:bg-black dark:text-white">
                <CardHeader>
                    <CardTitle>Disease History Patterns</CardTitle>
                    <CardDescription className="text-black/65 dark:text-white/65">
                        Weekly patterns for top diseases by total actual count, up to current week.
                    </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                    {diseasePatternData.length === 0 || patternKeys.length === 0 ? (
                        <p className="text-sm text-black/60 dark:text-white/60">Not enough report history for pattern analytics.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={diseasePatternData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="period" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                {patternKeys.map((key, index) => (
                                    <Area
                                        key={key}
                                        type="monotone"
                                        dataKey={key}
                                        stroke={["#2563eb", "#f97316", "#22c55e", "#a855f7"][index % 4]}
                                        strokeWidth={2}
                                        fillOpacity={0.14}
                                        fill={["#2563eb", "#f97316", "#22c55e", "#a855f7"][index % 4]}
                                    />
                                ))}
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

