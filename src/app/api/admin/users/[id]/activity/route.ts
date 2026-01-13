import { NextResponse } from "next/server";
import { adminApi } from "@/lib/adminApi";

export async function GET(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const res = await adminApi.get(`/admin/users/${id}/activity`);
        return NextResponse.json(res.data);
    } catch (err: unknown) {
        const error = err as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            { error: error?.response?.data || "Failed to load activity" },
            { status: error?.response?.status || 500 }
        );
    }
}

