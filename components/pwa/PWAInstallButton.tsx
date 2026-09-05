"use client";

import React, { useState } from "react";
import { usePWA } from "@/context/PWAContext";
import { Download } from "lucide-react";

export default function PWAInstallButton({ variant = "header" }: { variant?: "header" | "sidebar" | "banner" }) {
    const { isInstallable, isInstalled, installApp } = usePWA();
    const [installing, setInstalling] = useState(false);

    // If already installed or browser hasn't triggered installability yet, don't show
    if (isInstalled || !isInstallable) return null;

    const handleInstall = async () => {
        setInstalling(true);
        try {
            await installApp();
        } finally {
            setInstalling(false);
        }
    };

    if (variant === "sidebar") {
        return (
            <button
                type="button"
                onClick={handleInstall}
                disabled={installing}
                className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 transition-all active:scale-[0.98] cursor-pointer"
                title="Install LAMAS as a standalone desktop or mobile application"
            >
                <div className="w-6 h-6 rounded-lg bg-blue-500 text-white flex items-center justify-center shadow-xs">
                    <Download className="w-3.5 h-3.5 group-hover:animate-bounce" />
                </div>
                <div className="text-left flex-1 min-w-0">
                    <div className="leading-none">Install App</div>
                    <div className="text-[10px] font-normal opacity-75 mt-0.5 truncate">Fast access</div>
                </div>
            </button>
        );
    }

    // Default "header" variant
    return (
        <button
            type="button"
            onClick={handleInstall}
            disabled={installing}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 cursor-pointer"
            title="Install HTU LAMAS onto your device for standalone access"
        >
            <Download className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5" />
            <span className="hidden md:inline">Install App</span>
        </button>
    );
}
