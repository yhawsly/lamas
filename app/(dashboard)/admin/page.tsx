"use client";
import { Users, ClipboardList, Clock, BarChart2, AlertTriangle, TrendingUp, Megaphone, CheckCircle } from "lucide-react";

import { useState } from "react";
import dynamic from "next/dynamic";
import KPICard from "@/components/ui/KPICard";
import useSWR from "swr";
import { useTerm } from "@/context/TermContext";

const ComplianceChart = dynamic(() => import("@/components/analytics/ComplianceChart"), { ssr: false });
const ObservationRadar = dynamic(() => import("@/components/analytics/ObservationRadar"), { ssr: false });
const AdminDashboardCharts = dynamic(() => import("@/components/admin/analytics/AdminDashboardCharts"), { ssr: false });

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Analytics {
    summary: { totalLecturers: number; totalSubmissions: number; totalDeadlines: number; avgScore: number; atRiskCount: number };
    scores: any[];
    atRisk: any[];
    heatmap: any[];
    trend: any[];
}
const AdminSkeleton = () => (
    <div className="max-w-7xl mx-auto space-y-8 animate-pulse pb-20">
        {/* Header */}
        <div className="space-y-2">
            <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700/80 rounded-lg" />
            <div className="h-4 w-96 bg-slate-200 dark:bg-slate-700/80 rounded-lg" />
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-28 bg-slate-250 dark:bg-slate-900 rounded-2xl" />
            ))}
        </div>

        {/* Tabs */}
        <div className="h-10 w-80 bg-slate-200 dark:bg-slate-700/80 rounded-xl" />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-slate-200 dark:bg-slate-700/80 rounded-2xl" />
            <div className="h-96 bg-slate-200 dark:bg-slate-700/80 rounded-2xl" />
        </div>
    </div>
);

