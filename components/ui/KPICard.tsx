"use client";
import React from "react";
import Link from "next/link";

interface KPICardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    trend?: {
        value: string;
        isPositive: boolean;
    };
    delay?: number;
    size?: "default" | "sm";
    href?: string;
    onClick?: () => void;
}

const COLOR_MAP: Record<string, { primary: string; bg: string; border: string; glow: string }> = {
    blue: {
        primary: "#2563eb",
        bg: "rgba(37, 99, 235, 0.12)",
        border: "rgba(37, 99, 235, 0.25)",
        glow: "rgba(37, 99, 235, 0.18)"
    },
    emerald: {
        primary: "#10b981",
        bg: "rgba(16, 185, 129, 0.12)",
        border: "rgba(16, 185, 129, 0.25)",
        glow: "rgba(16, 185, 129, 0.18)"
    },
    green: {
        primary: "#16a34a",
        bg: "rgba(22, 163, 74, 0.12)",
        border: "rgba(22, 163, 74, 0.25)",
        glow: "rgba(22, 163, 74, 0.18)"
    },
    rose: {
        primary: "#f43f5e",
        bg: "rgba(244, 63, 94, 0.12)",
        border: "rgba(244, 63, 94, 0.25)",
        glow: "rgba(244, 63, 94, 0.18)"
    },
    red: {
        primary: "#ef4444",
        bg: "rgba(239, 68, 68, 0.12)",
        border: "rgba(239, 68, 68, 0.25)",
        glow: "rgba(239, 68, 68, 0.18)"
    },
    amber: {
        primary: "#f59e0b",
        bg: "rgba(245, 158, 11, 0.12)",
        border: "rgba(245, 158, 11, 0.25)",
        glow: "rgba(245, 158, 11, 0.18)"
    },
    yellow: {
        primary: "#eab308",
        bg: "rgba(234, 179, 8, 0.12)",
        border: "rgba(234, 179, 8, 0.25)",
        glow: "rgba(234, 179, 8, 0.18)"
    },
    indigo: {
        primary: "#6366f1",
        bg: "rgba(99, 102, 241, 0.12)",
        border: "rgba(99, 102, 241, 0.25)",
        glow: "rgba(99, 102, 241, 0.18)"
    },
    purple: {
        primary: "#a855f7",
        bg: "rgba(168, 85, 247, 0.12)",
        border: "rgba(168, 85, 247, 0.25)",
        glow: "rgba(168, 85, 247, 0.18)"
    },
    violet: {
        primary: "#8b5cf6",
        bg: "rgba(139, 92, 246, 0.12)",
        border: "rgba(139, 92, 246, 0.25)",
        glow: "rgba(139, 92, 246, 0.18)"
    },
    sky: {
        primary: "#0284c7",
        bg: "rgba(2, 132, 199, 0.12)",
        border: "rgba(2, 132, 199, 0.25)",
        glow: "rgba(2, 132, 199, 0.18)"
    },
    cyan: {
        primary: "#06b6d4",
        bg: "rgba(6, 182, 212, 0.12)",
        border: "rgba(6, 182, 212, 0.25)",
        glow: "rgba(6, 182, 212, 0.18)"
    }
};

export default function KPICard({ label, value, icon, color, trend, delay = 0, size = "default", href, onClick }: KPICardProps) {
    const isSm = size === "sm";

    const colorConfig = COLOR_MAP[color.toLowerCase()] || {
        primary: color,
        bg: `${color}20`,
        border: `${color}40`,
        glow: `${color}25`
    };

    const cardContent = (
        <div 
            className={`group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-black/50 ${href || onClick ? "cursor-pointer" : "cursor-default"} animate-in slide-in-from-bottom-4 fade-in fill-mode-both ${isSm ? "rounded-xl sm:rounded-2xl p-3.5 sm:p-5" : "rounded-2xl sm:rounded-3xl p-4 sm:p-6"}`}
            style={{ 
                backgroundColor: "var(--bg-surface)", 
                border: "1.5px solid var(--bg-border)",
                animationDelay: `${delay}ms`,
                animationDuration: "500ms"
            }}
            onClick={onClick}
        >
            {/* Background Corner Glow */}
            <div 
                className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-35 transition-opacity duration-500 pointer-events-none"
                style={{ backgroundColor: colorConfig.primary }}
            />
            
            {/* Subtle Gradient Overlay */}
            <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500 pointer-events-none"
                style={{ background: `linear-gradient(135deg, ${colorConfig.primary}, transparent)` }}
            />

            <div className="relative z-10">
                <div className={`flex items-center justify-between ${isSm ? "mb-1.5 sm:mb-2" : "mb-2 sm:mb-3"}`}>
                    <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
                        {/* Icon Container with rich themed background & border */}
                        <div 
                            className={`relative flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-xs border ${
                                isSm ? "w-9 h-9 sm:w-10 sm:h-10 rounded-xl" : "w-11 h-11 sm:w-12 sm:h-12 rounded-2xl"
                            }`}
                            style={{ 
                                backgroundColor: colorConfig.bg,
                                borderColor: colorConfig.border
                            }}
                        >
                            <div 
                                className="relative z-10 [&>svg]:w-5 [&>svg]:h-5 sm:[&>svg]:w-6 sm:[&>svg]:h-6"
                                style={{ color: colorConfig.primary }}
                            >
                                {icon}
                            </div>
                        </div>

                        {/* Value */}
                        <div className={`${isSm ? "text-lg sm:text-2xl" : "text-xl sm:text-3xl"} font-black tracking-tight truncate`} style={{ color: "var(--text-primary)" }}>
                            {value}
                        </div>
                    </div>

                    {trend && (
                        <div className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest shrink-0 ${trend.isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            {trend.isPositive ? '+' : ''}{trend.value}
                        </div>
                    )}
                </div>
                
                <div className="font-bold uppercase tracking-widest text-[9px] sm:text-[10px] md:text-xs truncate" style={{ color: "var(--text-muted)" }}>
                    {label}
                </div>
            </div>
        </div>
    );

    if (href) {
        return <Link href={href} className="block">{cardContent}</Link>;
    }
    return cardContent;
}
