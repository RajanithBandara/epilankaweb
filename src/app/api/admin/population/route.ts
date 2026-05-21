import { NextRequest, NextResponse } from 'next/server';
import { makeAdminApi } from '@/lib/adminApi';

function getJwt(request: NextRequest) {
    return (
        request.cookies.get('appwrite-admin-jwt')?.value ??
        request.headers.get('authorization')?.replace('Bearer ', '') ??
        null
    );
}

// GET /api/admin/population
export async function GET(request: NextRequest) {
    const jwt = getJwt(request);
    const api = makeAdminApi(jwt);
    try {
        const res = await api.get('/admin/population/total');
        return NextResponse.json(res.data);
    } catch (e: unknown) {
        const err = e as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(err?.response?.data ?? { error: 'Failed' }, { status: err?.response?.status ?? 500 });
    }
}
