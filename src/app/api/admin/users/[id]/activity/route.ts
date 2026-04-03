import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { makeAdminApi } from "@/lib/adminApi";

export async function GET(
    _req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const jwt = (await cookies()).get("appwrite-admin-jwt")?.value;
        const api = makeAdminApi(jwt);
        const res = await api.get(`/admin/users/${id}/activity`);
        return NextResponse.json(res.data);
    } catch (err: unknown) {
        const error = err as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            { error: error?.response?.data || "Failed to load activity" },
            { status: error?.response?.status || 500 }
        );
    }
}
