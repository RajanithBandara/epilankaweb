import { NextResponse } from 'next/server';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_KEY = process.env.SECRET_KEY || '';

/** GET /api/map/locations — returns all district locations (no auth required) */
export async function GET() {
    try {
        const response = await axios.get(`${API_BASE}/map/locations`, {
            headers: {
                'x-api-key': API_KEY,
                'Content-Type': 'application/json',
            },
            timeout: 10000,
        });

        return NextResponse.json(response.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return NextResponse.json(
                { error: error.response?.data?.detail || 'Failed to fetch locations' },
                { status: error.response?.status || 500 }
            );
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
