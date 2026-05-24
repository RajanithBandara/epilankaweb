import { NextRequest, NextResponse } from 'next/server';
import { makeAdminApi } from '@/lib/adminApi';

function getJwt(request: NextRequest) {
    return (
        request.cookies.get('appwrite-admin-jwt')?.value ??
        request.headers.get('authorization')?.replace('Bearer ', '') ??
        null
    );
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ district_id: string }> }
) {
    const jwt = getJwt(request);
    const api = makeAdminApi(jwt);
    const body = await request.json();
    const resolvedParams = await params;
    
    try {
        const res = await api.put(`/rainfall/${resolvedParams.district_id}`, body);
        return NextResponse.json(res.data);
    } catch (e: unknown) {
        const err = e as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(err?.response?.data ?? { error: 'Failed' }, { status: err?.response?.status ?? 500 });
    }
}
