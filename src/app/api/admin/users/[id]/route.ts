import { NextResponse } from "next/server";
import { adminApi } from "@/lib/adminApi";

export async function PATCH(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const body = await req.json();
        const res = await adminApi.put(`/users/profile/${id}`, body);
        return NextResponse.json(res.data);
    } catch (err: unknown) {
        const error = err as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            { error: error?.response?.data || "Update failed" },
            { status: error?.response?.status || 500 }
        );
    }
}
