"use client";

import React from "react";
import { usePWA } from "@/context/PWAContext";
import { X, Share, PlusSquare } from "lucide-react";

export default function PWAInstallModal() {
    const { showIOSPrompt, setShowIOSPrompt } = usePWA();

    if (!showIOSPrompt) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-md rounded-3xl p-6 shadow-2xl border animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
                style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}
            >
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/htu-logo.png" alt="HTU LAMAS" className="w-8 h-8 object-contain" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-base leading-tight" style={{ color: "var(--text-primary)" }}>
                                Install HTU LAMAS
                            </h3>
                            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                                Add to your iPhone or iPad Home Screen
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowIOSPrompt(false)}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="space-y-3.5 my-6 text-xs" style={{ color: "var(--text-secondary)" }}>
                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                        <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 font-bold">
                            1
                        </div>
                        <div className="pt-0.5">
                            <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                Tap the <Share className="w-3.5 h-3.5 text-blue-500" /> Share button
                            </p>
                            <p className="text-[11px] mt-0.5 text-slate-500">Located at the bottom of Safari on iPhone, or top-right on iPad.</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                        <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 font-bold">
                            2
                        </div>
                        <div className="pt-0.5">
                            <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                Scroll down and tap <PlusSquare className="w-3.5 h-3.5 text-blue-500" /> Add to Home Screen
                            </p>
                            <p className="text-[11px] mt-0.5 text-slate-500">You may need to scroll down in the Safari share sheet.</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                        <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 font-bold">
                            3
                        </div>
                        <div className="pt-0.5">
                            <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                Tap &quot;Add&quot; in the top-right corner
                            </p>
                            <p className="text-[11px] mt-0.5 text-slate-500">LAMAS will be installed as a standalone full-screen web app.</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setShowIOSPrompt(false)}
                    className="w-full py-3 rounded-2xl font-bold text-xs text-white shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
                    style={{ backgroundColor: "var(--primary)" }}
                >
                    Got It
                </button>
            </div>
        </div>
    );
}
