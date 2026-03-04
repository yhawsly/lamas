"use client";

import { useEffect, useState } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";

interface Analytics {
    summary: { totalLecturers: number; totalSubmissions: number; totalDeadlines: number; avgScore: number; atRiskCount: number };
    scores: any[];
    atRisk: any[];
    heatmap: any[];
    trend: any[];
}
export default function AdminDashboard() {
    const [data, setData] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<"overview" | "lecturers" | "atRisk" | "trend">("overview");
    const [notify, setNotify] = useState({ message: "", show: false, sent: false });

    useEffect(() => {
        fetch("/api/admin/analytics").then(r => r.json()).then(d => { setData(d); setLoading(false); });
    }, []);

    async function sendBroadcast() {
        const res = await fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: notify.message }),
        });
        if (res.ok) setNotify(n => ({ ...n, sent: true }));
    }

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div>;
    if (!data) return null;

    const { summary } = data;

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-white/50 mt-1">Institution-wide academic compliance overview</p>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {[
                    { label: "Total Lecturers", value: summary.totalLecturers, icon: "👥", color: "text-blue-400" },
                    { label: "Total Submissions", value: summary.totalSubmissions, icon: "📋", color: "text-green-400" },
                    { label: "Deadlines Set", value: summary.totalDeadlines, icon: "⏰", color: "text-yellow-400" },
                    { label: "Avg Compliance", value: `${summary.avgScore}%`, icon: "📊", color: summary.avgScore >= 70 ? "text-green-400" : "text-red-400" },
                    { label: "At Risk", value: summary.atRiskCount, icon: "⚠️", color: "text-red-400" },
                ].map(k => (
                    <div key={k.label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <div className="text-2xl mb-1">{k.icon}</div>
                        <div className={`text-3xl font-bold ${k.color}`}>{k.value}</div>
                        <div className="text-white/40 text-xs mt-1">{k.label}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-6 w-fit flex-wrap">
                {(["overview", "lecturers", "atRisk", "trend"] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${tab === t ? "bg-blue-600 text-white" : "text-white/50 hover:text-white"}`}>
                        {t === "atRisk" ? "⚠️ At Risk" : t === "trend" ? "📈 Trend" : t === "lecturers" ? "👥 Scores" : "📊 Overview"}
                    </button>
                ))}
            </div>

            {/* Overview Tab — Charts */}
            {tab === "overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Compliance Distribution */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-white font-semibold mb-4">Compliance Score Distribution</h3>
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie data={[
                                    { name: "Excellent (90-100%)", value: data.scores.filter(s => s.score >= 90).length },
                                    { name: "Good (70-89%)", value: data.scores.filter(s => s.score >= 70 && s.score < 90).length },
                                    { name: "At Risk (<70%)", value: data.scores.filter(s => s.score < 70).length },
                                ]} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ value }) => `${value}`}>
                                    {[0, 1, 2].map(i => <Cell key={i} fill={["#10b981", "#3b82f6", "#ef4444"][i]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }} />
                                <Legend formatter={(v) => <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{v}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Dept Heatmap bars */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-white font-semibold mb-4">Department Submission Rate (%)</h3>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={data.heatmap} margin={{ left: -10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="department" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} />
                                <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} domain={[0, 100]} />
                                <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }} />
                                <Bar dataKey="SEMESTER_CALENDAR" name="Calendar" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="COURSE_TOPICS" name="Topics" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="OBSERVATION_REPORT" name="Observation" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                <Legend formatter={(v) => <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{v}</span>} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Broadcast Notification */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 lg:col-span-2">
                        <h3 className="text-white font-semibold mb-4">📢 Broadcast Notification</h3>
                        {notify.sent ? (
                            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300">✅ Notification sent to all lecturers.</div>
                        ) : (
                            <div className="flex gap-3">
                                <input value={notify.message} onChange={e => setNotify(n => ({ ...n, message: e.target.value }))}
                                    placeholder="Type a message to broadcast to all lecturers..."
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm" />
                                <button onClick={sendBroadcast} disabled={!notify.message}
                                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition disabled:opacity-40">
                                    Send
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Lecturers Scores Tab */}
            {tab === "lecturers" && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-semibold mb-4">Lecturer Compliance Scores</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="text-white/40 text-left border-b border-white/5">
                                <th className="pb-3">Lecturer</th><th className="pb-3">Department</th>
                                <th className="pb-3">Score</th><th className="pb-3">Submitted</th>
                                <th className="pb-3">Late</th><th className="pb-3">Missing</th><th className="pb-3">Status</th>
                            </tr></thead>
                            <tbody className="divide-y divide-white/5">
                                {data.scores.map(s => (
                                    <tr key={s.lecturerId} className="text-white/70">
                                        <td className="py-3"><div>{s.lecturerName}</div><div className="text-white/30 text-xs">{s.email}</div></td>
                                        <td className="py-3 text-white/50">{s.department}</td>
                                        <td className="py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 h-1.5 rounded-full bg-white/10">
                                                    <div className={`h-1.5 rounded-full ${s.score >= 70 ? "bg-green-500" : "bg-red-500"}`} style={{ width: `${s.score}%` }} />
                                                </div>
                                                <span className={s.score >= 70 ? "text-green-400" : "text-red-400"}>{s.score}%</span>
                                            </div>
                                        </td>
                                        <td className="py-3 text-green-400">{s.submitted}</td>
                                        <td className="py-3 text-red-400">{s.late}</td>
                                        <td className="py-3 text-yellow-400">{s.missing}</td>
                                        <td className="py-3">{s.isAtRisk ? <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-300">At Risk</span> : <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-300">Good</span>}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* At Risk Tab */}
            {tab === "atRisk" && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-semibold mb-4">⚠️ At-Risk Lecturers ({data.atRisk.length})</h3>
                    {data.atRisk.length === 0 ? (
                        <div className="text-center py-8 text-white/40">✅ No at-risk lecturers detected!</div>
                    ) : (
                        <div className="space-y-3">
                            {data.atRisk.map(s => (
                                <div key={s.lecturerId} className="flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                                    <div>
                                        <div className="text-white font-medium">{s.lecturerName}</div>
                                        <div className="text-white/40 text-sm">{s.email} · {s.department}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-red-400 font-bold text-xl">{s.score}%</div>
                                        <div className="text-white/30 text-xs">{s.missing} missing</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Trend Tab */}
            {tab === "trend" && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-semibold mb-4">📈 Monthly Submission Trend</h3>
                    {data.trend.length === 0 ? (
                        <div className="text-center py-8 text-white/40">No trend data yet. Submissions will appear here.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={320}>
                            <LineChart data={data.trend} margin={{ left: -10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} />
                                <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} />
                                <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }} />
                                <Legend formatter={(v) => <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{v}</span>} />
                                <Line type="monotone" dataKey="submitted" name="On Time" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981" }} />
                                <Line type="monotone" dataKey="late" name="Late" stroke="#ef4444" strokeWidth={2} dot={{ fill: "#ef4444" }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            )}
        </div>
    );
}
