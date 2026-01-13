import axios, { AxiosError } from "axios";
import { NextResponse } from "next/server";

type ApiError = { detail?: string; msg?: string };

// Change this to your FastAPI base URL
const BACKEND_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(req: Request) {
    try {
        // Pass query params through (optional)
        const url = new URL(req.url);
        const qs = url.searchParams.toString();

        const endpoint = `${BACKEND_BASE_URL}/admin/postgres/tables${
            qs ? `?${qs}` : ""
        }`;

        const res = await axios.get(endpoint, {
            headers: {
                "x-api-key": process.env.NEXT_PUBLIC_SECRET_KEY || "", // ✅ server-only env
                Accept: "application/json",
            },
            timeout: 30_000,
        });

        return NextResponse.json(res.data, { status: 200 });
    } catch (e: unknown) {
        const ax = e as AxiosError<ApiError>;

        const status = ax.response?.status ?? 500;
        const msg =
            ax.response?.data?.detail ||
            ax.response?.data?.msg ||
            ax.message ||
            "Proxy request failed";

        return NextResponse.json({ error: msg }, { status });
    }
}
