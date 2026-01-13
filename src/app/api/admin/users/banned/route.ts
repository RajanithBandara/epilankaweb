import { NextResponse } from "next/server";
import { adminApi } from "@/lib/adminApi";

export async function GET() {
    try {
        const res = await adminApi.get("/admin/users/banned");
        return NextResponse.json(res.data);
    } catch (err: unknown) {
        const error = err as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            { error: error?.response?.data || "Failed to load banned users" },
            { status: error?.response?.status || 500 }
        );
    }
}

