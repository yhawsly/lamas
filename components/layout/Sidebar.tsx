"use client";
import { Home, Megaphone, ClipboardList, Eye, Library, FileText, Bell, Map, Users, BarChart2 } from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

const navByRole: Record<string, { label: string; href: string; icon: React.ReactNode }[]> = {
    LECTURER: [
        { label: "Dashboard", href: "/lecturer", icon: <Home className="w-5 h-5" /> },
        { label: "Appraisals & Reviews", href: "/lecturer/appraisals", icon: <Eye className="w-5 h-5" /> },
        { label: "Course Syllabus", href: "/lecturer/courses", icon: <ClipboardList className="w-5 h-5" /> },
        { label: "Resources", href: "/lecturer/resources", icon: <Library className="w-5 h-5" /> },
        { label: "My Reports", href: "/lecturer/reports", icon: <FileText className="w-5 h-5" /> },
        { label: "Colleagues", href: "/lecturer/department", icon: <Megaphone className="w-5 h-5" /> },
        { label: "Notifications", href: "/notifications", icon: <Bell className="w-5 h-5" /> },
    ],
    HOD: [
        { label: "Dashboard", href: "/hod", icon: <Home className="w-5 h-5" /> },
        { label: "Staff & Reviews", href: "/hod/staff", icon: <Users className="w-5 h-5" /> },
        { label: "Resources", href: "/hod/resources", icon: <Library className="w-5 h-5" /> },
        { label: "Academics", href: "/hod/curriculum", icon: <Map className="w-5 h-5" /> },
        { label: "Reports", href: "/hod/reports", icon: <FileText className="w-5 h-5" /> },
        { label: "Notifications", href: "/notifications", icon: <Bell className="w-5 h-5" /> },
    ],
    DEO: [
        { label: "Dispatch Hub", href: "/deo", icon: <Home className="w-5 h-5" /> },
        { label: "Notifications", href: "/notifications", icon: <Bell className="w-5 h-5" /> },
    ],
    ADMIN: [
        { label: "Dashboard", href: "/admin", icon: <Home className="w-5 h-5" /> },
        { label: "User Management", href: "/admin/users", icon: <Users className="w-5 h-5" /> },
        { label: "Submissions", href: "/admin/submissions", icon: <ClipboardList className="w-5 h-5" /> },
        { label: "Academics", href: "/admin/curriculum", icon: <Map className="w-5 h-5" /> },
        { label: "System Insights", href: "/admin/analytics", icon: <BarChart2 className="w-5 h-5" /> },
        { label: "Communications", href: "/admin/notify", icon: <Megaphone className="w-5 h-5" /> },
        { label: "Notifications", href: "/notifications", icon: <Bell className="w-5 h-5" /> },
    ],
    SUPER_ADMIN: [
        { label: "Dashboard", href: "/admin", icon: <Home className="w-5 h-5" /> },
        { label: "User Management", href: "/admin/users", icon: <Users className="w-5 h-5" /> },
        { label: "Submissions", href: "/admin/submissions", icon: <ClipboardList className="w-5 h-5" /> },
        { label: "Academics", href: "/admin/curriculum", icon: <Map className="w-5 h-5" /> },
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
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    const { data: session } = useSession();
    const pathname = usePathname();

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
    const nav = navByRole[role] || navByRole.LECTURER;
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
            {/* Brand Header */}
            <div className={`p-4 sm:p-5 bg-gradient-to-br ${roleColors[role] || roleColors.LECTURER}`}>
                <div className="flex items-center justify-between gap-3">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-11 h-11 rounded-2xl bg-white p-1 flex items-center justify-center shadow-lg shadow-black/10 shrink-0 border border-white/60 group-hover:scale-105 transition-transform duration-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/htu-logo.png" alt="HTU Official Crest" className="w-full h-full object-contain" />
                        </div>
                        <div className="min-w-0">
                            <div className="text-white font-black text-base tracking-wide leading-tight">HTU LAMAS</div>
                            <div className="text-white/85 text-[10px] font-bold tracking-wider uppercase mt-0.5 truncate">
                                {role === "SUPER_ADMIN" ? "Super Admin" : role === "ADMIN" ? "Admin Portal" : role === "HOD" ? "HOD Portal" : role === "DEO" ? "Exam Officer" : "Faculty Portal"}
                            </div>
                        </div>
                    </Link>

                    {/* Mobile close button */}
                    <button
                        onClick={onClose}
                        className="lg:hidden w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer"
                        style={{ background: "rgba(255, 255, 255, 0.18)" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.18)"}
                        aria-label="Close menu"
                    >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
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
