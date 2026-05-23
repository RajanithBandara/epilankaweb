import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { makeOfficerApi } from "@/lib/officerApi";

/**
 * GET /api/officer/chart-builder/metadata
 * Returns diseases and distinct years from the database for the chart builder.
 */
export async function GET() {
    try {
        const officerJwt = (await cookies()).get("appwrite-officer-jwt")?.value;
        const api = makeOfficerApi(officerJwt);

        // Fetch diseases and metadata (which now includes years from DB)
        const metaRes = await api.get("/officer/reports/metadata");
        const meta = metaRes.data as {
            diseases?: { disease_id: number; disease_name: string }[];
            years?: number[];
            disease_years?: Record<string, number[]>;
        };

        const diseases = meta.diseases ?? [];
        const years = meta.years ?? [];
        const diseaseYears = meta.disease_years ?? {};

        return NextResponse.json({ diseases, years, disease_years: diseaseYears }, { status: 200 });
    } catch (error: unknown) {
        const err = error as {
            response?: { data?: { detail?: string; error?: string }; status?: number };
            message?: string;
        };
        const message =
            err.response?.data?.detail ||
            err.response?.data?.error ||
            err.message ||
            "Failed to fetch chart builder metadata";
        return NextResponse.json({ error: message }, { status: err.response?.status ?? 500 });
    }
}
