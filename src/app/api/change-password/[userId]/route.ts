import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const API_KEY = process.env.SECRET_KEY;

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await context.params;
        const body = await request.json();

        const response = await axios.post(
            `${API_BASE}/users/change-password/${userId}`,
            body,
            {
                headers: {
                    'x-api-key': API_KEY,
                    'Content-Type': 'application/json',
                },
            }
        );

        return NextResponse.json(response.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return NextResponse.json(
                { detail: error.response?.data?.detail || 'Failed to change password' },
                { status: error.response?.status || 500 }
            );
        }
        return NextResponse.json(
            { detail: 'Internal server error' },
            { status: 500 }
        );
    }
}
