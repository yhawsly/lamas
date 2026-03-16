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

    const isApiPath = nextUrl.pathname.startsWith("/api");
    const isAdminPath = nextUrl.pathname.startsWith("/admin") || nextUrl.pathname.startsWith("/api/admin");
    const isHodPath = nextUrl.pathname.startsWith("/hod") || nextUrl.pathname.startsWith("/api/hod");
    const isLecturerPath = nextUrl.pathname.startsWith("/lecturer") || nextUrl.pathname.startsWith("/api/lecturer");

    // 1. Authorization check: Role-based path protection
    if (isLoggedIn) {
        if (!userRole && (isAdminPath || isHodPath || isLecturerPath)) {
            return isApiPath ? NextResponse.json({ error: "Unauthorized" }, { status: 401 }) : NextResponse.redirect(new URL("/login", nextUrl));
        }
        if (isAdminPath && !isAdmin(userRole)) {
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
        "/admin/:path*", "/hod/:path*", "/lecturer/:path*",
        "/api/admin/:path*", "/api/hod/:path*", "/api/lecturer/:path*"
    ],
};
