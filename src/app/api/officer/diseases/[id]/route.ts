import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { makeOfficerApi } from "@/lib/officerApi";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();

        const officerJwt = (await cookies()).get("appwrite-officer-jwt")?.value;
        const api = makeOfficerApi(officerJwt);

        const response = await api.put(`/officer/diseases/${id}`, body);
        return NextResponse.json(response.data, { status: response.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: { detail?: string; error?: string }; status?: number }; message?: string };
        const message = err.response?.data?.detail || err.response?.data?.error || err.message || "Failed to update disease";
        return NextResponse.json({ error: message }, { status: err.response?.status ?? 500 });
    }
}
