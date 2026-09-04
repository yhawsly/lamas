"use client";

import React, { useState, useEffect } from "react";
import { usePWA } from "@/context/PWAContext";
import { Download, X } from "lucide-react";

export default function PWAInstallBanner() {
    const { isInstallable, isInstalled, installApp } = usePWA();
    const [dismissed, setDismissed] = useState(true);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const isDismissed = sessionStorage.getItem("lamas_pwa_banner_dismissed") === "true";
        if (!isDismissed) {
            // Show after a brief delay so page loads smoothly first
            const timer = setTimeout(() => {
                setDismissed(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, []);

    if (isInstalled || !isInstallable || dismissed) return null;

    const handleDismiss = () => {
        setDismissed(true);
        try {
            sessionStorage.setItem("lamas_pwa_banner_dismissed", "true");
        } catch {}
    };

    const handleInstall = async () => {
        setLoading(true);
        try {
            await installApp();
        } finally {
            setLoading(false);
            handleDismiss();
        }
    };

    return (
        <aside
            aria-label="Install web application"
            className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 max-w-sm w-[calc(100vw-2rem)] p-4 rounded-3xl shadow-2xl border backdrop-blur-xl animate-in slide-in-from-bottom-8 duration-300"
            style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--bg-border)",
            }}
        >
            <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/20 p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/htu-logo.png" alt="HTU Logo" className="w-full h-full object-contain" />
                </div>

                <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-sm leading-tight" style={{ color: "var(--text-primary)" }}>
                            Install HTU LAMAS
                        </h4>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            App
                        </span>
                    </div>
                    <p className="text-xs mt-1 leading-snug line-clamp-2" style={{ color: "var(--text-muted)" }}>
                        Install as a standalone app for fast offline access and instant launching.
                    </p>

                    <div className="flex items-center gap-2 mt-3.5">
                        <button
                            type="button"
                            onClick={handleInstall}
                            disabled={loading}
                            className="flex-1 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Install Now</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleDismiss}
                            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                        >
                            Not Now
                        </button>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleDismiss}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0 cursor-pointer"
                    aria-label="Dismiss install banner"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </aside>
    );
}
