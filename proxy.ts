import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";
import { ROLES, isAdmin, hasHodPrivileges, hasLecturerPrivileges, hasDeoPrivileges } from "@/lib/permissions";

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
    const isDeoPath = nextUrl.pathname.startsWith("/deo") || nextUrl.pathname.startsWith("/api/deo");
    const isLecturerPath = nextUrl.pathname.startsWith("/lecturer") || nextUrl.pathname.startsWith("/api/lecturer");

    console.log(`[MIDDLEWARE] Path: ${nextUrl.pathname}, LoggedIn: ${isLoggedIn}, RequireReset: ${requireReset}`);

    // 1. Authorization check: Role-based path protection & forced password reset
    if (isLoggedIn) {
        // Force Password Reset Flow
        if (requireReset && !isResetPage) {
            if (isApiPath) {
                // Allow auth-related API routes and the password update API route so they can complete the reset
                const isAuthApi = nextUrl.pathname.startsWith("/api/auth");
                const isPasswordApi = nextUrl.pathname === "/api/user/password";
                if (!isAuthApi && !isPasswordApi) {
                    console.log(`[MIDDLEWARE] Blocking API request for user requiring password reset: ${nextUrl.pathname}`);
                    return NextResponse.json({ error: "Password reset required" }, { status: 403 });
                }
            } else if (isAdminPath || isHodPath || isDeoPath || isLecturerPath) {
                console.log(`[MIDDLEWARE] Redirecting to reset-password for user`);
                return NextResponse.redirect(new URL("/reset-password", nextUrl));
            }
        }

        if (!userRole && (isAdminPath || isHodPath || isDeoPath || isLecturerPath)) {
            return isApiPath ? NextResponse.json({ error: "Unauthorized" }, { status: 401 }) : NextResponse.redirect(new URL("/login", nextUrl));
        }
        if (isAdminPath && !isAdmin(userRole)) {
            // Special cases: allow HODs to access the analytics and curriculum APIs
            const isAnalyticsApi = nextUrl.pathname.startsWith("/api/admin/analytics");
            const isCurriculumApi = nextUrl.pathname.startsWith("/api/admin/curriculum");
            if ((isAnalyticsApi || isCurriculumApi) && userRole === ROLES.HOD) {
                return NextResponse.next();
            }
            return isApiPath ? NextResponse.json({ error: "Forbidden" }, { status: 403 }) : NextResponse.redirect(new URL("/", nextUrl));
        }
        if (isHodPath && !hasHodPrivileges(userRole)) {
            return isApiPath ? NextResponse.json({ error: "Forbidden" }, { status: 403 }) : NextResponse.redirect(new URL("/", nextUrl));
        }
        if (isDeoPath && !hasDeoPrivileges(userRole)) {
            return isApiPath ? NextResponse.json({ error: "Forbidden" }, { status: 403 }) : NextResponse.redirect(new URL("/", nextUrl));
        }
        if (isLecturerPath && !hasLecturerPrivileges(userRole)) {
            return isApiPath ? NextResponse.json({ error: "Forbidden" }, { status: 403 }) : NextResponse.redirect(new URL("/", nextUrl));
        }
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        "/admin/:path*", "/admin",
        "/hod/:path*", "/hod",
        "/deo/:path*", "/deo",
        "/lecturer/:path*", "/lecturer",
        "/api/admin/:path*", "/api/hod/:path*", "/api/deo/:path*", "/api/lecturer/:path*",
        "/api/submissions/:path*", "/api/submissions",
        "/api/observations/:path*", "/api/observations",
        "/api/notifications/:path*", "/api/notifications",
        "/api/deadlines/:path*", "/api/deadlines",
        "/api/courses/:path*", "/api/courses",
        "/api/user/:path*", "/api/user",
        "/api/upload/:path*", "/api/upload",
        "/api/reports/:path*", "/api/reports",
        "/api/audit/:path*", "/api/audit",
        "/api/extract-syllabus/:path*", "/api/extract-syllabus",
        "/api/export-syllabus/:path*", "/api/export-syllabus",
        "/api/moderations/:path*", "/api/moderations",
        "/api/teaching-observations/:path*", "/api/teaching-observations",
        "/api/search/:path*", "/api/search",
        "/api/resources/:path*", "/api/resources",
        "/api/lecturers/:path*", "/api/lecturers",
        "/api/department/:path*", "/api/department"
    ],
};
