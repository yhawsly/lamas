import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth;
    const userRole = (req.auth?.user as any)?.role;

    const isAdminPath = nextUrl.pathname.startsWith("/admin");
    const isHodPath = nextUrl.pathname.startsWith("/hod");
    const isLecturerPath = nextUrl.pathname.startsWith("/lecturer");

    // 1. Authorization check: Role-based path protection
    if (isLoggedIn) {
        if (isAdminPath && !["ADMIN", "SUPER_ADMIN"].includes(userRole)) {
            return NextResponse.redirect(new URL("/", nextUrl));
        }
        if (isHodPath && userRole !== "HOD" && !["ADMIN", "SUPER_ADMIN"].includes(userRole)) {
            return NextResponse.redirect(new URL("/", nextUrl));
        }
        if (isLecturerPath && !["LECTURER", "HOD", "ADMIN", "SUPER_ADMIN"].includes(userRole)) {
            return NextResponse.redirect(new URL("/", nextUrl));
        }
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/admin/:path*", "/hod/:path*", "/lecturer/:path*"],
};
