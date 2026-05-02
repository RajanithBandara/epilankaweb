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

/** POST /api/users/profilepic — upload a new profile picture (multipart/form-data) */
export async function POST(request: NextRequest) {
    const jwt = getJwt(request);
    if (!jwt) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const formData = await request.formData();

        // Re-build FormData for axios — axios handles multipart natively
        const axiosFormData = new FormData();
        const file = formData.get('file');
        if (file && file instanceof Blob) {
            const fileName = (file as File).name ?? 'profile.jpg';
            axiosFormData.append('file', file, fileName);
        }

        const response = await axios.post(`${API_BASE}/users/profilepic`, axiosFormData, {
            headers: {
                'x-api-key': API_KEY,
                'Authorization': `Bearer ${jwt}`,
                // Let axios set multipart Content-Type with the correct boundary
            },
            timeout: 30000,
        });

        return NextResponse.json(response.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return NextResponse.json(
                { error: error.response?.data?.detail || 'Failed to upload picture' },
                { status: error.response?.status || 500 }
            );
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/** DELETE /api/users/profilepic — remove the current profile picture */
export async function DELETE(request: NextRequest) {
    const jwt = getJwt(request);
    if (!jwt) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const response = await axios.delete(`${API_BASE}/users/profilepic`, {
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
                { error: error.response?.data?.detail || 'Failed to delete picture' },
                { status: error.response?.status || 500 }
            );
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
