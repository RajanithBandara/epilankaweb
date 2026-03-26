import axios, { AxiosError } from "axios";
import { NextResponse } from "next/server";

type ApiError = { detail?: string; msg?: string };

const BACKEND_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const API_KEY = process.env.NEXT_PUBLIC_SECRET_KEY || "";

/**
 * GET /api/admin/historical-data
 * Supported query params forwarded to FastAPI:
 *   week_number, year, district_id, disease_id, skip, limit
 */
export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const qs = url.searchParams.toString();
        const endpoint = `${BACKEND_BASE_URL}/admin/historical-data${qs ? `?${qs}` : ""}`;

        const res = await axios.get(endpoint, {
            headers: {
                "x-api-key": API_KEY,
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
            "Failed to fetch historical records";
        console.error("[historical-data GET]", ax.code, ax.message, ax.response?.status, ax.response?.data);
        return NextResponse.json({ error: msg, code: ax.code }, { status });
    }
}

/**
 * POST /api/admin/historical-data
 * Body: { week_number, year, district_id, disease_id, case_count }
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();

        const res = await axios.post(
            `${BACKEND_BASE_URL}/admin/historical-data`,
            body,
            {
                headers: {
                    "x-api-key": API_KEY,
                    "Content-Type": "application/json",
                },
                timeout: 30_000,
            }
        );

        return NextResponse.json(res.data, { status: res.status });
    } catch (e: unknown) {
        const ax = e as AxiosError<ApiError>;
        const status = ax.response?.status ?? 500;
        const msg =
            ax.response?.data?.detail ||
            ax.response?.data?.msg ||
            ax.message ||
            "Failed to create historical record";
        console.error("[historical-data POST]", ax.code, ax.message, ax.response?.status, ax.response?.data);
        return NextResponse.json({ error: msg, detail: msg }, { status });
    }
}


