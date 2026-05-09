import { NextResponse, NextRequest } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
    try {
        const { user_id } = await req.json();
        
        if (!user_id) {
            return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
        }
        
        const cookieToken = req.cookies.get("appwrite-jwt")?.value;
        const authHeader = req.headers.get("authorization");
        const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : undefined;
        const token = headerToken || cookieToken;

        if (!token) return NextResponse.json({ error: "Authentication is required" }, { status: 401 });

        const fastApiUrl = process.env.NEXT_PUBLIC_API_URL;
        const apiKey = process.env.API_SECRET_KEY || process.env.SECRET_KEY;

        const response = await axios.post(
            `${fastApiUrl}/officer/users/${encodeURIComponent(user_id)}/ban`,
            {},
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
        return NextResponse.json({ error: "Failed to ban user" }, { status: 500 });
    }
}
