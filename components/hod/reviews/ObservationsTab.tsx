"use client";
import { useEffect, useState } from "react";
import Loader from "@/components/ui/Loader";
import { Eye, Calendar, User, ChevronRight } from "lucide-react";

const ObservationsSkeleton = () => (
    <div className="divide-y divide-slate-100 dark:divide-slate-800/60 animate-pulse">
        {[1, 2, 3].map((i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-5 items-center">
                <div className="col-span-3 space-y-2">
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-3.5 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
                <div className="col-span-3 space-y-3">
                    <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
                <div className="col-span-2">
                    <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-3.5 w-16 bg-slate-200 dark:bg-slate-800 rounded mt-1" />
                </div>
                <div className="col-span-2">
                    <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
                </div>
                <div className="col-span-2 flex justify-end">
                    <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
            </div>
        ))}
    </div>
);

export default function ObservationsTab() {
    const [observations, setObservations] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [lecturers, setLecturers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/observations").then(r => r.json()).then(d => {
            // API returns { data: [...], meta: {...} } — not a plain array
            const list = Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
            setObservations(list);
            setLoading(false);
        }).catch(() => setLoading(false));
        fetch("/api/courses").then(r => r.json()).then(d => setCourses(Array.isArray(d) ? d : []));
        fetch("/api/lecturers").then(r => r.json()).then(d => setLecturers(Array.isArray(d) ? d : []));
    }, []);

    const statusColors: Record<string, string> = { 
        PENDING: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20", 
        COMPLETED: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20", 
        REVIEWED: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20" 
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>Classroom Observations</h2>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Manage and review classroom observation sessions within the department.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800/60 overflow-hidden shadow-sm flex flex-col" style={{ backgroundColor: "var(--bg-surface)" }}>
                <div className="hidden sm:grid grid-cols-12 gap-4 p-4 border-b border-slate-200 dark:border-slate-800/60 text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: "var(--bg-hover)", color: "var(--text-muted)" }}>
                    <div className="col-span-3">Course Info</div>
                    <div className="col-span-3">Lecturer / Observer</div>
                    <div className="col-span-2">Date</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2 text-right">Action</div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {loading ? (
                        <ObservationsSkeleton />
                    ) : observations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-center p-8">
                            <Eye className="w-10 h-10 text-slate-400 mb-4" />
                            <h3 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>No Observations</h3>
                            <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>There are no classroom observations scheduled or recorded yet.</p>
                        </div>
                    ) : (
                        observations.map(o => (
                            <div key={o.id} className="group flex flex-col transition-colors hover:bg-[var(--bg-hover)]" style={{ backgroundColor: "var(--bg-base)" }}>
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 sm:p-5 items-center">
                                    {/* Course Info */}
                                    <div className="col-span-1 sm:col-span-3">
                                        <div className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{o.courseCode}</div>
                                        <div className="inline-flex mt-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[9px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                                            {o.status === "PENDING" ? "Scheduled" : "Recorded"}
                                        </div>
                                    </div>

                                    {/* Lecturer / Observer */}
                                    <div className="col-span-1 sm:col-span-3 space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <User className="w-3.5 h-3.5 text-slate-400" />
                                            <div>
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Observed</div>
                                                <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{o.lecturer?.name || "Unknown"}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Eye className="w-3.5 h-3.5 text-blue-500/70" />
                                            <div>
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-blue-500/70">Observer</div>
                                                <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{o.observer?.name || "Unknown"}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Date */}
                                    <div className="col-span-1 sm:col-span-2 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                        <div>
                                            <div className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
                                                {new Date(o.sessionDate).toLocaleDateString()}
                                            </div>
                                            <div className="text-[10px] font-semibold text-slate-400 mt-0.5">
                                                {new Date(o.sessionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-1 sm:col-span-2">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusColors[o.status] || statusColors.PENDING}`}>
                                            {o.status}
                                        </span>
                                    </div>

                                    {/* Action */}
                                    <div className="col-span-1 sm:col-span-2 flex justify-end border-t sm:border-t-0 pt-3 sm:pt-0" style={{ borderColor: "var(--bg-border)" }}>
                                        <button 
                                            onClick={() => window.location.href = `/hod/observations/${o.id}`}
                                            className="group/btn flex items-center gap-1 text-[10px] font-black uppercase tracking-widest transition-colors hover:text-blue-500"
                                            style={{ color: "var(--text-muted)" }}
                                        >
                                            {o.status === "PENDING" ? "Conduct" : "View Details"}
                                            <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                                        </button>
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
