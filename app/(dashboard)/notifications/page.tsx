"use client";
import { Inbox } from "lucide-react";


import { formatDistanceToNow } from "date-fns";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Notification {
    id: number;
    message: string;
    read: boolean;
    createdAt: string;
}

export default function NotificationsPage() {
    
    
    // Shared SWR hook with the same key used by the Sidebar and NotificationBell
    const { data: notificationsData, mutate } = useSWR("/api/notifications", fetcher, {
        refreshInterval: 30000,
        dedupingInterval: 5000,
    });

    const notifications: Notification[] = Array.isArray(notificationsData?.data) ? notificationsData.data : [];
    const loading = !notificationsData;

    const markAllAsRead = async () => {
        if (!notifications.some((n: Notification) => !n.read)) return;

        // Optimistically mark all as read locally across the shared SWR cache
        const optimisticData = {
            ...notificationsData,
            data: notifications.map((n: Notification) => ({ ...n, read: true }))
        };
        
        mutate(optimisticData, false);

        try {
            await fetch("/api/notifications", { method: "PATCH" });
            mutate(); // final synchronization
        } catch (error) {
            console.error("Failed to mark as read:", error);
            mutate(); // roll back on error
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notification Center</h1>
                    <p className="text-gray-500 text-sm mt-1">View your latest alerts and department messages.</p>
                </div>
                {notifications.some((n: Notification) => !n.read) && (
                    <button
                        onClick={markAllAsRead}
                        className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors"
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="p-5 flex gap-4">
                                <div className="mt-1">
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                                </div>
                                <div className="flex-1 space-y-2.5">
                                    <div className="w-3/4 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                                    <div className="w-1/4 h-3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Inbox className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-gray-900 dark:text-white font-semibold">You&apos;re all caught up!</h3>
                        <p className="text-gray-500 text-sm mt-1">No new notifications.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {notifications.map((n: Notification) => (
                            <div key={n.id} className={`p-5 flex gap-4 transition-colors ${n.read ? 'bg-white dark:bg-gray-800' : 'bg-indigo-50/50 dark:bg-indigo-900/10'}`}>
                                <div className="mt-1">
                                    <div className={`w-2.5 h-2.5 rounded-full ${n.read ? 'bg-transparent' : 'bg-indigo-500'}`} />
                                </div>
                                <div className="flex-1">
                                    <p className={`text-sm ${n.read ? 'text-gray-600 dark:text-gray-300' : 'text-gray-900 dark:text-white font-medium'}`}>
                                        {n.message}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1.5">
                                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
