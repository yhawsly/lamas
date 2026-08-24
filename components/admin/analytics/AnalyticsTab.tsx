"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    BarChart, Bar, Legend 
} from "recharts";
import { 
    TrendingUp, Users, AlertTriangle, CheckCircle2, Search, Filter, 
    RefreshCw, Layers, ArrowUpRight, Sparkles, Building, Check, X 
} from "lucide-react";
import { useTerm } from "@/context/TermContext";

export function LiveAnalyticsSkeleton() {
    return (
        <div className="w-full space-y-8 animate-pulse">
            {/* Top KPI Metrics Shimmer */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-3">
                        <div className="flex justify-between items-center">
                            <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-xl sm:rounded-2xl bg-slate-200 dark:bg-slate-800" />
                            <div className="w-12 sm:w-16 h-4 sm:h-5 rounded-full bg-slate-200 dark:bg-slate-800" />
                        </div>
                        <div className="h-6 sm:h-8 w-20 sm:w-24 bg-slate-200 dark:bg-slate-700/80 rounded-lg" />
                        <div className="h-3 sm:h-4 w-28 sm:w-36 bg-slate-200 dark:bg-slate-700/80 rounded" />
                    </div>
                ))}
            </div>

            {/* Interactive Tool Bar Shimmer */}
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex gap-2">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-9 w-28 bg-slate-200 dark:bg-slate-700/80 rounded-xl" />
                    ))}
                </div>
                <div className="h-9 w-64 bg-slate-200 dark:bg-slate-700/80 rounded-xl" />
            </div>

            {/* Two Main Chart Cards Shimmer */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="rounded-3xl p-7 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 h-96 flex flex-col justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
                        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700/80 rounded" />
                    </div>
                    <div className="h-64 bg-slate-200/70 dark:bg-slate-800/50 rounded-2xl" />
                </div>
                <div className="rounded-3xl p-7 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 h-96 flex flex-col justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
                        <div className="h-6 w-52 bg-slate-200 dark:bg-slate-700/80 rounded" />
                    </div>
                    <div className="h-64 bg-slate-200/70 dark:bg-slate-800/50 rounded-2xl" />
                </div>
            </div>

            {/* Faculty Compliance Matrix Shimmer */}
            <div className="rounded-3xl p-7 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-4">
                <div className="h-6 w-56 bg-slate-200 dark:bg-slate-700/80 rounded" />
                <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-16 bg-slate-200/60 dark:bg-slate-800/40 rounded-2xl" />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function AnalyticsTab() {
    const { selectedTermId } = useTerm();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Simple Analytic Tool State
    const [selectedDept, setSelectedDept] = useState<string>("ALL");
    const [viewMode, setViewMode] = useState<"ALL" | "TREND" | "HEATMAP" | "AT_RISK">("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<"score_desc" | "score_asc" | "missing_desc" | "name">("score_desc");

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        try {
            const url = selectedTermId 
                ? `/api/admin/analytics?termId=${selectedTermId}` 
                : "/api/admin/analytics";
            const res = await fetch(url);
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (e) {
            console.error("Failed to load analytics:", e);
        } finally {
            setLoading(false);
        }
    }, [selectedTermId]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    // Compute unique departments for filter
    const departments = useMemo(() => {
        if (!data?.scores) return [];
        const depts = new Set<string>();
        data.scores.forEach((s: any) => {
            if (s.department) depts.add(s.department);
        });
        return Array.from(depts);
    }, [data]);

    // Filtered and sorted faculty compliance data
    const filteredScores = useMemo(() => {
        if (!data?.scores) return [];
        let list = [...data.scores];

        if (selectedDept !== "ALL") {
            list = list.filter((s: any) => s.department === selectedDept);
        }

        if (viewMode === "AT_RISK") {
            list = list.filter((s: any) => s.isAtRisk);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter((s: any) => 
                s.lecturerName.toLowerCase().includes(q) ||
                s.email.toLowerCase().includes(q) ||
                (s.department || "").toLowerCase().includes(q)
            );
        }

        list.sort((a, b) => {
            if (sortBy === "score_desc") return b.score - a.score;
            if (sortBy === "score_asc") return a.score - b.score;
            if (sortBy === "missing_desc") return b.missing - a.missing;
            if (sortBy === "name") return a.lecturerName.localeCompare(b.lecturerName);
            return 0;
        });

        return list;
    }, [data, selectedDept, viewMode, searchQuery, sortBy]);

    if (loading && !data) {
        return <LiveAnalyticsSkeleton />;
    }

    const summary = data?.summary || {
        avgScore: 0,
        totalLecturers: data?.scores?.length || 0,
        totalSubmissions: 0,
        atRiskCount: data?.atRisk?.length || 0
    };

    return (
        <div className="w-full space-y-8 animate-in fade-in duration-500 font-sans">
            {/* ── 1. KPI Summary Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {/* Average Compliance */}
                <div className="group relative rounded-2xl sm:rounded-3xl p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-black tracking-wider uppercase ${
                            summary.avgScore >= 75 
                                ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" 
                                : "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                        }`}>
                            {summary.avgScore >= 75 ? "Optimal" : "Attention"}
                        </span>
                    </div>
                    <div className="mt-3 sm:mt-4">
                        <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            {summary.avgScore}%
                        </div>
                        <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mt-1 truncate">Average Compliance</p>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-700/80 rounded-full h-1.5 mt-3 sm:mt-4 overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full transition-all duration-700" style={{ width: `${summary.avgScore}%` }} />
                    </div>
                </div>

                {/* Faculty Monitored */}
                <div className="group relative rounded-2xl sm:rounded-3xl p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-slate-400">Active</span>
                    </div>
                    <div className="mt-3 sm:mt-4">
                        <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            {summary.totalLecturers}
                        </div>
                        <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mt-1 truncate">Faculty Tracked</p>
                    </div>
                    <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 mt-2 sm:mt-3 truncate">
                        Across departments
                    </p>
                </div>

                {/* Total Submissions */}
                <div className="group relative rounded-2xl sm:rounded-3xl p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <span className="px-1.5 sm:px-2.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300">
                            Verified
                        </span>
                    </div>
                    <div className="mt-3 sm:mt-4">
                        <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            {summary.totalSubmissions}
                        </div>
                        <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mt-1 truncate">Submissions</p>
                    </div>
                    <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 mt-2 sm:mt-3 truncate">
                        Syllabi & logs
                    </p>
                </div>

                {/* At-Risk Flagged */}
                <div 
                    onClick={() => setViewMode(viewMode === "AT_RISK" ? "ALL" : "AT_RISK")}
                    className={`group relative rounded-2xl sm:rounded-3xl p-4 sm:p-6 cursor-pointer border shadow-sm hover:shadow-md transition-all ${
                        viewMode === "AT_RISK" 
                            ? "bg-rose-50 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/20" 
                            : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-black tracking-wider uppercase text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 sm:py-1 rounded-full border border-rose-200 dark:border-rose-800">
                            Filter
                        </span>
                    </div>
                    <div className="mt-3 sm:mt-4">
                        <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            {summary.atRiskCount}
                        </div>
                        <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mt-1 truncate">At-Risk Interventions</p>
                    </div>
                    <p className="text-[10px] sm:text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-2 sm:mt-3 flex items-center gap-1 truncate">
                        <span>Filter at-risk staff</span>
                        <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </p>
                </div>
            </div>

            {/* ── 2. Simple Analytic Tool Bar ── */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* View Modes */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mr-1 shrink-0 flex items-center gap-1.5">
                            <Filter className="w-3.5 h-3.5" /> Filter:
                        </span>
                        {[
                            { id: "ALL", label: "All Analytics", icon: Layers },
                            { id: "TREND", label: "Submission Trends", icon: TrendingUp },
                            { id: "HEATMAP", label: "Department Matrix", icon: Building },
                            { id: "AT_RISK", label: `At-Risk (${summary.atRiskCount})`, icon: AlertTriangle },
                        ].map(mode => {
                            const Icon = mode.icon;
                            const isActive = viewMode === mode.id;
                            return (
                                <button
                                    key={mode.id}
                                    type="button"
                                    onClick={() => setViewMode(mode.id as any)}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                                        isActive
                                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-500/20"
                                            : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80"
                                    }`}
                                >
                                    <Icon className={`w-3.5 h-3.5 ${isActive ? "opacity-100" : "opacity-60"}`} />
                                    <span>{mode.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Department Selector & Refresh */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400">Department:</span>
                            <select
                                value={selectedDept}
                                onChange={(e) => setSelectedDept(e.target.value)}
                                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                            >
                                <option value="ALL">All Departments</option>
                                {departments.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="button"
                            onClick={fetchAnalytics}
                            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                            title="Refresh Analytics"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Secondary Search & Sort Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search lecturer, department or email..."
                            className="w-full pl-9 pr-8 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md transition cursor-pointer"
                                aria-label="Clear search query"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-400">Sort By:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                        >
                            <option value="score_desc">Highest Compliance</option>
                            <option value="score_asc">Lowest Compliance</option>
                            <option value="missing_desc">Most Missing Items</option>
                            <option value="name">Lecturer Name (A-Z)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* ── 3. Chart Visualizations (When ALL, TREND, or HEATMAP active) ── */}
            {(viewMode === "ALL" || viewMode === "TREND" || viewMode === "HEATMAP") && (
                <div className={`grid gap-8 ${viewMode === "ALL" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
                    {/* Monthly Trend Card */}
                    {(viewMode === "ALL" || viewMode === "TREND") && (
                        <div className="group relative rounded-3xl p-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm transition-all">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Monthly Submission Trend</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">On-time vs Late submission timeline</p>
                                </div>
                            </div>
                            
                            {data?.trend?.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                                    <p className="text-xs font-bold">No trend data recorded for this period.</p>
                                </div>
                            ) : (
                                <div className="h-72 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={data?.trend ?? []} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} vertical={false} />
                                            <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} dy={10} />
                                            <YAxis tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} dx={-10} />
                                            <Tooltip 
                                                contentStyle={{ background: "var(--bg-surface)", border: "1px solid var(--bg-border)", borderRadius: "12px", color: "var(--text-primary)", fontSize: "12px", fontWeight: "bold" }} 
                                            />
                                            <Legend wrapperStyle={{ paddingTop: "15px", fontWeight: "bold", fontSize: "11px" }} />
                                            <Line type="monotone" dataKey="submitted" name="On Time" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: "#3b82f6" }} activeDot={{ r: 6 }} />
                                            <Line type="monotone" dataKey="late" name="Late" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, fill: "#f43f5e" }} activeDot={{ r: 6 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Department Heatmap Card */}
                    {(viewMode === "ALL" || viewMode === "HEATMAP") && (
                        <div className="group relative rounded-3xl p-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm transition-all">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                    <Building className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Department Compliance Rates</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">Completion percentage across curriculum milestones</p>
                                </div>
                            </div>
                            
                            <div className="h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data?.heatmap ?? []} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} vertical={false} />
                                        <XAxis dataKey="department" tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} dy={10} />
                                        <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} dx={-10} tickFormatter={(val) => `${val}%`} />
                                        <Tooltip 
                                            contentStyle={{ background: "var(--bg-surface)", border: "1px solid var(--bg-border)", borderRadius: "12px", color: "var(--text-primary)", fontSize: "12px", fontWeight: "bold" }} 
                                        />
                                        <Legend wrapperStyle={{ paddingTop: "15px", fontWeight: "bold", fontSize: "11px" }} />
                                        <Bar dataKey="SEMESTER_CALENDAR" name="Calendar" fill="#60a5fa" radius={[6, 6, 0, 0]} maxBarSize={32} />
                                        <Bar dataKey="COURSE_TOPICS" name="Topics" fill="#34d399" radius={[6, 6, 0, 0]} maxBarSize={32} />
                                        <Bar dataKey="OBSERVATION_REPORT" name="Observation" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={32} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── 4. Interactive Faculty Performance & Compliance Matrix ── */}
            <div className="rounded-3xl p-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            Faculty Compliance Performance Tool
                        </h3>
                        <p className="text-xs font-semibold text-slate-400 mt-1">
                            Live breakdown of submission milestones, on-time fidelity, and risk metrics.
                        </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        Showing {filteredScores.length} of {data?.scores?.length || 0} Faculty
                    </span>
                </div>

                {filteredScores.length === 0 ? (
                    <div className="py-12 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800">
                        <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">No faculty records match your criteria.</p>
                        <p className="text-xs text-slate-400 mt-1">Try clearing your search query or choosing &quot;All Departments&quot;.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredScores.map((lec: any) => {
                            const isAtRisk = lec.isAtRisk || lec.score < 50;
                            const isOptimal = lec.score >= 80;

                            return (
                                <div
                                    key={lec.lecturerId}
                                    className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                                        isAtRisk 
                                            ? "bg-rose-50/30 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/60 hover:border-rose-400" 
                                            : isOptimal
                                            ? "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-blue-400"
                                            : "bg-slate-50/50 dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-400"
                                    }`}
                                >
                                    {/* Faculty Info */}
                                    <div className="flex items-center gap-3.5 min-w-[240px]">
                                        <div className={`w-10 h-10 rounded-2xl font-black text-xs flex items-center justify-center shrink-0 ${
                                            isAtRisk 
                                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20" 
                                                : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                        }`}>
                                            {lec.lecturerName.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                                {lec.lecturerName}
                                                {isOptimal && (
                                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                                )}
                                            </div>
                                            <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                                                {lec.department} · {lec.email}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Score & Progress Bar */}
                                    <div className="flex-1 max-w-xs space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-slate-500">Compliance Rate</span>
                                            <span className={`font-black ${
                                                isAtRisk ? "text-rose-600 dark:text-rose-400" : isOptimal ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                                            }`}>
                                                {lec.score}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-200 dark:bg-slate-700/80 rounded-full h-2 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    isAtRisk ? "bg-rose-500" : isOptimal ? "bg-emerald-500" : "bg-amber-500"
                                                }`}
                                                style={{ width: `${lec.score}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Stats Badges */}
                                    <div className="flex items-center gap-3 shrink-0">
                                        <div className="text-center px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                                            <div className="text-xs font-black text-slate-800 dark:text-slate-200">{lec.submitted || 0}</div>
                                            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">On Time</div>
                                        </div>
                                        <div className="text-center px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                                            <div className="text-xs font-black text-slate-800 dark:text-slate-200">{lec.late || 0}</div>
                                            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Late</div>
                                        </div>
                                        <div className={`text-center px-3 py-1.5 rounded-xl ${
                                            lec.missing > 0 ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                        }`}>
                                            <div className="text-xs font-black">{lec.missing || 0}</div>
                                            <div className="text-[9px] font-bold uppercase tracking-wider">Missing</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
