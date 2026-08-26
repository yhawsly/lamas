"use client";
import { 
    Home, 
    Megaphone, 
    ClipboardList, 
    Eye, 
    Library, 
    FileText, 
    Bell, 
    Map, 
    Users, 
    BarChart2,
    BookOpen,
    Calendar,
    PanelLeftClose,
    PanelLeftOpen
} from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

const navByRole: Record<string, { label: string; href: string; icon: React.ReactNode }[]> = {
    LECTURER: [
        { label: "Dashboard", href: "/lecturer", icon: <Home className="w-5 h-5 shrink-0" /> },
        { label: "Appraisals & Reviews", href: "/lecturer/appraisals", icon: <Eye className="w-5 h-5 shrink-0" /> },
        { label: "Course Syllabus", href: "/lecturer/courses", icon: <ClipboardList className="w-5 h-5 shrink-0" /> },
        { label: "Resources", href: "/lecturer/resources", icon: <Library className="w-5 h-5 shrink-0" /> },
        { label: "My Reports", href: "/lecturer/reports", icon: <FileText className="w-5 h-5 shrink-0" /> },
        { label: "Colleagues", href: "/lecturer/department", icon: <Megaphone className="w-5 h-5 shrink-0" /> },
        { label: "Notifications", href: "/notifications", icon: <Bell className="w-5 h-5 shrink-0" /> },
    ],
    HOD: [
        { label: "Dashboard", href: "/hod", icon: <Home className="w-5 h-5 shrink-0" /> },
        { label: "Staff & Reviews", href: "/hod/staff", icon: <Users className="w-5 h-5 shrink-0" /> },
        { label: "Resources", href: "/hod/resources", icon: <Library className="w-5 h-5 shrink-0" /> },
        { label: "Academics", href: "/hod/curriculum", icon: <Map className="w-5 h-5 shrink-0" /> },
        { label: "Reports", href: "/hod/reports", icon: <FileText className="w-5 h-5 shrink-0" /> },
        { label: "Notifications", href: "/notifications", icon: <Bell className="w-5 h-5 shrink-0" /> },
    ],
    DEO: [
        { label: "Course Allocations", href: "/deo/allocations", icon: <BookOpen className="w-5 h-5 shrink-0" /> },
        { label: "Curriculum Vetting", href: "/deo/vetting", icon: <FileText className="w-5 h-5 shrink-0" /> },
        { label: "Peer Review Hub", href: "/deo", icon: <ClipboardList className="w-5 h-5 shrink-0" /> },
        { label: "Invigilation Matrix", href: "/deo/invigilation", icon: <Calendar className="w-5 h-5 shrink-0" /> },
        { label: "Notifications", href: "/notifications", icon: <Bell className="w-5 h-5 shrink-0" /> },
    ],
    ADMIN: [
        { label: "Dashboard", href: "/admin", icon: <Home className="w-5 h-5 shrink-0" /> },
        { label: "User Management", href: "/admin/users", icon: <Users className="w-5 h-5 shrink-0" /> },
        { label: "Submissions", href: "/admin/submissions", icon: <ClipboardList className="w-5 h-5 shrink-0" /> },
        { label: "Academics", href: "/admin/curriculum", icon: <Map className="w-5 h-5 shrink-0" /> },
        { label: "System Insights", href: "/admin/analytics", icon: <BarChart2 className="w-5 h-5 shrink-0" /> },
        { label: "Communications", href: "/admin/notify", icon: <Megaphone className="w-5 h-5 shrink-0" /> },
        { label: "Notifications", href: "/notifications", icon: <Bell className="w-5 h-5 shrink-0" /> },
    ],
    SUPER_ADMIN: [
        { label: "Dashboard", href: "/admin", icon: <Home className="w-5 h-5 shrink-0" /> },
        { label: "User Management", href: "/admin/users", icon: <Users className="w-5 h-5 shrink-0" /> },
        { label: "Submissions", href: "/admin/submissions", icon: <ClipboardList className="w-5 h-5 shrink-0" /> },
        { label: "Academics", href: "/admin/curriculum", icon: <Map className="w-5 h-5 shrink-0" /> },
        { label: "System Insights", href: "/admin/analytics", icon: <BarChart2 className="w-5 h-5 shrink-0" /> },
        { label: "Communications", href: "/admin/notify", icon: <Megaphone className="w-5 h-5 shrink-0" /> },
        { label: "Notifications", href: "/notifications", icon: <Bell className="w-5 h-5 shrink-0" /> },
    ],
};

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

