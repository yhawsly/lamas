"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { User, Settings, LogOut, ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import Sidebar from "@/components/layout/Sidebar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import MobileActionDrawer from "@/components/layout/MobileActionDrawer";
import NotificationBell from "@/components/ui/NotificationBell";
import ThemeToggle from "@/components/ui/ThemeToggle";
import TermSwitcher from "@/components/workspace/TermSwitcher";
import RefreshButton from "@/components/ui/RefreshButton";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Read stored collapse preference
    useEffect(() => {
        try {
            const saved = localStorage.getItem("sidebar_collapsed");
            if (saved !== null) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setIsCollapsed(saved === "true");
            }
        } catch {}
    }, []);

    const toggleCollapse = () => {
        setIsCollapsed(prev => {
            const next = !prev;
            try { localStorage.setItem("sidebar_collapsed", String(next)); } catch {}
            return next;
        });
    };

    // Keyboard shortcuts: ESC to close drawers, Ctrl/Cmd+B to toggle sidebar
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { 
            if (e.key === "Escape") {
                setSidebarOpen(false);
                setMobileDrawerOpen(false);
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === "b" || e.key === "B")) {
                e.preventDefault();
                toggleCollapse();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const { data: session } = useSession();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { mutate } = useSWRConfig();

    const handleGlobalRefresh = async () => {
        try {
            // Silently revalidate active SWR caches for live cards and lists
            await mutate(() => true, undefined, { revalidate: true });
            // Notify active components to re-fetch live data queries
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("lamas:refresh-data"));
            }
        } catch (e) {
            console.error("Global refresh error:", e);
        }
    };

    const getRoleFromPath = (path: string | null): string => {
        if (!path) return "";
        if (path.startsWith("/admin")) return "ADMIN";
        if (path.startsWith("/hod")) return "HOD";
        if (path.startsWith("/deo")) return "DEO";
        if (path.startsWith("/lecturer")) return "LECTURER";
        return "";
    };

    const sessionRole = (session?.user as any)?.role;
    const pathRole = getRoleFromPath(pathname);
    const role = sessionRole || pathRole || "LECTURER";
    
    // determine initials
    const name = session?.user?.name || "User";
    const initials = name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();

    // click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.profile-dropdown')) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <div className="flex min-h-screen" style={{ background: "var(--bg-base)" }}>
            {/* ── Mobile backdrop overlay ── */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ── Sidebar (fixed on all screens) ── */}
            <Sidebar 
                isOpen={sidebarOpen} 
                onClose={() => setSidebarOpen(false)}
                isCollapsed={isCollapsed}
                onToggleCollapse={toggleCollapse}
            />

            {/* ── Main content area (pushed right by fixed sidebar on desktop) ── */}
            <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isCollapsed ? "lg:ml-20" : "lg:ml-64"}`}>
                {/* Top bar (Visible on all screens) */}
                <header className="flex items-center justify-between px-4 lg:px-8 py-3 lg:py-4 border-b sticky top-0 z-30"
                    style={{ background: "var(--bg-base)", borderColor: "var(--bg-border)" }}>
                    <div className="flex items-center gap-3">
                        {/* Mobile hamburger menu */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                            style={{ color: "var(--text-primary)" }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "var(--bg-hover)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent";
                            }}
                            aria-label="Open menu"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        {/* Desktop sidebar collapse/expand toggle button in header */}
                        <button
                            onClick={toggleCollapse}
                            className="hidden lg:flex w-9 h-9 rounded-xl items-center justify-center transition-all text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title={isCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
                            aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                        >
                            {isCollapsed ? (
                                <PanelLeftOpen className="w-5 h-5" />
                            ) : (
                                <PanelLeftClose className="w-5 h-5" />
                            )}
                        </button>

                        {/* Brand on mobile */}
                        <div className="flex items-center gap-2.5 lg:hidden">
                            <div className="w-8 h-8 rounded-lg bg-white p-0.5 flex items-center justify-center shadow-xs border border-slate-200 dark:border-slate-800">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/htu-logo.png" alt="HTU Logo" className="w-full h-full object-contain" />
                            </div>
                            <span className="font-extrabold text-sm tracking-wide" style={{ color: "var(--text-primary)" }}>HTU LAMAS</span>
                        </div>
                    </div> {/* End left side flex */}

                    {/* Right side global actions */}
                    <div className="flex items-center gap-2 sm:gap-2.5">
                        <RefreshButton 
                            onClick={handleGlobalRefresh} 
                            iconOnly 
                            variant="ghost" 
                            size="icon" 
                            title="Refresh data (re-sync)" 
                            className="rounded-xl border border-slate-200/80 dark:border-slate-800"
                        />
                        <TermSwitcher />
                        <ThemeToggle />
                        <NotificationBell />
                        
                        <div className="relative profile-dropdown ml-1 sm:ml-2">
                            <button 
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            >
                                <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-sm border border-blue-200 dark:border-blue-500/30">
                                    {initials}
                                </div>
                                <div className="hidden sm:block text-left">
                                    <div className="text-sm font-bold leading-tight" style={{ color: "var(--text-primary)" }}>{name}</div>
                                    <div className="text-[10px] font-bold tracking-widest uppercase mt-0.5" style={{ color: "var(--text-muted)" }}>{role.replace("_", " ")}</div>
                                </div>
                                <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block ml-1" />
                            </button>

                            {dropdownOpen && (
                                <div className="absolute right-0 mt-2 w-56 rounded-2xl shadow-xl border py-2 animate-in fade-in slide-in-from-top-2"
                                    style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)", zIndex: 100 }}>
                                    
                                    <Link
                                        href="/profile"
                                        onClick={() => setDropdownOpen(false)}
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                        style={{ color: "var(--text-primary)" }}
                                    >
                                        <User className="w-4 h-4 text-blue-500" />
                                        <span className="font-medium">My Profile</span>
                                    </Link>
                                    
                                    <Link
                                        href="/settings"
                                        onClick={() => setDropdownOpen(false)}
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                        style={{ color: "var(--text-primary)" }}
                                    >
                                        <Settings className="w-4 h-4 text-blue-500" />
                                        <span className="font-medium">Settings Panel</span>
                                    </Link>
                                    
                                    <div className="my-1 border-t" style={{ borderColor: "var(--bg-border)" }}></div>
                                    
                                    <button
                                        onClick={() => signOut({ callbackUrl: "/login" })}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-rose-500"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span className="font-bold">Sign Out</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto pb-28 lg:pb-8">
                    <div className="px-3.5 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 w-full">{children}</div>
                </main>

                {/* ── Native Mobile Bottom Navigation Bar ── */}
                <MobileBottomNav onOpenDrawer={() => setMobileDrawerOpen(true)} />

                {/* ── Native Mobile Slide-Up Quick Action Drawer ── */}
                <MobileActionDrawer 
                    isOpen={mobileDrawerOpen} 
                    onClose={() => setMobileDrawerOpen(false)} 
                />
            </div>
        </div>
    );
}
