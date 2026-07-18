"use client";
import { Home, Megaphone, ClipboardList, Eye, Library, FileText, Bell, FileEdit, Map, Inbox, Users, BookOpen, CheckCircle, User, Clock, BarChart2, Calendar, Building, Search, LogOut } from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

const navByRole: Record<string, { label: string; href: string; icon: React.ReactNode }[]> = {
    LECTURER: [
        { label: "Dashboard", href: "/lecturer", icon: <Home className="w-5 h-5" /> },
        { label: "My Department", href: "/lecturer/department", icon: <Megaphone className="w-5 h-5" /> },
        { label: "Course Syllabus", href: "/lecturer/courses", icon: <ClipboardList className="w-5 h-5" /> },
        { label: "Appraisals & Reviews", href: "/lecturer/appraisals", icon: <Eye className="w-5 h-5" /> },
        { label: "Resources", href: "/lecturer/resources", icon: <Library className="w-5 h-5" /> },
        { label: "My Reports", href: "/lecturer/reports", icon: <FileText className="w-5 h-5" /> },
        { label: "Notifications", href: "/notifications", icon: <Bell className="w-5 h-5" /> },
    ],
    HOD: [
        { label: "Dashboard", href: "/hod", icon: <Home className="w-5 h-5" /> },
        { label: "Academics", href: "/hod/curriculum", icon: <Map className="w-5 h-5" /> },
        { label: "Staff & Reviews", href: "/hod/staff", icon: <Users className="w-5 h-5" /> },
        { label: "Reports", href: "/hod/reports", icon: <FileText className="w-5 h-5" /> },
        { label: "Resources", href: "/lecturer/resources", icon: <Library className="w-5 h-5" /> },
        { label: "Resource Approvals", href: "/hod/resources", icon: <CheckCircle className="w-5 h-5" /> },
        { label: "Notifications", href: "/notifications", icon: <Bell className="w-5 h-5" /> },
    ],
    DEO: [
        { label: "Dashboard", href: "/deo", icon: <Home className="w-5 h-5" /> },
        { label: "Notifications", href: "/notifications", icon: <Bell className="w-5 h-5" /> },
    ],
    ADMIN: [
        { label: "Dashboard", href: "/admin", icon: <Home className="w-5 h-5" /> },
        { label: "User Management", href: "/admin/users", icon: <Users className="w-5 h-5" /> },
        { label: "Academics", href: "/admin/curriculum", icon: <Map className="w-5 h-5" /> },
        { label: "Submissions", href: "/admin/submissions", icon: <ClipboardList className="w-5 h-5" /> },
        { label: "System Insights", href: "/admin/analytics", icon: <BarChart2 className="w-5 h-5" /> },
        { label: "Communications", href: "/admin/notify", icon: <Megaphone className="w-5 h-5" /> },
        { label: "Notifications", href: "/notifications", icon: <Bell className="w-5 h-5" /> },
    ],
    SUPER_ADMIN: [
        { label: "Dashboard", href: "/admin", icon: <Home className="w-5 h-5" /> },
        { label: "User Management", href: "/admin/users", icon: <Users className="w-5 h-5" /> },
        { label: "Academics", href: "/admin/curriculum", icon: <Map className="w-5 h-5" /> },
        { label: "Submissions", href: "/admin/submissions", icon: <ClipboardList className="w-5 h-5" /> },
        { label: "System Insights", href: "/admin/analytics", icon: <BarChart2 className="w-5 h-5" /> },
        { label: "Communications", href: "/admin/notify", icon: <Megaphone className="w-5 h-5" /> },
        { label: "Notifications", href: "/notifications", icon: <Bell className="w-5 h-5" /> },
    ],
};

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const { data: session } = useSession();
    const pathname = usePathname();
    const role = (session?.user as any)?.role || "LECTURER";
    const nav = navByRole[role] || navByRole.LECTURER;
    const profileHref = "/settings";
    const { data: notificationsData } = useSWR("/api/notifications", fetcher, {
        refreshInterval: 30000,
        dedupingInterval: 5000,
    });
    const unread = Array.isArray(notificationsData?.data)
        ? notificationsData.data.filter((n: any) => !n.read).length
        : 0;
    useTheme();

    // Close sidebar on route change (mobile)
    const prevPath = useState(pathname)[0];
    useEffect(() => {
        if (pathname !== prevPath) onClose?.();
    }, [pathname]); // eslint-disable-line

    

    // SWR handles fetching and caching automatically

    const roleColors: Record<string, string> = {
        SUPER_ADMIN: "from-purple-600 to-violet-700",
        ADMIN: "from-rose-600 to-red-700",
        HOD: "from-amber-500 to-orange-600",
        DEO: "from-emerald-500 to-teal-700",
        LECTURER: "from-blue-600 to-indigo-700",
    };

    const roleBadgeColors: Record<string, string> = {
        SUPER_ADMIN: "bg-purple-500/20 text-purple-300",
        ADMIN: "bg-rose-500/20 text-rose-300",
        HOD: "bg-amber-500/20 text-amber-300",
        DEO: "bg-emerald-500/20 text-emerald-300",
        LECTURER: "bg-blue-500/20 text-blue-300",
    };

    const activeStyles: Record<string, string> = {
        SUPER_ADMIN: "bg-purple-500/10 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 font-bold",
        ADMIN: "bg-rose-500/10 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 font-bold",
        HOD: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 font-bold",
        DEO: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 font-bold",
        LECTURER: "bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 font-bold",
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





            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                {nav.map((item) => {
                    const isDashboard = ["/lecturer", "/hod", "/admin", "/deo"].includes(item.href);
                    const isActive = isDashboard 
                        ? pathname === item.href 
                        : pathname === item.href || pathname?.startsWith(item.href + "/");
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            onClick={onClose}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${!mounted ? "text-slate-500 dark:text-slate-400" : isActive ? activeStyles[role] || activeStyles.LECTURER : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                            suppressHydrationWarning
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                            {item.label === "Notifications" && unread > 0 && (
                                <span className="ml-auto text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                                    {unread > 9 ? "9+" : unread}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>


        </aside>
    );
}
