"use client";

import React from "react";
import { useTerm } from "@/context/TermContext";
import { Lock, ShieldAlert, Sparkles } from "lucide-react";

export default function ArchiveModeBanner() {
    const { isArchiveMode, selectedTerm, activeTerm, setSelectedTermId } = useTerm();

    if (!isArchiveMode || !selectedTerm) {
        return null;
    }

    return (
        <div className="sticky top-0 z-40 bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-amber-500/20 dark:from-amber-950/50 dark:via-amber-900/40 dark:to-amber-950/50 border-b border-amber-500/30 text-amber-950 dark:text-amber-100 backdrop-blur-xl px-4 py-2.5 shadow-sm transition-all duration-300 animate-in slide-in-from-top-2">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs font-medium">
                {/* Left side info */}
                <div className="flex items-center gap-2.5 text-center sm:text-left">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/30 shadow-inner">
                        <Lock className="w-4 h-4" />
                    </span>
                    <div>
                        <div className="font-bold flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                            <span>Viewing Archive Snapshot:</span>
                            <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 font-extrabold border border-amber-500/30">
                                {selectedTerm.name}
                            </span>
                        </div>
                        <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5 flex items-center gap-1 justify-center sm:justify-start">
                            <ShieldAlert className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            Read-Only Workspace — Form submissions, reviews, dispatches, and edit actions are disabled.
                        </p>
                    </div>
                </div>

                {/* Right side CTA button */}
                {activeTerm && (
                    <button
                        type="button"
                        onClick={() => setSelectedTermId(activeTerm.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-900 hover:bg-amber-950 dark:bg-amber-200 dark:hover:bg-amber-100 text-white dark:text-amber-950 font-bold text-xs shadow-md transition-all hover:scale-105 active:scale-95 shrink-0"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                        <span>Return to Live Workspace</span>
                    </button>
                )}
            </div>
        </div>
    );
}
