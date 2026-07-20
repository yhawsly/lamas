import type { NextConfig } from "next";

// Bundle analyzer integration (enabled with `ANALYZE=true` env)
const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: process.env.ANALYZE === 'true' });

const nextConfig: NextConfig = {
    // Don't leak Next.js version in response headers
    poweredByHeader: false,

    // Enable gzip/brotli compression
    compress: true,

    // Image optimisation
    images: {
        formats: ["image/avif", "image/webp"],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920],
        minimumCacheTTL: 60,
    },

    // Security headers on every response
    async headers() {
        const isDev = process.env.NODE_ENV !== "production";
        const cspHeader = `
            default-src 'self';
            script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""};
            style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
            img-src 'self' blob: data:;
            font-src 'self' https://fonts.gstatic.com;
            frame-src 'self';
            worker-src 'self' blob:;
            connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com ${isDev ? "http://localhost:3000 http://127.0.0.1:3000 ws://localhost:3000" : ""};
        `.replace(/\s{2,}/g, ' ').trim();

        return [
            {
                source: "/:path*",
                headers: [
                    { key: "X-DNS-Prefetch-Control", value: "on" },
                    { key: "X-Frame-Options", value: "SAMEORIGIN" },
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
                    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
                    { key: "Content-Security-Policy", value: cspHeader },
                ],
            },
        ];
    },

    // Strict mode for catching React issues early
    reactStrictMode: true,



    // Externalize problematic CommonJS packages so Turbopack doesn't break them
    serverExternalPackages: ["pdf-parse", "exceljs", "bcrypt", "nodemailer"],
};

export default withBundleAnalyzer(nextConfig);
