import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_KEY = process.env.SECRET_KEY || '';

/**
 * POST /api/notifications/read-all
 * Proxies to backend PUT /notifications/read-all
 * Marks all personal notifications as read for the authenticated user.
 */
export async function POST(request: NextRequest) {
    const jwt =
        request.cookies.get('appwrite-jwt')?.value ??
        request.headers.get('authorization')?.replace('Bearer ', '') ??
        null;

    if (!jwt) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const response = await axios.put(`${API_BASE}/notifications/read-all`, null, {
            headers: {
                'x-api-key': API_KEY,
                'Authorization': `Bearer ${jwt}`,
                'Content-Type': 'application/json',
            },
            timeout: 10_000,
        });

        return NextResponse.json(response.data);
    } catch (error) {
        console.error('[notifications/read-all] PUT failed:', error);
        if (axios.isAxiosError(error)) {
            return NextResponse.json(
                { error: error.response?.data?.detail || 'Failed to mark all as read' },
                { status: error.response?.status || 500 },
            );
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
