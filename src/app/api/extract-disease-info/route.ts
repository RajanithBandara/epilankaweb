import { NextResponse } from "next/server";
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

export async function POST(req: Request) {
    try {
        const { description, user_id, latitude, longitude, token } = await req.json();

        if (!description || typeof description !== 'string') {
            return NextResponse.json(
                { error: "Description is required" },
                { status: 400 }
            );
        }

        if (!token) {
            return NextResponse.json(
                { error: "Authentication is required" },
                { status: 401 }
            );
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "Gemini API key not configured" },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
        } catch (parseError) {
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
            if (!user_id || !latitude || !longitude) {
                return NextResponse.json(
                    {
                        success: false,
                        extracted_data: finalData,
                        error: "Missing user ID, latitude, or longitude",
                    },
                    {status: 400}
                );
            }
            const submitResponse = await axios.post(
                `${fastApiUrl}/user_reports/submit`,
                {
                    user_id: user_id,
                    description: description.trim(),
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude),
                    extracted_data: finalData,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": process.env.NEXT_PUBLIC_SECRET_KEY!,
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