export default function AdminDashboard() {
    const { selectedTermId } = useTerm();
    const analyticsUrl = selectedTermId ? `/api/admin/analytics?termId=${selectedTermId}` : "/api/admin/analytics";

    // Use SWR for client-side caching of institution analytics
    const { data: analyticsData } = useSWR<Analytics>(analyticsUrl, fetcher);

    const data = analyticsData;
    const loading = !analyticsData;

    const [tab, setTab] = useState<"overview" | "lecturers" | "atRisk" | "trend">("overview");
    const [notify, setNotify] = useState({ message: "", show: false, sent: false });
    const [sending, setSending] = useState(false);

    async function sendBroadcast() {
        if (!notify.message.trim()) return;
        setSending(true);
        const res = await fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: notify.message }),
        });
        setSending(false);
        if (res.ok) {
            setNotify(n => ({ ...n, sent: true, message: "" }));
        } else {
            const d = await res.json().catch(() => ({}));
            alert(d.error || "Failed to send notification. Please try again later.");
        }
    }

    if (loading || !data) {
        return <AdminSkeleton />;
    }

    const { summary } = data;

    return (
        <div className="w-full space-y-6 sm:space-y-8 animate-in fade-in duration-500">
            <div className="mb-4 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Admin Dashboard</h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Institution-wide academic compliance overview and governance.</p>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {[
                    { label: "Total Lecturers", value: summary.totalLecturers, icon: <Users className="w-6 h-6" />, color: "#3b82f6", href: "/admin/users" },
                    { label: "Total Submissions", value: summary.totalSubmissions, icon: <ClipboardList className="w-6 h-6" />, color: "#10b981", href: "/admin/submissions" },
                    { label: "Deadlines Set", value: summary.totalDeadlines, icon: <Clock className="w-6 h-6" />, color: "#f59e0b", href: "/admin/submissions" },
                    { label: "Avg Compliance", value: `${summary.avgScore}%`, icon: <BarChart2 className="w-6 h-6" />, color: summary.avgScore >= 70 ? "#10b981" : "#ef4444", onClick: () => setTab("lecturers") },
                    { label: "At Risk", value: summary.atRiskCount, icon: <AlertTriangle className="w-6 h-6" />, color: "#ef4444", onClick: () => setTab("atRisk") },
                ].map((k, i) => (
                    <KPICard key={k.label} delay={i * 100} {...k} />
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl mb-6 w-full sm:w-fit overflow-x-auto" style={{ backgroundColor: "var(--bg-surface)" }}>
                {(["overview", "lecturers", "atRisk", "trend"] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className="px-4 py-2 rounded-lg text-sm font-medium capitalize transition"
                        style={{
                            backgroundColor: tab === t ? "var(--primary)" : "transparent",
                            color: tab === t ? "white" : "var(--text-muted)"
                        }}>
                        {t === "atRisk" ? <><AlertTriangle className="w-4 h-4 inline mr-1" /> At Risk</> : t === "trend" ? <><TrendingUp className="w-4 h-4 inline mr-1" /> Trend</> : t === "lecturers" ? <><Users className="w-4 h-4 inline mr-1" /> Scores</> : <><BarChart2 className="w-4 h-4 inline mr-1" /> Overview</>}
                    </button>
                ))}
            </div>

            {/* Overview Tab — Charts */}
            {tab === "overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="rounded-2xl p-6" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                        <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Global Submission Statuses</h3>
                        <ComplianceChart />
                    </div>

                    <div className="rounded-2xl p-6" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                        <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Average Observation Rubrics</h3>
                        <ObservationRadar />
                    </div>

                    {/* Compliance Distribution */}
                    <div className="rounded-2xl p-6" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                        <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Lecturer Final Compliance Scores</h3>
                        <AdminDashboardCharts data={data} type="pie" />
                    </div>

                    {/* Dept Heatmap bars */}
                    <div className="rounded-2xl p-6" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                        <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Department Submission Rate (%)</h3>
                        <AdminDashboardCharts data={data} type="bar" />
                    </div>

                    {/* Broadcast Notification */}
                    <div className="rounded-2xl p-6 lg:col-span-2" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                        <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}><Megaphone className="w-5 h-5 text-blue-500" /> Broadcast Notification</h3>
                        {notify.sent ? (
                            <div className="p-3 rounded-xl text-green-500 flex items-center gap-2" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)" }}><CheckCircle className="w-5 h-5" /> Notification sent to all lecturers.</div>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input value={notify.message} onChange={e => setNotify(n => ({ ...n, message: e.target.value }))}
                                    placeholder="Type a message to broadcast to all lecturers..."
                                    className="flex-1 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 text-sm"
                                    style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} />
                                <button onClick={sendBroadcast} disabled={!notify.message || sending}
                                    className="px-5 py-2.5 rounded-xl text-white font-medium text-sm transition disabled:opacity-40 shrink-0"
                                    style={{ backgroundColor: "var(--primary)", color: "white" }}>
                                    {sending ? "Sending..." : "Send"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Lecturers Scores Tab */}
            {tab === "lecturers" && (
                <div className="rounded-2xl p-6" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                    <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Lecturer Compliance Scores</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="text-left border-b" style={{ color: "var(--text-muted)", borderBottomColor: "var(--bg-border)" }}>
                                <th className="pb-3">Lecturer</th><th className="pb-3">Department</th>
                                <th className="pb-3">Score</th><th className="pb-3">Submitted</th>
                                <th className="pb-3">Late</th><th className="pb-3">Missing</th><th className="pb-3">Status</th>
                            </tr></thead>
                            <tbody style={{ borderBottomColor: "var(--bg-border)" }} className="divide-y">
                                {data.scores.map(s => (
                                    <tr key={s.lecturerId} style={{ color: "var(--text-secondary)" }}>
                                        <td className="py-3"><div>{s.lecturerName}</div><div className="text-xs" style={{ color: "var(--text-muted)" }}>{s.email}</div></td>
                                        <td className="py-3" style={{ color: "var(--text-muted)" }}>{s.department}</td>
                                        <td className="py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 h-1.5 rounded-full" style={{ backgroundColor: "var(--bg-hover)" }}>
                                                    <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, Math.max(0, s.score))}%`, backgroundColor: s.score >= 70 ? "#10b981" : "#ef4444" }} />
                                                </div>
                                                <span style={{ color: s.score >= 70 ? "#10b981" : "#ef4444" }}>{Math.min(100, Math.max(0, s.score))}%</span>
                                            </div>
                                        </td>
                                        <td className="py-3" style={{ color: "#10b981" }}>{s.submitted}</td>
                                        <td className="py-3" style={{ color: "#ef4444" }}>{s.late}</td>
                                        <td className="py-3" style={{ color: "#f59e0b" }}>{s.missing}</td>
                                        <td className="py-3">{s.isAtRisk ? <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "rgba(239, 68, 68, 0.2)", color: "#ef4444" }}>At Risk</span> : <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "rgba(16, 185, 129, 0.2)", color: "#10b981" }}>Good</span>}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* At Risk Tab */}
            {tab === "atRisk" && (
                <div className="space-y-6">
                    <div className="rounded-2xl p-6" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                        <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                            <AlertTriangle className="w-5 h-5 text-rose-500" />
                            At-Risk Lecturers ({data.atRisk.length})
                        </h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Lecturers with compliance scores below the 70% institutional threshold.</p>
                    </div>

                    {data.atRisk.length === 0 ? (
                        <div className="rounded-3xl border p-12 text-center flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900" style={{ borderColor: "var(--bg-border)" }}>
                            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500"><CheckCircle className="w-6 h-6" /></div>
                            <div>
                                <h4 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>All Lecturers Compliant</h4>
                                <p className="text-xs text-slate-400 mt-1">No at-risk academic staff members detected.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {data.atRisk.map(s => {
                                const initials = s.lecturerName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
                                return (
                                    <div key={s.lecturerId} className="rounded-3xl border p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:border-red-200/50 dark:hover:border-red-900/50" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                                        <div>
                                            {/* Top Row: Avatar & Risk Badge */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-11 h-11 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 font-bold flex items-center justify-center text-sm">
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-extrabold text-sm" style={{ color: "var(--text-primary)" }}>{s.lecturerName}</h4>
                                                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{s.email} · {s.department}</p>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20 animate-pulse">
                                                    High Risk
                                                </span>
                                            </div>

                                            {/* Progress Bar & Score */}
                                            <div className="mb-5 space-y-2">
                                                <div className="flex justify-between text-xs font-semibold">
                                                    <span style={{ color: "var(--text-secondary)" }}>Compliance Rating</span>
                                                    <span className="font-extrabold text-rose-600">{Math.min(100, Math.max(0, s.score))}%</span>
                                                </div>
                                                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-hover)" }}>
                                                    <div className="h-2 rounded-full bg-gradient-to-r from-red-500 to-rose-600" style={{ width: `${Math.min(100, Math.max(0, s.score))}%` }} />
                                                </div>
                                            </div>

                                            {/* Stats Badges */}
                                            <div className="grid grid-cols-3 gap-2.5 mb-6 text-center">
                                                <div className="p-2 rounded-xl border bg-slate-50/50 dark:bg-slate-900/30" style={{ borderColor: "var(--bg-border)" }}>
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Done</div>
                                                    <div className="text-sm font-black text-emerald-500 mt-0.5">{s.submitted || 0}</div>
                                                </div>
                                                <div className="p-2 rounded-xl border bg-slate-50/50 dark:bg-slate-900/30" style={{ borderColor: "var(--bg-border)" }}>
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Late</div>
                                                    <div className="text-sm font-black text-red-500 mt-0.5">{s.late || 0}</div>
                                                </div>
                                                <div className="p-2 rounded-xl border bg-slate-50/50 dark:bg-slate-900/30" style={{ borderColor: "var(--bg-border)" }}>
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Missing</div>
                                                    <div className="text-sm font-black text-amber-500 mt-0.5">{s.missing || 0}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Send Alert Action */}
                                        <a 
                                            href={`mailto:${s.email}?subject=Urgent: Course Compliance Reminder - LAMAS&body=Dear ${s.lecturerName},%0D%0A%0D%0AThis is an automated reminder from the Academic Admin regarding your current submission compliance rate of ${s.score}%. You have ${s.missing} missing submission(s). Please log in to the LAMAS portal and submit your materials as soon as possible.%0D%0A%0D%0ABest regards,%0D%0AAcademic Administration`}
                                            className="w-full py-2.5 rounded-xl border text-center text-xs font-bold transition flex items-center justify-center gap-2 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400"
                                        >
                                            <Megaphone className="w-4 h-4" />
                                            Send Alert Email
                                        </a>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Trend Tab */}
            {tab === "trend" && (
                <div className="rounded-2xl p-6" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                    <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}><TrendingUp className="w-5 h-5 text-green-500" /> Monthly Submission Trend</h3>
                    {data.trend.length === 0 ? (
                        <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>No trend data yet. Submissions will appear here.</div>
                    ) : (
                        <AdminDashboardCharts data={data} type="line" />
                    )}
                </div>
            )}
        </div>
    );
}
