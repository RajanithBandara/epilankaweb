import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { makeOfficerApi } from "@/lib/officerApi";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const officerJwt = (await cookies()).get("appwrite-officer-jwt")?.value;
        const api = makeOfficerApi(officerJwt);

        const response = await api.post("/officer/reports/bulk", body);
        return NextResponse.json(response.data, { status: response.status });
    } catch (error: unknown) {
        const err = error as {
            response?: { data?: { detail?: string; error?: string }; status?: number };
            message?: string;
        };
        const message =
            err.response?.data?.detail ||
            err.response?.data?.error ||
            err.message ||
            "Failed to bulk-update records";
        return NextResponse.json({ error: message }, { status: err.response?.status ?? 500 });
    }
}
