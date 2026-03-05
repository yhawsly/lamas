import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/ThemeProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import { auth } from "@/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LAMAS — Lecturer Academic Management System",
  description: "Academic accountability and monitoring platform for higher education",
  manifest: "/manifest.json",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en">
      <head>
        {/* Theme is managed by ThemeProvider and ThemeToggle */}
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <SessionProvider session={session}>
            <ThemeProvider>{children}</ThemeProvider>
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
