import { NextResponse } from "next/server";

const API_BASE =
    process.env.API_BASE_URL ||
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";

const API_KEY =
    process.env.API_SECRET_KEY ||
    process.env.SECRET_KEY ||
    process.env.INTERNAL_API_KEY ||
    process.env.NEXT_PUBLIC_SECRET_KEY ||
    "";

/**
 * Public GET — returns the list of diseases from the backend.
 * Calls the Python API server-side so the API key stays secret.
 * No user authentication required.
 */
export async function GET() {
    try {
        const response = await fetch(`${API_BASE}/diseases/list`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": API_KEY,
            },
            next: { revalidate: 60 }, // cache for 60 seconds
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { error: data?.detail || "Failed to fetch diseases" },
                { status: response.status }
            );
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to fetch diseases";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
