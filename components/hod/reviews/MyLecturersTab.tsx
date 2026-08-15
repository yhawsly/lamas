"use client";
import { useEffect, useState } from "react";
import { Users, AlertCircle } from "lucide-react";

const MyLecturersSkeleton = () => (
    <div className="divide-y divide-slate-100 dark:divide-slate-800/60 animate-pulse">
        {[1, 2, 3].map((i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-5 items-center">
                <div className="col-span-1 flex justify-center">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800" />
                </div>
                <div className="col-span-5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                    <div className="space-y-2 flex-1">
                        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                        <div className="h-3 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                </div>
                <div className="col-span-4 space-y-2">
                    <div className="flex justify-between">
                        <div className="h-3.5 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
                        <div className="h-3.5 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full" />
                </div>
                <div className="col-span-2 flex justify-end">
                    <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
                </div>
            </div>
        ))}
    </div>
);

export default function MyLecturersTab() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const r = await fetch("/api/admin/analytics");
                if (!r.ok) {
                    const err = await r.json().catch(() => ({}));
                    throw new Error(err.error || `Server error: ${r.status}`);
                }
                const d = await r.json();
                setData(d);
            } catch (e: any) {
                console.error("Fetch error:", e);
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const scores = data?.scores ?? [];
    const deptName = scores.length > 0 ? scores[0].department : "Department";

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>My Lecturers</h2>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Compliance overview and risk monitoring for {deptName}.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800/60 overflow-hidden shadow-sm flex flex-col" style={{ backgroundColor: "var(--bg-surface)" }}>
                <div className="hidden sm:grid grid-cols-12 gap-4 p-4 border-b border-slate-200 dark:border-slate-800/60 text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: "var(--bg-hover)", color: "var(--text-muted)" }}>
                    <div className="col-span-1 text-center">Rank</div>
                    <div className="col-span-5">Lecturer Info</div>
                    <div className="col-span-4">Compliance Score</div>
                    <div className="col-span-2 text-right">Status</div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {loading ? (
                        <MyLecturersSkeleton />
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-48 text-center p-8">
                            <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
                            <h3 className="text-lg font-bold mb-2 text-red-500">Database Synchronization Error</h3>
                            <p className="text-sm text-red-400 mb-4">{error}</p>
                            <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 font-bold text-xs transition-colors hover:bg-red-100 dark:hover:bg-red-500/20">
                                Retry Connection
                            </button>
                        </div>
                    ) : scores.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-center p-8">
                            <Users className="w-10 h-10 text-slate-400 mb-4" />
                            <h3 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>No Lecturers Found</h3>
                            <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>There are no lecturers assigned to your department yet.</p>
                        </div>
                    ) : (
                        scores.sort((a: any, b: any) => b.score - a.score).map((s: any, i: number) => (
                            <div key={s.lecturerId} className="group flex flex-col transition-colors hover:bg-[var(--bg-hover)]" style={{ backgroundColor: "var(--bg-base)" }}>
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 sm:p-5 items-center">
                                    {/* Rank */}
                                    <div className="col-span-1 flex justify-center">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-inner" style={{
                                            backgroundColor: i === 0 ? "rgba(251, 191, 36, 0.15)" : i === 1 ? "rgba(148, 163, 184, 0.15)" : i === 2 ? "rgba(234, 88, 12, 0.15)" : "var(--bg-hover)",
                                            color: i === 0 ? "#fbbf24" : i === 1 ? "#94a3b8" : i === 2 ? "#ea580c" : "var(--text-muted)",
                                            border: `1px solid ${i === 0 ? "rgba(251, 191, 36, 0.3)" : i === 1 ? "rgba(148, 163, 184, 0.3)" : i === 2 ? "rgba(234, 88, 12, 0.3)" : "var(--bg-border)"}`
                                        }}>
                                            {i + 1}
                                        </div>
                                    </div>

                                    {/* Lecturer Info */}
                                    <div className="col-span-1 sm:col-span-5 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border shrink-0 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700" style={{ color: "var(--text-primary)" }}>
                                            {(s.lecturerName || "?").substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{s.lecturerName}</div>
                                            <div className="text-[11px] font-semibold mt-0.5" style={{ color: "var(--text-muted)" }}>{s.email}</div>
                                        </div>
                                    </div>

                                    {/* Compliance Score */}
                                    <div className="col-span-1 sm:col-span-4">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="text-sm font-black" style={{ color: s.score >= 70 ? "#10b981" : "#ef4444" }}>{s.score}%</div>
                                            <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                                                {s.submitted} / {s.totalRequired} submitted
                                            </div>
                                        </div>
                                        <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ 
                                                width: `${s.score}%`, 
                                                backgroundColor: s.score >= 70 ? "#10b981" : "#ef4444" 
                                            }} />
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-1 sm:col-span-2 flex justify-end">
                                        {s.isAtRisk ? (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">
                                                <AlertCircle className="w-3 h-3" /> At Risk
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                                                On Track
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
