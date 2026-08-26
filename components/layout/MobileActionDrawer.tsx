"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { 
    Settings, LogOut, Moon, Sun, Building, Library, 
    Bell, X, ChevronRight, Leaf
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import TermSwitcher from "@/components/workspace/TermSwitcher";

interface MobileActionDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MobileActionDrawer({ isOpen, onClose }: MobileActionDrawerProps) {
    const { data: session } = useSession();
    const pathname = usePathname();
    const { theme, cycle } = useTheme();

    // Close on ESC
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "hidden";
        }
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [isOpen, onClose]);

    // Close on route change
    useEffect(() => {
        if (isOpen) {
            onClose();
        }
    }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!isOpen) return null;

    const user = session?.user as any;
    const name = user?.name || "Academic User";
    const email = user?.email || "";
    const role = user?.role || "LECTURER";
    const initials = name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();

    const isLecturer = role === "LECTURER";
    const isHOD = role === "HOD";

    return (
        <div className="fixed inset-0 z-50 lg:hidden animate-in fade-in duration-200">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
                onClick={onClose}
            />

            {/* Slide-Up Sheet Container */}
            <div 
                className="absolute inset-x-0 bottom-0 max-h-[85vh] rounded-t-3xl bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300"
                style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
            >
                {/* Drag Handle & Close Header */}
                <div className="flex flex-col items-center pt-3 pb-2 px-6 relative shrink-0">
                    <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mb-3" />
                    <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Quick Navigation & Controls</span>
                        <button 
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto px-5 py-3 space-y-5">
                    {/* User Profile Card */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-base flex items-center justify-center shadow-md shadow-blue-500/20">
                                {initials}
                            </div>
                            <div>
                                <div className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                                    {name}
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[180px]">
                                    {email}
                                </div>
                                <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                    {role.replace("_", " ")}
                                </span>
                            </div>
                        </div>

                        <Link
                            href="/profile"
                            onClick={onClose}
                            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 text-xs font-bold shadow-2xs border border-slate-200 dark:border-slate-600"
                        >
                            View
                        </Link>
                    </div>

                    {/* Academic Term Switcher Section */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            Academic Period Selection
                        </div>
                        <div className="w-full flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Active Working Term:</span>
                            <TermSwitcher />
                        </div>
                    </div>

                    {/* Theme & Display Options */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                theme === "dark"
                                    ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                                    : theme === "sage"
                                    ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                                    : "bg-amber-500/15 text-amber-600 border border-amber-500/30"
                            }`}>
                                {theme === "dark"
                                    ? <Moon className="w-4 h-4 fill-sky-400/30 stroke-[2.2]" />
                                    : theme === "sage"
                                    ? <Leaf className="w-4 h-4 stroke-[2.2]" />
                                    : <Sun className="w-4 h-4 fill-amber-400/30 stroke-[2.2]" />}
                            </div>
                            <div>
                                <div className="text-xs font-extrabold text-slate-900 dark:text-white">Interface Theme</div>
                                <div className="text-[11px] text-slate-400 font-semibold">
                                    {theme === "dark" ? "Dark Mode (Twitter Dim)" : theme === "sage" ? "Academic Sage" : "Light Mode"}
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={cycle}
                            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shadow-2xs cursor-pointer flex items-center gap-1.5"
                        >
                            {theme === "dark" ? (
                                <>
                                    <Leaf className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>Sage</span>
                                </>
                            ) : theme === "sage" ? (
                                <>
                                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Light</span>
                                </>
                            ) : (
                                <>
                                    <Moon className="w-3.5 h-3.5 text-blue-500" />
                                    <span>Dark</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Quick App Navigation Links */}
                    <div className="space-y-1.5">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-1 mb-2">
                            Quick Links
                        </div>

                        <Link
                            href="/settings"
                            onClick={onClose}
                            className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition font-bold text-xs"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                    <Settings className="w-4 h-4" />
                                </div>
                                <span>Settings & System Preferences</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                        </Link>

                        {(isLecturer || isHOD) && (
                            <Link
                                href={isLecturer ? "/lecturer/resources" : "/hod/resources"}
                                onClick={onClose}
                                className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition font-bold text-xs"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                        <Library className="w-4 h-4" />
                                    </div>
                                    <span>Curriculum & Resource Files</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                            </Link>
                        )}

                        {(isLecturer || isHOD) && (
                            <Link
                                href="/lecturer/department"
                                onClick={onClose}
                                className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition font-bold text-xs"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                                        <Building className="w-4 h-4" />
                                    </div>
                                    <span>Department Colleagues Directory</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                            </Link>
                        )}

                        <Link
                            href="/notifications"
                            onClick={onClose}
                            className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition font-bold text-xs"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                    <Bell className="w-4 h-4" />
                                </div>
                                <span>Notifications & Alerts</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                        </Link>
                    </div>

                    {/* Sign Out Button */}
                    <button
                        type="button"
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="w-full py-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-extrabold text-xs flex items-center justify-center gap-2 border border-rose-200 dark:border-rose-900/50 transition cursor-pointer"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out of HTU LAMAS</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
