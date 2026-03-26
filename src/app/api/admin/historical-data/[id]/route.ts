import axios, { AxiosError } from "axios";
import { NextResponse } from "next/server";

type ApiError = { detail?: string; msg?: string };

const BACKEND_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const API_KEY = process.env.NEXT_PUBLIC_SECRET_KEY || "";

// GET /api/admin/historical-data/[id] — fetch a single record
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const res = await axios.get(
            `${BACKEND_BASE_URL}/admin/historical-data/${id}`,
            {
                headers: {
                    "x-api-key": API_KEY,
                    Accept: "application/json",
                },
                timeout: 30_000,
            }
        );
        return NextResponse.json(res.data, { status: 200 });
    } catch (e: unknown) {
        const ax = e as AxiosError<ApiError>;
        const status = ax.response?.status ?? 500;
        const msg =
            ax.response?.data?.detail ||
            ax.response?.data?.msg ||
            ax.message ||
            "Failed to fetch record";
        return NextResponse.json({ error: msg }, { status });
    }
}

// PUT /api/admin/historical-data/[id] — update a record
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await req.json();
        const res = await axios.put(
            `${BACKEND_BASE_URL}/admin/historical-data/${id}`,
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
            "Failed to update record";
        return NextResponse.json({ error: msg, detail: msg }, { status });
    }
}

// DELETE /api/admin/historical-data/[id] — delete a record
export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const res = await axios.delete(
            `${BACKEND_BASE_URL}/admin/historical-data/${id}`,
            {
                headers: {
                    "x-api-key": API_KEY,
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
            "Failed to delete record";
        return NextResponse.json({ error: msg, detail: msg }, { status });
    }
}

