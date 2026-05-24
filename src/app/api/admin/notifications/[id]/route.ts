import { NextRequest, NextResponse } from 'next/server';
import { makeAdminApi } from '@/lib/adminApi';

function getJwt(request: NextRequest) {
    return (
        request.cookies.get('appwrite-admin-jwt')?.value ??
        request.headers.get('authorization')?.replace('Bearer ', '') ??
        null
    );
}

// PUT /api/admin/notifications/[id]
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const jwt = getJwt(request);
    const api = makeAdminApi(jwt);
    const body = await request.json();
    try {
        const res = await api.put(`/notifications/${id}`, body);
        return NextResponse.json(res.data);
    } catch (e: unknown) {
        const err = e as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(err?.response?.data ?? { error: 'Failed' }, { status: err?.response?.status ?? 500 });
    }
}

// DELETE /api/admin/notifications/[id]
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const jwt = getJwt(request);
    const api = makeAdminApi(jwt);
    try {
        const res = await api.delete(`/notifications/${id}`);
        return NextResponse.json(res.data);
    } catch (e: unknown) {
        const err = e as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(err?.response?.data ?? { error: 'Failed' }, { status: err?.response?.status ?? 500 });
    }
}
