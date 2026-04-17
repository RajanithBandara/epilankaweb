import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { makeOfficerApi } from "@/lib/officerApi";

type UpdateNotificationBody = {
    text?: string;
    severity?: "info" | "warning" | "critical" | "success";
    read?: boolean;
    metadata?: Record<string, unknown>;
};

const ALLOWED_SEVERITIES = new Set(["info", "warning", "critical", "success"]);

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ notificationId: string }> }
) {
    try {
        const { notificationId } = await context.params;
        const body = (await request.json()) as UpdateNotificationBody;

        const payload: Record<string, unknown> = {};

        if (typeof body.text === "string") {
            const trimmed = body.text.trim();
            if (!trimmed) {
                return NextResponse.json({ error: "Notification text cannot be empty" }, { status: 400 });
            }
            if (trimmed.length > 500) {
                return NextResponse.json({ error: "Notification text must be 500 characters or less" }, { status: 400 });
            }
            payload.text = trimmed;
        }

        if (body.severity !== undefined) {
            if (!ALLOWED_SEVERITIES.has(body.severity)) {
                return NextResponse.json({ error: "Invalid severity value" }, { status: 400 });
            }
            payload.severity = body.severity;
        }

        if (typeof body.read === "boolean") {
            payload.read = body.read;
        }

        if (body.metadata && typeof body.metadata === "object") {
            payload.metadata = body.metadata;
        }

        if (Object.keys(payload).length === 0) {
            return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
        }

        const officerJwt = (await cookies()).get("appwrite-officer-jwt")?.value;
        const api = makeOfficerApi(officerJwt);
        const response = await api.put(`/notifications/${notificationId}`, payload);

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
            "Failed to update notification";

        return NextResponse.json({ error: message }, { status: err.response?.status ?? 500 });
    }
}

export async function DELETE(
    _request: NextRequest,
    context: { params: Promise<{ notificationId: string }> }
) {
    try {
        const { notificationId } = await context.params;

        const officerJwt = (await cookies()).get("appwrite-officer-jwt")?.value;
        const api = makeOfficerApi(officerJwt);
        const response = await api.delete(`/notifications/${notificationId}`);

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
            "Failed to delete notification";

        return NextResponse.json({ error: message }, { status: err.response?.status ?? 500 });
    }
}
