"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface Notification {
    id: number;
    message: string;
    read: boolean;
    createdAt: string;
}

export default function NotificationBell() {
    const [mounted, setMounted] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter((n) => !n.read).length;

    useEffect(() => {
        Promise.resolve().then(() => setMounted(true));
        
        let mountedFlag = true;
        const fetchNotifications = async () => {
            try {
                const res = await fetch("/api/notifications");
                if (res.ok) {
                    const json = await res.json();
                    if (mountedFlag) setNotifications(Array.isArray(json.data) ? json.data : []);
                }
            } catch {
                console.error("Failed to fetch notifications");
            }
        };

        fetchNotifications();

        // Polling for new notifications every 30s
        const interval = setInterval(fetchNotifications, 30000);
        return () => {
            mountedFlag = false;
            clearInterval(interval);
        };
    }, []);

    const markAllAsRead = async () => {
        if (unreadCount === 0) return;
        try {
            await fetch("/api/notifications", { method: "PATCH" });
            setNotifications(notifications.map(n => ({ ...n, read: true })));
        } catch {
            console.error("Failed to mark read");
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
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
                style={{ color: "var(--text-primary)" }}
                aria-label="Notifications"
            >
                <div className="relative">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-1 ring-black">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </div>
            </button>

            {/* Sidebar Overlay and Drawer */}
            {mounted && isOpen && createPortal(
                <div className="fixed inset-0 z-[99999] pointer-events-none">
                    <div 
                        className="absolute inset-0 bg-slate-950/20 backdrop-blur-sm transition-opacity pointer-events-auto"
                        onClick={() => setIsOpen(false)}
                    />
                    
                    <div
                        className="absolute inset-y-0 right-0 w-80 sm:w-96 shadow-2xl flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-white/10 pointer-events-auto transform transition-transform"
                    >
                        <div className="px-6 py-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between shrink-0">
                            <h3 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>Notifications</h3>
                            <div className="flex items-center gap-4">
                                {unreadCount > 0 && (
                                    <button onClick={markAllAsRead} className="text-xs font-semibold text-emerald-500 hover:text-emerald-600 transition">
                                        Mark all read
                                    </button>
                                )}
                                <button onClick={() => setIsOpen(false)} className="p-2 -mr-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition" style={{ color: "var(--text-muted)" }}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="px-6 py-12 flex flex-col items-center justify-center h-full text-center" style={{ color: "var(--text-muted)" }}>
                                    <div className="text-5xl mb-4 opacity-50">📭</div>
                                    <p className="font-medium text-sm">No notifications yet</p>
                                    <p className="text-xs opacity-70 mt-1">When you get pinged, it&apos;ll show up here.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-[var(--bg-border)]">
                                    {notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            className="px-6 py-4 transition-colors"
                                            style={{
                                                background: !n.read ? "var(--bg-hover)" : "transparent",
                                            }}
                                        >
                                            <div className="flex items-start gap-3">
                                                {!n.read && <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium leading-relaxed" style={{ color: "var(--text-primary)" }}>
                                                        {n.message}
                                                    </p>
                                                    <p className="text-[10px] uppercase tracking-wider font-bold mt-2" style={{ color: "var(--text-muted)" }}>
                                                        {new Date(n.createdAt).toLocaleString(undefined, {
                                                            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
