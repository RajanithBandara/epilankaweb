export const runtime = "nodejs";

import axios from "axios";

export async function POST(req: Request) {
    const body = await req.json();

    try {
        const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/users/login`,
            body,
            {
                headers: {
                    "x-api-key": process.env.NEXT_PUBLIC_SECRET_KEY!,
                    "Content-Type": "application/json",
                },
            }
        );

        const headers = new Headers();
        headers.append(
            "Set-Cookie",
            `access_token=${response.data.access_token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=1800`
        );

        return new Response(JSON.stringify(response.data), {
            status: 200,
            headers,
        });
    } catch (err: unknown) {
        const axiosError = err as { response?: { data?: { message?: string }; status?: number } };
        console.error('Login error:', axiosError.response?.data || err);
        return Response.json(
            {
                message:
                    axiosError.response?.data?.message || "Login failed",
            },
            { status: axiosError.response?.status || 500 }
        );
    }
}
