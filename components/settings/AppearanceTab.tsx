"use client";

import { useState, useEffect } from "react";
import { 
    Palette, Sun, Moon, Monitor, Eye, 
    Sparkles, CheckCircle2, Sliders, LayoutGrid, Check 
} from "lucide-react";

export default function AppearanceTab() {
    const [theme, setThemeState] = useState<"light" | "dark">("dark");
    const [mounted, setMounted] = useState(false);
    const [compactMode, setCompactMode] = useState(false);
    const [reduceMotion, setReduceMotion] = useState(false);
    const [savedMsg, setSavedMsg] = useState<string | null>(null);

    useEffect(() => {
        const saved = (localStorage.getItem("lamas-theme") as "light" | "dark") || "dark";
        const storedCompact = localStorage.getItem("lamas_compact_mode") === "true";
        const storedMotion = localStorage.getItem("lamas_reduce_motion") === "true";
        setThemeState(saved);
        setCompactMode(storedCompact);
        setReduceMotion(storedMotion);
        setMounted(true);
    }, []);

    const handleThemeChange = (newTheme: "light" | "dark") => {
        setThemeState(newTheme);
        localStorage.setItem("lamas-theme", newTheme);
        document.documentElement.classList.toggle("dark", newTheme === "dark");
        setSavedMsg(`Switched to ${newTheme} mode.`);
        setTimeout(() => setSavedMsg(null), 2500);
    };

    const handleToggleCompact = () => {
        const newVal = !compactMode;
        setCompactMode(newVal);
        localStorage.setItem("lamas_compact_mode", String(newVal));
        setSavedMsg("Display density updated.");
        setTimeout(() => setSavedMsg(null), 2500);
    };

    const handleToggleMotion = () => {
        const newVal = !reduceMotion;
        setReduceMotion(newVal);
        localStorage.setItem("lamas_reduce_motion", String(newVal));
        setSavedMsg("Motion preferences updated.");
        setTimeout(() => setSavedMsg(null), 2500);
    };

    if (!mounted) return null;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <Palette className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    Appearance & Display Preferences
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                    Customize your visual workspace, color theme, and accessibility settings.
                </p>
            </div>

            {savedMsg && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold text-sm flex items-center gap-2 shadow-xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    {savedMsg}
                </div>
            )}

            {/* Theme Mode Selector */}
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-6 shadow-xs space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">Color Theme</h3>
                        <p className="text-xs text-slate-500">Choose how HTU LAMAS appears on your device</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={() => handleThemeChange("light")}
                        className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            theme === "light"
                                ? "bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-500 shadow-md ring-2 ring-indigo-500/20"
                                : "bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-amber-500 shadow-xs">
                                <Sun className="w-5 h-5" />
                            </div>
                            {theme === "light" && <Check className="w-5 h-5 text-indigo-600" />}
                        </div>
                        <div className="mt-4">
                            <div className="font-bold text-sm text-slate-900 dark:text-white">Light Mode</div>
                            <p className="text-xs text-slate-500 mt-0.5">Crisp, high-clarity academic daytime view</p>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleThemeChange("dark")}
                        className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            theme === "dark"
                                ? "bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-500 shadow-md ring-2 ring-indigo-500/20"
                                : "bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-indigo-400 shadow-xs">
                                <Moon className="w-5 h-5" />
                            </div>
                            {theme === "dark" && <Check className="w-5 h-5 text-indigo-400" />}
                        </div>
                        <div className="mt-4">
                            <div className="font-bold text-sm text-slate-900 dark:text-white">Dark Mode</div>
                            <p className="text-xs text-slate-500 mt-0.5">Deep slate palette tailored for low-light focus</p>
                        </div>
                    </button>
                </div>
            </div>

            {/* Accessibility & Interface Density */}
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-6 shadow-xs space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Sliders className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">Workspace Density & Accessibility</h3>
                        <p className="text-xs text-slate-500">Fine-tune dashboard density and visual comfort</p>
                    </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    <div className="py-4 flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">Compact Table & Form Density</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">Reduce padding on courses, timetables, and submission lists to fit more data on screen.</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleToggleCompact}
                            className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ml-4 cursor-pointer ${
                                compactMode ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"
                            }`}
                        >
                            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                                compactMode ? "left-7" : "left-1"
                            }`} />
                        </button>
                    </div>

                    <div className="py-4 flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">Reduce Dynamic Animations</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">Disable smooth sliding and fade transitions for lower battery consumption or motion sensitivity.</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleToggleMotion}
                            className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ml-4 cursor-pointer ${
                                reduceMotion ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"
                            }`}
                        >
                            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                                reduceMotion ? "left-7" : "left-1"
                            }`} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
