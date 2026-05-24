import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { makeOfficerApi } from "@/lib/officerApi";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
        if (value.trim().length > 0) params[key] = value;
    });

    try {
        const officerJwt = (await cookies()).get("appwrite-officer-jwt")?.value;
        const api = makeOfficerApi(officerJwt);
        const response = await api.get("/officer/reports/uploaded", { params });
        return NextResponse.json(response.data, { status: 200 });
    } catch (error: unknown) {
        const err = error as { response?: { data?: { detail?: string; error?: string }; status?: number }; message?: string };
        const message = err.response?.data?.detail || err.response?.data?.error || err.message || "Failed to fetch uploaded reports";
        return NextResponse.json({ error: message }, { status: err.response?.status ?? 500 });
    }
}
