import axios from "axios";

export async function POST(req: Request) {
    const body = await req.json();

    try {

        const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/users/register`,
            body,
            {
                headers: {
                    "x-api-key": process.env.NEXT_PUBLIC_SECRET_KEY!,
                    "Content-Type": "application/json",
                },
            }
        );

        return Response.json(response.data, {
            status: response.status,
        });
    } catch (err: unknown) {
        const axiosError = err as { response?: { data?: { message?: string }; status?: number } };
        return Response.json(
            {
                message:
                    axiosError.response?.data?.message || "Signup failed",
                status: axiosError.response?.status || 500,
            },
            {
                status: axiosError.response?.status || 500,
            }
        );
    }
}
