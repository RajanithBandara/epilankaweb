import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { makeAdminApi } from "@/lib/adminApi";

/**
 * GET /api/admin/analytics
 * Forwarded query params: week_number, year, district_id, disease_id
 */
export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const qs = url.searchParams.toString();
        const jwt = (await cookies()).get("appwrite-admin-jwt")?.value;
        const api = makeAdminApi(jwt);

        const res = await api.get(`/admin/analytics${qs ? `?${qs}` : ""}`);
        return NextResponse.json(res.data, { status: 200 });
    } catch (err: unknown) {
        const error = err as { response?: { data?: { detail?: string; msg?: string }; status?: number }; message?: string };
        const msg = error?.response?.data?.detail || error?.response?.data?.msg || error?.message || "Failed to fetch analytics";
        return NextResponse.json({ error: msg }, { status: error?.response?.status ?? 500 });
    }
}