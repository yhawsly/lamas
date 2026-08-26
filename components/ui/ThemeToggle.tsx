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
        nextLabel: "Dark (Twitter Dim)",
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
        nextLabel: "Academic Sage",
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
    sage: {
        label: "Sage",
        nextLabel: "Light Mode",
        metaColor: "#1A1E1A",
        glowColor: "rgba(76, 175, 120, 0.15)",
        btnBg: "rgba(76, 175, 120, 0.08)",
        btnBorder: "rgba(76, 175, 120, 0.20)",
        btnColor: "rgba(155, 168, 141, 0.80)",
        hoverBg: "rgba(76, 175, 120, 0.15)",
        hoverColor: "#4CAF78",
        hoverBorder: "rgba(76, 175, 120, 0.45)",
        icon: (
            // Leaf / nature icon
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M5 3C5 3 5 13 12 16c0 0-1 3-4 4M19 3s0 10-7 13" />
            </svg>
        ),
    },
};

export default function ThemeToggle() {
    const { theme, cycle } = useTheme();
    const meta = THEME_META[theme];

    return (
        <button
            onClick={cycle}
            className="relative p-2.5 rounded-xl transition-all duration-300 group"
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
            <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] font-bold whitespace-nowrap px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none"
                style={{ background: "var(--bg-surface)", color: "var(--text-secondary)", border: "1px solid var(--bg-border)" }}>
                {meta.label}
            </span>

            {/* Glow */}
            <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `radial-gradient(circle, ${meta.glowColor} 0%, transparent 70%)` }}
            />
        </button>
    );
}
