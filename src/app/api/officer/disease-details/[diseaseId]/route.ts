import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
    deleteDiseaseDetails,
    getDiseaseDetailsByDiseaseId,
    updateDiseaseDetails,
} from "@/controllers/diseaseDetailsController";

type RouteParams = {
    diseaseId: string;
};

async function isOfficerAuthorized() {
    const officerJwt = (await cookies()).get("appwrite-officer-jwt")?.value;
    return Boolean(officerJwt);
}

function parseDiseaseId(value: string) {
    const diseaseId = Number(value);

    if (!Number.isInteger(diseaseId) || diseaseId <= 0) {
        return null;
    }

    return diseaseId;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<RouteParams> }) {
    try {
        if (!(await isOfficerAuthorized())) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { diseaseId: diseaseIdParam } = await params;
        const diseaseId = parseDiseaseId(diseaseIdParam);

        if (!diseaseId) {
            return NextResponse.json({ error: "Invalid diseaseId" }, { status: 400 });
        }

        const details = await getDiseaseDetailsByDiseaseId(diseaseId);

        if (!details) {
            return NextResponse.json({ error: "Disease details not found" }, { status: 404 });
        }

        return NextResponse.json(details, { status: 200 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to fetch disease details";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<RouteParams> }) {
    try {
        if (!(await isOfficerAuthorized())) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { diseaseId: diseaseIdParam } = await params;
        const diseaseId = parseDiseaseId(diseaseIdParam);

        if (!diseaseId) {
            return NextResponse.json({ error: "Invalid diseaseId" }, { status: 400 });
        }

        const body = (await request.json()) as {
            symptoms?: unknown;
            precautions?: unknown;
        };

        const updated = await updateDiseaseDetails(diseaseId, {
            symptoms: body.symptoms,
            precautions: body.precautions,
        });

        if (!updated) {
            return NextResponse.json({ error: "Disease details not found" }, { status: 404 });
        }

        return NextResponse.json(updated, { status: 200 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to update disease details";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<RouteParams> }) {
    try {
        if (!(await isOfficerAuthorized())) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { diseaseId: diseaseIdParam } = await params;
        const diseaseId = parseDiseaseId(diseaseIdParam);

        if (!diseaseId) {
            return NextResponse.json({ error: "Invalid diseaseId" }, { status: 400 });
        }

        const deleted = await deleteDiseaseDetails(diseaseId);

        if (!deleted) {
            return NextResponse.json({ error: "Disease details not found" }, { status: 404 });
        }

        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to delete disease details";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
