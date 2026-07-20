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

export default function KPICard({ label, value, icon, color, trend, delay = 0, size = "default", href, onClick }: KPICardProps) {
    const isSm = size === "sm";

    const cardContent = (
        <div 
            className={`group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-black/50 ${href || onClick ? "cursor-pointer" : "cursor-default"} animate-in slide-in-from-bottom-4 fade-in fill-mode-both ${isSm ? "rounded-2xl p-5" : "rounded-3xl p-6"}`}
            style={{ 
                backgroundColor: "var(--bg-surface)", 
                border: "1px solid var(--bg-border)",
                animationDelay: `${delay}ms`,
                animationDuration: "500ms"
            }}
            onClick={onClick}
        >
            {/* Background Glow */}
            <div 
                className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
                style={{ backgroundColor: color }}
            />
            
            {/* Subtle Gradient Overlay */}
            <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 pointer-events-none"
                style={{ background: `linear-gradient(135deg, ${color}, transparent)` }}
            />

            <div className="relative z-10">
                <div className={`flex items-center justify-between ${isSm ? "mb-2" : "mb-3"}`}>
                    <div className="flex items-center gap-4">
                        <div className={`relative flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${isSm ? "p-2.5 rounded-xl" : "p-3 rounded-2xl"}`}>
                            {/* Background with opacity */}
                            <div className={`absolute inset-0 opacity-15 ${isSm ? "rounded-xl" : "rounded-2xl"}`} style={{ backgroundColor: color }} />
                            {/* Icon */}
                            <div className="relative z-10" style={{ color }}>{icon}</div>
                        </div>
                        <div className={`${isSm ? "text-2xl" : "text-3xl"} font-black tracking-tight`} style={{ color: "var(--text-primary)" }}>
                            {value}
                        </div>
                    </div>
                    {trend && (
                        <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${trend.isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            {trend.isPositive ? '+' : ''}{trend.value}
                        </div>
                    )}
                </div>
                
                <div className={`font-bold uppercase tracking-widest ${isSm ? "text-[10px]" : "text-xs"}`} style={{ color: "var(--text-muted)" }}>
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
