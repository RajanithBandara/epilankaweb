import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { makeAdminApi } from "@/lib/adminApi";

async function getAdminApi() {
    const jar = await cookies();
    const jwt = jar.get("appwrite-admin-jwt")?.value;
    return makeAdminApi(jwt);
}

export async function GET() {
    try {
        const api = await getAdminApi();
        const res = await api.get("/admin/officers");
        return NextResponse.json(res.data);
    } catch (err: unknown) {
        const e = err as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            { error: e?.response?.data || "Failed to load officers" },
            { status: e?.response?.status || 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const api = await getAdminApi();
        const body = await request.json();
        const res = await api.post("/admin/register-officer", body);
        return NextResponse.json(res.data, { status: 201 });
    } catch (err: unknown) {
        const e = err as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            { error: e?.response?.data || "Failed to register officer" },
            { status: e?.response?.status || 500 }
        );
    }
}
