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
            console.debug(`[JWT] Final Token - Sub: ${token.sub}, Role: ${token.role}`);
            return token;
        },
        async session({ session, token }) {
            console.debug(`[SESSION] Token ID: ${token.id}, Token Role: ${token.role}`);
            
            if (token && session.user) {
                session.user.id = String(token.id || token.sub);
                (session.user as any).role = token.role as string;
                (session.user as any).departmentId = token.departmentId as number;
                (session.user as any).lastActivity = token.lastActivity as number;
                
                console.debug(`[SESSION] Final Session User - ID: ${session.user.id}, Role: ${(session.user as any).role}`);
            }
            return session;
        },
    },
    providers: [], // Initialized in auth.ts
} satisfies NextAuthConfig;
