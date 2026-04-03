import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { makeAdminApi } from "@/lib/adminApi";

export async function POST(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const jwt = (await cookies()).get("appwrite-admin-jwt")?.value;
        const api = makeAdminApi(jwt);

        const backendFormData = new FormData();
        backendFormData.append("file", file);

        const res = await api.post(`/users/profilepic/${id}`, backendFormData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        return NextResponse.json(res.data);
    } catch (err: unknown) {
        const error = err as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            { error: error?.response?.data || "Image upload failed" },
            { status: error?.response?.status || 500 }
        );
    }
}
