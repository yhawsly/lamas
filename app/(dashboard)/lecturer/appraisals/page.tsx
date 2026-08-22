"use client";
import { ClipboardList, BookOpen, Video, ShieldCheck, Inbox } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTerm } from "@/context/TermContext";

export default function AppraisalsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const { selectedTermId } = useTerm();
    const userId = parseInt(session?.user?.id || "0");
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"ALL" | "A" | "B" | "C">("ALL");
    const [activeRoleTab, setActiveRoleTab] = useState<"ALL" | "EVALUATE" | "TARGET">("ALL");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const termQuery = selectedTermId ? `?termId=${selectedTermId}` : "";
            const obsQuery = selectedTermId ? `?termId=${selectedTermId}&limit=100` : "?limit=100";

            const [obsRes, teachRes, modRes] = await Promise.all([
                fetch(`/api/observations${obsQuery}`).then(r => r.json()),
                fetch(`/api/teaching-observations${termQuery}`).then(r => r.json()),
                fetch(`/api/moderations${termQuery}`).then(r => r.json())
            ]);
            
            const obs = (obsRes.data || (Array.isArray(obsRes) ? obsRes : [])).map((o: any) => ({...o, formType: "A", typeName: "Peer Observation"}));
            const teach = (Array.isArray(teachRes) ? teachRes : []).map((o: any) => ({...o, formType: "B", typeName: "Teaching Observation", observerId: o.observerId, lecturerId: o.lecturerId}));
            const mod = (Array.isArray(modRes) ? modRes : []).map((o: any) => ({...o, formType: "C", typeName: "Exam Moderation", observerId: o.moderatorId, lecturerId: o.lecturerId}));
            
            setAssignments([...obs, ...teach, ...mod].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } finally {
            setLoading(false);
        }
    }, [selectedTermId]);

    useEffect(() => {
        load();
    }, [load]);

    const statusColors: Record<string, string> = {
        PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300",
        COMPLETED: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300",
        REVIEWED: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
    };

    const getRoute = (formType: string, id: number) => {
        if (formType === "A") return `/lecturer/observations/${id}`;
        if (formType === "B") return `/lecturer/teaching-observations/${id}`;
        if (formType === "C") return `/lecturer/moderations/${id}`;
        return "#";
    };

    return (
        <div className="w-full space-y-6 sm:space-y-8 animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Appraisals & Reviews</h1>
                <p className="mt-1" style={{ color: "var(--text-secondary)" }}>Track all your peer observations, teaching observations, and exam moderations.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 sm:p-5 rounded-2xl flex flex-col justify-center">
                    <div className="text-emerald-500 text-[10px] sm:text-xs font-bold mb-1 tracking-wider uppercase truncate">Assigned to Observe</div>
                    <div className="text-2xl sm:text-3xl font-black" style={{ color: "var(--text-primary)" }}>{assignments.filter(o => o.observerId === userId).length}</div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 p-3.5 sm:p-5 rounded-2xl flex flex-col justify-center">
                    <div className="text-blue-500 text-[10px] sm:text-xs font-bold mb-1 tracking-wider uppercase truncate">Being Evaluated</div>
                    <div className="text-2xl sm:text-3xl font-black" style={{ color: "var(--text-primary)" }}>{assignments.filter(o => o.lecturerId === userId).length}</div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 sm:p-5 rounded-2xl flex flex-col justify-center col-span-2 sm:col-span-1">
                    <div className="text-amber-500 text-[10px] sm:text-xs font-bold mb-1 tracking-wider uppercase truncate">Pending Action</div>
                    <div className="text-2xl sm:text-3xl font-black" style={{ color: "var(--text-primary)" }}>{assignments.filter(o => o.status === "PENDING" && o.observerId === userId).length}</div>
                </div>
            </div>

            <div className="border rounded-2xl p-6 shadow-xl relative overflow-hidden" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                <div className="flex flex-col gap-4 mb-6 pb-4 border-b relative z-10" style={{ borderColor: "var(--bg-border)" }}>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <h3 className="font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                            <ClipboardList className="w-5 h-5 text-blue-500" /> Appraisals Registry
                        </h3>
                        
                        {/* Role Filter (Observer vs Target) */}
                        <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 w-fit shrink-0">
                            {[
                                { id: "ALL", label: "All Roles", count: assignments.length },
                                { id: "EVALUATE", label: "Assigned to Observe", count: assignments.filter(o => o.observerId === userId).length },
                                { id: "TARGET", label: "Being Evaluated", count: assignments.filter(o => o.lecturerId === userId).length },
                            ].map((r) => {
                                const isActive = activeRoleTab === r.id;
                                return (
                                    <button
                                        key={r.id}
                                        type="button"
                                        onClick={() => {
                                            setActiveRoleTab(r.id as any);
                                            setActiveTab("ALL"); // Reset form type tab on role change to avoid empty states
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                                            isActive
                                                ? "bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400 font-extrabold"
                                                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                                        }`}
                                    >
                                        <span>{r.label}</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                                            isActive 
                                                ? "bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400" 
                                                : "bg-slate-200/80 dark:bg-slate-800 text-slate-500"
                                        }`}>{r.count}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    
                    {/* Form Type Filter - Dynamic based on selected role */}
                    <div className="flex flex-wrap gap-1 p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 w-fit">
                        {[
                            { id: "ALL", label: "All", icon: null, bgActive: "bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white", count: assignments.filter(o => activeRoleTab === "ALL" || (activeRoleTab === "EVALUATE" ? o.observerId === userId : o.lecturerId === userId)).length },
                            { id: "A", label: "Peer Observation", icon: BookOpen, bgActive: "bg-white dark:bg-slate-800 shadow-sm text-amber-600 dark:text-amber-400", count: assignments.filter(o => o.formType === "A" && (activeRoleTab === "ALL" || (activeRoleTab === "EVALUATE" ? o.observerId === userId : o.lecturerId === userId))).length },
                            { id: "B", label: "Teaching Observation", icon: Video, bgActive: "bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400", count: assignments.filter(o => o.formType === "B" && (activeRoleTab === "ALL" || (activeRoleTab === "EVALUATE" ? o.observerId === userId : o.lecturerId === userId))).length },
                            { id: "C", label: "Exam Moderation", icon: ShieldCheck, bgActive: "bg-white dark:bg-slate-800 shadow-sm text-purple-600 dark:text-purple-400", count: assignments.filter(o => o.formType === "C" && (activeRoleTab === "ALL" || (activeRoleTab === "EVALUATE" ? o.observerId === userId : o.lecturerId === userId))).length },
                        ].map((t) => {
                            const Icon = t.icon;
                            const isActive = activeTab === t.id;
                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setActiveTab(t.id as any)}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                                        isActive
                                            ? t.bgActive
                                            : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                                    }`}
                                >
                                    {Icon && <Icon className="w-3.5 h-3.5" />}
                                    <span>{t.label}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                                        isActive 
                                            ? "bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300" 
                                            : "bg-slate-200/80 dark:bg-slate-800 text-slate-500"
                                    }`}>{t.count}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-4 mt-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-4 w-full p-4 border rounded-xl border-slate-100 dark:border-slate-800/50">
                                <div className="w-16 h-10 rounded-md bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
                                <div className="flex-1 space-y-2">
                                    <div className="w-1/3 h-4 rounded bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
                                    <div className="w-1/4 h-3 rounded bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
                                </div>
                                <div className="w-24 h-8 rounded-full bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
                            </div>
                        ))}
                    </div>
                ) : assignments.length === 0 ? (
                    <div className="text-center py-20" style={{ color: "var(--text-muted)" }}>
                        <div className="flex justify-center mb-4"><Inbox className="w-10 h-10 text-gray-400" /></div>
                        <p>No assignments found.</p>
                    </div>
                ) : assignments.filter(o => (activeRoleTab === "ALL" || (activeRoleTab === "EVALUATE" ? o.observerId === userId : o.lecturerId === userId)) && (activeTab === "ALL" || o.formType === activeTab)).length === 0 ? (
                    <div className="text-center py-20" style={{ color: "var(--text-muted)" }}>
                        <div className="flex justify-center mb-4"><Inbox className="w-10 h-10 text-gray-400" /></div>
                        <p>
                            No {activeTab === "ALL" ? "appraisals" : activeTab === "A" ? "Peer Observation" : activeTab === "B" ? "Teaching Observation" : "Exam Moderation"}{" "}
                            {activeRoleTab === "ALL" ? "" : activeRoleTab === "EVALUATE" ? "where you are observing" : "where you are being observed"}{" "}
                            found.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4 relative z-10">
                        {assignments
                            .filter(o => (activeRoleTab === "ALL" || (activeRoleTab === "EVALUATE" ? o.observerId === userId : o.lecturerId === userId)) && (activeTab === "ALL" || o.formType === activeTab))
                            .map(o => {
                                const isObserver = o.observerId === userId;
                                return (
                                    <div 
                                        key={`${o.formType}-${o.id}`} 
                                        className="flex flex-col md:flex-row md:items-center justify-between p-5 border rounded-2xl transition-all duration-300 hover:shadow-md hover:scale-[1.002] border-l-4" 
                                        style={{ 
                                            backgroundColor: "var(--bg-base)", 
                                            borderColor: "var(--bg-border)",
                                            borderLeftColor: isObserver ? "rgb(168, 85, 247)" : "rgb(59, 130, 246)" // purple-500 vs blue-500
                                        }}
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Colored Icon box based on Form Type */}
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                                                o.formType === "A" ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400" :
                                                o.formType === "B" ? "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400" :
                                                "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400"
                                            }`}>
                                                {o.formType === "A" && <BookOpen className="w-5 h-5" />}
                                                {o.formType === "B" && <Video className="w-5 h-5" />}
                                                {o.formType === "C" && <ShieldCheck className="w-5 h-5" />}
                                            </div>

                                            <div>
                                                {/* Form Name & Type - Important First */}
                                                <div className="flex items-center flex-wrap gap-2">
                                                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                                                        {o.typeName}
                                                    </span>
                                                    <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                                                        o.formType === "A" ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400" :
                                                        o.formType === "B" ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400" :
                                                        "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400"
                                                    }`}>
                                                        Form {o.formType}
                                                    </span>
                                                </div>

                                                {/* Course, Status, & Role - Secondary Important */}
                                                <div className="font-bold text-base mt-1.5 flex items-center flex-wrap gap-2.5" style={{ color: "var(--text-primary)" }}>
                                                    <span>{o.courseCode}</span>
                                                    <span className={`text-[9px] px-2 py-0.5 rounded-md font-black tracking-widest uppercase ${isObserver ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300'}`}>
                                                        {isObserver ? (o.formType === "C" ? 'MODERATOR' : 'OBSERVER') : 'LECTURER'}
                                                    </span>
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${statusColors[o.status]}`}>
                                                        {o.status}
                                                    </span>
                                                </div>

                                                {/* Partner details */}
                                                <div className="text-xs font-semibold mt-2" style={{ color: "var(--text-muted)" }}>
                                                    Partner: <span className="font-bold text-slate-700 dark:text-slate-300">{isObserver ? (o.lecturer?.name || "Peer") : (o.formType === "C" ? o.moderator?.name : o.observer?.name) || "Peer"}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Details */}
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-4 md:mt-0">
                                            {/* Schedule Info */}
                                            <div className="text-left md:text-right min-w-[120px]">
                                                {o.formType === "C" ? (
                                                    <span className="text-xs italic" style={{ color: "var(--text-muted)" }}>Moderation Review</span>
                                                ) : (
                                                    o.sessionDate ? (
                                                        <div>
                                                            <div className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{new Date(o.sessionDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}</div>
                                                            <div className="text-[10px] font-semibold mt-0.5" style={{ color: "var(--text-muted)" }}>{o.venue || "VENUE TBA"}</div>
                                                        </div>
                                                    ) : (
                                                        <span className="inline-block text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-md">Unscheduled</span>
                                                    )
                                                )}
                                            </div>

                                            {/* Action Button */}
                                            <div className="shrink-0">
                                                <button
                                                    onClick={() => router.push(getRoute(o.formType, o.id))}
                                                    className={`w-full md:w-auto px-5 py-2 rounded-xl text-xs font-bold transition shadow-lg ${
                                                        isObserver && o.status === "PENDING"
                                                            ? "bg-primary text-white hover:opacity-90 shadow-primary/20"
                                                            : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 shadow-none"
                                                    }`}
                                                >
                                                    {isObserver && o.status === "PENDING" ? "Conduct →" : "View Artifact →"}
                                                </button>
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
