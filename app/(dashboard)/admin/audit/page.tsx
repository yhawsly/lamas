"use client";

import { useCallback, useEffect, useState } from "react";
import Pagination from "@/components/ui/Pagination";
import SearchableSelect from "@/components/ui/SearchableSelect";

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
    SUBMISSION_CREATED: "#10b981",
    SUBMISSION_UPDATED: "#3b82f6",
    OBSERVATION_ASSIGNED: "#f59e0b",
    OBSERVATION_COMPLETED: "#8b5cf6",
    DEPARTMENT_BROADCAST: "#ec4899",
    DIRECT_NOTIFICATION: "#06b6d4",
    LOGIN: "#6366f1",
    LOGOUT: "#64748b",
    ADMIN_ACTION: "#ef4444",
};

export default function AdminAuditPage() {
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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadLogs(1);
    }, [loadLogs]);

    const actions = Array.from(new Set(logs.map(l => l.action)));

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Audit Logs</h1>
                <p className="mt-1" style={{ color: "var(--text-muted)" }}>Track all system activities and user actions for compliance monitoring</p>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Filter by Action</label>
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
                <div>
                    <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Filter by User ID</label>
                    <input
                        type="text"
                        value={userFilter}
                        onChange={e => setUserFilter(e.target.value)}
                        placeholder="Enter user ID..."
                        className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2"
                        style={{
                            backgroundColor: "var(--bg-surface)",
                            border: "1px solid var(--bg-border)",
                            color: "var(--text-primary)"
                        }}
                    />
                </div>
            </div>

            {/* Logs Table */}
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin w-8 h-8 border-2" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                        <div className="text-6xl mb-4">📋</div>
                        <h4 className="font-semibold" style={{ color: "var(--text-primary)" }}>No audit logs found</h4>
                        <p className="text-sm max-w-xs mx-auto mt-1" style={{ color: "var(--text-muted)" }}>
                            Try adjusting your filters to find what you&apos;re looking for.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr style={{ backgroundColor: "var(--bg-hover)", borderBottom: "1px solid var(--bg-border)" }}>
                                    <th className="px-6 py-4 text-left" style={{ color: "var(--text-secondary)" }}>Timestamp</th>
                                    <th className="px-6 py-4 text-left" style={{ color: "var(--text-secondary)" }}>User</th>
                                    <th className="px-6 py-4 text-left" style={{ color: "var(--text-secondary)" }}>Action</th>
                                    <th className="px-6 py-4 text-left" style={{ color: "var(--text-secondary)" }}>Details</th>
                                </tr>
                            </thead>
                            <tbody style={{ borderColor: "var(--bg-border)" }} className="divide-y">
                                {logs.map(log => (
                                    <tr
                                        key={log.id}
                                        style={{ color: "var(--text-secondary)" }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                                    >
                                        <td className="px-6 py-4" style={{ color: "var(--text-muted)" }}>
                                            <div className="text-xs">{new Date(log.createdAt).toLocaleString()}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium" style={{ color: "var(--text-primary)" }}>{log.user?.name}</div>
                                            <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                                                {log.user?.department?.name || "No Dept."} · {log.user?.role}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                                                style={{
                                                    backgroundColor: ACTION_COLORS[log.action] || "var(--primary)"
                                                }}
                                            >
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs truncate" title={log.details}>
                                            {log.details}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {!loading && logs.length > 0 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={loadLogs} />}
        </div>
    );
}
