import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname;

    const firebaseToken = request.cookies.get("firebase-token")?.value;
    const isAdminRoute = path.startsWith("/admindashboard");
    const isAdminLoginRoute = path === "/admin/login" || path === "/admin/login";

    if (isAdminRoute && !firebaseToken) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin/login"; // ✅ choose ONE admin login route
        return NextResponse.redirect(url);
    }

    if (firebaseToken && isAdminLoginRoute) {
        const url = request.nextUrl.clone();
        url.pathname = "/admindashboard";
        return NextResponse.redirect(url);
    }

    const token =
        request.cookies.get("token")?.value ||
        request.cookies.get("auth-token")?.value ||
        request.cookies.get("session")?.value;

    const isUserDashboardRoute = path.startsWith("/dashboard");
    const isUserLoginRoute = path === "/login";

    if (isUserDashboardRoute && !token) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // Optional: if user already logged in, prevent seeing login page
    if (token && isUserLoginRoute) {
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
