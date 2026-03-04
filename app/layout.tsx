import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LAMAS — Lecturer Academic Management System",
  description: "Academic accountability and monitoring platform for higher education",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Always enforce dark mode — all UI components use hardcoded dark classes */}
        <script dangerouslySetInnerHTML={{
          __html: `document.documentElement.classList.add('dark');localStorage.setItem('lamas-theme','dark');`
        }} />
      </head>
      <body className={inter.className}>
        <SessionProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
