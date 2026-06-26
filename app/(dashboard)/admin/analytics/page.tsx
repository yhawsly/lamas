"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

export default function AdminAnalyticsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/analytics")
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d) setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                </div>
                <p className="text-indigo-400 font-medium animate-pulse">Aggregating analytics...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto pb-12">
            {/* Premium Header */}
            <div className="relative mb-10 p-8 rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 border border-white/10 shadow-2xl shadow-indigo-500/20">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl mix-blend-screen pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl mix-blend-screen pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-4">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            Live Analytics
                        </div>
                        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200 tracking-tight">
                            Performance Insights
                        </h1>
                        <p className="mt-2 text-blue-300/80 max-w-xl text-lg font-light">
                            Deep dive into academic compliance trends, departmental heatmaps, and predictive risk factors across the institution.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Monthly Trend Card */}
                <div className="group relative rounded-3xl p-7 bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl hover:bg-white/[0.07] transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                            </div>
                            <h3 className="text-xl font-semibold text-white">Monthly Submission Trend</h3>
                        </div>
                        {data?.trend?.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                                <svg className="w-12 h-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                <p>No trend data yet. Check back later.</p>
                            </div>
                        ) : (
                            <div className="h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data?.trend ?? []} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                                        <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
                                        <Tooltip 
                                            contentStyle={{ background: "rgba(15, 23, 42, 0.9)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#f8fafc", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)" }} 
                                            itemStyle={{ color: "#e2e8f0" }}
                                        />
                                        <Legend wrapperStyle={{ paddingTop: "20px" }} />
                                        <Line type="monotone" dataKey="submitted" name="On Time" stroke="#34d399" strokeWidth={3} dot={{ r: 4, fill: "#34d399", strokeWidth: 2, stroke: "#0f172a" }} activeDot={{ r: 6, strokeWidth: 0 }} />
                                        <Line type="monotone" dataKey="late" name="Late" stroke="#fb7185" strokeWidth={3} dot={{ r: 4, fill: "#fb7185", strokeWidth: 2, stroke: "#0f172a" }} activeDot={{ r: 6, strokeWidth: 0 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>

                {/* Department Heatmap Card */}
                <div className="group relative rounded-3xl p-7 bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl hover:bg-white/[0.07] transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                            </div>
                            <h3 className="text-xl font-semibold text-white">Department Submission Rates</h3>
                        </div>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data?.heatmap ?? []} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="department" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} tickFormatter={(val) => `${val}%`} />
                                    <Tooltip 
                                        cursor={{ fill: "rgba(255,255,255,0.02)" }}
                                        contentStyle={{ background: "rgba(15, 23, 42, 0.9)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#f8fafc", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)" }} 
                                    />
                                    <Legend wrapperStyle={{ paddingTop: "20px" }} />
                                    <Bar dataKey="SEMESTER_CALENDAR" name="Calendar" fill="#60a5fa" radius={[6, 6, 0, 0]} maxBarSize={40} />
                                    <Bar dataKey="COURSE_TOPICS" name="Topics" fill="#34d399" radius={[6, 6, 0, 0]} maxBarSize={40} />
                                    <Bar dataKey="OBSERVATION_REPORT" name="Observation" fill="#fbbf24" radius={[6, 6, 0, 0]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* At Risk Lecturers Full Width */}
                <div className="lg:col-span-2 group relative rounded-3xl p-7 bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl hover:bg-white/[0.07] transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white">At-Risk Lecturers</h3>
                                    <p className="text-sm text-slate-400 mt-1">Personnel requiring immediate follow-up</p>
                                </div>
                            </div>
                            <div className="px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm">
                                {data?.atRisk?.length ?? 0} Flagged
                            </div>
                        </div>

                        {data?.atRisk?.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <p className="text-lg font-medium text-slate-300">All Clear</p>
                                <p className="text-sm mt-1">No lecturers are currently flagged as at-risk.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {(data?.atRisk ?? []).map((s: any, i: number) => (
                                    <div 
                                        key={s.lecturerId} 
                                        className="relative p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-red-500/30 hover:bg-red-500/5 transition-all duration-300 cursor-pointer overflow-hidden group/card"
                                        style={{ animationDelay: `${i * 100}ms` }}
                                    >
                                        <div className="absolute top-0 left-0 w-1 h-full bg-red-500 opacity-50 group-hover/card:opacity-100 transition-opacity" />
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="font-semibold text-slate-200 group-hover/card:text-white transition-colors">{s.lecturerName}</div>
                                                <div className="text-xs text-slate-400 mt-0.5">{s.email}</div>
                                            </div>
                                            <div className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20 shadow-inner">
                                                {s.score}%
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-sm">
                                            <span className="text-slate-400">{s.department}</span>
                                            <span className="flex items-center gap-1.5 text-orange-300 font-medium bg-orange-500/10 px-2 py-0.5 rounded-md">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                {s.missing} missing
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
