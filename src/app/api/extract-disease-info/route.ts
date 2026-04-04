import { NextResponse, NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
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

export async function POST(req: NextRequest) {
    try {
        const { description, user_id, latitude, longitude } = await req.json();
        const apiKey =
            process.env.API_SECRET_KEY ||
            process.env.NEXT_PUBLIC_SECRET_KEY ||
            process.env.NEXT_PUBLIC_API_KEY;

        if (!description || typeof description !== 'string') {
            return NextResponse.json(
                { error: "Description is required" },
                { status: 400 }
            );
        }

        const authHeader = req.headers.get("authorization");
        const headerToken = authHeader?.startsWith("Bearer ")
            ? authHeader.slice(7).trim()
            : undefined;
        const cookieToken = req.cookies.get("appwrite-jwt")?.value;
        const token = headerToken || cookieToken;
        if (!token) {
            return NextResponse.json(
                { error: "Authentication is required" },
                { status: 401 }
            );
        }

        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey) {
            return NextResponse.json(
                { error: "Gemini API key not configured" },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        const prompt = `You are a medical data extraction assistant. Analyze the following disease report and extract structured information.
                        
                        USER REPORT:
                        "${description}"
                        
                        Extract the following information and respond ONLY with a valid JSON object (no markdown, no extra text):
                        
                        {
                          "disease_name": "extracted disease name or null if not mentioned",
                          "disease_type": "viral, bacterial, parasitic, fungal, or unknown",
                          "cases_reported": number of cases mentioned or null if not specified,
                          "severity": "mild, moderate, severe, or unknown",
                          "symptoms": ["symptom1", "symptom2", ...] or empty array,
                          "time_period": "extracted time period (e.g., 'last week', '3 days ago') or null",
                          "age_group": "children, adults, elderly, mixed, or null",
                          "location_specifics": "specific location mentioned (village, school, hospital, etc.) or null",
                          "confidence": "high, medium, or low based on clarity of information"
                        }
                        
                        Rules:
                        - Use null for missing information, not "unknown" or "not mentioned"
                        - disease_type must be one of: viral, bacterial, parasitic, fungal, or unknown
                        - cases_reported must be a number or null
                        - severity must be: mild, moderate, severe, or unknown
                        - confidence must be: high, medium, or low
                        - Return ONLY the JSON object, no explanation`;

        // Call Gemini API
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean up the response
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        // Parse the JSON response
        let extractedData: ExtractedData;
        try {
            extractedData = JSON.parse(text);
        } catch {
            console.error("Failed to parse Gemini response:", text);
            extractedData = {
                disease_name: null,
                disease_type: "unknown",
                cases_reported: null,
                severity: "unknown",
                symptoms: [],
                time_period: null,
                age_group: null,
                location_specifics: null,
                confidence: "low"
            };
        }

        // Ensure all required fields exist with defaults
        const finalData: ExtractedData = {
            disease_name: extractedData.disease_name ?? null,
            disease_type: extractedData.disease_type ?? "unknown",
            cases_reported: extractedData.cases_reported ?? null,
            severity: extractedData.severity ?? "unknown",
            symptoms: Array.isArray(extractedData.symptoms) ? extractedData.symptoms : [],
            time_period: extractedData.time_period ?? null,
            age_group: extractedData.age_group ?? null,
            location_specifics: extractedData.location_specifics ?? null,
            confidence: extractedData.confidence ?? "low"
        };


        // Submit to FastAPI backend
        const fastApiUrl = process.env.NEXT_PUBLIC_API_URL;

        try {
            const parsedLatitude = Number(latitude);
            const parsedLongitude = Number(longitude);

            if (!user_id || Number.isNaN(parsedLatitude) || Number.isNaN(parsedLongitude)) {
                return NextResponse.json(
                    {
                        success: false,
                        extracted_data: finalData,
                        error: "Missing or invalid user ID, latitude, or longitude",
                    },
                    {status: 400}
                );
            }

            if (!fastApiUrl) {
                return NextResponse.json(
                    {
                        success: false,
                        extracted_data: finalData,
                        error: "Backend API URL is not configured",
                    },
                    { status: 500 }
                );
            }

            if (!apiKey) {
                return NextResponse.json(
                    {
                        success: false,
                        extracted_data: finalData,
                        error: "Backend API key is not configured",
                    },
                    { status: 500 }
                );
            }

            const submitResponse = await axios.post(
                `${fastApiUrl}/user_reports/submit`,
                {
                    user_id: user_id,
                    description: description.trim(),
                    latitude: parsedLatitude,
                    longitude: parsedLongitude,
                    extracted_data: finalData,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": apiKey,
                        "Authorization": `Bearer ${token}`,
                    },
                }
            );

            return NextResponse.json({
                success: true,
                extracted_data: finalData,
                submission: submitResponse.data,
            });

        } catch (submitError) {
            console.error("FastAPI submission error:", submitError);

            // Return extracted data even if submission fails
            return NextResponse.json({
                success: false,
                extracted_data: finalData,
                error: "Failed to submit to backend",
                details: axios.isAxiosError(submitError)
                    ? submitError.response?.data
                    : "Unknown error",
            }, { status: 500 });
        }

    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json(
            {
                error: "Failed to process disease report",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}
