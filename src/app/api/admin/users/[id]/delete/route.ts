import { NextResponse } from "next/server";
import { adminApi } from "@/lib/adminApi";

export async function DELETE(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const res = await adminApi.delete(`/admin/users/${id}`);
        return NextResponse.json(res.data);
    } catch (err: unknown) {
        const error = err as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            { error: error?.response?.data || "Delete failed" },
            { status: error?.response?.status || 500 }
        );
    }
}

