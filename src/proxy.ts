import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname;

    const isProtectedRoute = path.startsWith('/dashboard');

    const token = request.cookies.get('token')?.value ||
        request.cookies.get('auth-token')?.value ||
        request.cookies.get('session')?.value;

    if (isProtectedRoute && !token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (token && path === '/login') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/login'
    ]
};
