"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
    const [theme, setTheme] = useState<"light" | "dark">("dark");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const saved = (localStorage.getItem("lamas-theme") as "light" | "dark") || "dark";
        Promise.resolve().then(() => {
            setTheme(saved);
            setMounted(true);
        });
    }, []);

    useEffect(() => {
        if (mounted) {
            document.documentElement.classList.toggle("dark", theme === "dark");
        }
    }, [theme, mounted]);

    const toggle = () => {
        const newTheme = theme === "dark" ? "light" : "dark";
        setTheme(newTheme);
        localStorage.setItem("lamas-theme", newTheme);
        document.documentElement.classList.toggle("dark", newTheme === "dark");
    };

    if (!mounted) return <div className="p-2.5 w-[42px] h-[42px]" />; // Placeholder with same dimensions

    return (
        <button
            onClick={toggle}
            className="relative p-2.5 rounded-xl transition-all duration-300 group"
            style={{
                background: theme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(15, 23, 42, 0.08)",
                border: theme === "dark" ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(15, 23, 42, 0.12)",
                color: theme === "dark" ? "rgba(255, 255, 255, 0.6)" : "rgba(15, 23, 42, 0.7)",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(15, 23, 42, 0.12)";
                e.currentTarget.style.color = theme === "dark" ? "rgba(255, 255, 255, 1)" : "rgba(15, 23, 42, 1)";
                e.currentTarget.style.borderColor = theme === "dark" ? "rgba(99, 102, 241, 0.3)" : "rgba(79, 70, 229, 0.3)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = theme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(15, 23, 42, 0.08)";
                e.currentTarget.style.color = theme === "dark" ? "rgba(255, 255, 255, 0.6)" : "rgba(15, 23, 42, 0.7)";
                e.currentTarget.style.borderColor = theme === "dark" ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(15, 23, 42, 0.12)";
            }}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
            <div className="relative w-5 h-5 flex items-center justify-center overflow-hidden">
                {/* Sun Icon */}
                <svg
                    className={`absolute w-5 h-5 transition-all duration-300 ${
                        theme === "light"
                            ? "opacity-100 rotate-0 scale-100"
                            : "opacity-0 -rotate-90 scale-50"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"
                    />
                </svg>

                {/* Moon Icon */}
                <svg
                    className={`absolute w-5 h-5 transition-all duration-300 ${
                        theme === "dark"
                            ? "opacity-100 rotate-0 scale-100"
                            : "opacity-0 rotate-90 scale-50"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                </svg>
            </div>

            {/* Subtle glow effect */}
            <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                    background: theme === "dark"
                        ? "radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)"
                        : "radial-gradient(circle, rgba(79, 70, 229, 0.1) 0%, transparent 70%)",
                }}
            />
        </button>
    );
}
