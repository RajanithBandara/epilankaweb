import { NextRequest, NextResponse } from "next/server";
import { toggleLike } from "@/controllers/articleController";
import { getCurrentUser } from "@/lib/serverAuth";

type RouteParams = { id: string };

export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<RouteParams> }
) {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const result = await toggleLike(id, user.id);
    if (!result) {
        return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    return NextResponse.json(result);
}
