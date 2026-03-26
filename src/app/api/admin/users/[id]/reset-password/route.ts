import { NextResponse } from "next/server";
import { adminApi } from "@/lib/adminApi";

export async function POST(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const body = await req.json();

        const res = await adminApi.post(`/admin/users/${id}/reset-password`, {
            new_password: body.new_password,
        });

        return NextResponse.json(res.data);
    } catch (err: unknown) {
        const error = err as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            { error: error?.response?.data || "Password reset failed" },
            { status: error?.response?.status || 500 }
        );
    }
}
