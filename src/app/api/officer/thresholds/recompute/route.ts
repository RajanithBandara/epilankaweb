import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { makeOfficerApi } from "@/lib/officerApi";

// Allow up to 10 minutes for this endpoint — bulk-recomputing every
// (district × disease × week) row across the year can take a while.
export const maxDuration = 600;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const officerJwt = (await cookies()).get("appwrite-officer-jwt")?.value;
        const api = makeOfficerApi(officerJwt);
        // No client-side timeout for this call (default is 15s on the shared
        // officer axios instance, which is way too short for a year-wide upsert).
        const response = await api.post("/officer/thresholds/recompute", body, {
            timeout: 0,
        });
        return NextResponse.json(response.data, { status: 200 });
    } catch (error: unknown) {
        const err = error as { response?: { data?: { detail?: string; error?: string }; status?: number }; message?: string };
        const message =
            err.response?.data?.detail ||
            err.response?.data?.error ||
            err.message ||
            "Failed to recompute thresholds";
        return NextResponse.json({ error: message }, { status: err.response?.status ?? 500 });
    }
}
