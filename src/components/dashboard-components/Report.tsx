"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useLocation } from "@/contexts/LocationContext";

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

export default function DiseaseReportPage() {
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
    const [submitResponse, setSubmitResponse] = useState<SubmitResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Get cached location data from context
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
            // Get authentication token and user ID
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

            // Call the API with all required data (extraction + submission combined)
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

            // Set the extracted data and submission response
            setExtractedData(data.extracted_data);
            if (data.submission) {
                setSubmitResponse(data.submission);
            }
            setDescription(""); // Clear form on success
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
            <Card className="w-full max-w-2xl border border-border shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-semibold tracking-tight">
                        🏥 Disease Report Analyzer
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        AI-powered disease report extraction and submission
                    </p>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Location Status */}
                    {locationLoading ? (
                        <Alert>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <AlertDescription>Fetching your location...</AlertDescription>
                        </Alert>
                    ) : locationError ? (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{locationError}</AlertDescription>
                        </Alert>
                    ) : locationData?.nearest_area ? (
                        <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                            <MapPin className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800 dark:text-green-200">
                                <strong>Location Ready:</strong> {locationData.nearest_area.district_name}, {locationData.nearest_area.province_name}
                                {" "}({locationData.nearest_area.distance.toFixed(2)} km away)
                            </AlertDescription>
                        </Alert>
                    ) : null}

                    {/* Report Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Disease Report Description
                        </label>
                        <Textarea
                            placeholder="Example: 5 children in our school have dengue fever with high fever and rashes since last Monday..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={6}
                            className="resize-none"
                            disabled={loading || locationLoading}
                        />
                    </div>

                    {/* Submit Button */}
                    <Button
                        onClick={analyzeAndSubmit}
                        disabled={loading || locationLoading || !locationData}
                        className="w-full"
                        size="lg"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing Report...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Analyze & Submit Report
                            </>
                        )}
                    </Button>

                    {/* Error Display */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Extracted Data Preview */}
                    {extractedData && !submitResponse && (
                        <div className="space-y-3 pt-4 border-t">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-medium">
                                    ✅ AI Extracted Data
                                </h3>
                                <Badge variant={extractedData.confidence === "high" ? "default" : "secondary"}>
                                    {extractedData.confidence} confidence
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="font-medium">Disease:</span>
                                    <p className="text-muted-foreground">{extractedData.disease_name || "Unknown"}</p>
                                </div>
                                <div>
                                    <span className="font-medium">Type:</span>
                                    <p className="text-muted-foreground">{extractedData.disease_type}</p>
                                </div>
                                <div>
                                    <span className="font-medium">Cases:</span>
                                    <p className="text-muted-foreground">{extractedData.cases_reported || "N/A"}</p>
                                </div>
                                <div>
                                    <span className="font-medium">Severity:</span>
                                    <p className="text-muted-foreground">{extractedData.severity}</p>
                                </div>
                                {extractedData.age_group && (
                                    <div>
                                        <span className="font-medium">Age Group:</span>
                                        <p className="text-muted-foreground">{extractedData.age_group}</p>
                                    </div>
                                )}
                                {extractedData.time_period && (
                                    <div>
                                        <span className="font-medium">Time Period:</span>
                                        <p className="text-muted-foreground">{extractedData.time_period}</p>
                                    </div>
                                )}
                            </div>

                            {extractedData.symptoms.length > 0 && (
                                <div>
                                    <span className="text-sm font-medium">Symptoms:</span>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {extractedData.symptoms.map((symptom, i) => (
                                            <Badge key={i} variant="outline">
                                                {symptom}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Submission Success */}
                    {submitResponse && (
                        <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription className="space-y-2">
                                <p className="font-semibold text-green-800 dark:text-green-200">
                                    ✅ Report Submitted Successfully!
                                </p>
                                <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                                    <p><strong>Report ID:</strong> #{submitResponse.data.report_id}</p>
                                    <p><strong>Disease:</strong> {submitResponse.data.extracted_data.disease_name || "Unknown"}</p>
                                    <p><strong>Type:</strong> {submitResponse.data.extracted_data.disease_type}</p>
                                    <p><strong>Location:</strong> {submitResponse.data.nearest_location.district_name}, {submitResponse.data.nearest_location.province_name}</p>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
