import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { makeAdminApi } from "@/lib/adminApi";

export async function PUT(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const body = await req.json();
        const jwt = (await cookies()).get("appwrite-admin-jwt")?.value;
        const api = makeAdminApi(jwt);

        const res = await api.put(`/admin/users/${id}/ban`, null, {
            params: {
                is_banned: body.is_banned ?? true,
                reason: body.reason || null,
            },
        });

        return NextResponse.json(res.data);
    } catch (err: unknown) {
        const error = err as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            { error: error?.response?.data || "Ban operation failed" },
            { status: error?.response?.status || 500 }
        );
    }
}
