import { NextRequest, NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

type MongoReportDoc = {
    _id: { toString: () => string };
    created_at?: string | Date;
} & Record<string, unknown>;

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limitStr = searchParams.get("limit") || "50";
        const skipStr = searchParams.get("skip") || "0";
        const districtFilter = searchParams.get("district") || null; // optional

        const limit = parseInt(limitStr, 10);
        const skip = parseInt(skipStr, 10);

        if (isNaN(limit) || isNaN(skip)) {
            return NextResponse.json({ error: "Invalid pagination parameters" }, { status: 400 });
        }

        const db = await getMongoDb();

        const collectionsInfo = await db.listCollections().toArray();
        const reportCollections = collectionsInfo
            .map(c => c.name)
            .filter(name => name.startsWith("reports_"));

        const allReports: MongoReportDoc[] = [];

        // If a specific district is requested, we can filter down to just its collection
        const targetCollections = districtFilter
            ? reportCollections.filter(c => c === `reports_${districtFilter.toLowerCase().replace(/\s+/g, '_')}`)
            : reportCollections;

        // Fetch from the target collections
        // We will fetch up to "limit + skip" items from EACH to guarantee we can correctly sort the union
        const queryLimit = limit + skip;
        
        // In a very large system this could be incredibly memory expensive, but for a regional admin it's manageable
        for (const colName of targetCollections) {
            const col = db.collection(colName);
            const docs = await col
                .find({})
                .sort({ created_at: -1 })
                .limit(queryLimit)
                .toArray();
            allReports.push(...docs);
        }

        // Sort all aggregated results
        allReports.sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
        });

        // Apply global pagination skip and limit
        const paginatedReports = allReports.slice(skip, skip + limit);

        // Sanitize out MongoDB internal object IDs if necessary
        const sanitizedReports = paginatedReports.map(report => {
            const { _id, ...rest } = report;
            return {
                report_id: _id.toString(),
                ...rest
            };
        });

        return NextResponse.json({
            success: true,
            total_fetched: allReports.length,
            reports: sanitizedReports,
            skip,
            limit
        });

    } catch (error: unknown) {
        console.error("Error fetching native mongo user reports:", error);
        const message = error instanceof Error ? error.message : "Failed to fetch user reports";
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
