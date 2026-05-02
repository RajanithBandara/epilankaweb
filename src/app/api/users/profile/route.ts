import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_KEY = process.env.SECRET_KEY || '';

function getJwt(req: NextRequest): string | null {
    return (
        req.cookies.get('appwrite-jwt')?.value ??
        req.headers.get('authorization')?.replace('Bearer ', '') ??
        null
    );
}

/** PUT /api/users/profile — update username/email */
export async function PUT(request: NextRequest) {
    const jwt = getJwt(request);
    if (!jwt) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body: Record<string, string>;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    try {
        const response = await axios.put(`${API_BASE}/users/profile`, body, {
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
                { error: error.response?.data?.detail || 'Failed to update profile' },
                { status: error.response?.status || 500 }
            );
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
