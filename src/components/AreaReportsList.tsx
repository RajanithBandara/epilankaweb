'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { MapPin, FileText, TrendingUp, Calendar, AlertCircle, Loader2, X, ChevronDown, HeartPulse, ThumbsUp, Activity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { CheckCircle2 } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface LocalExtractedData {
    [key: string]: string | number | null | undefined;
    disease_name?: string | null;
}

interface Report {
    report_id: string;
    user_id: string;
    description: string;
    district_info?: {
        district_name: string;
        province_name: string;
    };
    extracted_data?: LocalExtractedData;
    week_number: number;
    year: number;
    status: string;
    score: number;
    has_voted: boolean;
    created_at: string;
}

interface ReportsResponse {
    total: number;
    limit: number;
    skip: number;
    district?: string;
    reports: Report[];
}

interface DistrictReportGroup {
    district_name: string;
    province_name: string;
    report_count: number;
    total_score: number;
    recent_reports: Report[];
}

// severity color helper removed (unused) to satisfy lint rules

const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'verified':
        case 'confirmed':
            return { color: '#15803d', bg: 'rgba(22,163,74,0.09)', border: 'rgba(22,163,74,0.28)' };
        case 'pending':
            return { color: 'var(--color-primary)', bg: 'rgba(30,58,138,0.09)', border: 'rgba(30,58,138,0.22)' };
        case 'investigating':
            return { color: '#7c3aed', bg: 'rgba(124,58,237,0.09)', border: 'rgba(124,58,237,0.25)' };
        default:
            return { color: 'var(--dash-text-muted)', bg: 'var(--dash-card-header-bg)', border: 'var(--dash-card-border)' };
    }
};

