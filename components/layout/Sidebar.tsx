"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";

const navByRole: Record<string, { label: string; href: string; icon: string }[]> = {
    LECTURER: [
        { label: "Dashboard", href: "/lecturer", icon: "🏠" },
        { label: "My Department", href: "/lecturer/department", icon: "📢" },
        { label: "Course Outline", href: "/lecturer/submissions?mode=outline", icon: "📋" },
        { label: "Weekly Topics", href: "/lecturer/submissions?mode=weekly", icon: "📅" },
        { label: "Observations", href: "/lecturer/observations", icon: "👁️" },
        { label: "Resources", href: "/lecturer/resources", icon: "📚" },
        { label: "My Reports", href: "/lecturer/reports", icon: "📄" },
    ],
    HOD: [
        { label: "Dashboard", href: "/hod", icon: "🏠" },
        { label: "My Lecturers", href: "/hod/lecturers", icon: "👥" },
        { label: "Observations", href: "/hod/observations", icon: "👁️" },
        { label: "Reports", href: "/hod/reports", icon: "📄" },
        { label: "Courses", href: "/hod/courses", icon: "📖" },
        { label: "Resources", href: "/lecturer/resources", icon: "📚" },
        { label: "Resource Approvals", href: "/hod/resources", icon: "✅" },
    ],
    ADMIN: [
        { label: "Dashboard", href: "/admin", icon: "🏠" },
        { label: "Users", href: "/admin/users", icon: "👤" },
        { label: "Submissions", href: "/admin/submissions", icon: "📋" },
        { label: "Lecturers", href: "/admin/lecturers", icon: "👥" },
        { label: "Deadlines", href: "/admin/deadlines", icon: "⏰" },
        { label: "Analytics", href: "/admin/analytics", icon: "📊" },
        { label: "Reports", href: "/admin/reports", icon: "📄" },
        { label: "Courses", href: "/admin/courses", icon: "📖" },
        { label: "Academic Terms", href: "/admin/terms", icon: "🗓️" },
        { label: "Departments", href: "/admin/departments", icon: "🏢" },
        { label: "Audit Log", href: "/admin/audit", icon: "🔍" },
        { label: "Notify All", href: "/admin/notify", icon: "📢" },
    ],
    SUPER_ADMIN: [
        { label: "Dashboard", href: "/admin", icon: "🏠" },
        { label: "Users", href: "/admin/users", icon: "👤" },
        { label: "Submissions", href: "/admin/submissions", icon: "📋" },
        { label: "Lecturers", href: "/admin/lecturers", icon: "👥" },
        { label: "Deadlines", href: "/admin/deadlines", icon: "⏰" },
        { label: "Analytics", href: "/admin/analytics", icon: "📊" },
        { label: "Reports", href: "/admin/reports", icon: "📄" },
        { label: "Courses", href: "/admin/courses", icon: "📖" },
        { label: "Academic Terms", href: "/admin/terms", icon: "🗓️" },
        { label: "Departments", href: "/admin/departments", icon: "🏢" },
        { label: "Audit Log", href: "/admin/audit", icon: "🔍" },
        { label: "Notify All", href: "/admin/notify", icon: "📢" },
    ],
};

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
    const { data: session } = useSession();
    const pathname = usePathname();
    const role = (session?.user as any)?.role || "LECTURER";
    const nav = navByRole[role] || navByRole.LECTURER;
    const [unread, setUnread] = useState(0);
    useTheme();

    // Close sidebar on route change (mobile)
    const prevPath = useState(pathname)[0];
    useEffect(() => {
        if (pathname !== prevPath) onClose?.();
    }, [pathname]); // eslint-disable-line

    const [searchQ, setSearchQ] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => {
            if (searchQ.length < 2) {
                setSearchResults([]);
                return;
            }
            fetch(`/api/search?q=${searchQ}`)
                .then(r => r.json())
                .then(setSearchResults);
        }, 300);
        return () => clearTimeout(t);
    }, [searchQ]);

    useEffect(() => {
        fetch("/api/notifications")
            .then((r) => r.json())
            .then((data) => setUnread(data.filter((n: any) => !n.read).length))
            .catch(() => { });
    }, []);

    const roleColors: Record<string, string> = {
        SUPER_ADMIN: "from-purple-600 to-violet-700",
        ADMIN: "from-rose-600 to-red-700",
        HOD: "from-amber-500 to-orange-600",
        LECTURER: "from-blue-600 to-indigo-700",
    };

    const roleBadgeColors: Record<string, string> = {
        SUPER_ADMIN: "bg-purple-500/20 text-purple-300",
        ADMIN: "bg-rose-500/20 text-rose-300",
        HOD: "bg-amber-500/20 text-amber-300",
        LECTURER: "bg-blue-500/20 text-blue-300",
    };

    return (
        <aside
            className={[
                // Base styles
                "w-64 h-screen flex flex-col shrink-0 z-40 transition-transform duration-300",
                // Fixed on all screens
                "fixed top-0 left-0",
                // Show/hide on mobile via translate
                isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
            ].join(" ")}
            style={{ background: "var(--bg-sidebar)", borderRight: "1px solid var(--bg-border)" }}
        >
            {/* Brand */}
            <div className={`p-5 bg-gradient-to-br ${roleColors[role] || roleColors.LECTURER}`}>
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255, 255, 255, 0.2)" }}>
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                            </svg>
                        </div>
                        <div>
                            <div className="text-white font-bold text-lg leading-none">LAMAS</div>
                            <div className="text-white/60 text-xs mt-0.5">Academic System</div>
                        </div>
                    </div>

                    {/* Mobile close button */}
                    <button
                        onClick={onClose}
                        className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                        style={{ background: "rgba(255, 255, 255, 0.15)" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)"}
                        aria-label="Close menu"
                    >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="px-4 py-3 relative">
                <div className="relative">
                    <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        style={{ color: "var(--text-muted)" }}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        value={searchQ}
                        onChange={e => { setSearchQ(e.target.value); setShowResults(true); }}
                        onFocus={(e) => {
                            setShowResults(true);
                            e.currentTarget.style.borderColor = "var(--primary)";
                            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79, 70, 229, 0.1)";
                        }}
                        placeholder="Search LAMAS..."
                        style={{
                            backgroundColor: "var(--bg-surface)",
                            borderColor: "var(--bg-border)",
                            color: "var(--text-primary)",
                        }}
                        className="w-full border rounded-xl pl-9 pr-4 py-2 text-[13px] focus:outline-none focus:ring-2 transition-all"
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = "var(--bg-border)";
                            e.currentTarget.style.boxShadow = "none";
                        }}
                    />
                </div>

                {/* Search Results Dropdown */}
                {showResults && searchResults.length > 0 && (
                    <div
                        className="absolute left-4 right-4 mt-2 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[300px] overflow-y-auto border"
                        style={{ background: "var(--bg-surface)", borderColor: "var(--bg-border)" }}
                    >
                        <div className="p-2 space-y-1">
                            {searchResults.map((res, i) => (
                                <Link
                                    key={i}
                                    href={res.href}
                                    onClick={() => { setShowResults(false); setSearchQ(""); }}
                                    className="flex items-center gap-3 p-2 rounded-xl transition-colors"
                                    style={{
                                        color: "var(--text-primary)"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = "var(--bg-hover)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = "transparent";
                                    }}
                                >
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs"
                                        style={{ background: "var(--bg-hover)" }}
                                    >
                                        {res.category === 'Resource' ? '📚' : res.category === 'Lecturer' ? '👤' : '📋'}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xs font-bold truncate">{res.title}</div>
                                        <div className="text-[10px] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                                            {res.category}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
                {showResults && searchQ.length >= 2 && searchResults.length === 0 && (
                    <div
                        className="absolute left-4 right-4 mt-2 rounded-2xl p-4 text-center z-50 shadow-2xl border"
                        style={{ background: "var(--bg-surface)", borderColor: "var(--bg-border)" }}
                    >
                        <div style={{ color: "var(--text-muted)" }} className="text-xs">
                            No results for &quot;{searchQ}&quot;
                        </div>
                    </div>
                )}
            </div>

            {/* User info */}
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--bg-border)" }}>
                <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{session?.user?.name}</div>
                <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{session?.user?.email}</div>
                <span className={`mt-1.5 inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleBadgeColors[role]}`}>
                    {role.replace("_", " ")}
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                {nav.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            onClick={onClose}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
                            style={{
                                background: isActive ? "var(--bg-hover)" : "transparent",
                                color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                                fontWeight: isActive ? "500" : "400",
                            }}
                            onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                            onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                            {item.label === "Dashboard" && unread > 0 && (
                                <span className="ml-auto text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                                    {unread > 9 ? "9+" : unread}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom: Sign Out */}
            <div className="p-3" style={{ borderTop: "1px solid var(--bg-border)" }}>
                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
                >
                    <span>🚪</span>
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
