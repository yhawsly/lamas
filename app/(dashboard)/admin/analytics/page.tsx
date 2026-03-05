"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

export default function AdminAnalyticsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetch("/api/admin/analytics").then(r => r.json()).then(d => { setData(d); setLoading(false); }); }, []);

    if (loading) return <div className="flex justify-center py-32"><div className="animate-spin w-8 h-8 border-2" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>;

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Analytics</h1>
                <p className="mt-1" style={{ color: "var(--text-muted)" }}>Trends, heatmaps, and predictive compliance insights</p>
            </div>
            <div className="space-y-6">
                {/* Monthly Trend */}
                <div className="rounded-2xl p-6" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                    <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>📈 Monthly Submission Trend</h3>
                    {data?.trend?.length === 0 ? <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>No trend data yet. Submissions will appear here.</p> :
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={data?.trend ?? []} margin={{ left: -10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" />
                                <XAxis dataKey="month" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
                                <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
                                <Tooltip contentStyle={{ background: "var(--bg-surface)", border: "1px solid var(--bg-border)", borderRadius: "8px", color: "var(--text-primary)" }} />
                                <Legend formatter={v => <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{v}</span>} />
                                <Line type="monotone" dataKey="submitted" name="On Time" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981" }} />
                                <Line type="monotone" dataKey="late" name="Late" stroke="#ef4444" strokeWidth={2} dot={{ fill: "#ef4444" }} />
                            </LineChart>
                        </ResponsiveContainer>
                    }
                </div>
                {/* Department Heatmap */}
                <div className="rounded-2xl p-6" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                    <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>🏢 Department Submission Rates (%)</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={data?.heatmap ?? []} margin={{ left: -10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" />
                            <XAxis dataKey="department" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
                            <YAxis domain={[0, 100]} tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
                            <Tooltip contentStyle={{ background: "var(--bg-surface)", border: "1px solid var(--bg-border)", borderRadius: "8px", color: "var(--text-primary)" }} />
                            <Legend formatter={v => <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{v}</span>} />
                            <Bar dataKey="SEMESTER_CALENDAR" name="Calendar" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="COURSE_TOPICS" name="Topics" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="OBSERVATION_REPORT" name="Observation" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                {/* At Risk List */}
                <div className="rounded-2xl p-6" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                    <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>⚠️ At-Risk Lecturers ({data?.atRisk?.length ?? 0})</h3>
                    {data?.atRisk?.length === 0 ? <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>✅ No at-risk lecturers!</div> :
                        <div className="space-y-3">
                            {(data?.atRisk ?? []).map((s: any) => (
                                <div key={s.lecturerId} className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                                    <div><div className="font-medium" style={{ color: "var(--text-primary)" }}>{s.lecturerName}</div><div className="text-sm" style={{ color: "var(--text-muted)" }}>{s.email} · {s.department}</div></div>
                                    <div className="text-right"><div className="font-bold text-xl" style={{ color: "#ef4444" }}>{s.score}%</div><div className="text-xs" style={{ color: "var(--text-muted)" }}>{s.missing} missing</div></div>
                                </div>
                            ))}
                        </div>
                    }
                </div>
            </div>
        </div>
    );
}
