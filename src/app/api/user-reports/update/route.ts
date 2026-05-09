import { NextResponse, NextRequest } from "next/server";
import axios from "axios";

export async function PUT(req: NextRequest) {
    try {
        const { reportid, location, description } = await req.json();
        
        const cookieToken = req.cookies.get("appwrite-jwt")?.value;
        const authHeader = req.headers.get("authorization");
        const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : undefined;
        const token = headerToken || cookieToken;

        if (!token) return NextResponse.json({ error: "Authentication is required" }, { status: 401 });

        const fastApiUrl = process.env.NEXT_PUBLIC_API_URL;
        const apiKey = process.env.API_SECRET_KEY || process.env.SECRET_KEY;

        const response = await axios.put(
            `${fastApiUrl}/user_reports/update?reportid=${encodeURIComponent(reportid)}&location=${encodeURIComponent(location)}`,
            { description },
            {
                headers: {
                    "Content-Type": "application/json",
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
        return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
    }
}
