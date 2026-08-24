"use client";

import { useState, useEffect } from "react";
import { 
    Cpu, Database, Trash2, Mail, Shield, CheckCircle2, 
    Server, Activity, Download, AlertTriangle 
} from "lucide-react";

export default function SystemControlsTab() {
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const fetchMetrics = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/system");
            if (res.ok) {
                const data = await res.json();
                setMetrics(data);
            }
        } catch (e) {
            console.error("Failed to load system metrics:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
    }, []);

    const handlePurgeCache = async () => {
        setActionLoading("purge");
        setStatusMsg(null);
        try {
            const res = await fetch("/api/admin/system", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "PURGE_CACHE" })
            });
            const data = await res.json();
            if (res.ok) {
                setStatusMsg({ type: "success", text: data.message });
                fetchMetrics();
            } else {
                setStatusMsg({ type: "error", text: data.error || "Failed to purge cache" });
            }
        } catch (e: any) {
            setStatusMsg({ type: "error", text: e.message });
        } finally {
            setActionLoading(null);
        }
    };

    const handleTestEmail = async () => {
        setActionLoading("email");
        setStatusMsg(null);
        try {
            const res = await fetch("/api/admin/system", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "TEST_EMAIL" })
            });
            const data = await res.json();
            if (res.ok) {
                setStatusMsg({ type: "success", text: data.message });
            } else {
                setStatusMsg({ type: "error", text: data.error || "Email dispatch failed" });
            }
        } catch (e: any) {
            setStatusMsg({ type: "error", text: e.message });
        } finally {
            setActionLoading(null);
        }
    };

    const handleExportAuditLogs = () => {
        window.open("/api/admin/system/audit-export", "_blank");
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <Server className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    System Infrastructure & Security Controls
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                    Manage database connections, in-memory cache handlers, email dispatch health, and accreditation audit trails.
                </p>
            </div>

            {statusMsg && (
                <div className={`p-4 rounded-2xl border font-semibold text-sm flex items-center gap-2 shadow-xs ${
                    statusMsg.type === "success" 
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                        : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
                }`}>
                    {statusMsg.type === "success" ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                        <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                    )}
                    {statusMsg.text}
                </div>
            )}

            {/* Infrastructure Vitals Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Memory Cache</span>
                        <Cpu className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-blue-500 shrink-0" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1.5 sm:mt-2">
                        {loading ? "..." : `${metrics?.cache?.size || 0} Keys`}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1 truncate">
                        <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                        Active TTL
                    </div>
                </div>

                <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Postgres Pool</span>
                        <Database className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-purple-500 shrink-0" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1.5 sm:mt-2">
                        {loading ? "..." : `Max ${metrics?.database?.poolMax || 5}`}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 font-medium truncate">
                        Pool Singleton
                    </div>
                </div>

                <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs col-span-2 sm:col-span-1">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Active Staff</span>
                        <Shield className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-emerald-500 shrink-0" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1.5 sm:mt-2">
                        {loading ? "..." : `${metrics?.database?.activeUsers || 0} Users`}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 font-medium truncate">
                        Semester: {metrics?.database?.activeTerm || "Live"}
                    </div>
                </div>
            </div>

            {/* Cache Handler Actions */}
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700/60 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <Cpu className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white">In-Memory Cache Handler</h3>
                            <p className="text-xs text-slate-500">Caches frequent queries in memory to prevent database load</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handlePurgeCache}
                        disabled={actionLoading === "purge"}
                        className="px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        <Trash2 className="w-4 h-4" />
                        {actionLoading === "purge" ? "Purging..." : "Purge Server Cache"}
                    </button>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Use this button if you updated underlying database records manually and need all faculty dashboards and analytics charts to reflect the latest state immediately without waiting for the 5-minute TTL expiration.
                </p>
            </div>

            {/* Email Dispatch Diagnostics */}
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700/60 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Email Dispatch Service</h3>
                            <p className="text-xs text-slate-500">Resend API notification and reminder delivery engine</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleTestEmail}
                        disabled={actionLoading === "email"}
                        className="px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        <Activity className="w-4 h-4" />
                        {actionLoading === "email" ? "Sending Test..." : "Send Test Diagnostic Email"}
                    </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                    <span>Status:</span>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider ${
                        metrics?.emailService?.configured 
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                            : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                    }`}>
                        {metrics?.emailService?.status || "CHECKING"}
                    </span>
                    <span className="text-slate-400">• Dispatches password resets, submission alerts & observation invitations</span>
                </div>
            </div>

            {/* Audit Trail & Compliance Archive */}
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700/60 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                            <Shield className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Accreditation Audit Trail</h3>
                            <p className="text-xs text-slate-500">Immutable ledger of all login, submission, and review activities</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-lg">
                            {metrics?.database?.auditLogs || 0} Total Logged Events
                        </div>
                        <button
                            type="button"
                            onClick={handleExportAuditLogs}
                            className="px-3 py-1.5 rounded-lg font-semibold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Export
                        </button>
                    </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    All compliance activities and sign-offs are logged with UTC timestamps and user IDs to satisfy university accreditation standards.
                </p>
            </div>
        </div>
    );
}
