import { auth } from "@/auth";
import { NextResponse } from "next/server";

const roleRoutes: Record<string, string[]> = {
    LECTURER: ["/lecturer"],
    HOD: ["/hod", "/lecturer"],
    ADMIN: ["/admin", "/hod", "/lecturer"],
    SUPER_ADMIN: ["/admin", "/hod", "/lecturer"],
};

export default auth((req) => {
    const { nextUrl, auth: session } = req as any;
    const isLoggedIn = !!session;
    const path = nextUrl.pathname;

    // Allow public paths
    if (path === "/login" || path === "/register" || path.startsWith("/checkin")) {
        if (isLoggedIn && (path === "/login" || path === "/register")) {
            const role = session.user?.role || "LECTURER";
            const redirect = roleRedirect(role);
            return NextResponse.redirect(new URL(redirect, nextUrl));
        }
        return NextResponse.next();
    }

    // Protected routes
    if (!isLoggedIn) {
        return NextResponse.redirect(new URL("/login", nextUrl));
    }

    const role = session.user?.role || "LECTURER";
    const allowed = roleRoutes[role] || [];
    const hasAccess = allowed.some((r) => path.startsWith(r));

    if (!hasAccess) {
        return NextResponse.redirect(new URL(roleRedirect(role), nextUrl));
    }

    return NextResponse.next();
});

function roleRedirect(role: string): string {
    if (role === "LECTURER") return "/lecturer";
    if (role === "HOD") return "/hod";
    if (role === "ADMIN" || role === "SUPER_ADMIN") return "/admin";
    return "/login";
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.json).*)"],
};
