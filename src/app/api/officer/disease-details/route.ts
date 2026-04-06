import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
    createDiseaseDetails,
    getDiseaseDetailsByDiseaseId,
    listDiseaseDetails,
} from "@/controllers/diseaseDetailsController";

async function isOfficerAuthorized() {
    const officerJwt = (await cookies()).get("appwrite-officer-jwt")?.value;
    return Boolean(officerJwt);
}

export async function GET(request: NextRequest) {
    try {
        if (!(await isOfficerAuthorized())) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const diseaseIdParam = request.nextUrl.searchParams.get("disease_id");

        if (diseaseIdParam) {
            const diseaseId = Number(diseaseIdParam);

            if (!Number.isInteger(diseaseId) || diseaseId <= 0) {
                return NextResponse.json({ error: "Invalid disease_id" }, { status: 400 });
            }

            const details = await getDiseaseDetailsByDiseaseId(diseaseId);
            if (!details) {
                return NextResponse.json({ error: "Disease details not found" }, { status: 404 });
            }

            return NextResponse.json(details, { status: 200 });
        }

        const detailsList = await listDiseaseDetails();
        return NextResponse.json(detailsList, { status: 200 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to fetch disease details";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        if (!(await isOfficerAuthorized())) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = (await request.json()) as {
            disease_id?: unknown;
            symptoms?: unknown;
            precautions?: unknown;
        };

        const diseaseId = Number(body.disease_id);

        if (!Number.isInteger(diseaseId) || diseaseId <= 0) {
            return NextResponse.json({ error: "disease_id must be a positive integer" }, { status: 400 });
        }

        const created = await createDiseaseDetails({
            disease_id: diseaseId,
            symptoms: body.symptoms,
            precautions: body.precautions,
        });

        return NextResponse.json(created, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to create disease details";
        const status = message.includes("duplicate key") ? 409 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
