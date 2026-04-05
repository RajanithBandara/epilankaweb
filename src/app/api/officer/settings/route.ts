import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { makeOfficerApi } from "@/lib/officerApi";

export async function GET() {
  try {
    const officerJwt = (await cookies()).get("appwrite-officer-jwt")?.value;
    const api = makeOfficerApi(officerJwt);

    const response = await api.get("/officer/settings");
    return NextResponse.json(response.data, { status: 200 });
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string; error?: string }; status?: number }; message?: string };
    const message = err.response?.data?.detail || err.response?.data?.error || err.message || "Failed to fetch settings";
    return NextResponse.json({ error: message }, { status: err.response?.status ?? 500 });
  }
}
