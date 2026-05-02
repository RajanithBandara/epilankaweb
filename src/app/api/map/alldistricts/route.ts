import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_KEY = process.env.SECRET_KEY || '';

export async function GET(request: NextRequest) {
    const target_date = request.nextUrl.searchParams.get('target_date');

    try {
        const response = await axios.get(`${API_BASE}/map/alldistricts`, {
            params: target_date ? { target_date } : undefined,
            headers: {
                'x-api-key': API_KEY,
                'Content-Type': 'application/json',
            },
            timeout: 15000,
        });

        return NextResponse.json(response.data);
    } catch (error) {
        console.error('[map/alldistricts] Error:', error);
        if (axios.isAxiosError(error)) {
            return NextResponse.json(
                { error: error.response?.data?.detail || 'Failed to fetch map data' },
                { status: error.response?.status || 500 }
            );
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
