import { NextRequest, NextResponse } from "next/server";
import { listDiseaseDetails, getDiseaseDetailsByDiseaseId } from "@/controllers/diseaseDetailsController";

/**
 * Public GET — fetches disease details (symptoms & precautions) from MongoDB.
 * No authentication required.
 *
 * Query params:
 *   ?disease_id=N  — return a single disease's details
 *   (none)         — return all disease details
 */
export async function GET(request: NextRequest) {
    try {
        const diseaseIdParam = request.nextUrl.searchParams.get("disease_id");

        if (diseaseIdParam !== null) {
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

        const all = await listDiseaseDetails();
        return NextResponse.json(all, { status: 200 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to fetch disease details";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
