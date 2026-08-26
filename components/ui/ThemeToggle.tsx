"use client";

import { useTheme, Theme } from "@/components/ThemeProvider";

const THEME_META: Record<Theme, {
    label: string;
    nextLabel: string;
    metaColor: string;
    icon: React.ReactNode;
    glowColor: string;
    btnBg: string;
    btnBorder: string;
    btnColor: string;
    hoverBg: string;
    hoverColor: string;
    hoverBorder: string;
}> = {
    light: {
        label: "Light",
        nextLabel: "Dark Mode (Twitter Dim)",
        metaColor: "#ffffff",
        glowColor: "rgba(37, 99, 235, 0.10)",
        btnBg: "rgba(15, 23, 42, 0.08)",
        btnBorder: "rgba(15, 23, 42, 0.12)",
        btnColor: "rgba(15, 23, 42, 0.70)",
        hoverBg: "rgba(15, 23, 42, 0.12)",
        hoverColor: "rgba(15, 23, 42, 1)",
        hoverBorder: "rgba(37, 99, 235, 0.30)",
        icon: (
            // Sun
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
        ),
    },
    dark: {
        label: "Dark",
        nextLabel: "Frost Mode",
        metaColor: "#15202B",
        glowColor: "rgba(29, 155, 240, 0.15)",
        btnBg: "rgba(255, 255, 255, 0.05)",
        btnBorder: "rgba(255, 255, 255, 0.10)",
        btnColor: "rgba(255, 255, 255, 0.60)",
        hoverBg: "rgba(29, 155, 240, 0.12)",
        hoverColor: "#1D9BF0",
        hoverBorder: "rgba(29, 155, 240, 0.40)",
        icon: (
            // Moon
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
        ),
    },
    glass: {
        label: "Frost",
        nextLabel: "Light Mode",
        metaColor: "#EEF4FB",
        glowColor: "rgba(10, 132, 255, 0.20)",
        btnBg: "rgba(255, 255, 255, 0.65)",
        btnBorder: "rgba(255, 255, 255, 0.85)",
        btnColor: "#0F172A",
        hoverBg: "rgba(255, 255, 255, 0.90)",
        hoverColor: "#0A84FF",
        hoverBorder: "rgba(10, 132, 255, 0.40)",
        icon: (
            // Sparkles / Glass diamond icon
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.286L13 21l-2.286-6.857L5 12l5.714-2.286L13 3z" />
            </svg>
        ),
    },
};

export default function ThemeToggle() {
    const { theme, cycle } = useTheme();
    const meta = THEME_META[theme] || THEME_META.light;

    return (
        <button
            onClick={cycle}
            className="relative p-2.5 rounded-xl transition-all duration-300 group cursor-pointer backdrop-blur-md"
            style={{
                background: meta.btnBg,
                border: `1px solid ${meta.btnBorder}`,
                color: meta.btnColor,
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = meta.hoverBg;
                e.currentTarget.style.color = meta.hoverColor;
                e.currentTarget.style.borderColor = meta.hoverBorder;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = meta.btnBg;
                e.currentTarget.style.color = meta.btnColor;
                e.currentTarget.style.borderColor = meta.btnBorder;
            }}
            title={`Switch to ${meta.nextLabel}`}
            aria-label={`Current theme: ${meta.label}. Switch to ${meta.nextLabel}`}
        >
            {/* Icon with smooth fade-through */}
            <div className="relative w-5 h-5 flex items-center justify-center">
                {meta.icon}
            </div>

            {/* Tooltip badge */}
            <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] font-bold whitespace-nowrap px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 shadow-md"
                style={{ background: "var(--bg-surface)", color: "var(--text-secondary)", border: "1px solid var(--bg-border)" }}>
                {meta.label}
            </span>

            {/* Glow */}
            <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: `radial-gradient(circle, ${meta.glowColor} 0%, transparent 70%)` }}
            />
        </button>
    );
}
