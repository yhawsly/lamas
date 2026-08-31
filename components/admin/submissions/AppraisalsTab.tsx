"use client";
import { useEffect, useState } from "react";
import SearchableSelect from "@/components/ui/SearchableSelect";
import KPICard from "@/components/ui/KPICard";
import RefreshButton from "@/components/ui/RefreshButton";
import { CheckCircle, Clock, AlertCircle, FileText, Search } from "lucide-react";
import { useTerm } from "@/context/TermContext";
import { useModal } from "@/context/ModalContext";
import SubmissionAuditWorkspace, { SubmissionAuditData } from "@/components/hod/reviews/SubmissionAuditWorkspace";

const AppraisalsSkeleton = () => (
    <div className="divide-y divide-slate-100 dark:divide-slate-800/60 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 sm:p-5">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                    {/* Lecturer avatar + info skeleton */}
                    <div className="col-span-1 sm:col-span-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700/80 shrink-0" />
                        <div className="space-y-2 flex-1">
                            <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700/80 rounded" />
                            <div className="h-3 w-36 bg-slate-200 dark:bg-slate-700/80 rounded" />
                        </div>
                    </div>
                    {/* Department skeleton */}
                    <div className="col-span-1 sm:col-span-3 space-y-2">
                        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700/80 rounded" />
                        <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700/80 rounded" />
                    </div>
                    {/* Submission Type skeleton */}
                    <div className="col-span-1 sm:col-span-2">
                        <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700/80 rounded-lg" />
                    </div>
                    {/* Date skeleton */}
                    <div className="col-span-1 sm:col-span-2">
                        <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700/80 rounded" />
                    </div>
                    {/* Status skeleton */}
                    <div className="col-span-1 sm:col-span-2 flex justify-end">
                        <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700/80 rounded-full" />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

export default function AppraisalsTab() {
    const { selectedTermId, isArchiveMode } = useTerm();
    const { showWarning, showError } = useModal();
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ status: "", type: "" });
    const [search, setSearch] = useState("");
    const [selectedSub, setSelectedSub] = useState<SubmissionAuditData | null>(null);

    const fetchSubmissions = () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (filter.status) params.set("status", filter.status);
        if (filter.type) params.set("type", filter.type);
        if (selectedTermId) params.set("termId", String(selectedTermId));
        fetch(`/api/submissions?${params}`)
            .then(r => r.json())
            .then(d => {
                setSubmissions(Array.isArray(d) ? d : (d && Array.isArray(d.data) ? d.data : []));
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchSubmissions();
    }, [filter, selectedTermId]);

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

    if (selectedSub) {
        return (
            <SubmissionAuditWorkspace
                submission={selectedSub}
                onBack={() => setSelectedSub(null)}
                onStatusUpdate={handleStatusUpdate}
            />
        );
    }

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
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Top KPI Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    label="Total Appraisals"
                    value={totalSubmissions}
                    icon={<FileText className="w-5 h-5" />}
                    color="blue"
                />
                <KPICard
                    label="Submitted Dossiers"
                    value={submittedCount}
                    icon={<CheckCircle className="w-5 h-5" />}
                    color="emerald"
                />
                <KPICard
                    label="Late Submissions"
                    value={lateCount}
                    icon={<AlertCircle className="w-5 h-5" />}
                    color="rose"
                />
                <KPICard
                    label="Pending Dossiers"
                    value={pendingCount}
                    icon={<Clock className="w-5 h-5" />}
                    color="amber"
                />
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800/60 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center" style={{ backgroundColor: "var(--bg-surface)" }}>
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by lecturer name, email, or course..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50 dark:bg-slate-900/50"
                        style={{ color: "var(--text-primary)" }}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="w-40">
                        <SearchableSelect
                            value={filter.status}
                            onChange={(val) => setFilter(prev => ({ ...prev, status: String(val) }))}
                            options={[
                                { label: "All Statuses", value: "" },
                                { label: "Submitted", value: "SUBMITTED" },
                                { label: "Approved", value: "APPROVED" },
                                { label: "Rejected", value: "REJECTED" },
                                { label: "Late", value: "LATE" },
                                { label: "Pending", value: "PENDING" },
                            ]}
                        />
                    </div>

                    <div className="w-48">
                        <SearchableSelect
                            value={filter.type}
                            onChange={(val) => setFilter(prev => ({ ...prev, type: String(val) }))}
                            options={[
                                { label: "All Types", value: "" },
                                { label: "Semester Calendar", value: "SEMESTER_CALENDAR" },
                                { label: "Course Topics", value: "COURSE_TOPICS" },
                                { label: "Observation Report", value: "OBSERVATION_REPORT" },
                            ]}
                        />
                    </div>

                    <RefreshButton
                        onClick={fetchSubmissions}
                        isRefreshing={loading}
                        label="Refresh"
                        size="sm"
                        variant="outline"
                        title="Reload appraisals list"
                    />
                </div>
            </div>

            {/* Professional List UI */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800/60 overflow-hidden shadow-sm flex flex-col" style={{ backgroundColor: "var(--bg-surface)" }}>
                <div className="hidden sm:grid grid-cols-12 gap-4 p-4 border-b border-slate-200 dark:border-slate-800/60 text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: "var(--bg-hover)", color: "var(--text-muted)" }}>
                    <div className="col-span-3">Lecturer</div>
                    <div className="col-span-3">Department & Title</div>
                    <div className="col-span-2">Submission Type</div>
                    <div className="col-span-2">Date</div>
                    <div className="col-span-2 text-right">Status / Action</div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 flex-1">
                    {loading ? (
                        <AppraisalsSkeleton />
                    ) : filteredSubmissions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-center p-8">
                            <FileText className="w-10 h-10 text-slate-400 mb-4" />
                            <h3 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>No Submissions Found</h3>
                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>There are no submissions matching your filters.</p>
                        </div>
                    ) : (
                        filteredSubmissions.map(s => (
                            <div
                                key={s.id}
                                onClick={() => setSelectedSub(s)}
                                className="group flex flex-col transition-colors hover:bg-[var(--bg-hover)] cursor-pointer"
                                style={{ backgroundColor: "var(--bg-base)" }}
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 sm:p-5 items-center">
                                    {/* Lecturer */}
                                    <div className="col-span-1 sm:col-span-3 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs border shrink-0 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700" style={{ color: "var(--text-primary)" }}>
                                            {(s.lecturer?.name || "?").substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" style={{ color: "var(--text-primary)" }}>{s.lecturer?.name || "Unknown User"}</div>
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
                                    <div className="col-span-1 sm:col-span-2 flex justify-end items-center gap-2">
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
                                                <FileText className="w-3 h-3" /> {s.status}
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
