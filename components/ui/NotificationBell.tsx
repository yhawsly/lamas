"use client";

import { useState, useEffect, useRef } from "react";

interface Notification {
    id: number;
    message: string;
    read: boolean;
    createdAt: string;
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter((n) => !n.read).length;

    useEffect(() => {
        let mounted = true;
        const fetchNotifications = async () => {
            try {
                const res = await fetch("/api/notifications");
                if (res.ok) {
                    const json = await res.json();
                    if (mounted) setNotifications(Array.isArray(json.data) ? json.data : []);
                }
            } catch {
                console.error("Failed to fetch notifications");
            }
        };

        fetchNotifications();

        // Polling for new notifications every 30s
        const interval = setInterval(fetchNotifications, 30000);
        return () => {
            mounted = false;
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

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

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

            {/* Dropdown menu */}
            {isOpen && (
                <div
                    className="absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    style={{ background: "var(--bg-surface)" }}
                >
                    <div className="px-4 py-3 border-b flex items-center justify-between">
                        <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Notifications</h3>
                        {unreadCount > 0 && (
                            <span className="text-xs font-medium" style={{ color: "var(--primary)" }}>
                                Marked as read
                            </span>
                        )}
                    </div>

                    <div className="max-h-[350px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center" style={{ color: "var(--text-muted)" }}>
                                <div className="text-3xl mb-2 flex justify-center opacity-50">📭</div>
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        className="px-4 py-3 transition-colors"
                                        style={{
                                            background: !n.read ? "var(--bg-hover)" : "transparent",
                                        }}
                                    >
                                        <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
                                            {n.message}
                                        </p>
                                        <p className="text-[11px] mt-1.5" style={{ color: "var(--text-muted)" }}>
                                            {new Date(n.createdAt).toLocaleString(undefined, {
                                                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
