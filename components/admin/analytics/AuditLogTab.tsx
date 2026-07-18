"use client";

import { useCallback, useEffect, useState } from "react";
import Pagination from "@/components/ui/Pagination";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { Shield, User } from "lucide-react";

interface AuditLog {
    id: number;
    userId: number;
    action: string;
    details: string;
    createdAt: string;
    user: {
        name: string;
        role: string;
        department?: { name: string };
    };
}

const ACTION_COLORS: Record<string, string> = {
    SUBMISSION_CREATED: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    SUBMISSION_UPDATED: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
    OBSERVATION_ASSIGNED: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    OBSERVATION_COMPLETED: "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
    DEPARTMENT_BROADCAST: "bg-pink-50 text-pink-600 border-pink-200 dark:bg-pink-500/10 dark:text-pink-400 dark:border-pink-500/20",
    DIRECT_NOTIFICATION: "bg-cyan-50 text-cyan-600 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20",
    LOGIN: "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20",
    LOGOUT: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
    ADMIN_ACTION: "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
};

export default function AuditLogTab() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [actionFilter, setActionFilter] = useState("ALL");
    const [userFilter, setUserFilter] = useState("");
    const LIMIT = 20;

    const loadLogs = useCallback((pageNum = 1) => {
        setLoading(true);
        let url = `/api/audit?page=${pageNum}&limit=${LIMIT}`;
        if (actionFilter !== "ALL") url += `&action=${actionFilter}`;
        if (userFilter) url += `&userId=${userFilter}`;

        fetch(url)
            .then(r => r.json())
            .then(data => {
                if (data.data) {
                    setLogs(Array.isArray(data.data) ? data.data : []);
                    setTotalPages(data.meta?.totalPages || 1);
                    setPage(pageNum);
                } else {
                    setLogs(Array.isArray(data) ? data : []);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load audit logs:", err);
                setLoading(false);
            });
    }, [actionFilter, userFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadLogs(1);
        }, 0);
        return () => clearTimeout(timer);
    }, [loadLogs]);

    const actions = Array.from(new Set(logs.map(l => l.action)));

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>System Audit Logs</h2>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Track all system activities and user actions for compliance monitoring.</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="w-full sm:w-64">
                    <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>Filter by Action</label>
                    <SearchableSelect
                        value={actionFilter}
                        onChange={val => setActionFilter(String(val))}
                        options={[
                            { label: "All Actions", value: "ALL" },
                            ...actions.map(a => ({ label: a, value: a }))
                        ]}
                        placeholder="All Actions"
                    />
                </div>
                <div className="w-full sm:w-64">
                    <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>Search by User ID</label>
                    <div className="relative">
                        <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={userFilter}
                            onChange={e => setUserFilter(e.target.value)}
                            placeholder="Enter user ID..."
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition shadow-sm border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            style={{ color: "var(--text-primary)" }}
                        />
                    </div>
                </div>
            </div>

            {/* Logs List - Professional UI */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800/60 overflow-hidden shadow-sm flex flex-col" style={{ backgroundColor: "var(--bg-surface)" }}>
                <div className="hidden sm:grid grid-cols-12 gap-4 p-4 border-b border-slate-200 dark:border-slate-800/60 text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: "var(--bg-hover)", color: "var(--text-muted)" }}>
                    <div className="col-span-2">Timestamp</div>
                    <div className="col-span-3">User</div>
                    <div className="col-span-3">Action</div>
                    <div className="col-span-4">Details</div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 flex-1">
                    {loading ? (
                        <div className="flex justify-center items-center h-48">
                            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-center p-8">
                            <Shield className="w-10 h-10 text-slate-400 mb-4" />
                            <h3 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>No Audit Logs Found</h3>
                            <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>Try adjusting your filters.</p>
                        </div>
                    ) : (
                        logs.map(log => (
                            <div key={log.id} className="group flex flex-col transition-colors hover:bg-[var(--bg-hover)]" style={{ backgroundColor: "var(--bg-base)" }}>
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 sm:p-5 items-center">
                                    {/* Timestamp */}
                                    <div className="col-span-1 sm:col-span-2">
                                        <div className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
                                            {new Date(log.createdAt).toLocaleDateString()}
                                        </div>
                                        <div className="text-[10px] font-semibold text-slate-400 mt-0.5">
                                            {new Date(log.createdAt).toLocaleTimeString()}
                                        </div>
                                    </div>

                                    {/* User */}
                                    <div className="col-span-1 sm:col-span-3 flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-[10px] border shrink-0 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700" style={{ color: "var(--text-primary)" }}>
                                            {(log.user?.name || "?").substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm truncate" style={{ color: "var(--text-primary)" }}>{log.user?.name || "System"}</div>
                                            <div className="text-[10px] font-semibold mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                                                {log.user?.department?.name || "No Dept."} · {log.user?.role}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <div className="col-span-1 sm:col-span-3">
                                        <span className={`inline-flex px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${ACTION_COLORS[log.action] || ACTION_COLORS.LOGOUT}`}>
                                            {log.action.replace(/_/g, " ")}
                                        </span>
                                    </div>

                                    {/* Details */}
                                    <div className="col-span-1 sm:col-span-4">
                                        <div className="text-xs font-semibold leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                            {log.details}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {!loading && logs.length > 0 && (
                <div className="mt-6 flex justify-center">
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={loadLogs} />
                </div>
            )}
        </div>
    );
}
