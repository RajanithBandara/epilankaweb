import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { makeAdminApi } from "@/lib/adminApi";

export async function POST(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const body = await req.json();
        const jwt = (await cookies()).get("appwrite-admin-jwt")?.value;
        const api = makeAdminApi(jwt);

        const res = await api.post(`/admin/users/${id}/reset-password`, {
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
