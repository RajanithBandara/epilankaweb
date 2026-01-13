import { NextResponse } from "next/server";
import { adminApi } from "@/lib/adminApi";

export async function GET() {
    try {
        const res = await adminApi.get("/admin/users");
        return NextResponse.json(res.data);
    } catch (err: unknown) {
        const error = err as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            { error: error?.response?.data || "Failed to load users" },
            { status: error?.response?.status || 500 }
        );
    }
}

