"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MapPin, Loader2, CheckCircle2, AlertCircle, Activity, Send, ThumbsUp } from "lucide-react";
import { useLocation } from "@/contexts/LocationContext";
import axios from "axios";

interface ExtractedData {
    disease_name: string | null;
    disease_type: string;
    cases_reported: number | null;
    severity: string;
    symptoms: string[];
    time_period: string | null;
    age_group: string | null;
    location_specifics: string | null;
    confidence: string;
}

interface SubmitResponse {
    status: string;
    message: string;
    data: {
        report_id: number;
        collection: string;
        nearest_location: {
            district_name: string;
            province_name: string;
            distance_km: number;
        };
        extracted_data: ExtractedData;
    };
}

interface HistoryReport {
    report_id: string;
    user_id: string | number;
    description: string;
    district_info: {
        district_name: string;
        province_name: string;
        distance_km: number;
    } | null;
    extracted_data: ExtractedData | null;
    status: string | null;
    created_at: string;
}

const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
        case "high":
        case "severe":
            return "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30";
        case "medium":
        case "moderate":
            return "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30";
        case "low":
        case "mild":
            return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30";
        default:
            return "bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30";
    }
};

const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
        case "verified":
        case "confirmed":
            return "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30";
        case "pending":
            return "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30";
        case "investigating":
            return "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30";
        default:
            return "bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30";
    }
};

