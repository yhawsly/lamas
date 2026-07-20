"use client";
import { Inbox, Folder } from "lucide-react";

import { useEffect, useState } from "react";
import Loader from "@/components/ui/Loader";
import Pagination from "@/components/ui/Pagination";
import Modal from "@/components/ui/Modal";

interface Submission {
    id: number;
    title: string;
    type: string;
    status: "PENDING" | "SUBMITTED" | "LATE" | "APPROVED" | "REJECTED" | "REVIEWED";
    submittedAt: string;
    content: any;
    feedback: string | null;
    lecturer: {
        name: string;
        email: string;
        department: { name: string } | null;
    };
}

const ReviewCenterSkeleton = () => (
    <div className="space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="space-y-2">
            <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-4 w-96 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
        
        {/* Tabs Skeleton */}
        <div className="h-12 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />

        {/* Table Skeleton */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800/60 overflow-hidden shadow-sm" style={{ backgroundColor: "var(--bg-surface)" }}>
            <div className="hidden sm:grid grid-cols-12 gap-4 p-4 border-b border-slate-200 dark:border-slate-800/60" style={{ backgroundColor: "var(--bg-hover)" }}>
                <div className="col-span-3"><div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" /></div>
                <div className="col-span-3"><div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded" /></div>
                <div className="col-span-2"><div className="h-3 w-10 bg-slate-200 dark:bg-slate-800 rounded" /></div>
                <div className="col-span-2"><div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" /></div>
                <div className="col-span-2 text-right flex justify-end"><div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" /></div>
            </div>
            
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 items-center">
                        <div className="col-span-3 space-y-2">
                            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                            <div className="h-3 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
                        </div>
                        <div className="col-span-3 space-y-2">
                            <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
                            <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                        </div>
                        <div className="col-span-2">
                            <div className="h-3.5 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                        </div>
                        <div className="col-span-2">
                            <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
                        </div>
                        <div className="col-span-2 flex flex-col items-end">
                            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default function ReviewCenterTab() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [tab, setTab] = useState<"pending" | "reviewed">("pending");
    
    const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
    const [reviewMode, setReviewMode] = useState<boolean>(false);
    const [feedback, setFeedback] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        fetchSubmissions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, tab]);

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const statusFilter = tab === "pending" ? "SUBMITTED,LATE" : "APPROVED,REJECTED,REVIEWED";
            const res = await fetch(`/api/submissions?page=${page}&limit=10&status=${statusFilter}`);
            const d = await res.json();
            setSubmissions(d.data || []);
            setTotalPages(d.meta?.totalPages || 1);
        } catch (err) {
            console.error("Failed to fetch submissions:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (status: "APPROVED" | "REJECTED") => {
        if (!selectedSub) return;
        setIsUpdating(true);
        try {
            const res = await fetch(`/api/submissions/${selectedSub.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, feedback }),
            });
            if (res.ok) {
                setReviewMode(false);
                setSelectedSub(null);
                setFeedback("");
                fetchSubmissions();
            }
        } catch (err) {
            console.error("Review failed:", err);
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading && submissions.length === 0) return <ReviewCenterSkeleton />;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>Review Center</h2>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Quality assurance and departmental oversight for academic planning.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex p-1.5 rounded-2xl border w-fit shadow-sm" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                {[
                    { id: "pending", label: "Inbox", icon: <Inbox className="w-4 h-4" /> },
                    { id: "reviewed", label: "Archive", icon: <Folder className="w-4 h-4" /> }
                ].map(t => (
                    <button key={t.id} onClick={() => { setTab(t.id as any); setPage(1); }}
                        className="px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2"
                        style={{
                            backgroundColor: tab === t.id ? "var(--primary)" : "transparent",
                            color: tab === t.id ? "white" : "var(--text-muted)",
                            boxShadow: tab === t.id ? "0 4px 12px -2px rgba(59, 130, 246, 0.25)" : "none"
                        }}>
                        <span>{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Submissions List - Professional UI */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800/60 overflow-hidden shadow-sm flex flex-col" style={{ backgroundColor: "var(--bg-surface)" }}>
                <div className="hidden sm:grid grid-cols-12 gap-4 p-4 border-b border-slate-200 dark:border-slate-800/60 text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: "var(--bg-hover)", color: "var(--text-muted)" }}>
                    <div className="col-span-3">Lecturer</div>
                    <div className="col-span-3">Submission Details</div>
                    <div className="col-span-2">Date</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2 text-right">Action</div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {submissions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-center p-8">
                            <Inbox className="w-10 h-10 text-slate-400 mb-4" />
                            <h3 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Your inbox is clear!</h3>
                            <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>No {tab} submissions found in your department at this time.</p>
                        </div>
                    ) : (
                        submissions.map((s) => (
                            <div key={s.id} className="group flex flex-col transition-colors hover:bg-[var(--bg-hover)]" style={{ backgroundColor: "var(--bg-base)" }}>
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 sm:p-5 items-center">
                                    {/* Lecturer */}
                                    <div className="col-span-1 sm:col-span-3">
                                        <div className="font-bold text-sm truncate" style={{ color: "var(--text-primary)" }}>{s.lecturer.name}</div>
                                        <div className="text-[11px] font-semibold mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{s.lecturer.email}</div>
                                    </div>

                                    {/* Submission Details */}
                                    <div className="col-span-1 sm:col-span-3">
                                        <div className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>{s.title}</div>
                                        <div className="inline-flex mt-1.5 px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[9px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                                            {s.type.replace(/_/g, ' ')}
                                        </div>
                                    </div>

                                    {/* Date */}
                                    <div className="col-span-1 sm:col-span-2">
                                        <div className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
                                            {new Date(s.submittedAt).toLocaleDateString()}
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-1 sm:col-span-2">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${
                                            s.status === 'APPROVED' || s.status === 'REVIEWED' || s.status === 'SUBMITTED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' :
                                            s.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20' :
                                            s.status === 'LATE' || s.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' :
                                            'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
                                        }`}>
                                            {s.status}
                                        </span>
                                    </div>

                                    {/* Action */}
                                    <div className="col-span-1 sm:col-span-2 text-right">
                                        <button onClick={() => { setSelectedSub(s); setReviewMode(false); }}
                                            className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors">
                                            Open Details →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
            )}

            {/* Submission Detail Modal */}
            <Modal isOpen={!!selectedSub} onClose={() => setSelectedSub(null)} title={selectedSub?.title || "Submission Details"} size="2xl">
                {selectedSub && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-start p-4 rounded-2xl" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)" }}>
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Lecturer</div>
                                <div className="font-bold text-sm">{selectedSub.lecturer.name}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Status</div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                    selectedSub.status === 'APPROVED' || selectedSub.status === 'REVIEWED' || selectedSub.status === 'SUBMITTED' ? 'text-emerald-500' : 
                                    selectedSub.status === 'REJECTED' ? 'text-rose-500' : 
                                    selectedSub.status === 'LATE' || selectedSub.status === 'PENDING' ? 'text-amber-500' : 
                                    'text-blue-500'
                                }`}>
                                    {selectedSub.status}
                                </span>
                            </div>
                        </div>

                        {/* Content Rendering */}
                        <div className="max-h-[500px] overflow-y-auto pr-2 space-y-4">
                            {selectedSub.type === "COURSE_TOPICS" && (
                                <div className="space-y-6">
                                    {selectedSub.content?.basicInfo ? (
                                        <div className="space-y-6">
                                            {/* Basic Info Overview */}
                                            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
                                                <div className="text-xs font-black uppercase tracking-wider text-slate-400">Basic Info</div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <span className="text-[10px] text-slate-400 uppercase font-bold">Course Code</span>
                                                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedSub.content.basicInfo.courseCode || "N/A"}</div>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] text-slate-400 uppercase font-bold">Credits</span>
                                                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedSub.content.basicInfo.credits || "N/A"}</div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-slate-400 uppercase font-bold">Course Title</span>
                                                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedSub.content.basicInfo.title || "N/A"}</div>
                                                </div>
                                                {selectedSub.content.basicInfo.description && (
                                                    <div>
                                                        <span className="text-[10px] text-slate-400 uppercase font-bold">Description</span>
                                                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{selectedSub.content.basicInfo.description}</div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Learning Outcomes list (CLOs) */}
                                            {selectedSub.content.outcomes && selectedSub.content.outcomes.length > 0 && (
                                                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
                                                    <div className="text-xs font-black uppercase tracking-wider text-slate-400">Course Learning Outcomes (CLOs)</div>
                                                    <div className="space-y-2">
                                                        {selectedSub.content.outcomes.map((o: any) => (
                                                            <div key={o.id} className="flex gap-3 text-xs">
                                                                <span className="font-bold text-blue-500 shrink-0 uppercase w-12">{o.id}</span>
                                                                <span className="text-slate-700 dark:text-slate-300">{o.text || "No description provided."}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Topics List with Outcome badges */}
                                            {selectedSub.content.topics && selectedSub.content.topics.length > 0 && (
                                                <div className="space-y-3">
                                                    <div className="text-xs font-black uppercase tracking-wider text-slate-400">Course Topics</div>
                                                    <div className="space-y-2">
                                                        {selectedSub.content.topics.map((t: any) => (
                                                            <div key={t.id} className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm space-y-2">
                                                                <div>
                                                                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{t.title}</div>
                                                                    {t.description && <div className="text-[11px] text-slate-500 mt-1">{t.description}</div>}
                                                                </div>
                                                                {t.outcomeIds && t.outcomeIds.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                                        {t.outcomeIds.map((id: string) => (
                                                                            <span key={id} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 text-[9px] font-bold rounded">
                                                                                {id}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Assessments Weights allocations */}
                                            {selectedSub.content.assessments && selectedSub.content.assessments.length > 0 && (
                                                <div className="space-y-3">
                                                    <div className="text-xs font-black uppercase tracking-wider text-slate-400">Assessments Registry</div>
                                                    <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
                                                        <table className="w-full text-left text-xs border-collapse">
                                                            <thead>
                                                                <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-400 font-bold">
                                                                    <th className="py-2">Assessment Name</th>
                                                                    <th className="py-2 text-right">Weight</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                                                {selectedSub.content.assessments.map((a: any) => (
                                                                    <tr key={a.id} className="text-slate-700 dark:text-slate-300">
                                                                        <td className="py-2">
                                                                            <div className="font-bold">{a.name}</div>
                                                                            {a.description && <div className="text-[10px] text-slate-400 mt-0.5">{a.description}</div>}
                                                                        </td>
                                                                        <td className="py-2 text-right font-black text-slate-900 dark:text-white">{a.weight}%</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Classes & Weekly Schedules */}
                                            {selectedSub.content.classes && selectedSub.content.classes.length > 0 && (
                                                <div className="space-y-4">
                                                    <div className="text-xs font-black uppercase tracking-wider text-slate-400">Weekly Classes & Modules</div>
                                                    <div className="space-y-4">
                                                        {selectedSub.content.classes.map((cls: any) => (
                                                            <div key={cls.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
                                                                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{cls.name}</span>
                                                                </div>
                                                                {cls.modules && cls.modules.length > 0 ? (
                                                                    <div className="space-y-2.5">
                                                                        {cls.modules.map((m: any) => (
                                                                            <div key={m.id} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 rounded font-bold uppercase">Week {m.week}</span>
                                                                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{m.title}</span>
                                                                                </div>
                                                                                {m.description && <p className="text-[11px] text-slate-500 dark:text-slate-400 ml-[52px]">{m.description}</p>}
                                                                                {m.lesson_plan && (
                                                                                    <div className="text-[10px] text-slate-400 italic ml-[52px]">Lesson Plan: {m.lesson_plan}</div>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-[11px] text-slate-400 italic text-center py-2">No weekly modules mapped for this class.</div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        selectedSub.content?.weeks && (
                                            <div className="space-y-3">
                                                <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>Course Roadmap</div>
                                                {selectedSub.content.weeks.map((w: any) => (
                                                    <div key={w.week} className="p-4 rounded-xl border border-dashed" style={{ borderColor: "var(--bg-border)" }}>
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <span className="w-6 h-6 rounded bg-blue-500/20 text-blue-500 flex items-center justify-center text-[10px] font-bold">Wk {w.week}</span>
                                                            <div className="font-bold text-xs">{w.sessions[0]?.topic || "No topic"}</div>
                                                        </div>
                                                        {w.sessions[0]?.description && <p className="text-[11px] opacity-60 ml-9">{w.sessions[0].description}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    )}
                                </div>
                            )}

                            {selectedSub.type === "SEMESTER_CALENDAR" && selectedSub.content && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {Object.entries(selectedSub.content).map(([key, val]) => (
                                        <div key={key} className="p-3 rounded-xl border border-dashed" style={{ borderColor: "var(--bg-border)" }}>
                                            <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">{key.replace(/([A-Z])/g, ' $1')}</div>
                                            <div className="text-xs font-medium">{String(val)}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!selectedSub.content && (
                                <div className="py-8 text-center text-xs italic opacity-40 border-2 border-dashed rounded-3xl" style={{ borderColor: "var(--bg-border)" }}>
                                    No detailed content found for this submission.
                                </div>
                            )}
                        </div>

                        {/* Review Section */}
                        {tab === "pending" && !reviewMode && (
                            <button onClick={() => setReviewMode(true)} className="w-full py-4 rounded-xl bg-amber-500 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-500/20 active:scale-95 transition-all">
                                Begin Quality Audit
                            </button>
                        )}

                        {reviewMode && (
                            <div className="space-y-4 animate-in slide-in-from-bottom-4">
                                <div className="text-[10px] font-black uppercase tracking-widest opacity-40">Reviewer Feedback</div>
                                <textarea 
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Provide constructive feedback for the lecturer..."
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition shadow-sm border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900"
                                    style={{ color: "var(--text-primary)" }}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => handleReview("REJECTED")}
                                        disabled={isUpdating}
                                        className="py-3 rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all disabled:opacity-50">
                                        Flag Issues
                                    </button>
                                    <button 
                                        onClick={() => handleReview("APPROVED")}
                                        disabled={isUpdating}
                                        className="py-3 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all disabled:opacity-50">
                                        Approve Plan
                                    </button>
                                </div>
                            </div>
                        )}

                        {selectedSub.feedback && !reviewMode && (
                            <div className="p-4 rounded-2xl border border-dashed border-blue-500/30" style={{ backgroundColor: "var(--bg-hover)" }}>
                                <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Past Feedback</div>
                                <p className="text-xs italic">{selectedSub.feedback}</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
