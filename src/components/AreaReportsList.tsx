'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { MapPin, FileText, TrendingUp, Calendar, AlertCircle, Loader2, Filter } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface ExtractedData {
    [key: string]: number;
}

interface Report {
    report_id: string;
    user_id: string;
    description: string;
    district_info?: {
        district_name: string;
        province_name: string;
    };
    extracted_data?: ExtractedData;
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

export default function AreaReportsList() {
    const [loading, setLoading] = useState(true);
    const [locationsLoading, setLocationsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [districtGroups, setDistrictGroups] = useState<Map<string, DistrictReportGroup>>(new Map());
    const [expandedDistricts, setExpandedDistricts] = useState<Set<string>>(new Set());
    const { user } = useAuth();

    // Filter states
    const [selectedLocation, setSelectedLocation] = useState<string>('all');
    const [locationOptions, setLocationOptions] = useState<Array<{district_id: number; district_name: string; province_name: string}>>([]);

    // Fetch available locations
    const fetchLocations = useCallback(async () => {
        try {
            setLocationsLoading(true);
            const response = await api.get('/map/locations');
            if (response.data?.locations) {
                setLocationOptions(response.data.locations);
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

    // Apply filters and sorting
    const filteredAndSortedGroups = useMemo(() => {
        let filtered = Array.from(districtGroups.values());

        // Filter by selected location
        if (selectedLocation !== 'all') {
            filtered = filtered.filter(
                group => group.district_name === selectedLocation
            );
        }

        // Default sort by report count
        filtered.sort((a, b) => b.report_count - a.report_count);

        return new Map(filtered.map(g => [g.district_name, g]));
    }, [districtGroups, selectedLocation]);

    const fetchReportsForAllAreas = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Build fetch parameters
            const params: {
                limit: number;
                skip: number;
                days: number;
                user_id?: string;
                district_name?: string;
            } = {
                limit: 100,
                skip: 0,
                days: 30,
                user_id: user?.$id || undefined,
            };

            // If a specific location is selected, fetch only that location
            if (selectedLocation !== 'all') {
                params.district_name = selectedLocation;
            }

            // Fetch reports
            const response = await api.get<ReportsResponse>('/reports/location', {
                params
            });

            if (!response.data.reports || response.data.reports.length === 0) {
                setDistrictGroups(new Map());
                setLoading(false);
                return;
            }

            // Group reports by district
            const groupedByDistrict = new Map<string, DistrictReportGroup>();

            response.data.reports.forEach((report) => {
                const districtName = report.district_info?.district_name || 'Unknown District';
                const provinceName = report.district_info?.province_name || 'Unknown Province';
                const key = districtName;

                if (!groupedByDistrict.has(key)) {
                    groupedByDistrict.set(key, {
                        district_name: districtName,
                        province_name: provinceName,
                        report_count: 0,
                        total_score: 0,
                        recent_reports: [],
                    });
                }

                const group = groupedByDistrict.get(key)!;
                group.report_count += 1;
                group.total_score += report.score || 0;
                if (group.recent_reports.length < 3) {
                    group.recent_reports.push(report);
                }
            });

            // Sort by report count (descending)
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

    // Fetch locations on mount
    useEffect(() => {
        fetchLocations();
    }, [fetchLocations]);

    // Fetch reports when location changes or on mount
    useEffect(() => {
        fetchReportsForAllAreas();
    }, [fetchReportsForAllAreas]);

    const toggleDistrictExpansion = (districtName: string) => {
        const newExpanded = new Set(expandedDistricts);
        if (newExpanded.has(districtName)) {
            newExpanded.delete(districtName);
        } else {
            newExpanded.add(districtName);
        }
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
                            <p className="mt-1 text-sm font-medium text-white/80">Browse reports grouped by location and refine the list using the controls below.</p>
                        </div>
                    </div>
                    <div className="glass inline-flex items-center gap-2 self-start rounded-full px-4 py-2 text-sm font-semibold text-white">
                        <span className="h-2 w-2 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)]" />
                        {filteredAndSortedGroups.size} / {districtGroups.size} areas
                    </div>
                </div>

                {/* Location Dropdown */}
                <div className="flex flex-col gap-3 lg:flex-row">
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
            </div>

            {/* Results */}
            {filteredAndSortedGroups.size === 0 ? (
                <div className="glass rounded-3xl p-10 text-center shadow-2xl shadow-black/10 border-white/20">
                    <div className="glass mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
                        <AlertCircle className="h-7 w-7 text-white/70" />
                    </div>
                    <p className="text-lg font-medium text-white">No areas match your filters</p>
                    <p className="text-sm text-white/60 mt-1">Try adjusting the score range or search criteria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {Array.from(filteredAndSortedGroups.values()).map((group) => (
                    <div
                        key={group.district_name}
                        className="glass-heavy group overflow-hidden rounded-3xl shadow-2xl shadow-black/10 transition-all hover:-translate-y-1 hover:border-white/30 border-white/20"
                    >
                        {/* Header */}
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
                                    <span className="text-sm font-bold text-white">
                                        {group.report_count}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-white/70" />
                                    <span className="text-sm font-bold text-teal-300 drop-shadow-md">
                                        {Math.round(group.total_score / group.report_count * 10) / 10}
                                    </span>
                                </div>
                                <svg
                                    className={`h-5 w-5 text-white/50 transition-transform duration-300 ${
                                        expandedDistricts.has(group.district_name) ? 'rotate-180' : ''
                                    }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                                    />
                                </svg>
                            </div>
                        </button>

                        {/* Expanded content */}
                        <div className={`transition-all duration-300 ease-in-out ${expandedDistricts.has(group.district_name) ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="border-t border-white/10 p-5 space-y-3 bg-black/20 backdrop-blur-sm">
                                {group.recent_reports.length > 0 ? (
                                    group.recent_reports.map((report) => (
                                        <div
                                            key={report.report_id}
                                            className="glass rounded-2xl p-4 shadow-lg shadow-black/5 transition-colors hover:bg-white/10 border-white/10"
                                        >
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <p className="flex-1 text-sm font-medium leading-relaxed text-white line-clamp-2 drop-shadow-sm">
                                                    {report.description}
                                                </p>
                                                <span className="shrink-0 inline-flex items-center rounded-lg border border-teal-400/30 bg-teal-400/20 px-2.5 py-1 text-xs font-bold text-teal-100 shadow-sm">
                                                    {report.score} <span className="ml-1 text-[10px] text-teal-200/80">SCORE</span>
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-3 text-xs font-medium text-white/60">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    <span>
                                                        Week {report.week_number}, {report.year}
                                                    </span>
                                                </div>
                                                {report.extracted_data && Object.keys(report.extracted_data).length > 0 && (
                                                    <span className="uppercase tracking-widest text-[10px] text-white/50">
                                                        {Object.keys(report.extracted_data).join(', ')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm font-medium text-white/50 py-3 text-center">No recent reports to display</p>
                                )}
                            </div>
                        </div>
                    </div>
                    ))}
                </div>
            )}

            {/* Summary stats */}
            <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-4">
                <div className="glass rounded-3xl p-5 shadow-xl shadow-black/10 border-white/20">
                    <div className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1.5">Total Areas</div>
                    <div className="text-3xl font-bold tracking-tight text-white drop-shadow-md">{districtGroups.size}</div>
                </div>
                <div className="glass rounded-3xl p-5 shadow-xl shadow-black/10 border-white/20">
                    <div className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1.5">Filtered Areas</div>
                    <div className="text-3xl font-bold tracking-tight text-white drop-shadow-md">{filteredAndSortedGroups.size}</div>
                </div>
                <div className="glass rounded-3xl p-5 shadow-xl shadow-black/10 border-white/20">
                    <div className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1.5">Total Reports</div>
                    <div className="text-3xl font-bold tracking-tight text-white drop-shadow-md">
                        {Array.from(districtGroups.values()).reduce((sum, g) => sum + g.report_count, 0)}
                    </div>
                </div>
                <div className="glass rounded-3xl p-5 shadow-xl shadow-black/10 border-white/20">
                    <div className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1.5">Avg Score</div>
                    <div className="text-3xl font-bold tracking-tight text-teal-300 drop-shadow-md">
                        {districtGroups.size > 0
                            ? (Math.round(
                                Array.from(districtGroups.values()).reduce((sum, g) => sum + g.total_score, 0) /
                                Array.from(districtGroups.values()).reduce((sum, g) => sum + g.report_count, 0) * 10
                            ) / 10)
                            : 0}
                    </div>
                </div>
            </div>
        </div>
    );
}