export default function AreaReportsList() {
    const [loading, setLoading] = useState(true);
    const [locationsLoading, setLocationsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [districtGroups, setDistrictGroups] = useState<Map<string, DistrictReportGroup>>(new Map());
    const [expandedDistricts, setExpandedDistricts] = useState<Set<string>>(new Set());
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    
    const { user } = useAuth();
    const [voteLoadingByReport, setVoteLoadingByReport] = useState<Record<string, boolean>>({});

    const toggleVoteReport = async (reportId: string, isCurrentlyVoted: boolean) => {
        if (!user) {
            setError("Please log in to vote.");
            return;
        }
        setVoteLoadingByReport((prev) => ({ ...prev, [reportId]: true }));
        try {
            await axios.post("/api/reports/vote", { report_id: reportId });
            
            // Update districtGroups
            setDistrictGroups(prevGroups => {
                const newGroups = new Map(prevGroups);
                for (const [districtName, group] of newGroups.entries()) {
                    let updated = false;
                    const newRecentReports = group.recent_reports.map(report => {
                        if (report.report_id === reportId) {
                            updated = true;
                            const currentScore = report.score ?? 0;
                            const newScore = isCurrentlyVoted ? Math.max(0, currentScore - 1) : currentScore + 1;
                            return {
                                ...report,
                                has_voted: !isCurrentlyVoted,
                                score: newScore
                            };
                        }
                        return report;
                    });
                    
                    if (updated) {
                        const scoreDiff = isCurrentlyVoted ? -1 : 1;
                        newGroups.set(districtName, {
                            ...group,
                            total_score: group.total_score + scoreDiff,
                            recent_reports: newRecentReports
                        });
                    }
                }
                return newGroups;
            });

            // Update selectedReport if it's the one we voted on
            setSelectedReport(prev => {
                if (prev && prev.report_id === reportId) {
                    const currentScore = prev.score ?? 0;
                    return {
                        ...prev,
                        has_voted: !isCurrentlyVoted,
                        score: isCurrentlyVoted ? Math.max(0, currentScore - 1) : currentScore + 1
                    };
                }
                return prev;
            });

        } catch (err) {
            console.error("Failed to update vote", err);
            setError("Failed to update vote. Please try again.");
        } finally {
            setVoteLoadingByReport((prev) => {
                const copy = { ...prev };
                delete copy[reportId];
                return copy;
            });
        }
    };
    

    // Filter states
    const [selectedLocation, setSelectedLocation] = useState<string>('all');
    const [locationOptions, setLocationOptions] = useState<Array<{district_id: number; district_name: string; province_name: string}>>([]);

    // Fetch available locations
    const fetchLocations = useCallback(async () => {
        try {
            setLocationsLoading(true);
            const res = await fetch('/api/map/locations');
            if (res.ok) {
                const data = await res.json();
                if (data?.locations) setLocationOptions(data.locations);
            }
        } catch (err) {
            console.error('Failed to fetch locations:', err);
        } finally {
            setLocationsLoading(false);
        }
    }, []);

    // Get sorted list of districts for dropdown
    const districtOptions = useMemo(() => {
        if (locationOptions.length > 0) {
            return [...locationOptions].sort((a, b) => a.district_name.localeCompare(b.district_name));
        }
        return Array.from(districtGroups.values())
            .map((group) => ({
                district_id: 0,
                district_name: group.district_name,
                province_name: group.province_name,
            }))
            .sort((a, b) => a.district_name.localeCompare(b.district_name));
    }, [districtGroups, locationOptions]);

    // Apply filters
    const filteredAndSortedGroups = useMemo(() => {
        let filtered = Array.from(districtGroups.values());
        if (selectedLocation !== 'all') {
            filtered = filtered.filter(group => group.district_name === selectedLocation);
        }
        filtered.sort((a, b) => b.report_count - a.report_count);
        return new Map(filtered.map(g => [g.district_name, g]));
    }, [districtGroups, selectedLocation]);

    const fetchReportsForAllAreas = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const params: { limit: number; skip: number; days: number; user_id?: string; district_name?: string; } = {
                limit: 100, skip: 0, days: 30,
                user_id: user?.$id || undefined,
            };
            if (selectedLocation !== 'all') params.district_name = selectedLocation;

            const qs = new URLSearchParams({
                limit: String(params.limit),
                skip: String(params.skip),
                days: String(params.days),
                ...(params.user_id ? { user_id: params.user_id } : {}),
                ...(params.district_name ? { district_name: params.district_name } : {}),
            });
            const res = await fetch(`/api/reports/location?${qs}`, { credentials: 'include' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const responseData: ReportsResponse = await res.json();

            if (!responseData.reports || responseData.reports.length === 0) {
                setDistrictGroups(new Map());
                setLoading(false);
                return;
            }

            const groupedByDistrict = new Map<string, DistrictReportGroup>();
            responseData.reports.forEach((report) => {
                        // Filter out reports with unknown disease
                                const extData = report.extracted_data as LocalExtractedData | undefined;
                        const diseaseName = (extData?.disease_name ?? '').toLowerCase();
                if (diseaseName.includes('unknown')) return;

                const districtName = report.district_info?.district_name || 'Unknown District';
                const provinceName = report.district_info?.province_name || 'Unknown Province';

                if (!groupedByDistrict.has(districtName)) {
                    groupedByDistrict.set(districtName, {
                        district_name: districtName,
                        province_name: provinceName,
                        report_count: 0,
                        total_score: 0,
                        recent_reports: [],
                    });
                }

                const group = groupedByDistrict.get(districtName)!;
                group.report_count += 1;
                group.total_score += report.score || 0;
                if (group.recent_reports.length < 5) {
                    group.recent_reports.push(report);
                }
            });

            const sortedGroups = new Map(
                [...groupedByDistrict.entries()].sort((a, b) => b[1].report_count - a[1].report_count)
            );
            setDistrictGroups(sortedGroups);
        } catch (err) {
            console.error('Failed to fetch reports:', err);
            setError('Failed to load reports. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [user?.$id, selectedLocation]);

    useEffect(() => { fetchLocations(); }, [fetchLocations]);
    useEffect(() => { fetchReportsForAllAreas(); }, [fetchReportsForAllAreas]);

    const toggleDistrictExpansion = (districtName: string) => {
        const newExpanded = new Set(expandedDistricts);
        if (newExpanded.has(districtName)) newExpanded.delete(districtName);
        else newExpanded.add(districtName);
        setExpandedDistricts(newExpanded);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-white/80" />
                    <p className="text-white/80 font-medium tracking-wide">Loading area reports...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="glass rounded-xl p-4 flex items-center gap-3 border-red-500/30 bg-red-500/10">
                <AlertCircle className="h-5 w-5 text-red-300 shrink-0" />
                <p className="text-red-200 font-medium">{error}</p>
            </div>
        );
    }

    if (districtGroups.size === 0) {
        return (
            <div className="glass-heavy rounded-2xl p-8 text-center border-white/20">
                <div className="glass mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
                    <FileText className="h-8 w-8 text-white/80" />
                </div>
                <p className="text-white/80 text-lg font-medium">No reports available for the selected period</p>
                <p className="text-white/50 text-sm mt-1">Try adjusting your filters.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with filters */}
            <div className="space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-4">
                    <div className="flex items-start gap-4">
                        <div className="glass flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-lg shadow-black/20">
                            <MapPin className="h-6 w-6 text-teal-300" />
                        </div>
                        <div className="pt-1">
                            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl drop-shadow-md">Reports by Area</h2>
                            <p className="mt-1 text-sm font-medium text-white/80">Browse reports grouped by location. Click any report to view full details.</p>
                        </div>
                    </div>
                    <div className="glass inline-flex items-center gap-2 self-start rounded-full px-4 py-2 text-sm font-semibold text-white">
                        <span className="h-2 w-2 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)]" />
                        {filteredAndSortedGroups.size} / {districtGroups.size} areas
                    </div>
                </div>

                {/* Location Dropdown */}
                <div className="flex-1">
                    <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                        <SelectTrigger className="w-full rounded-2xl px-5 py-4 text-base font-medium text-white shadow-xl shadow-black/20 transition-all focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-0 data-placeholder:text-white/60 bg-[#1e40af]/40 border border-white/20 hover:bg-[#1e40af]/60 backdrop-blur-md">
                            <SelectValue placeholder={locationsLoading ? 'Loading locations...' : 'Select a location'} />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1E3A8A] border-white/20 text-white shadow-2xl shadow-black/50">
                            <SelectItem value="all" className="cursor-pointer text-white/90 focus:bg-white/15 focus:text-white font-medium">All Locations</SelectItem>
                            {districtOptions.map((district) => (
                                <SelectItem
                                    key={district.district_id || district.district_name}
                                    value={district.district_name}
                                    className="cursor-pointer text-white/80 focus:bg-white/15 focus:text-white font-medium"
                                >
                                    {district.district_name} - {district.province_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Results */}
            {filteredAndSortedGroups.size === 0 ? (
                <div className="glass rounded-3xl p-10 text-center shadow-2xl shadow-black/10 border-white/20">
                    <AlertCircle className="h-7 w-7 text-white/70 mx-auto mb-3" />
                    <p className="text-lg font-medium text-white">No areas match your filters</p>
                    <p className="text-sm text-white/60 mt-1">Try adjusting the filter criteria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {Array.from(filteredAndSortedGroups.values()).map((group) => {
                        const isExpanded = expandedDistricts.has(group.district_name);
                        const avgScore = group.report_count > 0
                            ? Math.round(group.total_score / group.report_count * 10) / 10
                            : 0;

                        return (
                            <div
                                key={group.district_name}
                                className="glass-heavy group overflow-hidden rounded-3xl shadow-2xl shadow-black/10 transition-all hover:-translate-y-1 hover:shadow-black/20 border-white/20"
                                style={{ transition: "transform 0.22s ease, box-shadow 0.22s ease" }}
                            >
                                {/* District header — click to expand */}
                                <button
                                    onClick={() => toggleDistrictExpansion(group.district_name)}
                                    className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-white/10"
                                >
                                    <div className="flex items-center gap-4 flex-1 text-left">
                                        <div className="glass flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-lg shadow-teal-500/10">
                                            <MapPin className="h-5 w-5 text-teal-300 drop-shadow-md" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold tracking-tight text-white">{group.district_name}</h3>
                                            <p className="text-sm font-medium text-white/70">{group.province_name}</p>
                                        </div>
                                    </div>

                                    <div className="glass flex shrink-0 items-center gap-5 rounded-2xl px-4 py-2.5 shadow-sm border-white/20">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-white/70" />
                                            <span className="text-sm font-bold text-white">{group.report_count}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-white/70" />
                                            <span className="text-sm font-bold text-teal-300 drop-shadow-md">{avgScore}</span>
                                        </div>
                                        <ChevronDown
                                            className={`h-5 w-5 text-white/50 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                                        />
                                    </div>
                                </button>

                                {/* Expanded report list */}
                                <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                                    <div className="border-t border-white/10 p-4 space-y-2.5 bg-black/20 backdrop-blur-sm">
                                        {group.recent_reports.length > 0 ? (
                                            group.recent_reports.map((report) => {
                                                const dn = (report.extracted_data as LocalExtractedData)?.disease_name;
                                                const statusCfg = getStatusStyle(report.status);
                                                return (
                                                    <div
                                                        key={report.report_id}
                                                        className="glass group/card rounded-2xl p-4 cursor-pointer relative overflow-hidden"
                                                        style={{
                                                            borderColor: "rgba(255,255,255,0.12)",
                                                            transition: "transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease",
                                                        }}
                                                        onMouseEnter={e => {
                                                            const el = e.currentTarget as HTMLElement;
                                                            el.style.background = "rgba(255,255,255,0.18)";
                                                            el.style.transform = "translateY(-1px)";
                                                            el.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
                                                        }}
                                                        onMouseLeave={e => {
                                                            const el = e.currentTarget as HTMLElement;
                                                            el.style.background = "";
                                                            el.style.transform = "";
                                                            el.style.boxShadow = "";
                                                        }}
                                                        onClick={() => setSelectedReport(report)}
                                                    >
                                                        <div className="flex items-start justify-between gap-3 mb-1.5">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <Activity className="h-3.5 w-3.5 shrink-0 text-teal-300" />
                                                                <p className="text-sm font-semibold text-white truncate">
                                                                    {dn || "Health Report"}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <span className="text-[10px] font-bold rounded-full px-2 py-0.5 border"
                                                                    style={{ color: statusCfg.color, background: statusCfg.bg, borderColor: statusCfg.border }}>
                                                                    {report.status || "pending"}
                                                                </span>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (!voteLoadingByReport[report.report_id] && user?.$id) {
                                                                            toggleVoteReport(report.report_id, Boolean(report.has_voted));
                                                                        }
                                                                    }}
                                                                    disabled={Boolean(voteLoadingByReport[report.report_id]) || !user?.$id}
                                                                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-bold transition-colors ${report.has_voted ? 'border-teal-400/50 bg-teal-400/30 text-teal-50' : 'border-teal-400/20 bg-teal-400/10 text-teal-100/70 hover:bg-teal-400/20 hover:text-teal-100'}`}
                                                                >
                                                                    {voteLoadingByReport[report.report_id] ? (
                                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                    ) : report.has_voted ? (
                                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                                    ) : (
                                                                        <ThumbsUp className="h-3.5 w-3.5" />
                                                                    )}
                                                                    {report.score} <span className="text-[10px] opacity-80">pts</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <p className="text-xs font-medium leading-relaxed text-white/70 line-clamp-2 mb-2">
                                                            {report.description}
                                                        </p>
                                                        <div className="flex items-center justify-between text-xs text-white/50">
                                                            <div className="flex items-center gap-1.5">
                                                                <Calendar className="h-3.5 w-3.5" />
                                                                <span>Week {report.week_number}, {report.year}</span>
                                                            </div>
                                                            <span className="text-teal-300/70 text-[10px] font-medium group-hover/card:text-teal-300 transition-colors">
                                                                Click to view full report →
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p className="text-sm font-medium text-white/50 py-4 text-center">No recent reports to display</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Summary stats */}
            <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-4">
                {[
                    { label: "Total Areas", value: districtGroups.size, accent: false },
                    { label: "Filtered Areas", value: filteredAndSortedGroups.size, accent: false },
                    { label: "Total Reports", value: Array.from(districtGroups.values()).reduce((s, g) => s + g.report_count, 0), accent: false },
                    {
                        label: "Avg Score",
                        value: districtGroups.size > 0
                            ? (Math.round(Array.from(districtGroups.values()).reduce((s, g) => s + g.total_score, 0) / Array.from(districtGroups.values()).reduce((s, g) => s + g.report_count, 0) * 10) / 10)
                            : 0,
                        accent: true,
                    },
                ].map(stat => (
                    <div key={stat.label} className="glass rounded-3xl p-5 shadow-xl shadow-black/10 border-white/20">
                        <div className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1.5">{stat.label}</div>
                        <div className={`text-3xl font-bold tracking-tight drop-shadow-md ${stat.accent ? 'text-teal-300' : 'text-white'}`}>
                            {stat.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Report Detail Modal Drawer ─────────────────────────────── */}
            {selectedReport && (() => {
                const r = selectedReport;
                const dn = (r.extracted_data as LocalExtractedData)?.disease_name;
                const statusCfg = getStatusStyle(r.status);
                return (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                            style={{ animation: "fade-in 0.18s ease forwards" }}
                            onClick={() => setSelectedReport(null)}
                        />

                        {/* Slide-in drawer */}
                        <div
                            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md flex flex-col overflow-hidden"
                            style={{
                                background: "linear-gradient(180deg, #0f2460 0%, #0a1a3e 100%)",
                                borderLeft: "1px solid rgba(255,255,255,0.15)",
                                boxShadow: "-20px 0 60px rgba(0,0,0,0.4)",
                                animation: "slide-in-right 0.3s cubic-bezier(0.16,1,0.3,1) forwards",
                            }}
                        >
                            {/* Gradient top accent */}
                            <div className="h-1.5 w-full shrink-0"
                                style={{ background: "linear-gradient(90deg, #14b8a6, #3b82f6, #8b5cf6)" }} />

                            {/* Header */}
                            <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 border-b border-white/10 shrink-0">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl glass">
                                        <HeartPulse className="h-5 w-5 text-teal-300" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-base font-bold text-white truncate">
                                            {dn || "Health Report"}
                                        </h2>
                                        <p className="text-xs text-white/50">
                                            Week {r.week_number}, {r.year} · {r.district_info?.district_name}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedReport(null)}
                                    className="shrink-0 rounded-xl p-2 glass transition-all hover:bg-white/20"
                                    style={{ color: "rgba(255,255,255,0.7)" }}
                                    aria-label="Close"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Scrollable body */}
                            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                                {/* Badges */}
                                <div className="flex flex-wrap gap-2">
                                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border"
                                        style={{ color: statusCfg.color, background: statusCfg.bg, borderColor: statusCfg.border }}>
                                        {r.status || "pending"}
                                    </span>
                                    <button
                                        onClick={() => {
                                            if (!voteLoadingByReport[r.report_id] && user?.$id) {
                                                toggleVoteReport(r.report_id, Boolean(r.has_voted));
                                            }
                                        }}
                                        disabled={Boolean(voteLoadingByReport[r.report_id]) || !user?.$id}
                                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-colors border ${r.has_voted ? 'border-teal-400/50 bg-teal-400/30 text-teal-50' : 'border-teal-400/30 bg-teal-400/10 text-teal-100/80 hover:bg-teal-400/20 hover:text-teal-100'}`}
                                    >
                                        {voteLoadingByReport[r.report_id] ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : r.has_voted ? (
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                        ) : (
                                            <ThumbsUp className="h-3.5 w-3.5" />
                                        )}
                                        {r.score} pts
                                    </button>
                                </div>

                                {/* Full description */}
                                <div className="glass rounded-2xl p-4 border-white/10">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-2 flex items-center gap-1.5">
                                        <FileText className="h-3 w-3" /> Full Report
                                    </p>
                                    <p className="text-sm leading-relaxed text-white/85 whitespace-pre-wrap">
                                        {r.description}
                                    </p>
                                </div>

                                {/* AI data */}
                                {r.extracted_data && Object.keys(r.extracted_data).length > 0 && (
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">Extracted Data</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.entries(r.extracted_data).map(([k, v]) => (
                                                v !== null && v !== undefined ? (
                                                    <div key={k} className="glass rounded-xl px-3 py-2.5 border-white/10">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-0.5">
                                                            {k.replace(/_/g, ' ')}
                                                        </p>
                                                        <p className="text-sm font-semibold text-white">
                                                            {String(v)}
                                                        </p>
                                                    </div>
                                                ) : null
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Location */}
                                {r.district_info && (
                                    <div className="glass flex items-center gap-3 rounded-xl border-white/10 px-4 py-3">
                                        <MapPin className="h-4 w-4 text-teal-300 shrink-0" />
                                        <div>
                                            <p className="text-sm font-semibold text-white">{r.district_info.district_name}</p>
                                            <p className="text-xs text-white/60">{r.district_info.province_name}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                );
            })()}
        </div>
    );
}
