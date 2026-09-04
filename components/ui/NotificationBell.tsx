"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Notification {
    id: number;
    message: string;
    read: boolean;
    createdAt: string;
}

export default function NotificationBell() {
    const [mounted, setMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { data: notificationsData, mutate } = useSWR("/api/notifications", fetcher, {
        refreshInterval: 30000,
        dedupingInterval: 5000,
    });

    const notifications = Array.isArray(notificationsData?.data) ? notificationsData.data : [];
    const unreadCount = notifications.filter((n: any) => !n.read).length;

    useEffect(() => {
        Promise.resolve().then(() => setMounted(true));
    }, []);

    const markAllAsRead = async () => {
        if (unreadCount === 0) return;
        
        // Optimistically mark all as read locally
        const optimisticData = {
            ...notificationsData,
            data: notifications.map((n: any) => ({ ...n, read: true }))
        };
        
        mutate(optimisticData, false);

        try {
            const res = await fetch("/api/notifications", { method: "PATCH" });
            if (!res.ok) throw new Error("Failed to sync read status");
            // Revalidate to ensure local state is in sync with server
            mutate();
        } catch {
            console.error("Failed to mark read");
            // Rollback on error
            mutate();
        }
    };

    // The full-screen overlay handles outside clicks naturally now.

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) markAllAsRead();
                }}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-slate-100 dark:hover:bg-white/10 group"
                style={{ color: "var(--text-primary)" }}
                aria-label="Notifications"
            >
                <div className="relative">
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-black text-white shadow-sm ring-2 ring-white dark:ring-slate-950">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </div>
            </button>

            {/* Sidebar Overlay and Drawer */}
            {mounted && isOpen && createPortal(
                <div className="fixed inset-0 z-[99999] pointer-events-none">
                    <div 
                        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity pointer-events-auto"
                        onClick={() => setIsOpen(false)}
                    />
                    
                    <div
                        className="absolute inset-y-0 right-0 w-[380px] max-w-full shadow-2xl flex flex-col pointer-events-auto transform transition-transform"
                        style={{ backgroundColor: "var(--bg-surface)", borderLeft: "1px solid var(--bg-border)" }}
                    >
                        {/* Premium Header */}
                        <div className="px-6 py-5 border-b flex items-center justify-between shrink-0 relative overflow-hidden" style={{ borderColor: "var(--bg-border)" }}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                            <div className="relative z-10 flex items-center gap-3">
                                <h3 className="font-black text-xl tracking-tight" style={{ color: "var(--text-primary)" }}>Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-bold">
                                        {unreadCount} New
                                    </span>
                                )}
                            </div>
                            <div className="relative z-10 flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button onClick={markAllAsRead} className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-wider">
                                        Mark Read
                                    </button>
                                )}
                                <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" style={{ color: "var(--text-muted)" }}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>

                        {/* Notification List */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                                    <div className="w-16 h-16 mb-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                                        <svg className="w-8 h-8 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                        </svg>
                                    </div>
                                    <p className="font-bold text-slate-700 dark:text-slate-300">All caught up!</p>
                                    <p className="text-sm mt-1 text-slate-500 dark:text-slate-400">There are no new notifications to display right now.</p>
                                </div>
                            ) : (
                                notifications.map((n: Notification) => (
                                    <div
                                        key={n.id}
                                        className="relative p-4 rounded-2xl transition-all border group"
                                        style={{
                                            backgroundColor: !n.read ? "var(--bg-hover)" : "transparent",
                                            borderColor: !n.read ? "var(--bg-border)" : "transparent"
                                        }}
                                    >
                                        <div className="flex items-start gap-3.5">
                                            <div className={`mt-0.5 w-2 h-2 shrink-0 rounded-full shadow-sm ${!n.read ? 'bg-blue-500 shadow-blue-500/50' : 'bg-transparent'}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm leading-relaxed ${!n.read ? 'font-semibold' : 'font-medium opacity-80'}`} style={{ color: "var(--text-primary)" }}>
                                                    {n.message}
                                                </p>
                                                <p className="text-[10px] uppercase tracking-wider font-bold mt-2.5 opacity-50" style={{ color: "var(--text-primary)" }}>
                                                    {new Date(n.createdAt).toLocaleString(undefined, {
                                                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="p-4 border-t shrink-0 text-center" style={{ borderColor: "var(--bg-border)" }}>
                                <button className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors uppercase tracking-widest">
                                    View All History
                                </button>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
