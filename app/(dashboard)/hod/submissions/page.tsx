"use client";

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

export default function HODSubmissionReview() {
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

    if (loading && submissions.length === 0) return <Loader message="Accessing departmental inbox..." />;

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400">
                    Submission Review Center
                </h1>
                <p className="mt-2 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                    Quality assurance and departmental oversight for academic planning.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex p-1.5 rounded-2xl border w-fit backdrop-blur-md" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                {[
                    { id: "pending", label: "Inbox", icon: "📥" },
                    { id: "reviewed", label: "Archive", icon: "📁" }
                ].map(t => (
                    <button key={t.id} onClick={() => { setTab(t.id as any); setPage(1); }}
                        className="px-8 py-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2"
                        style={{
                            backgroundColor: tab === t.id ? "var(--primary)" : "transparent",
                            color: tab === t.id ? "white" : "var(--text-muted)",
                            boxShadow: tab === t.id ? "0 8px 16px -4px rgba(59, 130, 246, 0.3)" : "none"
                        }}>
                        <span>{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Submissions List */}
            <div className="rounded-3xl overflow-hidden border shadow-2xl" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr style={{ backgroundColor: "var(--bg-hover)" }}>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Lecturer</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Submission Title</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Type</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-center" style={{ color: "var(--text-muted)" }}>Status</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-right" style={{ color: "var(--text-muted)" }}>Date</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-right" style={{ color: "var(--text-muted)" }}>Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: "var(--bg-border)" }}>
                        {submissions.map((s) => (
                            <tr key={s.id} className="group hover:bg-white/5 transition-all">
                                <td className="px-6 py-5">
                                    <div className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{s.lecturer.name}</div>
                                    <div className="text-[10px] font-medium opacity-40">{s.lecturer.email}</div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="text-sm font-semibold truncate max-w-[240px]" style={{ color: "var(--text-primary)" }}>{s.title}</div>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter" style={{ backgroundColor: "var(--bg-hover)", color: "var(--text-muted)", border: "1px solid var(--bg-border)" }}>
                                        {s.type.replace(/_/g, ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-center">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-tighter uppercase ${
                                        s.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                                        s.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400' :
                                        s.status === 'LATE' ? 'bg-amber-500/10 text-amber-400' :
                                        'bg-blue-500/10 text-blue-400'
                                    }`}>
                                        {s.status}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-right text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
                                    {new Date(s.submittedAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <button onClick={() => { setSelectedSub(s); setReviewMode(false); }}
                                        className="px-4 py-2 rounded-xl text-[10px] font-black bg-blue-500 text-white hover:bg-blue-400 transition-all active:scale-95 shadow-lg shadow-blue-500/20 uppercase tracking-widest">
                                        Open Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {submissions.length === 0 && !loading && (
                    <div className="p-20 text-center space-y-4">
                        <div className="text-5xl">📫</div>
                        <h3 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>Your inbox is clear!</h3>
                        <p className="text-sm opacity-50 max-w-xs mx-auto">No {tab} submissions found in your department at this time.</p>
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center">
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
            )}

            {/* Submission Detail Modal */}
            <Modal isOpen={!!selectedSub} onClose={() => setSelectedSub(null)} title={selectedSub?.title || "Submission Details"}>
                {selectedSub && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-start p-4 rounded-2xl" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)" }}>
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Lecturer</div>
                                <div className="font-bold text-sm">{selectedSub.lecturer.name}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Status</div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${selectedSub.status === 'APPROVED' ? 'text-emerald-400' : selectedSub.status === 'REJECTED' ? 'text-rose-400' : 'text-blue-400'}`}>
                                    {selectedSub.status}
                                </span>
                            </div>
                        </div>

                        {/* Content Rendering */}
                        <div className="max-h-[400px] overflow-y-auto pr-2 space-y-4">
                            {selectedSub.type === "COURSE_TOPICS" && selectedSub.content?.weeks && (
                                <div className="space-y-3">
                                    <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>Course Roadmap</div>
                                    {selectedSub.content.weeks.map((w: any) => (
                                        <div key={w.week} className="p-4 rounded-xl border border-dashed" style={{ borderColor: "var(--bg-border)" }}>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-[10px] font-bold">Wk {w.week}</span>
                                                <div className="font-bold text-xs">{w.sessions[0]?.topic || "No topic"}</div>
                                            </div>
                                            {w.sessions[0]?.description && <p className="text-[11px] opacity-60 ml-9">{w.sessions[0].description}</p>}
                                        </div>
                                    ))}
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
                            <button onClick={() => setReviewMode(true)} className="w-full py-4 rounded-2xl bg-amber-500 text-black font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-amber-500/20 active:scale-95 transition-all">
                                BEGIN QUALITY AUDIT
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
                                    className="w-full px-4 py-3 rounded-2xl text-xs focus:outline-none focus:ring-2"
                                    style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => handleReview("REJECTED")}
                                        disabled={isUpdating}
                                        className="py-3 rounded-xl border border-rose-500/50 text-rose-400 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/10 transition-all disabled:opacity-50">
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
                            <div className="p-4 rounded-2xl border border-dashed border-primary/30" style={{ backgroundColor: "var(--bg-hover)" }}>
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
