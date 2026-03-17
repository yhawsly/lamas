import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    // Explicitly define secret for middleware and auth handlers
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    session: {
        maxAge: 30 * 60, // 30 minutes session timeout
        updateAge: 5 * 60, // Update session every 5 minutes of activity
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith("/admin") ||
                nextUrl.pathname.startsWith("/hod") ||
                nextUrl.pathname.startsWith("/lecturer") ||
                nextUrl.pathname.startsWith("/api/admin") ||
                nextUrl.pathname.startsWith("/api/hod") ||
                nextUrl.pathname.startsWith("/api/lecturer");

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            }
            return true;
        },
        async jwt({ token, user, trigger }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.departmentId = (user as any).departmentId;
                token.lastActivity = Date.now();
                console.log(`[AUTH] JWT Created for user: ${user.email}, role: ${token.role}`);
            }
            // Track last activity for timeout
            if (trigger === "update") {
                token.lastActivity = Date.now();
            }
            return token;
        },
        async session({ session, token }) {
            // Further hardening for session data
            if (token && session.user) {
                session.user.id = (token.id as string) || (token.sub as string);
                // Hardened role assignment: no default "LECTURER" fallback if data is missing
                const userRole = (token.role as string);
                (session.user as any).role = userRole;
                (session.user as any).departmentId = (token.departmentId as number) || null;
                (session.user as any).lastActivity = (token.lastActivity as number) || Date.now();
                
                if (!userRole) {
                    console.warn(`[AUTH] Warning: Missing role in token for session ${session.user.id}`);
                }
            }
            return session;
        },
    },
    providers: [], // Initialized in auth.ts
} satisfies NextAuthConfig;
