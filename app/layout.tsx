import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/ThemeProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import { auth } from "@/auth";
import PWARegister from "@/components/PWARegister";
import SWRProvider from "@/lib/swr-config";

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "HTU LAMAS — Academic & Lecture Management System",
  description: "Ho Technical University academic accountability and monitoring platform",
  manifest: "/manifest.json",
  icons: {
    icon: "/htu-logo.png",
    shortcut: "/htu-logo.png",
    apple: "/htu-logo.png",
  },
  appleWebApp: {
    capable: true,
    title: "HTU LAMAS",
    statusBarStyle: "black-translucent",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en" className="light">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var savedTheme = localStorage.getItem('lamas-theme');
              if (savedTheme === 'dark') {
                document.documentElement.classList.add('dark');
                document.documentElement.classList.remove('light');
              } else {
                document.documentElement.classList.remove('dark');
                document.documentElement.classList.add('light');
              }
            } catch(e) {}
            if (typeof window !== 'undefined' && window.performance && window.performance.measure) {
              var orig = window.performance.measure;
              window.performance.measure = function() {
                try {
                  return orig.apply(this, arguments);
                } catch(e) {}
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

