"use client";
import { Inbox, Folder } from "lucide-react";
import { useEffect, useState } from "react";
import Pagination from "@/components/ui/Pagination";
import RefreshButton from "@/components/ui/RefreshButton";
import { useTerm } from "@/context/TermContext";
import { useModal } from "@/context/ModalContext";
import SubmissionAuditWorkspace, { SubmissionAuditData } from "./SubmissionAuditWorkspace";

const ReviewCenterSkeleton = () => (
    <div className="space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="space-y-2">
            <div className="h-7 w-48 bg-slate-200 dark:bg-slate-700/80 rounded-lg" />
            <div className="h-4 w-96 bg-slate-200 dark:bg-slate-700/80 rounded-lg" />
        </div>
        
        {/* Tabs Skeleton */}
        <div className="h-12 w-64 bg-slate-200 dark:bg-slate-700/80 rounded-xl" />

        {/* Table Skeleton */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800/60 overflow-hidden shadow-sm" style={{ backgroundColor: "var(--bg-surface)" }}>
            <div className="hidden sm:grid grid-cols-12 gap-4 p-4 border-b border-slate-200 dark:border-slate-800/60" style={{ backgroundColor: "var(--bg-hover)" }}>
                <div className="col-span-2"><div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded" /></div>
                <div className="col-span-5"><div className="h-3 w-40 bg-slate-200 dark:bg-slate-700 rounded" /></div>
                <div className="col-span-2"><div className="h-3 w-10 bg-slate-200 dark:bg-slate-700 rounded" /></div>
                <div className="col-span-1"><div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded" /></div>
                <div className="col-span-2 text-right flex justify-end"><div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" /></div>
            </div>
            
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 items-center">
                        <div className="col-span-2 space-y-2">
                            <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
                            <div className="h-3 w-36 bg-slate-200 dark:bg-slate-700 rounded" />
                        </div>
                        <div className="col-span-5 space-y-2">
                            <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded" />
                            <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                        </div>
                        <div className="col-span-2">
                            <div className="h-3.5 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                        </div>
                        <div className="col-span-1">
                            <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
                        </div>
                        <div className="col-span-2 flex flex-col items-end">
                            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default function ReviewCenterTab() {
    const { selectedTermId, isArchiveMode } = useTerm();
    const { showWarning, showError } = useModal();
    const [submissions, setSubmissions] = useState<SubmissionAuditData[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [tab, setTab] = useState<"pending" | "reviewed">("pending");
    
    const [selectedSub, setSelectedSub] = useState<SubmissionAuditData | null>(null);

    useEffect(() => {
        fetchSubmissions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, tab, selectedTermId]);

    const statusFilter = tab === "pending" ? "PENDING,LATE,SUBMITTED" : "APPROVED,REJECTED";

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            let url = `/api/submissions?page=${page}&limit=10&status=${statusFilter}`;
            if (selectedTermId) url += `&termId=${selectedTermId}`;
            const res = await fetch(url);
            const d = await res.json();
            setSubmissions(d.data || []);
            setTotalPages(d.meta?.totalPages || 1);
        } catch (err) {
            console.error("Failed to fetch submissions:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (submissionId: number, status: string, auditFeedback: string) => {
        if (isArchiveMode) {
            showWarning("Action Disabled", "You are viewing a read-only historical archive.");
            return;
        }
        try {
            const res = await fetch(`/api/submissions/${submissionId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, feedback: auditFeedback }),
            });
            if (res.ok) {
                setSelectedSub(null);
                fetchSubmissions();
            } else {
                const data = await res.json().catch(() => ({}));
                showError("Update Failed", data.error || "Failed to update submission audit verdict");
            }
        } catch (err) {
            console.error("Review update failed:", err);
            showError("Network Error", "An unexpected error occurred while updating the submission audit.");
        }
    };

    // If a submission is selected for review, render the full-featured structured workspace!
    if (selectedSub) {
        return (
            <SubmissionAuditWorkspace
                submission={selectedSub}
                onBack={() => setSelectedSub(null)}
                onStatusUpdate={handleStatusUpdate}
            />
        );
    }

    if (loading && submissions.length === 0) return <ReviewCenterSkeleton />;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>Review Center</h2>
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                        Quality assurance and departmental oversight for academic planning.
                    </p>
                </div>
                <RefreshButton
                    onClick={fetchSubmissions}
                    isRefreshing={loading}
                    label="Refresh"
                    size="sm"
                    variant="outline"
                    title="Reload submissions"
                />
            </div>

            {/* Tabs */}
            <div className="flex p-1.5 rounded-2xl border w-fit shadow-sm" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                {[
                    { id: "pending", label: "Inbox", icon: <Inbox className="w-4 h-4" /> },
                    { id: "reviewed", label: "Archive", icon: <Folder className="w-4 h-4" /> }
                ].map(t => (
                    <button key={t.id} onClick={() => { setTab(t.id as any); setPage(1); setSubmissions([]); }}
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

            {/* Main Table */}
            <div className="rounded-2xl border overflow-hidden shadow-sm" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                <div className="hidden sm:grid grid-cols-12 gap-4 p-4 border-b text-[10px] font-black uppercase tracking-widest" style={{ borderColor: "var(--bg-border)", backgroundColor: "var(--bg-hover)", color: "var(--text-muted)" }}>
                    <div className="col-span-3">Lecturer</div>
                    <div className="col-span-4">Submission Details</div>
                    <div className="col-span-2">Date</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-2 text-right">Action</div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {submissions.length === 0 ? (
                        <div className="p-12 text-center text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                            No submissions in this queue.
                        </div>
                    ) : (
                        submissions.map((s) => (
                            <div key={s.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                                    {/* Lecturer */}
                                    <div className="col-span-1 sm:col-span-3">
                                        <div className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{s.lecturer.name}</div>
                                        <div className="text-xs" style={{ color: "var(--text-muted)" }}>{s.lecturer.email}</div>
                                    </div>

                                    {/* Submission Details */}
                                    <div className="col-span-1 sm:col-span-4 space-y-1">
                                        <div className="font-bold text-sm leading-snug" style={{ color: "var(--text-primary)" }}>{s.title}</div>
                                        <span className="inline-block px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                            {s.type.replace(/_/g, ' ')}
                                        </span>
                                    </div>

                                    {/* Date */}
                                    <div className="col-span-1 sm:col-span-2">
                                        <div className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
                                            {new Date(s.submittedAt).toLocaleDateString()}
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-1 sm:col-span-1">
                                        <span className={`inline-flex px-3 py-1 rounded-xl text-[10px] font-black tracking-widest uppercase border-2 ${
                                            s.status === 'APPROVED' || s.status === 'REVIEWED' || s.status === 'SUBMITTED' ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700' :
                                            s.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700' :
                                            s.status === 'LATE' ? 'bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-700' :
                                            s.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700' :
                                            'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700'
                                        }`}>
                                            {s.status}
                                        </span>
                                    </div>

                                    {/* Action */}
                                    <div className="col-span-1 sm:col-span-2 text-right">
                                        <button onClick={() => setSelectedSub(s)}
                                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm shadow-blue-600/20 inline-flex items-center gap-1.5 active:scale-95 cursor-pointer">
                                            <span>Open Audit Workspace</span>
                                            <span>→</span>
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
        </div>
    );
}
