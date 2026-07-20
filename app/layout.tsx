import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/ThemeProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import { auth } from "@/auth";
import PWARegister from "@/components/PWARegister";
import SWRProvider from "@/lib/swr-config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "LAMAS — Lecturer Academic Management System",
  description: "Academic accountability and monitoring platform for higher education",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "LAMAS",
    statusBarStyle: "black-translucent",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            if (typeof window !== 'undefined' && window.performance && window.performance.measure) {
              var orig = window.performance.measure;
              window.performance.measure = function() {
                try {
                  return orig.apply(this, arguments);
                } catch(e) {
                  // Suppress Next.js/Turbopack HMR performance.measure negative duration DOMExceptions
                }
              };
            }
          })();
        ` }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body style={{ fontFamily: "'Inter', sans-serif" }}>
        <PWARegister />
        <ErrorBoundary>
          <SessionProvider session={session}>
            <SWRProvider>
              <ThemeProvider>{children}</ThemeProvider>
            </SWRProvider>
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

