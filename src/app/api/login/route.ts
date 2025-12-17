import axios from 'axios';

export async function POST(req: Request) {
    const body = await req.json();

    try {
        const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/users/login`,
            body,
            {
                headers: {
                    'x-api-key': process.env.NEXT_PUBLIC_SECRET_KEY!,

                },
            }
        );

        return Response.json(response.data);
    } catch (err: unknown) {
        const axiosError = err as { response?: { data?: { message?: string }; status?: number } };
        return Response.json(
            {
                message:
                    axiosError.response?.data?.message || 'Login failed',
            },
            {status: axiosError.response?.status || 500}
        );
    }
}
