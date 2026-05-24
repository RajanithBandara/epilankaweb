import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE =
    process.env.API_BASE_URL ||
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";

const API_KEY =
    process.env.API_SECRET_KEY ||
    process.env.SECRET_KEY ||
    process.env.NEXT_PUBLIC_SECRET_KEY ||
    "";

export async function POST(request: NextRequest) {
    try {
        const officerJwt = (await cookies()).get("appwrite-officer-jwt")?.value;
        const incomingForm = await request.formData();

        const forwardForm = new FormData();
        for (const [key, value] of incomingForm.entries()) {
            forwardForm.append(key, value as Blob | string);
        }

        const headers: Record<string, string> = {
            "x-api-key": API_KEY,
        };
        if (officerJwt) headers["Authorization"] = `Bearer ${officerJwt}`;

        const res = await fetch(`${API_BASE}/officer/reports/upload`, {
            method: "POST",
            headers,
            body: forwardForm,
        });

        const text = await res.text();
        let body: unknown;
        try {
            body = text ? JSON.parse(text) : {};
        } catch {
            body = { detail: text };
        }

        return NextResponse.json(body, { status: res.status });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to upload report";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
