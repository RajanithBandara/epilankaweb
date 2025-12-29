import axios from "axios";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Validate required env vars
        if (!process.env.NEXT_PUBLIC_API_URL) {
            return NextResponse.json(
                { error: "Backend API URL not configured" },
                { status: 500 }
            );
        }

        if (!process.env.NEXT_PUBLIC_SECRET_KEY) {
            return NextResponse.json(
                { error: "API key not configured" },
                { status: 500 }
            );
        }

        // Get the token from the request headers
        const authHeader = req.headers.get('authorization');

        if (!authHeader) {
            return NextResponse.json(
                { error: "Authorization token missing" },
                { status: 401 }
            );
        }

        // Forward request to FastAPI with both API key and JWT token
        const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/user_reports/submit`,
            body,
            {
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": process.env.NEXT_PUBLIC_SECRET_KEY,
                    "Authorization": authHeader, // Forward JWT token
                },
            }
        );

        return NextResponse.json(response.data, { status: 200 });

    } catch (error) {
        console.error("User report submit error:", error);

        if (axios.isAxiosError(error)) {
            const errorData = error.response?.data;
            const status = error.response?.status || 500;

            // Log the full error for debugging
            console.error("Backend error details:", {
                status,
                data: errorData,
                headers: error.response?.headers,
            });

            return NextResponse.json(
                errorData || { error: "Backend error" },
                { status }
            );
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
