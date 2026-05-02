import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_KEY = process.env.SECRET_KEY || '';

/** GET /api/users/me — returns the current user's profile from the Python backend */
export async function GET(request: NextRequest) {
    const jwt =
        request.cookies.get('appwrite-jwt')?.value ??
        request.headers.get('authorization')?.replace('Bearer ', '') ??
        null;

    if (!jwt) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const response = await axios.get(`${API_BASE}/users/me`, {
            headers: {
                'x-api-key': API_KEY,
                'Authorization': `Bearer ${jwt}`,
                'Content-Type': 'application/json',
            },
            timeout: 10000,
        });

        return NextResponse.json(response.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return NextResponse.json(
                { error: error.response?.data?.detail || 'Failed to fetch user' },
                { status: error.response?.status || 500 }
            );
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
