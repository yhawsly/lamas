"use client";
import { Users, BarChart2, AlertTriangle, ClipboardList, BookOpen, CheckCircle, Palmtree, Megaphone, Rocket } from "lucide-react";

import { useState } from "react";
import KPICard from "@/components/ui/KPICard";
import useSWR from "swr";
import dynamic from "next/dynamic";

const ComplianceChart = dynamic(() => import("@/components/analytics/ComplianceChart"), { ssr: false });
const ObservationRadar = dynamic(() => import("@/components/analytics/ObservationRadar"), { ssr: false });

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface LecturerScore {
    lecturerId: number; lecturerName: string; email: string;
    score: number; submitted: number; late: number; missing: number; isAtRisk: boolean;
}

const HODDashboardSkeleton = () => (
    <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
        <div className="space-y-2">
            <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-4 w-96 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>

        {/* KPI Cards Skeletons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            ))}
        </div>

        {/* Tab & Content Skeleton */}
        <div className="h-11 w-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
    </div>
);

export default function HoDDashboard() {
    // Use SWR for client-side caching of all dashboard datasets
    const { data: analyticsData } = useSWR("/api/admin/analytics", fetcher);
    const { data: coursesData } = useSWR("/api/courses", fetcher);

    const data = analyticsData;
    const courses = Array.isArray(coursesData) ? coursesData : [];
    const loading = !analyticsData || !coursesData;

    const [tab, setTab] = useState<"overview" | "notify">("overview");
    const [notify, setNotify] = useState({ message: "", sent: false });

    async function sendBroadcast() {
        if (!notify.message.trim()) return;
        const res = await fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: notify.message }),
        });
        if (res.ok) {
            setNotify(n => ({ ...n, sent: true }));
            setTimeout(() => setNotify({ message: "", sent: false }), 4000);
        } else {
            const d = await res.json().catch(() => ({}));
            alert(d.error || "Failed to send notification. Please try again later.");
        }
    }

    if (loading) return <HODDashboardSkeleton />;

    const scores: LecturerScore[] = data?.scores || [];
    const atRisk = scores.filter((s) => s.isAtRisk);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b.score, 0) / scores.length) : 0;

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="mb-4">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">HOD Dashboard</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Department compliance and observation management.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Dept. Lecturers", value: scores.length, icon: <Users className="w-6 h-6" />, color: "#3b82f6" },
                    { label: "Avg Compliance", value: `${avgScore}%`, icon: <BarChart2 className="w-6 h-6" />, color: avgScore >= 70 ? "#10b981" : "#ef4444" },
                    { label: "At Risk", value: atRisk.length, icon: <AlertTriangle className="w-6 h-6" />, color: "#ef4444" },
                    { label: "Total Submissions", value: scores.reduce((a, b) => a + b.submitted, 0), icon: <ClipboardList className="w-6 h-6" />, color: "#a855f7" },
                ].map((k, i) => (
                    <KPICard key={k.label} delay={i * 100} {...k} />
                ))}
            </div>

            {/* Course Assignment Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                {[
                    { label: "Total Courses", value: courses.length, icon: <BookOpen className="w-6 h-6" />, color: "#2563eb" },
                    { label: "Assigned Workload", value: courses.filter(c => c.lecturerId).length, icon: <CheckCircle className="w-6 h-6" />, color: "#16a34a" },
                    { label: "Pending Assignment", value: courses.length - courses.filter(c => c.lecturerId).length, icon: <AlertTriangle className="w-6 h-6" />, color: "#d97706" },
                    { label: "Staff Coverage", value: courses.length > 0 ? `${Math.round((courses.filter(c => c.lecturerId).length / courses.length) * 100)}%` : "0%", icon: <BarChart2 className="w-6 h-6" />, color: "#9333ea" },
                ].map((stat, i) => (
                    <KPICard key={stat.label} delay={(i + 4) * 100} {...stat} />
                ))}
            </div>


            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-2xl w-full sm:w-fit overflow-x-auto" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                {(["overview", "notify"] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className="px-6 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all duration-300"
                        style={{
                            backgroundColor: tab === t ? "var(--primary)" : "transparent",
                            color: tab === t ? "white" : "var(--text-muted)"
                        }}>
                        {t === "overview" ? "Lecturer Scores" : "Broadcast"}
                    </button>
                ))}
            </div>

            {/* Content Sections */}
            <div className="rounded-3xl overflow-hidden shadow-2xl" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                {/* Lecturer Scores */}
                {tab === "overview" && (
                    <div className="p-4 sm:p-6 lg:p-8 space-y-8 lg:space-y-12">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="p-6 rounded-3xl" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)" }}>
                                <h3 className="font-bold text-sm mb-6 text-center" style={{ color: "var(--text-primary)" }}>Department Submission Deadlines</h3>
                                <ComplianceChart />
                            </div>
                            <div className="p-6 rounded-3xl" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)" }}>
                                <h3 className="font-bold text-sm mb-6 text-center" style={{ color: "var(--text-primary)" }}>Avg Department Observation Rubrics</h3>
                                <ObservationRadar />
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-lg mb-6 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                                <BarChart2 className="w-6 h-6 text-blue-500" /> Lecturer Compliance Rankings
                            </h3>
                            <div className="space-y-4">
                                {scores.sort((a, b) => b.score - a.score).map((s, i) => (
                                    <div key={s.lecturerId} className="flex items-center gap-4 p-5 rounded-2xl hover:translate-x-1 transition-all" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)" }}>
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg" style={{
                                            backgroundColor: i === 0 ? "rgba(251, 191, 36, 0.1)" : i === 1 ? "rgba(148, 163, 184, 0.1)" : i === 2 ? "rgba(234, 88, 12, 0.1)" : "var(--bg-border)",
                                            color: i === 0 ? "#fbbf24" : i === 1 ? "#94a3b8" : i === 2 ? "#ea580c" : "var(--text-muted)"
                                        }}>
                                            #{i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold truncate" style={{ color: "var(--text-primary)" }}>{s.lecturerName}</div>
                                            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{s.email}</div>
                                            <div className="mt-3 h-1.5 rounded-full w-full overflow-hidden" style={{ backgroundColor: "var(--bg-border)" }}>
                                                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${s.score}%`, backgroundColor: s.score >= 70 ? "#10b981" : "#ef4444" }} />
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="text-2xl font-black" style={{ color: s.score >= 70 ? "#10b981" : "#ef4444" }}>{s.score}%</div>
                                            <div className="text-[10px] font-bold uppercase" style={{ color: "var(--text-muted)" }}>{s.submitted} SUBMITTED</div>
                                        </div>
                                        {s.isAtRisk && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/20 uppercase tracking-tighter">AT RISK</span>}
                                    </div>
                                ))}
                                {scores.length === 0 && (
                                    <div className="text-center py-16">
                                        <div className="flex justify-center mb-4"><Palmtree className="w-10 h-10 text-gray-400" /></div>
                                        <p className="text-sm font-medium italic" style={{ color: "var(--text-muted)" }}>No lecturers in your department yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}



                {/* Department Broadcast */}
                {tab === "notify" && (
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-8">
                            <h3 className="font-bold text-xl mb-2 flex justify-center items-center gap-2" style={{ color: "var(--text-primary)" }}><Megaphone className="w-6 h-6 text-blue-500" /> Departmental Broadcast</h3>
                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Send a priority alert to all lecturers in your department.</p>
                        </div>

                        {notify.sent ? (
                            <div className="p-8 rounded-3xl border text-center animate-in zoom-in duration-300" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                                <div className="flex justify-center mb-4"><Rocket className="w-10 h-10 text-green-500" /></div>
                                <h4 className="font-bold mb-1" style={{ color: "#10b981" }}>Broadcast Sent!</h4>
                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>All colleagues have been notified via their dashboards.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="relative">
                                    <textarea
                                        value={notify.message}
                                        onChange={e => setNotify(n => ({ ...n, message: e.target.value }))}
                                        placeholder="Write your announcement here..."
                                        rows={6}
                                        className="w-full px-6 py-5 rounded-3xl text-sm focus:outline-none focus:ring-2 resize-none" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} />
                                    <div className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-tighter" style={{ color: "var(--text-muted)" }}>Department Alert</div>
                                </div>
                                <button
                                    onClick={sendBroadcast}
                                    disabled={!notify.message}
                                    className="w-full py-4 rounded-xl text-white font-bold text-sm transition-all shadow-xl disabled:opacity-50 active:scale-[0.98]"
                                    style={{ backgroundColor: "var(--primary)" }}>
                                    Push Notification to Department
                                </button>
                                <p className="text-[10px] text-center" style={{ color: "var(--text-muted)" }}>Note: This action is permanent and logged in the audit trail.</p>
                            </div>
                        )}
                    </div>
                )}


            </div>
        </div>
    );
}
