"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
    Home, BookOpen, ClipboardList, Eye, Users, 
    BarChart2, Map, Bell, Menu, FileText, Calendar 
} from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface MobileBottomNavProps {
    onOpenDrawer: () => void;
}

export default function MobileBottomNav({ onOpenDrawer }: MobileBottomNavProps) {
    const pathname = usePathname();
    const { data: session } = useSession();

    const role = (session?.user as any)?.role || "LECTURER";

    // Live Unread Notification Count
    const { data: notificationsData } = useSWR("/api/notifications", fetcher, {
        refreshInterval: 30000,
        dedupingInterval: 5000,
    });
    const unreadCount = Array.isArray(notificationsData?.data)
        ? notificationsData.data.filter((n: any) => !n.read).length
        : 0;

    // Define role-specific mobile tabs
    const getTabsForRole = () => {
        switch (role) {
            case "HOD":
                return [
                    { id: "home", label: "Home", href: "/hod", icon: Home },
                    { id: "staff", label: "Staff", href: "/hod/staff", icon: Users },
                    { id: "academics", label: "Curriculum", href: "/hod/curriculum", icon: Map },
                    { id: "reports", label: "Reports", href: "/hod/reports", icon: FileText },
                    { id: "more", label: "More", action: onOpenDrawer, icon: Menu, badge: unreadCount },
                ];
            case "DEO":
                return [
                    { id: "home", label: "Hub", href: "/deo", icon: Home },
                    { id: "moderations", label: "Reviews", href: "/deo", icon: ClipboardList },
                    { id: "alerts", label: "Alerts", href: "/notifications", icon: Bell, badge: unreadCount },
                    { id: "more", label: "More", action: onOpenDrawer, icon: Menu },
                ];
            case "ADMIN":
            case "SUPER_ADMIN":
                return [
                    { id: "home", label: "Overview", href: "/admin", icon: Home },
                    { id: "users", label: "Users", href: "/admin/users", icon: Users },
                    { id: "submissions", label: "Submissions", href: "/admin/submissions", icon: ClipboardList },
                    { id: "analytics", label: "Analytics", href: "/admin/analytics", icon: BarChart2 },
                    { id: "more", label: "More", action: onOpenDrawer, icon: Menu, badge: unreadCount },
                ];
            case "LECTURER":
            default:
                return [
                    { id: "home", label: "Home", href: "/lecturer", icon: Home },
                    { id: "courses", label: "Courses", href: "/lecturer/courses", icon: BookOpen },
                    { id: "appraisals", label: "Reviews", href: "/lecturer/appraisals", icon: Eye },
                    { id: "alerts", label: "Alerts", href: "/notifications", icon: Bell, badge: unreadCount },
                    { id: "more", label: "More", action: onOpenDrawer, icon: Menu },
                ];
        }
    };

    const tabs = getTabsForRole();

    return (
        <nav 
            className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
            style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        >
            <div className="grid grid-flow-col auto-cols-fr items-center px-2 py-1.5 max-w-md mx-auto">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = tab.href ? (
                        tab.href === "/" 
                            ? pathname === "/" 
                            : pathname === tab.href || pathname.startsWith(tab.href + "/")
                    ) : false;

                    if (tab.action) {
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={tab.action}
                                className="flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all relative group cursor-pointer text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                            >
                                <div className="relative">
                                    <Icon className="w-5 h-5 transition-transform group-active:scale-90" />
                                    {!!tab.badge && tab.badge > 0 && (
                                        <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center border-2 border-white dark:border-slate-900 animate-pulse">
                                            {tab.badge > 9 ? "9+" : tab.badge}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[10px] font-bold mt-1 tracking-tight">
                                    {tab.label}
                                </span>
                            </button>
                        );
                    }

                    return (
                        <Link
                            key={tab.id}
                            href={tab.href!}
                            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all relative group ${
                                isActive
                                    ? "text-blue-600 dark:text-blue-400 font-black"
                                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-bold"
                            }`}
                        >
                            <div className="relative flex items-center justify-center">
                                {/* Active Indicator Glow Background */}
                                {isActive && (
                                    <div className="absolute inset-0 -m-1.5 rounded-xl bg-blue-500/15 dark:bg-blue-500/20 -z-10 animate-in zoom-in-90 duration-200" />
                                )}
                                <Icon className={`w-5 h-5 transition-transform group-active:scale-90 ${isActive ? "stroke-[2.5]" : "stroke-[2]"}`} />
                                {!!tab.badge && tab.badge > 0 && (
                                    <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center border-2 border-white dark:border-slate-900 animate-pulse">
                                        {tab.badge > 9 ? "9+" : tab.badge}
                                    </span>
                                )}
                            </div>
                            <span className={`text-[10px] mt-1 tracking-tight ${isActive ? "font-extrabold text-blue-600 dark:text-blue-400" : "font-bold"}`}>
                                {tab.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
