import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { makeAdminApi } from "@/lib/adminApi";

async function getAdminApi() {
    const jar = await cookies();
    const jwt = jar.get("appwrite-admin-jwt")?.value;
    return makeAdminApi(jwt);
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const api = await getAdminApi();
        const res = await api.delete(`/admin/admins/${id}`);
        return NextResponse.json(res.data);
    } catch (err: unknown) {
        const e = err as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            { error: e?.response?.data || "Failed to remove admin" },
            { status: e?.response?.status || 500 }
        );
    }
}
