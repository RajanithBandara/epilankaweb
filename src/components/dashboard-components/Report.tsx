"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MapPin, Loader2, CheckCircle2, AlertCircle, Send, ThumbsUp, Sparkles } from "lucide-react";
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
            return "bg-red-50 text-red-700 border-red-200";
        case "medium":
        case "moderate":
            return "bg-orange-50 text-orange-700 border-orange-200";
        case "low":
        case "mild":
            return "bg-yellow-50 text-yellow-700 border-yellow-200";
        default:
            return "bg-gray-50 text-gray-700 border-gray-200";
    }
};

const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
        case "verified":
        case "confirmed":
            return "bg-green-50 text-green-700 border-green-200";
        case "pending":
            return "bg-blue-50 text-blue-700 border-blue-200";
        case "investigating":
            return "bg-purple-50 text-purple-700 border-purple-200";
        default:
            return "bg-gray-50 text-gray-700 border-gray-200";
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
        <div className="min-h-0 h-auto w-full flex items-start justify-center bg-[#F8FAFC] px-4 sm:px-6 py-6 sm:py-8 md:py-12">
            <style jsx>{`
                @keyframes shine {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                @keyframes pulse-glow {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }
                @keyframes slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>

            <div className="w-full max-w-2xl space-y-6 animate-[slide-up_0.5s_ease-out] pb-4">
                {/* Header */}
                <div className="text-center mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-extrabold mb-2 text-[#1E3A8A]">
                        Health Incident Report
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-600">AI-powered community health monitoring</p>
                </div>

                {/* Location Status */}
                {locationLoading ? (
                    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white shadow-md p-3 sm:p-4 animate-pulse">
                        <Loader2 className="h-5 w-5 animate-spin text-[#1E3A8A]" />
                        <span className="text-xs sm:text-sm text-gray-700">Detecting location...</span>
                    </div>
                ) : locationError ? (
                    <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 shadow-md p-3 sm:p-4">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <span className="text-xs sm:text-sm text-red-700">{locationError}</span>
                    </div>
                ) : locationData?.nearest_area ? (
                    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white shadow-md hover:shadow-lg p-3 sm:p-4 transition-all duration-300">
                        <MapPin className="h-5 w-5 text-[#1E3A8A]" />
                        <div className="flex-1 text-xs sm:text-sm">
                            <span className="font-semibold text-gray-800">{locationData.nearest_area.district_name}</span>
                            <span className="text-gray-600">, {locationData.nearest_area.province_name}</span>
                        </div>
                    </div>
                ) : null}

                {/* Main Report Card */}
                <div className="relative rounded-2xl border border-gray-200 bg-white shadow-xl p-5 sm:p-6 md:p-8 overflow-hidden group">
                    {/* Animated shining border effect */}
                    <div
                        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{
                            background: 'linear-gradient(90deg, transparent, rgba(30, 58, 138, 0.15), transparent)',
                            animation: 'shine 3s ease-in-out infinite'
                        }}
                    />

                    {/* Corner glow effect */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#1E3A8A]/5 rounded-full blur-3xl animate-[pulse-glow_4s_ease-in-out_infinite]" />
                    <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#0EA5A4]/5 rounded-full blur-3xl animate-[pulse-glow_5s_ease-in-out_infinite]" />

                    <div className="relative space-y-5 sm:space-y-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-[#1E3A8A]" />
                                <label className="block text-sm font-medium text-gray-800">Report Health Incident</label>
                            </div>
                            <Textarea
                                placeholder="Describe symptoms, number of cases, affected age group, and timeline..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={5}
                                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 text-gray-800 placeholder:text-gray-500 resize-none transition-all duration-300"
                                disabled={loading || locationLoading}
                            />
                            <p className="text-xs text-gray-500">
                                Be specific with symptoms, location, and timeline for accurate analysis
                            </p>
                        </div>

                        <Button
                            onClick={analyzeAndSubmit}
                            disabled={loading || locationLoading || !locationData}
                            className="w-full bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition disabled:opacity-60"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Analyzing with AI...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-5 w-5" />
                                    Submit Report
                                </>
                            )}
                        </Button>

                        {/* Error */}
                        {error && (
                            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm shadow-md animate-[slide-up_0.3s_ease-out]">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            </div>
                        )}

                        {/* Success */}
                        {submitResponse && (
                            <div className="space-y-4 rounded-xl border border-green-200 bg-green-50 shadow-md p-4 sm:p-5 animate-[slide-up_0.3s_ease-out]">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                                    <div>
                                        <p className="font-semibold text-sm sm:text-base text-green-800">Report Submitted Successfully</p>
                                        <p className="text-xs text-green-600">ID: #{submitResponse.data.report_id}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="rounded-lg bg-white border border-gray-200 shadow-sm p-3">
                                        <span className="text-xs text-gray-600">Disease</span>
                                        <p className="font-semibold text-gray-800 text-sm mt-1">{submitResponse.data.extracted_data.disease_name || "Unknown"}</p>
                                    </div>
                                    <div className="rounded-lg bg-white border border-gray-200 shadow-sm p-3">
                                        <span className="text-xs text-gray-600">Type</span>
                                        <p className="font-semibold text-gray-800 text-sm mt-1">{submitResponse.data.extracted_data.disease_type}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Analysis Preview */}
                        {extractedData && !submitResponse && (
                            <div className="space-y-4 rounded-xl border border-gray-200 bg-white shadow-md p-4 sm:p-5 animate-[slide-up_0.3s_ease-out]">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-[#1E3A8A]" />
                                        <span className="text-sm font-semibold text-gray-800">Analysis Complete</span>
                                    </div>
                                    <Badge className="bg-gray-100 text-gray-700 border-gray-300 text-[11px] sm:text-xs">
                                        {extractedData.confidence} confidence
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="rounded-lg bg-gray-50 border border-gray-200 shadow-sm p-3">
                                        <p className="text-xs text-gray-600">Disease</p>
                                        <p className="text-sm font-semibold text-gray-800 mt-1">{extractedData.disease_name || "Unknown"}</p>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 border border-gray-200 shadow-sm p-3">
                                        <p className="text-xs text-gray-600">Cases</p>
                                        <p className="text-sm font-semibold text-gray-800 mt-1">{extractedData.cases_reported || "N/A"}</p>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 border border-gray-200 shadow-sm p-3">
                                        <p className="text-xs text-gray-600">Type</p>
                                        <p className="text-sm font-semibold text-gray-800 mt-1">{extractedData.disease_type}</p>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 border border-gray-200 shadow-sm p-3">
                                        <p className="text-xs text-gray-600">Severity</p>
                                        <Badge className={`text-[11px] sm:text-xs mt-1 ${getSeverityColor(extractedData.severity)}`}>
                                            {extractedData.severity}
                                        </Badge>
                                    </div>
                                </div>

                                {extractedData.symptoms.length > 0 && (
                                    <div>
                                        <p className="text-xs text-gray-600 mb-2">Detected Symptoms</p>
                                        <div className="flex flex-wrap gap-2">
                                            {extractedData.symptoms.map((symptom, i) => (
                                                <Badge key={i} className="bg-gray-100 text-gray-700 border-gray-300 text-[11px] sm:text-xs">
                                                    {symptom}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Reports Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold text-[#1E3A8A]">
                            Recent Reports
                        </h2>
                        {locationData?.nearest_area && (
                            <span className="text-sm text-gray-600">
                                {locationData.nearest_area.district_name}
                            </span>
                        )}
                    </div>

                    {historyLoading ? (
                        <div className="flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white shadow-md p-8">
                            <Loader2 className="h-5 w-5 animate-spin text-[#1E3A8A]" />
                            <span className="text-sm text-gray-700">Loading reports...</span>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="rounded-xl border border-gray-200 bg-white shadow-md p-10 text-center">
                            <p className="text-sm text-gray-500">No reports found for this area</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.map((report, index) => (
                                <div
                                    key={report.report_id}
                                    className="rounded-xl border border-gray-200 bg-white shadow-md hover:shadow-xl p-5 space-y-4 transition-all duration-300 hover:scale-[1.01] cursor-pointer group"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-800 truncate group-hover:text-[#1E3A8A] transition-colors">
                                                {report.extracted_data?.disease_name || "Unverified Report"}
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(report.created_at).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        <Badge className={`text-xs shrink-0 ${getStatusColor(report.status)}`}>
                                            {report.status || "pending"}
                                        </Badge>
                                    </div>

                                    {/* Description */}
                                    <p className="text-sm text-gray-600 line-clamp-2">
                                        {report.description}
                                    </p>

                                    {/* Stats */}
                                    {report.extracted_data && (
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="rounded-lg bg-gray-50 border border-gray-200 shadow-sm p-2">
                                                <p className="text-xs text-gray-600">Cases</p>
                                                <p className="text-sm font-semibold text-gray-800 mt-1">
                                                    {report.extracted_data.cases_reported || "N/A"}
                                                </p>
                                            </div>
                                            <div className="rounded-lg bg-gray-50 border border-gray-200 shadow-sm p-2">
                                                <p className="text-xs text-gray-600">Type</p>
                                                <p className="text-xs font-semibold text-gray-800 truncate mt-1">
                                                    {report.extracted_data.disease_type}
                                                </p>
                                            </div>
                                            <div className="rounded-lg bg-gray-50 border border-gray-200 shadow-sm p-2">
                                                <p className="text-xs text-gray-600">Severity</p>
                                                <Badge className={`text-xs mt-1 ${getSeverityColor(report.extracted_data.severity)}`}>
                                                    {report.extracted_data.severity}
                                                </Badge>
                                            </div>
                                        </div>
                                    )}

                                    {/* Vote Button */}
                                    <Button
                                        onClick={() => upvoteReport(report.report_id)}
                                        className="w-full bg-gray-100 hover:bg-blue-50 border border-gray-300 hover:border-[#1E3A8A]/50 text-gray-800 hover:text-[#1E3A8A] shadow-sm hover:shadow-md transition-all duration-300"
                                        size="sm"
                                    >
                                        <ThumbsUp className="mr-2 h-3.5 w-3.5" />
                                        I have the same problem
                                    </Button>

                                    {/* Location */}
                                    {report.district_info && (
                                        <div className="flex items-center gap-2 pt-3 border-t border-gray-200 text-xs text-gray-600">
                                            <MapPin className="h-3.5 w-3.5" />
                                            <span>
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


