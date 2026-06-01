import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";
import { ROLES, isAdmin, hasHodPrivileges } from "@/lib/permissions";

const { auth } = NextAuth({
    ...authConfig,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
});

export default auth((req) => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth;
    const userRole = (req.auth?.user as any)?.role || null;
    const requireReset = (req.auth?.user as any)?.requirePasswordReset || false;

    const isApiPath = nextUrl.pathname.startsWith("/api");
    const isResetPage = nextUrl.pathname === "/reset-password";
    const isAdminPath = nextUrl.pathname.startsWith("/admin") || nextUrl.pathname.startsWith("/api/admin");
    const isHodPath = nextUrl.pathname.startsWith("/hod") || nextUrl.pathname.startsWith("/api/hod");
    const isLecturerPath = nextUrl.pathname.startsWith("/lecturer") || nextUrl.pathname.startsWith("/api/lecturer");

    console.log(`[MIDDLEWARE] Path: ${nextUrl.pathname}, LoggedIn: ${isLoggedIn}, RequireReset: ${requireReset}`);

    // 1. Authorization check: Role-based path protection
    if (isLoggedIn) {
        // Force Password Reset Flow
        if (requireReset && !isResetPage && (isAdminPath || isHodPath || isLecturerPath)) {
            console.log(`[MIDDLEWARE] Redirecting to reset-password for user`);
            return NextResponse.redirect(new URL("/reset-password", nextUrl));
        }

        if (!userRole && (isAdminPath || isHodPath || isLecturerPath)) {
            return isApiPath ? NextResponse.json({ error: "Unauthorized" }, { status: 401 }) : NextResponse.redirect(new URL("/login", nextUrl));
        }
        if (isAdminPath && !isAdmin(userRole)) {
            // Special case: allow HODs to access the analytics API for their department
            const isAnalyticsApi = nextUrl.pathname.startsWith("/api/admin/analytics");
            if (isAnalyticsApi && userRole === ROLES.HOD) {
                return NextResponse.next();
            }
            return isApiPath ? NextResponse.json({ error: "Forbidden" }, { status: 403 }) : NextResponse.redirect(new URL("/", nextUrl));
        }
        if (isHodPath && !hasHodPrivileges(userRole)) {
            return isApiPath ? NextResponse.json({ error: "Forbidden" }, { status: 403 }) : NextResponse.redirect(new URL("/", nextUrl));
        }
        if (isLecturerPath && !Object.values(ROLES).includes(userRole)) {
            return isApiPath ? NextResponse.json({ error: "Forbidden" }, { status: 403 }) : NextResponse.redirect(new URL("/", nextUrl));
        }
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        "/admin/:path*", "/admin",
        "/hod/:path*", "/hod",
        "/lecturer/:path*", "/lecturer",
        "/api/admin/:path*", "/api/hod/:path*", "/api/lecturer/:path*"
    ],
};
