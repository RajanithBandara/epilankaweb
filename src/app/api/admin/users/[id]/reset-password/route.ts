import { NextResponse } from "next/server";
import { adminApi } from "@/lib/adminApi";

export async function POST(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const body = await req.json();

        // The backend expects { current_password, new_password }
        // For admin reset, we might not have current_password
        // We need to modify the payload to match backend expectations
        const res = await adminApi.post(
            `/users/change-password/${id}`,
            {
                current_password: body.current_password || "",
                new_password: body.new_password
            }
        );

        return NextResponse.json(res.data);
    } catch (err: unknown) {
        const error = err as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            { error: error?.response?.data || "Password reset failed" },
            { status: error?.response?.status || 500 }
        );
    }
}
