import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
const API_KEY = process.env.SECRET_KEY ?? "";

async function officerJwt(): Promise<string | null> {
    const jar = await cookies();
    return jar.get("appwrite-officer-jwt")?.value ?? null;
}

function backendHeaders(jwt: string): HeadersInit {
    return {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        Authorization: `Bearer ${jwt}`,
    };
}

export async function GET() {
    const jwt = await officerJwt();
    if (!jwt) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const res = await fetch(`${BACKEND}/articles/officer`, {
            headers: backendHeaders(jwt),
            cache: "no-store",
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to list articles";
        return NextResponse.json({ error: message }, { status: 502 });
    }
}

export async function POST(request: NextRequest) {
    const jwt = await officerJwt();
    if (!jwt) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    try {
        const res = await fetch(`${BACKEND}/articles/officer`, {
            method: "POST",
            headers: backendHeaders(jwt),
            body: JSON.stringify(body),
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create article";
        return NextResponse.json({ error: message }, { status: 502 });
    }
}
