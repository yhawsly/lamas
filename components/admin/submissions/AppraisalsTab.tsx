"use client";
import { useEffect, useState } from "react";
import SearchableSelect from "@/components/ui/SearchableSelect";
import KPICard from "@/components/ui/KPICard";
import { CheckCircle, Clock, AlertCircle, FileText, Search } from "lucide-react";

export default function AppraisalsTab() {
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ status: "", type: "" });
    const [search, setSearch] = useState("");

    useEffect(() => {
        const params = new URLSearchParams();
        if (filter.status) params.set("status", filter.status);
        if (filter.type) params.set("type", filter.type);
        fetch(`/api/submissions?${params}`).then(r => r.json()).then(d => { setSubmissions(Array.isArray(d) ? d : []); setLoading(false); });
    }, [filter]);

    const filteredSubmissions = submissions.filter((s: any) =>
        (s.lecturer?.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (s.lecturer?.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (s.title || "").toLowerCase().includes(search.toLowerCase())
    );

    const totalSubmissions = submissions.length;
    const submittedCount = submissions.filter(s => s.status === "SUBMITTED").length;
    const lateCount = submissions.filter(s => s.status === "LATE").length;
    const pendingCount = submissions.filter(s => s.status === "PENDING" || s.status === "DRAFT").length;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>Appraisal Submissions</h2>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Review and monitor all lecturer submissions across the university.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Tracked", value: totalSubmissions, icon: <FileText className="w-6 h-6" />, color: "#3b82f6" },
                    { label: "On Time", value: submittedCount, icon: <CheckCircle className="w-6 h-6" />, color: "#10b981" },
                    { label: "Late Submissions", value: lateCount, icon: <AlertCircle className="w-6 h-6" />, color: "#ef4444" },
                    { label: "Pending", value: pendingCount, icon: <Clock className="w-6 h-6" />, color: "#f59e0b" },
                ].map((stat, i) => (
                    <KPICard key={stat.label} delay={i * 100} size="sm" {...stat} />
                ))}
            </div>

            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-1 gap-4 max-w-2xl">
                    <div className="relative flex-1">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                            placeholder="Search by lecturer or title..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition shadow-sm border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500" 
                            style={{ color: "var(--text-primary)" }} 
                        />
                    </div>
                    <div className="w-44">
                        <SearchableSelect
                            value={filter.status}
                            onChange={val => setFilter(f => ({ ...f, status: String(val) }))}
                            options={[
                                { label: "All Statuses", value: "" },
                                { label: "Submitted", value: "SUBMITTED" },
                                { label: "Late", value: "LATE" },
                                { label: "Pending", value: "PENDING" },
                                { label: "Draft", value: "DRAFT" },
                            ]}
                        />
                    </div>
                    <div className="w-52 hidden lg:block">
                        <SearchableSelect
                            value={filter.type}
                            onChange={val => setFilter(f => ({ ...f, type: String(val) }))}
                            options={[
                                { label: "All Types", value: "" },
                                { label: "Semester Calendar", value: "SEMESTER_CALENDAR" },
                                { label: "Course Topics", value: "COURSE_TOPICS" },
                                { label: "Observation Report", value: "OBSERVATION_REPORT" },
                            ]}
                        />
                    </div>
                </div>
            </div>

            {/* Professional List UI */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800/60 overflow-hidden shadow-sm flex flex-col" style={{ backgroundColor: "var(--bg-surface)" }}>
                <div className="hidden sm:grid grid-cols-12 gap-4 p-4 border-b border-slate-200 dark:border-slate-800/60 text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: "var(--bg-hover)", color: "var(--text-muted)" }}>
                    <div className="col-span-3">Lecturer</div>
                    <div className="col-span-3">Department</div>
                    <div className="col-span-2">Submission Type</div>
                    <div className="col-span-2">Date</div>
                    <div className="col-span-2 text-right">Status</div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 flex-1">
                    {loading ? (
                        <div className="flex justify-center items-center h-48">
                            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
                        </div>
                    ) : filteredSubmissions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-center p-8">
                            <FileText className="w-10 h-10 text-slate-400 mb-4" />
                            <h3 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>No Submissions Found</h3>
                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>There are no submissions matching your filters.</p>
                        </div>
                    ) : (
                        filteredSubmissions.map(s => (
                            <div key={s.id} className="group flex flex-col transition-colors hover:bg-[var(--bg-hover)]" style={{ backgroundColor: "var(--bg-base)" }}>
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 sm:p-5 items-center">
                                    {/* Lecturer */}
                                    <div className="col-span-1 sm:col-span-3 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs border shrink-0 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700" style={{ color: "var(--text-primary)" }}>
                                            {(s.lecturer?.name || "?").substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm truncate" style={{ color: "var(--text-primary)" }}>{s.lecturer?.name || "Unknown User"}</div>
                                            <div className="text-xs font-semibold mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{s.lecturer?.email}</div>
                                        </div>
                                    </div>

                                    {/* Department */}
                                    <div className="col-span-1 sm:col-span-3">
                                        <div className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
                                            {s.lecturer?.department?.name || "—"}
                                        </div>
                                        <div className="text-[11px] font-semibold truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
                                            {s.title}
                                        </div>
                                    </div>

                                    {/* Type */}
                                    <div className="col-span-1 sm:col-span-2">
                                        <div className="inline-flex px-2 py-1 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                                            {s.type?.replace(/_/g, " ")}
                                        </div>
                                    </div>

                                    {/* Date */}
                                    <div className="col-span-1 sm:col-span-2">
                                        <div className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
                                            {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : "—"}
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-1 sm:col-span-2 flex justify-end">
                                        {s.status === "SUBMITTED" ? (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                                                <CheckCircle className="w-3 h-3" /> Submitted
                                            </span>
                                        ) : s.status === "LATE" ? (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">
                                                <AlertCircle className="w-3 h-3" /> Late
                                            </span>
                                        ) : s.status === "PENDING" ? (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                                                <Clock className="w-3 h-3" /> Pending
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-700">
                                                <FileText className="w-3 h-3" /> Draft
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
