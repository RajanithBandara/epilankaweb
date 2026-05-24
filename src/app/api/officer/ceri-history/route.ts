import { NextRequest, NextResponse } from "next/server";
import { makeOfficerApi } from "@/lib/officerApi";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
    try {
        const officerJwt = (await cookies()).get("appwrite-officer-jwt")?.value;
        const api = makeOfficerApi(officerJwt);
        const { searchParams } = request.nextUrl;
        
        const response = await api.get("/reports/ceri-history", {
            params: {
                district_name: searchParams.get("district_name") || undefined,
                disease_id: searchParams.get("disease_id") || undefined,
                limit: searchParams.get("limit") || 100,
            }
        });
        
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error("Error fetching CERI history:", error);
        return NextResponse.json(
            { error: error.response?.data?.detail || "Failed to fetch CERI history" },
            { status: error.response?.status || 500 }
        );
    }
}
