import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "dummy-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy-secret",
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        isGoogleMock: { label: "IsGoogleMock", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        const email = (credentials.email as string).toLowerCase().trim();
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.isActive) return null;

        if (credentials.isGoogleMock === "true") {
          // Bypassing password verification for mock Google Login demo flow
          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          });

          return {
            id: String(user.id),
            name: user.name,
            email: user.email,
            image: user.avatarUrl,
            role: user.role,
            departmentId: user.departmentId,
            requirePasswordReset: user.requirePasswordReset,
          };
        }

        if (!credentials.password) return null;

        const passwordMatch = await verifyPassword(
          credentials.password as string,
          user.passwordHash
        );

        if (!passwordMatch) return null;

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          image: user.avatarUrl,
          role: user.role,
          departmentId: user.departmentId,
          requirePasswordReset: user.requirePasswordReset,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        
        // Fetch fresh fields from DB to ensure they are always populated correctly (especially for Google Login)
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email?.toLowerCase().trim() },
          select: { role: true, departmentId: true, requirePasswordReset: true }
        });
        
        if (dbUser) {
          token.role = dbUser.role;
          token.departmentId = dbUser.departmentId;
          token.requirePasswordReset = dbUser.requirePasswordReset;
        } else {
          token.role = (user as any).role;
          token.departmentId = (user as any).departmentId;
          token.requirePasswordReset = (user as any).requirePasswordReset;
        }
        
        token.lastActivity = Date.now();
        console.log(`[AUTH] Node JWT Created for user: ${user.email}, role: ${token.role}`);
      }
      
      // Track last activity for timeout or sync database on profile update
      if (trigger === "update") {
        token.lastActivity = Date.now();
        if (token.id) {
          const dbUser = await prisma.user.findUnique({
            where: { id: Number(token.id) },
            select: { name: true, email: true, avatarUrl: true, role: true, departmentId: true, requirePasswordReset: true }
          });
          if (dbUser) {
            token.name = dbUser.name;
            token.email = dbUser.email;
            token.picture = dbUser.avatarUrl;
            token.role = dbUser.role;
            token.departmentId = dbUser.departmentId;
            token.requirePasswordReset = dbUser.requirePasswordReset;
          }
        }
      }
      return token;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase().trim() },
        });
        if (!dbUser || !dbUser.isActive) {
          return false; // Reject sign in if email is not found or user is inactive
        }
        
        // Populate Google authenticated user with DB fields for session/JWT callbacks
        user.id = String(dbUser.id);
        (user as any).role = dbUser.role;
        (user as any).departmentId = dbUser.departmentId;
        (user as any).requirePasswordReset = dbUser.requirePasswordReset;

        // Also update last login timestamp in db
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { lastLogin: new Date() },
        });
      }
      return true;
    },
  },
});
