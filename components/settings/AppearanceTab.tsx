"use client";

import { useState } from "react";
import { 
    Palette, Sun, Moon, 
    Sparkles, CheckCircle2, Sliders, Check 
} from "lucide-react";
import { useTheme, Theme } from "@/components/ThemeProvider";

export default function AppearanceTab() {
    const { theme, setTheme } = useTheme();
    const [compactMode, setCompactMode] = useState<boolean>(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("lamas_compact_mode") === "true";
        }
        return false;
    });
    const [reduceMotion, setReduceMotion] = useState<boolean>(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("lamas_reduce_motion") === "true";
        }
        return false;
    });
    const [savedMsg, setSavedMsg] = useState<string | null>(null);

    const handleThemeChange = (newTheme: Theme) => {
        setTheme(newTheme);
        const themeLabels: Record<Theme, string> = {
            light: "Light Mode",
            dark: "Dark Mode (Twitter Dim)",
            glass: "Frost Mode"
        };
        setSavedMsg(`Switched to ${themeLabels[newTheme]}.`);
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

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                    <Palette className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    Appearance & Display Preferences
                </h2>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
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
            <div className="rounded-2xl border p-6 shadow-xs space-y-6" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                <div className="flex items-center gap-3 border-b pb-4" style={{ borderColor: "var(--bg-border)" }}>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Color Theme</h3>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>Choose how HTU LAMAS appears on your device</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                    {/* 1. Light Mode Card */}
                    <button
                        type="button"
                        onClick={() => handleThemeChange("light")}
                        className={`p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                            theme === "light"
                                ? "bg-amber-50/70 border-amber-500 shadow-md ring-2 ring-amber-500/25"
                                : "hover:border-slate-300"
                        }`}
                        style={theme !== "light" ? { backgroundColor: "var(--bg-hover)", borderColor: "var(--bg-border)" } : {}}
                    >
                        <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl bg-amber-100/90 border border-amber-300 flex items-center justify-center shadow-xs">
                                <Sun className="w-5 h-5 text-amber-600 fill-amber-400/40 stroke-[2.2]" />
                            </div>
                            {theme === "light" && <Check className="w-5 h-5 text-amber-600" />}
                        </div>
                        <div className="mt-4">
                            <div className="font-extrabold text-sm text-slate-900 truncate">Light Mode</div>
                            <p className="text-xs text-slate-500 mt-0.5">Crisp academic daytime view</p>
                        </div>
                    </button>

                    {/* 2. Twitter Dim Dark Mode Card */}
                    <button
                        type="button"
                        onClick={() => handleThemeChange("dark")}
                        className={`p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                            theme === "dark"
                                ? "bg-[#1E2732] border-[#1D9BF0] shadow-md ring-2 ring-[#1D9BF0]/30 text-white"
                                : "hover:border-slate-600"
                        }`}
                        style={theme !== "dark" ? { backgroundColor: "var(--bg-hover)", borderColor: "var(--bg-border)" } : {}}
                    >
                        <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl bg-[#15202B] border border-[#253341] flex items-center justify-center shadow-xs">
                                <Moon className="w-5 h-5 text-[#1D9BF0] fill-[#1D9BF0]/30 stroke-[2.2]" />
                            </div>
                            {theme === "dark" && <Check className="w-5 h-5 text-[#1D9BF0]" />}
                        </div>
                        <div className="mt-4">
                            <div className="font-extrabold text-sm" style={{ color: theme === "dark" ? "#FFFFFF" : "var(--text-primary)" }}>Dark Mode</div>
                            <p className="text-xs mt-0.5" style={{ color: theme === "dark" ? "#8B98A5" : "var(--text-muted)" }}>Twitter Dim dark navy view</p>
                        </div>
                    </button>

                    {/* 3. Frost Mode Card */}
                    <button
                        type="button"
                        onClick={() => handleThemeChange("glass")}
                        className={`p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                            theme === "glass"
                                ? "bg-sky-50/80 dark:bg-sky-950/40 border-sky-500 shadow-md ring-2 ring-sky-500/25"
                                : "hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                        style={theme !== "glass" ? { backgroundColor: "var(--bg-hover)", borderColor: "var(--bg-border)" } : {}}
                    >
                        <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl bg-sky-100/90 dark:bg-sky-900/60 border border-sky-300 dark:border-sky-700 flex items-center justify-center shadow-xs">
                                <Sparkles className="w-5 h-5 text-sky-600 dark:text-sky-300 stroke-[2.2]" />
                            </div>
                            {theme === "glass" && <Check className="w-5 h-5 text-sky-600 dark:text-sky-400" />}
                        </div>
                        <div className="mt-4">
                            <div className="font-extrabold text-sm" style={{ color: "var(--text-primary)" }}>Frost Mode</div>
                            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>iPhone frosted glass & acrylic look</p>
                        </div>
                    </button>
                </div>
            </div>

            {/* Accessibility & Interface Density */}
            <div className="rounded-2xl border p-6 shadow-xs space-y-6" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                <div className="flex items-center gap-3 border-b pb-4" style={{ borderColor: "var(--bg-border)" }}>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Sliders className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Workspace Density & Accessibility</h3>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>Fine-tune dashboard density and visual comfort</p>
                    </div>
                </div>

                <div className="divide-y" style={{ borderColor: "var(--bg-border)" }}>
                    <div className="py-4 flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-xs" style={{ color: "var(--text-primary)" }}>Compact Table & Form Density</h4>
                            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Reduce padding on courses, timetables, and submission lists to fit more data on screen.</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleToggleCompact}
                            className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ml-4 cursor-pointer ${
                                compactMode ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
                            }`}
                        >
                            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                                compactMode ? "left-7" : "left-1"
                            }`} />
                        </button>
                    </div>

                    <div className="py-4 flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-xs" style={{ color: "var(--text-primary)" }}>Reduce Dynamic Animations</h4>
                            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Disable smooth sliding and fade transitions for lower battery consumption or motion sensitivity.</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleToggleMotion}
                            className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ml-4 cursor-pointer ${
                                reduceMotion ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
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
