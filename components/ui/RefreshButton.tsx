"use client";

import React, { useState } from "react";
import { RefreshCw } from "lucide-react";

export interface RefreshButtonProps {
    onClick?: () => void | Promise<any>;
    isRefreshing?: boolean;
    label?: string;
    size?: "sm" | "md" | "icon" | "pill";
    variant?: "outline" | "ghost" | "primary" | "secondary" | "subtle";
    className?: string;
    title?: string;
    disabled?: boolean;
    iconOnly?: boolean;
}

export default function RefreshButton({
    onClick,
    isRefreshing: controlledIsRefreshing,
    label = "Refresh",
    size = "sm",
    variant = "outline",
    className = "",
    title = "Refresh data",
    disabled = false,
    iconOnly = false,
}: RefreshButtonProps) {
    const [internalLoading, setInternalLoading] = useState(false);

    const isRefreshing = controlledIsRefreshing !== undefined ? controlledIsRefreshing : internalLoading;

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled || isRefreshing || !onClick) return;

        try {
            const result = onClick();
            if (result && typeof result.then === "function") {
                setInternalLoading(true);
                await result;
            } else {
                // Flash brief feedback for synchronous clicks
                setInternalLoading(true);
                setTimeout(() => setInternalLoading(false), 500);
            }
        } catch (err) {
            console.error("Refresh action failed:", err);
        } finally {
            if (controlledIsRefreshing === undefined) {
                setInternalLoading(false);
            }
        }
    };

    // Variant Styles
    const variantStyles = {
        outline: "bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs",
        ghost: "bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60",
        primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 border border-blue-500",
        secondary: "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60",
        subtle: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200/80 dark:border-blue-800/80",
    };

    // Size Styles
    const sizeStyles = {
        sm: iconOnly ? "p-2 rounded-xl" : "px-3 py-1.5 rounded-xl text-xs gap-1.5",
        md: iconOnly ? "p-2.5 rounded-xl" : "px-4 py-2 rounded-xl text-sm gap-2",
        icon: "p-2 sm:p-2.5 rounded-xl",
        pill: iconOnly ? "p-2 rounded-full" : "px-3.5 py-1.5 rounded-full text-xs gap-1.5",
    };

    const iconSizes = {
        sm: "w-3.5 h-3.5",
        md: "w-4 h-4",
        icon: "w-4 h-4",
        pill: "w-3.5 h-3.5",
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={disabled || isRefreshing}
            title={title}
            aria-label={title}
            className={`inline-flex items-center justify-center font-bold transition-all duration-200 select-none cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        >
            <RefreshCw
                className={`${iconSizes[size]} shrink-0 ${isRefreshing ? "animate-spin text-blue-500 dark:text-blue-400" : ""}`}
            />
            {!iconOnly && label && (
                <span className="leading-none">{isRefreshing ? "Refreshing..." : label}</span>
            )}
        </button>
    );
}
