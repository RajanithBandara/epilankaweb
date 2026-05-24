import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const API_KEY = process.env.API_SECRET_KEY || process.env.SECRET_KEY;

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const params: Record<string, string> = {};

    searchParams.forEach((value, key) => {
        if (value.trim().length > 0) {
            params[key] = value;
        }
    });

    if (!API_BASE) {
        return NextResponse.json(
            { error: "API base URL is not configured" },
            { status: 500 }
        );
    }

    if (!API_KEY) {
        return NextResponse.json(
            { error: "Backend API key is not configured" },
            { status: 500 }
        );
    }

    try {
        const response = await axios.get(
            `${API_BASE}/reports/uploaded-records`,
            {
                params,
                headers: {
                    "x-api-key": API_KEY,
                    "Content-Type": "application/json",
                },
                timeout: 10000,
            }
        );

        return NextResponse.json(response.data, { status: response.status });
    } catch (error) {
        console.error("Error fetching uploaded reports:", error);
        if (axios.isAxiosError(error)) {
            return NextResponse.json(
                {
                    error:
                        error.response?.data?.detail ||
                        error.response?.data?.error ||
                        "Failed to fetch uploaded reports",
                },
                { status: error.response?.status || 500 }
            );
        }
        return NextResponse.json(
            { error: "Failed to fetch uploaded reports" },
            { status: 500 }
        );
    }
}
