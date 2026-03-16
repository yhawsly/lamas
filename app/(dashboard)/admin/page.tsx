"use client";

import { useEffect, useState } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import ComplianceChart from "@/components/analytics/ComplianceChart";
import ObservationRadar from "@/components/analytics/ObservationRadar";

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

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>;
    if (!data) return null;

    const { summary } = data;

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Admin Dashboard</h1>
                <p className="mt-1" style={{ color: "var(--text-muted)" }}>Institution-wide academic compliance overview</p>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {[
                    { label: "Total Lecturers", value: summary.totalLecturers, icon: "👥", color: "#3b82f6" },
                    { label: "Total Submissions", value: summary.totalSubmissions, icon: "📋", color: "#10b981" },
                    { label: "Deadlines Set", value: summary.totalDeadlines, icon: "⏰", color: "#f59e0b" },
                    { label: "Avg Compliance", value: `${summary.avgScore}%`, icon: "📊", color: summary.avgScore >= 70 ? "#10b981" : "#ef4444" },
                    { label: "At Risk", value: summary.atRiskCount, icon: "⚠️", color: "#ef4444" },
                ].map(k => (
                    <div key={k.label} className="rounded-2xl p-4" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                        <div className="text-2xl mb-1">{k.icon}</div>
                        <div className="text-3xl font-bold" style={{ color: k.color }}>{k.value}</div>
                        <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{k.label}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit flex-wrap" style={{ backgroundColor: "var(--bg-surface)" }}>
                {(["overview", "lecturers", "atRisk", "trend"] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className="px-4 py-2 rounded-lg text-sm font-medium capitalize transition"
                        style={{
                            backgroundColor: tab === t ? "var(--primary)" : "transparent",
                            color: tab === t ? "white" : "var(--text-muted)"
                        }}>
                        {t === "atRisk" ? "⚠️ At Risk" : t === "trend" ? "📈 Trend" : t === "lecturers" ? "👥 Scores" : "📊 Overview"}
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
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie data={[
                                    { name: "Excellent (90-100%)", value: data.scores.filter(s => s.score >= 90).length },
                                    { name: "Good (70-89%)", value: data.scores.filter(s => s.score >= 70 && s.score < 90).length },
                                    { name: "At Risk (<70%)", value: data.scores.filter(s => s.score < 70).length },
                                ]} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ value }) => `${value}`}>
                                    {[0, 1, 2].map(i => <Cell key={i} fill={["#10b981", "#3b82f6", "#ef4444"][i]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)", borderRadius: "8px", color: "var(--text-primary)" }} />
                                <Legend formatter={(v) => <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{v}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Dept Heatmap bars */}
                    <div className="rounded-2xl p-6" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                        <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Department Submission Rate (%)</h3>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={data.heatmap} margin={{ left: -10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" />
                                <XAxis dataKey="department" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
                                <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 12 }} domain={[0, 100]} />
                                <Tooltip contentStyle={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)", borderRadius: "8px", color: "var(--text-primary)" }} />
                                <Bar dataKey="SEMESTER_CALENDAR" name="Calendar" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="COURSE_TOPICS" name="Topics" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="OBSERVATION_REPORT" name="Observation" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                <Legend formatter={(v) => <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{v}</span>} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Broadcast Notification */}
                    <div className="rounded-2xl p-6 lg:col-span-2" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                        <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>📢 Broadcast Notification</h3>
                        {notify.sent ? (
                            <div className="p-3 rounded-xl text-green-300" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)" }}>✅ Notification sent to all lecturers.</div>
                        ) : (
                            <div className="flex gap-3">
                                <input value={notify.message} onChange={e => setNotify(n => ({ ...n, message: e.target.value }))}
                                    placeholder="Type a message to broadcast to all lecturers..."
                                    className="flex-1 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 text-sm"
                                    style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} />
                                <button onClick={sendBroadcast} disabled={!notify.message}
                                    className="px-5 py-2.5 rounded-xl text-white font-medium text-sm transition disabled:opacity-40"
                                    style={{ backgroundColor: "var(--primary)", color: "white" }}>
                                    Send
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
                                                    <div className="h-1.5 rounded-full" style={{ width: `${s.score}%`, backgroundColor: s.score >= 70 ? "#10b981" : "#ef4444" }} />
                                                </div>
                                                <span style={{ color: s.score >= 70 ? "#10b981" : "#ef4444" }}>{s.score}%</span>
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
                <div className="rounded-2xl p-6" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                    <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>⚠️ At-Risk Lecturers ({data.atRisk.length})</h3>
                    {data.atRisk.length === 0 ? (
                        <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>✅ No at-risk lecturers detected!</div>
                    ) : (
                        <div className="space-y-3">
                            {data.atRisk.map(s => (
                                <div key={s.lecturerId} className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                                    <div>
                                        <div className="font-medium" style={{ color: "var(--text-primary)" }}>{s.lecturerName}</div>
                                        <div className="text-sm" style={{ color: "var(--text-muted)" }}>{s.email} · {s.department}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-xl" style={{ color: "#ef4444" }}>{s.score}%</div>
                                        <div className="text-xs" style={{ color: "var(--text-muted)" }}>{s.missing} missing</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Trend Tab */}
            {tab === "trend" && (
                <div className="rounded-2xl p-6" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                    <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>📈 Monthly Submission Trend</h3>
                    {data.trend.length === 0 ? (
                        <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>No trend data yet. Submissions will appear here.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={320}>
                            <LineChart data={data.trend} margin={{ left: -10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" />
                                <XAxis dataKey="month" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
                                <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
                                <Tooltip contentStyle={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)", borderRadius: "8px", color: "var(--text-primary)" }} />
                                <Legend formatter={(v) => <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{v}</span>} />
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
