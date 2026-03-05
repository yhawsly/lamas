import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import AzureAD from "next-auth/providers/microsoft-entra-id";

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    session: {
        maxAge: 30 * 60, // 30 minutes session timeout
        updateAge: 5 * 60, // Update session every 5 minutes of activity
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith("/admin") ||
                nextUrl.pathname.startsWith("/hod") ||
                nextUrl.pathname.startsWith("/lecturer");

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            }
            return true;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.departmentId = (user as any).departmentId;
                token.lastActivity = Date.now();
            }
            // Track last activity for timeout
            if (trigger === "update") {
                token.lastActivity = Date.now();
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string;
                (session.user as any).role = token.role;
                (session.user as any).departmentId = token.departmentId;
                (session.user as any).lastActivity = token.lastActivity;
            }
            return session;
        },
    },
    providers: [], // Initialized in auth.ts
} satisfies NextAuthConfig;
