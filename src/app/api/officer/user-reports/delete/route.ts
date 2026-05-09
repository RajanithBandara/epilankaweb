import { NextResponse, NextRequest } from "next/server";
import axios from "axios";

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const report_id = searchParams.get("report_id");
        const district = searchParams.get("district");
        
        if (!report_id || !district) {
            return NextResponse.json({ error: "Missing report_id or district" }, { status: 400 });
        }
        
        const cookieToken = req.cookies.get("appwrite-officer-jwt")?.value;
        const authHeader = req.headers.get("authorization");
        const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : undefined;
        const token = headerToken || cookieToken;

        if (!token) return NextResponse.json({ error: "Authentication is required" }, { status: 401 });

        const fastApiUrl = process.env.NEXT_PUBLIC_API_URL;
        const apiKey = process.env.API_SECRET_KEY || process.env.SECRET_KEY;

        const response = await axios.delete(
            `${fastApiUrl}/officer/user-reports/${encodeURIComponent(report_id)}?district=${encodeURIComponent(district)}`,
            {
                headers: {
                    "x-api-key": apiKey || "",
                    "Authorization": `Bearer ${token}`,
                },
            }
        );

        return NextResponse.json(response.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return NextResponse.json(error.response?.data || { error: "Backend error" }, { status: error.response?.status || 500 });
        }
        return NextResponse.json({ error: "Failed to delete report" }, { status: 500 });
    }
}
