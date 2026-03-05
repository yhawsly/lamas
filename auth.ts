import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import AzureAD from "next-auth/providers/microsoft-entra-id";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { authConfig } from "./auth.config";

const providers: any[] = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      const user = await prisma.user.findUnique({
        where: { email: credentials.email as string },
      });

      if (!user || !user.isActive) return null;

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
        role: user.role,
        departmentId: user.departmentId,
      };
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  );
}

if (process.env.AUTH_MICROSOFT_ENTRA_ID_ID && process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET) {
  providers.push(
    AzureAD({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "google" || account?.provider === "microsoft-entra-id") {
        if (!user.email) return false;

        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!dbUser || !dbUser.isActive) {
          return false;
        }

        // Update last login for OAuth users
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { lastLogin: new Date() },
        });
      }
      return true;
    },
  }
});
