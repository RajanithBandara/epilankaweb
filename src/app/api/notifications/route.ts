import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_KEY = process.env.SECRET_KEY || '';

// GET /api/notifications?skip=0&limit=30&unread_only=false
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const skip = searchParams.get('skip') ?? '0';
    const limit = searchParams.get('limit') ?? '30';
    const unread_only = searchParams.get('unread_only') ?? 'false';

    // Read JWT from HttpOnly cookie (set by /api/auth/session) or Authorization header
    const jwt =
        request.cookies.get('appwrite-jwt')?.value ??
        request.headers.get('authorization')?.replace('Bearer ', '') ??
        null;

    if (!jwt) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const response = await axios.get(`${API_BASE}/notifications/`, {
            params: { skip, limit, unread_only },
            headers: {
                'x-api-key': API_KEY,
                'Authorization': `Bearer ${jwt}`,
                'Content-Type': 'application/json',
            },
            timeout: 10000,
        });

        return NextResponse.json(response.data);
    } catch (error) {
        console.error('[notifications] GET failed:', error);
        if (axios.isAxiosError(error)) {
            return NextResponse.json(
                { error: error.response?.data?.detail || 'Failed to fetch notifications' },
                { status: error.response?.status || 500 }
            );
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
