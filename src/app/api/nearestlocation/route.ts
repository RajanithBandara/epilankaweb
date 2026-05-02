import axios from "axios";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);

        const latitude = searchParams.get("latitude");
        const longitude = searchParams.get("longitude");

        // Validate parameters
        if (!latitude || !longitude) {
            return NextResponse.json(
                { error: "Missing latitude or longitude parameters" },
                { status: 400 }
            );
        }

        if (!process.env.SECRET_KEY) {
            return NextResponse.json(
                { error: "API key not configured" },
                { status: 500 }
            );
        }

        const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/map/nearestlocation`,
            {
                params: {
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude),
                },
                headers: {
                    "x-api-key": process.env.SECRET_KEY,
                },
            }
        );

        return NextResponse.json(response.data);
    } catch (error) {
        console.error("Error fetching nearest location:", error);

        if (axios.isAxiosError(error)) {
            return NextResponse.json(
                {
                    error: error.response?.data?.detail || "Failed to fetch location data",
                },
                { status: error.response?.status || 500 }
            );
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
