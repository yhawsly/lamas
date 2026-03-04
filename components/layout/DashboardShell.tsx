"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import NotificationBell from "@/components/ui/NotificationBell";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // The sidebar state starts closed, so no need to set it on mount.

    // Close on ESC key
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSidebarOpen(false); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
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

            {/* ── Sidebar ── */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* ── Main content area ── */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top bar (Visible on all screens, but hamburger is mobile-only) */}
                <header className="flex items-center justify-between px-4 lg:px-8 py-3 lg:py-4 border-b sticky top-0 z-20"
                    style={{ background: "var(--bg-base)", borderColor: "var(--bg-border)" }}>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
                            style={{ color: "var(--text-primary)" }}
                            aria-label="Open menu"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        {/* Brand on mobile */}
                        <div className="flex items-center gap-2 lg:hidden">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                </svg>
                            </div>
                            <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>LAMAS</span>
                        </div>
                    </div> {/* End left side flex */}

                    {/* Right side global actions */}
                    <div className="flex items-center gap-3">
                        <NotificationBell />
                    </div>
                </header>

                <main className="flex-1 overflow-auto">
                    <div className="p-4 md:p-6 lg:p-8">{children}</div>
                </main>
            </div>
        </div>
    );
}
