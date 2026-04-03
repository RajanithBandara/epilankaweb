import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // ── Appwrite JWT cookies (set by /api/auth/session routes) ──────────────
    const userJwt    = request.cookies.get("appwrite-jwt")?.value;
    const adminJwt   = request.cookies.get("appwrite-admin-jwt")?.value;

    const isAdminRoute      = path.startsWith("/admindashboard");
    const isAdminLoginRoute = path === "/admin/login";
    const isUserDashRoute   = path.startsWith("/dashboard");
    const isUserLoginRoute  = path === "/login";

    // ── Admin dashboard guard ────────────────────────────────────────────────
    if (isAdminRoute && !adminJwt) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin/login";
        return NextResponse.redirect(url);
    }

    if (adminJwt && isAdminLoginRoute) {
        const url = request.nextUrl.clone();
        url.pathname = "/admindashboard";
        return NextResponse.redirect(url);
    }

    // ── User dashboard guard ─────────────────────────────────────────────────
    if (isUserDashRoute && !userJwt) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // Prevent logged-in users from seeing login page
    if (userJwt && isUserLoginRoute) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/login",
        "/admindashboard/:path*",
        "/admin/login",
    ],
};
