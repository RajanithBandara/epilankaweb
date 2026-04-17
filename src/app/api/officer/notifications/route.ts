import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { makeOfficerApi } from "@/lib/officerApi";

type PushNotificationBody = {
    text?: string;
    severity?: "info" | "warning" | "critical" | "success";
    user_id?: string | null;
    metadata?: Record<string, unknown>;
};

const ALLOWED_SEVERITIES = new Set(["info", "warning", "critical", "success"]);

function parseIntParam(value: string | null, name: string) {
    if (value === null) return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
        throw new Error(`${name} must be an integer`);
    }
    return parsed;
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const skip = parseIntParam(searchParams.get("skip"), "skip");
        const limit = parseIntParam(searchParams.get("limit"), "limit");
        const unread_only = searchParams.get("unread_only");

        const params: Record<string, string | number | boolean> = {};
        if (skip !== undefined) params.skip = skip;
        if (limit !== undefined) params.limit = limit;
        if (unread_only !== null) params.unread_only = unread_only === "true";

        const officerJwt = (await cookies()).get("appwrite-officer-jwt")?.value;
        const api = makeOfficerApi(officerJwt);
        const response = await api.get("/notifications/", { params });

        return NextResponse.json(response.data, { status: response.status });
    } catch (error: unknown) {
        const err = error as {
            response?: { data?: { detail?: string; error?: string }; status?: number };
            message?: string;
        };

        const message =
            err.response?.data?.detail ||
            err.response?.data?.error ||
            err.message ||
            "Failed to load notifications";

        return NextResponse.json({ error: message }, { status: err.response?.status ?? 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as PushNotificationBody;
        const text = body.text?.trim();
        const severity = body.severity ?? "info";

        if (!text) {
            return NextResponse.json({ error: "Notification text is required" }, { status: 400 });
        }

        if (!ALLOWED_SEVERITIES.has(severity)) {
            return NextResponse.json({ error: "Invalid severity value" }, { status: 400 });
        }

        const payload = {
            text,
            severity,
            user_id: body.user_id ?? null,
            metadata: body.metadata ?? {},
        };

        const officerJwt = (await cookies()).get("appwrite-officer-jwt")?.value;
        const api = makeOfficerApi(officerJwt);

        const response = await api.post("/notifications/", payload);
        return NextResponse.json(response.data, { status: response.status });
    } catch (error: unknown) {
        const err = error as {
            response?: { data?: { detail?: string; error?: string }; status?: number };
            message?: string;
        };

        const message =
            err.response?.data?.detail ||
            err.response?.data?.error ||
            err.message ||
            "Failed to push notification";

        return NextResponse.json({ error: message }, { status: err.response?.status ?? 500 });
    }
}
