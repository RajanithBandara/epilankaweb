import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { makeOfficerApi } from "@/lib/officerApi";

function parseIntParam(value: string | null, name: string) {
    if (value === null) return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
        throw new Error(`${name} must be an integer`);
    }
    return parsed;
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;

    let district_id: number | undefined;
    let disease_id: number | undefined;
    let week_number: number | undefined;
    let year: number | undefined;
    let limit: number | undefined;
    let skip: number | undefined;

    try {
        district_id = parseIntParam(searchParams.get("district_id"), "district_id");
        disease_id = parseIntParam(searchParams.get("disease_id"), "disease_id");
        week_number = parseIntParam(searchParams.get("week_number"), "week_number");
        year = parseIntParam(searchParams.get("year"), "year");
        limit = parseIntParam(searchParams.get("limit"), "limit");
        skip = parseIntParam(searchParams.get("skip"), "skip");
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Invalid query parameter" },
            { status: 400 }
        );
    }

    const params: Record<string, number> = {};
    if (district_id !== undefined) params.district_id = district_id;
    if (disease_id !== undefined) params.disease_id = disease_id;
    if (week_number !== undefined) params.week_number = week_number;
    if (year !== undefined) params.year = year;
    if (limit !== undefined) params.limit = limit;
    if (skip !== undefined) params.skip = skip;

    try {
        const officerJwt = (await cookies()).get("appwrite-officer-jwt")?.value;
        const api = makeOfficerApi(officerJwt);

        const response = await api.get("/officer/reports", { params });
        return NextResponse.json(response.data, { status: 200 });
    } catch (error: unknown) {
        const err = error as { response?: { data?: { detail?: string; error?: string }; status?: number }; message?: string };
        const message = err.response?.data?.detail || err.response?.data?.error || err.message || "Failed to fetch weekly records";
        return NextResponse.json({ error: message }, { status: err.response?.status ?? 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const officerJwt = (await cookies()).get("appwrite-officer-jwt")?.value;
        const api = makeOfficerApi(officerJwt);

        const response = await api.post("/officer/reports", body);

        return NextResponse.json(response.data, { status: response.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: { detail?: string; error?: string }; status?: number }; message?: string };
        const message = err.response?.data?.detail || err.response?.data?.error || err.message || "Failed to create weekly record";
        return NextResponse.json({ error: message }, { status: err.response?.status ?? 500 });
    }
}
