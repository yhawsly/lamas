"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

export default function AdminAnalyticsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetch("/api/admin/analytics").then(r => r.json()).then(d => { setData(d); setLoading(false); }); }, []);

    if (loading) return <div className="flex justify-center py-32"><div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div>;

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Analytics</h1>
                <p className="text-white/50 mt-1">Trends, heatmaps, and predictive compliance insights</p>
            </div>
            <div className="space-y-6">
                {/* Monthly Trend */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-semibold mb-4">📈 Monthly Submission Trend</h3>
                    {data?.trend?.length === 0 ? <p className="text-white/40 text-sm text-center py-8">No trend data yet. Submissions will appear here.</p> :
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={data?.trend ?? []} margin={{ left: -10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} />
                                <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} />
                                <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }} />
                                <Legend formatter={v => <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{v}</span>} />
                                <Line type="monotone" dataKey="submitted" name="On Time" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981" }} />
                                <Line type="monotone" dataKey="late" name="Late" stroke="#ef4444" strokeWidth={2} dot={{ fill: "#ef4444" }} />
                            </LineChart>
                        </ResponsiveContainer>
                    }
                </div>
                {/* Department Heatmap */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-semibold mb-4">🏢 Department Submission Rates (%)</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={data?.heatmap ?? []} margin={{ left: -10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="department" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} />
                            <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} />
                            <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }} />
                            <Legend formatter={v => <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{v}</span>} />
                            <Bar dataKey="SEMESTER_CALENDAR" name="Calendar" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="COURSE_TOPICS" name="Topics" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="OBSERVATION_REPORT" name="Observation" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                {/* At Risk List */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-semibold mb-4">⚠️ At-Risk Lecturers ({data?.atRisk?.length ?? 0})</h3>
                    {data?.atRisk?.length === 0 ? <div className="text-center py-8 text-white/40">✅ No at-risk lecturers!</div> :
                        <div className="space-y-3">
                            {(data?.atRisk ?? []).map((s: any) => (
                                <div key={s.lecturerId} className="flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                                    <div><div className="text-white font-medium">{s.lecturerName}</div><div className="text-white/40 text-sm">{s.email} · {s.department}</div></div>
                                    <div className="text-right"><div className="text-red-400 font-bold text-xl">{s.score}%</div><div className="text-white/30 text-xs">{s.missing} missing</div></div>
                                </div>
                            ))}
                        </div>
                    }
                </div>
            </div>
        </div>
    );
}
