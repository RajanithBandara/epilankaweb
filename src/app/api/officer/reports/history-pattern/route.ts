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
    try {
        const searchParams = request.nextUrl.searchParams;

        const districtId = parseIntParam(searchParams.get("district_id"), "district_id");
        const diseaseId = parseIntParam(searchParams.get("disease_id"), "disease_id");
        const yearFrom = parseIntParam(searchParams.get("year_from"), "year_from");
        const yearTo = parseIntParam(searchParams.get("year_to"), "year_to");
        const limit = parseIntParam(searchParams.get("limit"), "limit");

        const params: Record<string, number> = {};
        if (districtId !== undefined) params.district_id = districtId;
        if (diseaseId !== undefined) params.disease_id = diseaseId;
        if (yearFrom !== undefined) params.year_from = yearFrom;
        if (yearTo !== undefined) params.year_to = yearTo;
        if (limit !== undefined) params.limit = limit;

        const officerJwt = (await cookies()).get("appwrite-officer-jwt")?.value;
        const api = makeOfficerApi(officerJwt);

        const response = await api.get("/officer/reports/history-pattern", { params });
        return NextResponse.json(response.data, { status: 200 });
    } catch (error: unknown) {
        const err = error as {
            response?: { data?: { detail?: string; error?: string }; status?: number };
            message?: string;
        };
        const message =
            err.response?.data?.detail ||
            err.response?.data?.error ||
            err.message ||
            "Failed to fetch historical pattern data";

        return NextResponse.json({ error: message }, { status: err.response?.status ?? 500 });
    }
}
