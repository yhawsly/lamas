"use client";
import { Users, BarChart2, AlertTriangle, ClipboardList, BookOpen, CheckCircle, Palmtree, Megaphone, Rocket, AlertCircle, Send } from "lucide-react";

import { useState } from "react";
import KPICard from "@/components/ui/KPICard";
import useSWR from "swr";
import dynamic from "next/dynamic";
import { useTerm } from "@/context/TermContext";

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
    const { selectedTermId } = useTerm();
    const analyticsUrl = selectedTermId ? `/api/admin/analytics?termId=${selectedTermId}` : "/api/admin/analytics";

    // Use SWR for client-side caching of all dashboard datasets
    const { data: analyticsData } = useSWR(analyticsUrl, fetcher);
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
                                <BarChart2 className="w-6 h-6 text-blue-500" /> Portfolio Compliance Rankings
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
                {/* Department Broadcast */}
                {tab === "notify" && (
                    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4">
                        {notify.sent ? (
                            <div className="max-w-3xl mx-auto p-12 rounded-3xl border text-center relative overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl shadow-emerald-500/10">
                                <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
                                <div className="flex justify-center mb-6">
                                    <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center">
                                        <Rocket className="w-12 h-12 text-emerald-500" />
                                    </div>
                                </div>
                                <h4 className="font-black text-4xl mb-4 text-slate-900 dark:text-white tracking-tight">Broadcast Delivered!</h4>
                                <p className="text-slate-500 dark:text-slate-400 text-base max-w-lg mx-auto mb-10">
                                    Your priority alert has been successfully dispatched to all lecturers in your department. They will see it immediately on their dashboards.
                                </p>
                                <button 
                                    onClick={() => setNotify({ message: "", sent: false })}
                                    className="px-8 py-3.5 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-colors"
                                >
                                    Send Another Broadcast
                                </button>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl shadow-blue-500/5 overflow-hidden flex flex-col lg:flex-row">
                                {/* Left Side: Context & Guidelines */}
                                <div className="lg:w-1/2 bg-slate-50 dark:bg-slate-800/50 p-8 md:p-10 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-700/50 flex flex-col justify-between">
                                    <div>
                                        <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center mb-6 shadow-inner">
                                            <Megaphone className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <h3 className="font-black text-3xl tracking-tight text-slate-900 dark:text-white mb-3">
                                            Departmental Broadcast
                                        </h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
                                            Send a priority push notification to all academic staff in your department. This will appear immediately in their notification center.
                                        </p>
                                    </div>
                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/50">
                                        <h4 className="font-bold text-xs uppercase tracking-wider text-blue-800 dark:text-blue-300 mb-2">Best Practices</h4>
                                        <ul className="text-xs text-blue-700/80 dark:text-blue-200/80 space-y-2 font-medium">
                                            <li>• Keep messages clear and concise.</li>
                                            <li>• Include specific dates and times.</li>
                                            <li>• Do not use for confidential information.</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Right Side: The Form */}
                                <div className="lg:w-1/2 p-8 md:p-10 flex flex-col justify-center">
                                    <div className="space-y-6 max-w-2xl">
                                        <div className="relative group">
                                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-0 group-focus-within:opacity-10 transition-opacity duration-500" />
                                            <div className="relative bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-700 focus-within:border-blue-500 dark:focus-within:border-blue-400 transition-colors p-1 shadow-sm">
                                                <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                                                    <span className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                                                        Announcement Message
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                                                        {notify.message.length} chars
                                                    </span>
                                                </div>
                                                <textarea
                                                    value={notify.message}
                                                    onChange={e => setNotify(n => ({ ...n, message: e.target.value }))}
                                                    placeholder="Type your alert here... (e.g., 'Emergency departmental meeting at 2 PM')"
                                                    rows={6}
                                                    className="w-full px-5 py-4 bg-transparent text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none resize-none leading-relaxed"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4">
                                            <p className="text-xs text-slate-500 font-medium flex items-center gap-2 order-2 sm:order-1">
                                                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                                                This action is logged for audit purposes.
                                            </p>
                                            <button
                                                onClick={sendBroadcast}
                                                disabled={!notify.message}
                                                className="w-full sm:w-auto px-8 py-4 rounded-xl text-white font-black text-sm bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-500/30 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 order-1 sm:order-2 shrink-0"
                                            >
                                                <Send className="w-4 h-4" />
                                                Push Notification
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}


            </div>
        </div>
    );
}
