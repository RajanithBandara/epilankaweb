import axios, { AxiosError } from "axios";
import { NextResponse } from "next/server";

type ApiError = { detail?: string; msg?: string };

const BACKEND_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const API_KEY = process.env.SECRET_KEY || "";

// GET /api/admin/diseases — fetch all diseases
export async function GET() {
    try {
        const res = await axios.get(`${BACKEND_BASE_URL}/admin/diseases`, {
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
            "Failed to fetch diseases";
        console.error("[diseases GET]", ax.code, ax.message, ax.response?.status, ax.response?.data);
        return NextResponse.json({ error: msg, code: ax.code }, { status });
    }
}


