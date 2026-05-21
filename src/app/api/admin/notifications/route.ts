import { NextRequest, NextResponse } from 'next/server';
import { makeAdminApi } from '@/lib/adminApi';

function getJwt(request: NextRequest) {
    return (
        request.cookies.get('appwrite-admin-jwt')?.value ??
        request.headers.get('authorization')?.replace('Bearer ', '') ??
        null
    );
}

// GET /api/admin/notifications
export async function GET(request: NextRequest) {
    const jwt = getJwt(request);
    const api = makeAdminApi(jwt);
    const { searchParams } = request.nextUrl;
    try {
        const res = await api.get('/admin/notifications', {
            params: {
                skip: searchParams.get('skip') ?? 0,
                limit: searchParams.get('limit') ?? 50,
            },
        });
        return NextResponse.json(res.data);
    } catch (e: unknown) {
        const err = e as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(err?.response?.data ?? { error: 'Failed' }, { status: err?.response?.status ?? 500 });
    }
}

// POST /api/admin/notifications
export async function POST(request: NextRequest) {
    const jwt = getJwt(request);
    const api = makeAdminApi(jwt);
    const body = await request.json();
    try {
        const res = await api.post('/admin/notifications', body);
        return NextResponse.json(res.data, { status: 201 });
    } catch (e: unknown) {
        const err = e as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(err?.response?.data ?? { error: 'Failed' }, { status: err?.response?.status ?? 500 });
    }
}