export default function Sidebar({ isOpen = false, onClose, isCollapsed = false, onToggleCollapse }: SidebarProps) {
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
                // Base styles & dynamic width
                "w-64 h-screen flex flex-col shrink-0 z-40 transition-all duration-300",
                isCollapsed ? "lg:w-20" : "lg:w-64",
                // Fixed on all screens
                "fixed top-0 left-0",
                // Show/hide on mobile via translate
                isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
            ].join(" ")}
            style={{ background: "var(--bg-sidebar)", borderRight: "1px solid var(--bg-border)" }}
        >
            {/* Brand Header */}
            <div className={`p-4 ${isCollapsed ? "lg:p-3" : "sm:p-5"} bg-gradient-to-br ${roleColors[role] || roleColors.LECTURER} transition-all duration-300`}>
                <div className={`flex items-center ${isCollapsed ? "lg:justify-center justify-between" : "justify-between"} gap-3`}>
                    <Link href="/" className={`flex items-center gap-3 group ${isCollapsed ? "lg:justify-center" : ""}`}>
                        <div className="w-11 h-11 rounded-2xl bg-white p-1 flex items-center justify-center shadow-lg shadow-black/10 shrink-0 border border-white/60 group-hover:scale-105 transition-transform duration-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/htu-logo.png" alt="HTU Official Crest" className="w-full h-full object-contain" />
                        </div>
                        <div className={`min-w-0 ${isCollapsed ? "lg:hidden" : "block"}`}>
                            <div className="text-white font-black text-base tracking-wide leading-tight whitespace-nowrap">HTU LAMAS</div>
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
            <nav className={`flex-1 ${isCollapsed ? "lg:px-2 px-3" : "p-3"} py-3 space-y-1 overflow-y-auto transition-all duration-300`}>
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
                            className={`flex items-center ${isCollapsed ? "lg:justify-center lg:px-0 px-3" : "px-3"} py-2.5 rounded-xl text-sm transition-all relative group ${
                                !mounted 
                                    ? "text-slate-500 dark:text-slate-400" 
                                    : isActive 
                                        ? activeStyles[role] || activeStyles.LECTURER 
                                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                            suppressHydrationWarning
                        >
                            <span>{item.icon}</span>
                            <span className={`truncate ml-3 ${isCollapsed ? "lg:hidden" : "block"}`}>{item.label}</span>

                            {/* Notifications Badge in Expanded & Mobile view */}
                            {item.label === "Notifications" && unread > 0 && (
                                <>
                                    <span className={`ml-auto text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold ${isCollapsed ? "lg:hidden" : "flex"}`}>
                                        {unread > 9 ? "9+" : unread}
                                    </span>
                                    {/* Mini dot in collapsed desktop view */}
                                    {isCollapsed && (
                                        <span className="hidden lg:block absolute top-2 right-3 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
                                    )}
                                </>
                            )}

                            {/* Tooltip on Collapsed Desktop view */}
                            {isCollapsed && (
                                <div className="hidden lg:group-hover:flex absolute left-full ml-3.5 px-3 py-2 bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-2xl z-50 whitespace-nowrap pointer-events-none items-center gap-2 border border-slate-700/60 animate-in fade-in zoom-in-95 duration-150">
                                    <span>{item.label}</span>
                                    {item.label === "Notifications" && unread > 0 && (
                                        <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                                            {unread > 9 ? "9+" : unread}
                                        </span>
                                    )}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Desktop Collapse / Expand Toggle Button at Footer */}
            <div className="hidden lg:block p-3 border-t mt-auto" style={{ borderColor: "var(--bg-border)" }}>
                <button
                    type="button"
                    onClick={onToggleCollapse}
                    className={`w-full flex items-center ${isCollapsed ? "justify-center px-0" : "justify-between px-3"} py-2.5 rounded-xl text-xs font-bold transition-all text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer`}
                    title={isCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
                    aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    {!isCollapsed && (
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Collapse Menu</span>
                    )}
                    {isCollapsed ? (
                        <PanelLeftOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    ) : (
                        <PanelLeftClose className="w-5 h-5 text-slate-500" />
                    )}
                </button>
            </div>
        </aside>
    );
}