export default function DiseaseReportPage() {
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
    const [submitResponse, setSubmitResponse] = useState<SubmitResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<HistoryReport[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const { locationData, isLoading: locationLoading, error: locationError } = useLocation();

    const analyzeAndSubmit = async () => {
        if (!description.trim()) {
            setError("Please enter a disease report.");
            return;
        }

        if (!locationData?.user_location) {
            setError("Location data not available. Please refresh the page.");
            return;
        }

        setLoading(true);
        setError(null);
        setExtractedData(null);
        setSubmitResponse(null);

        try {
            const getCookie = (name: string) => {
                const value = `; ${document.cookie}`;
                const parts = value.split(`; ${name}=`);
                if (parts.length === 2) return parts.pop()?.split(';').shift();
                return null;
            };

            const token = getCookie('token');
            const userId = localStorage.getItem('user_id');

            if (!token || !userId) {
                throw new Error("Authentication required. Please log in again.");
            }

            const response = await fetch("/api/extract-disease-info", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    description: description.trim(),
                    user_id: userId,
                    latitude: locationData.user_location.latitude,
                    longitude: locationData.user_location.longitude,
                    token: token,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to process report");
            }

            setExtractedData(data.extracted_data);
            if (data.submission) {
                setSubmitResponse(data.submission);
                await fetchReportHistory();
            }
            setDescription("");
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const fetchReportHistory = useCallback(async () => {
        if (!locationData?.nearest_area?.district_name) return;

        try {
            setHistoryLoading(true);
            const district = locationData.nearest_area.district_name;

            const response = await axios.get('/api/reports/location', {
                params: { district_name: district }
            });

            setHistory(response.data.reports || []);
        } catch (err) {
            console.error("History fetch error:", err);
            setHistory([]);
        } finally {
            setHistoryLoading(false);
        }
    }, [locationData?.nearest_area?.district_name]);

    useEffect(() => {
        if (locationData?.nearest_area?.district_name) {
            fetchReportHistory();
        }
    }, [locationData?.nearest_area?.district_name, fetchReportHistory]);

    const upvoteReport = async (reportId: string) => {
        try {
            const userId = localStorage.getItem('user_id');
            if (!userId) {
                setError("Please log in to vote");
                return;
            }

            if (!locationData?.nearest_area?.district_name) {
                setError("Location data not available");
                return;
            }

            await axios.post('/api/reports/upvote', {
                reportid: reportId,
                userid: userId,
                location: locationData.nearest_area.district_name
            });

            await fetchReportHistory();
        } catch (err) {
            console.error("Upvote error:", err);
            setError("User has already voted for this report");
        }
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-blue-950/30 dark:to-purple-950/30">
            {/* iOS-style Header */}
            <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-b border-white/20 shadow-lg shadow-black/5">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Health Reports</h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">AI-Powered Disease Tracking</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
                {/* Location Status - iOS Style */}
                {locationLoading ? (
                    <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border border-white/20 rounded-3xl p-4 shadow-lg shadow-black/5">
                        <div className="flex items-center gap-3">
                            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Locating...</span>
                        </div>
                    </div>
                ) : locationError ? (
                    <div className="backdrop-blur-xl bg-red-500/10 dark:bg-red-500/20 border border-red-500/20 rounded-3xl p-4 shadow-lg shadow-red-500/5">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                            <span className="text-sm font-medium text-red-700 dark:text-red-300">{locationError}</span>
                        </div>
                    </div>
                ) : locationData?.nearest_area ? (
                    <div className="backdrop-blur-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 border border-green-500/20 rounded-3xl p-4 shadow-lg shadow-green-500/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                                    {locationData.nearest_area.district_name}, {locationData.nearest_area.province_name}
                                </p>
                                <p className="text-xs text-green-700 dark:text-green-300">
                                    {locationData.nearest_area.distance.toFixed(2)} km from your location
                                </p>
                            </div>
                        </div>
                    </div>
                ) : null}

                {/* Main Input Card - Glass Morphism */}
                <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border border-white/20 rounded-3xl shadow-2xl shadow-black/10 overflow-hidden">
                    <div className="p-6 space-y-4">
                        {/* Input Area */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                Report Health Incident
                            </label>
                            <div className="relative">
                                <Textarea
                                    placeholder="Describe the disease symptoms, number of cases, affected age group, and when symptoms started..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={5}
                                    className="resize-none backdrop-blur-xl bg-white/80 dark:bg-slate-800/80 border-white/40 dark:border-slate-700/40 rounded-2xl text-base placeholder:text-slate-400 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-inner"
                                    disabled={loading || locationLoading}
                                />
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 pl-1">
                                Be specific with symptoms, location details, and timeline
                            </p>
                        </div>

                        {/* Submit Button - iOS Style */}
                        <Button
                            onClick={analyzeAndSubmit}
                            disabled={loading || locationLoading || !locationData}
                            className="w-full h-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 disabled:opacity-50 disabled:shadow-none"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-5 w-5" />
                                    Submit Report
                                </>
                            )}
                        </Button>

                        {/* Error Message */}
                        {error && (
                            <div className="backdrop-blur-xl bg-red-500/10 dark:bg-red-500/20 border border-red-500/20 rounded-2xl p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Success Message */}
                        {submitResponse && (
                            <div className="backdrop-blur-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 border border-green-500/20 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-green-900 dark:text-green-100">Report Submitted</p>
                                        <p className="text-xs text-green-700 dark:text-green-300">ID: #{submitResponse.data.report_id}</p>
                                    </div>
                                </div>
                                <div className="pl-13 grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <span className="text-green-700 dark:text-green-400 font-medium">Disease:</span>
                                        <p className="text-green-900 dark:text-green-200">{submitResponse.data.extracted_data.disease_name || "Unknown"}</p>
                                    </div>
                                    <div>
                                        <span className="text-green-700 dark:text-green-400 font-medium">Type:</span>
                                        <p className="text-green-900 dark:text-green-200">{submitResponse.data.extracted_data.disease_type}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Extracted Data Preview */}
                        {extractedData && !submitResponse && (
                            <div className="backdrop-blur-xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 border border-blue-500/20 rounded-2xl p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        <span className="font-semibold text-slate-900 dark:text-white">Analysis Complete</span>
                                    </div>
                                    <Badge className={`text-xs font-medium rounded-full px-3 py-1 ${extractedData.confidence === "high" ? "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30" : "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30"}`}>
                                        {extractedData.confidence} confidence
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="backdrop-blur-xl bg-white/50 dark:bg-slate-800/50 rounded-xl p-3 border border-white/40">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Disease</p>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{extractedData.disease_name || "Unknown"}</p>
                                    </div>
                                    <div className="backdrop-blur-xl bg-white/50 dark:bg-slate-800/50 rounded-xl p-3 border border-white/40">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Cases</p>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{extractedData.cases_reported || "N/A"}</p>
                                    </div>
                                    <div className="backdrop-blur-xl bg-white/50 dark:bg-slate-800/50 rounded-xl p-3 border border-white/40">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Type</p>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{extractedData.disease_type}</p>
                                    </div>
                                    <div className="backdrop-blur-xl bg-white/50 dark:bg-slate-800/50 rounded-xl p-3 border border-white/40">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Severity</p>
                                        <Badge className={`text-xs ${getSeverityColor(extractedData.severity)} rounded-full px-2 py-0.5`}>
                                            {extractedData.severity}
                                        </Badge>
                                    </div>
                                </div>

                                {extractedData.symptoms.length > 0 && (
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">Symptoms Detected</p>
                                        <div className="flex flex-wrap gap-2">
                                            {extractedData.symptoms.map((symptom, i) => (
                                                <span key={i} className="text-xs px-3 py-1 backdrop-blur-xl bg-white/60 dark:bg-slate-800/60 border border-white/40 rounded-full text-slate-700 dark:text-slate-300 font-medium">
                                                    {symptom}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Reports Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Recent Reports
                        </h2>
                        {locationData?.nearest_area && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                {locationData.nearest_area.district_name}
                            </span>
                        )}
                    </div>

                    {historyLoading ? (
                        <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border border-white/20 rounded-3xl p-6 shadow-lg">
                            <div className="flex items-center justify-center gap-3">
                                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                                <span className="text-sm text-slate-600 dark:text-slate-400">Loading reports...</span>
                            </div>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border border-white/20 rounded-3xl p-8 shadow-lg">
                            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                                No reports found for this area
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {history.map((report) => (
                                <div
                                    key={report.report_id}
                                    className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border border-white/20 rounded-3xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01]"
                                >
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                                                {report.extracted_data?.disease_name || "Unverified Report"}
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {new Date(report.created_at).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        <Badge className={`text-xs rounded-full px-3 py-1 ${getStatusColor(report.status)}`}>
                                            {report.status || "pending"}
                                        </Badge>
                                    </div>

                                    {/* Description */}
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                                        {report.description}
                                    </p>

                                    {/* Stats Grid */}
                                    {report.extracted_data && (
                                        <div className="grid grid-cols-3 gap-2 mb-3">
                                            <div className="backdrop-blur-xl bg-white/50 dark:bg-slate-800/50 rounded-xl p-2 border border-white/40">
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Cases</p>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    {report.extracted_data.cases_reported || "N/A"}
                                                </p>
                                            </div>
                                            <div className="backdrop-blur-xl bg-white/50 dark:bg-slate-800/50 rounded-xl p-2 border border-white/40">
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Type</p>
                                                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                                    {report.extracted_data.disease_type}
                                                </p>
                                            </div>
                                            <div className="backdrop-blur-xl bg-white/50 dark:bg-slate-800/50 rounded-xl p-2 border border-white/40">
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Severity</p>
                                                <Badge className={`text-xs ${getSeverityColor(report.extracted_data.severity)} rounded-full px-2 py-0.5 mt-1`}>
                                                    {report.extracted_data.severity}
                                                </Badge>
                                            </div>
                                        </div>
                                    )}

                                    {/* Vote Button */}
                                    <div className="mb-3">
                                        <Button
                                            type="button"
                                            onClick={() => upvoteReport(report.report_id)}
                                            className="w-full h-10 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm font-medium rounded-xl shadow-md hover:shadow-lg transition-all"
                                        >
                                            <ThumbsUp className="w-4 h-4 mr-2" />
                                            I have the same problem
                                        </Button>
                                    </div>

                                    {/* Location Footer */}
                                    {report.district_info && (
                                        <div className="flex items-center gap-2 pt-3 border-t border-white/20">
                                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                {report.district_info.district_name} · {report.district_info.distance_km.toFixed(1)} km away
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
