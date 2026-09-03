"use client";

import { useState, useEffect, useCallback } from "react";
import { 
    FileText, 
    BarChart2, 
    Code, 
    Video, 
    Link as LinkIcon, 
    Paperclip, 
    Download, 
    Eye,
    Check,
    RotateCcw,
    FileSpreadsheet,
    Search,
    Image as ImageIcon,
    CheckCircle2,
    AlertCircle,
    Library,
    ShieldCheck,
    Clock,
} from "lucide-react";
import RefreshButton from "@/components/ui/RefreshButton";
import { TableSkeleton } from "@/components/ui/Skeleton";
import Modal from "@/components/ui/Modal";
import SearchableSelect from "@/components/ui/SearchableSelect";
import KPICard from "@/components/ui/KPICard";
import Pagination from "@/components/ui/Pagination";
import { useTerm } from "@/context/TermContext";
import { isBrowserViewable, openInBrowserViewer } from "@/lib/file-preview";

interface Resource {
    id: number;
    title: string;
    description?: string;
    type: string;
    url: string;
    status: string;
    createdAt: string;
    lecturer: { id: number; name: string; email?: string; role?: string; department?: { name: string; code: string } };
}

const typeConfig: Record<string, { icon: React.ReactNode, bgClass: string, borderClass: string, textClass: string }> = {
    PDF: { icon: <FileText className="w-5 h-5" />, bgClass: "bg-rose-50 dark:bg-rose-500/10", borderClass: "border-rose-100 dark:border-rose-500/20", textClass: "text-rose-500" },
    SLIDES: { icon: <BarChart2 className="w-5 h-5" />, bgClass: "bg-amber-50 dark:bg-amber-500/10", borderClass: "border-amber-100 dark:border-amber-500/20", textClass: "text-amber-500" },
    CODE: { icon: <Code className="w-5 h-5" />, bgClass: "bg-indigo-50 dark:bg-indigo-500/10", borderClass: "border-indigo-100 dark:border-indigo-500/20", textClass: "text-indigo-500" },
    VIDEO: { icon: <Video className="w-5 h-5" />, bgClass: "bg-purple-50 dark:bg-purple-500/10", borderClass: "border-purple-100 dark:border-purple-500/20", textClass: "text-purple-500" },
    LINK: { icon: <LinkIcon className="w-5 h-5" />, bgClass: "bg-sky-50 dark:bg-sky-500/10", borderClass: "border-sky-100 dark:border-sky-500/20", textClass: "text-sky-500" },
    SPREADSHEET: { icon: <FileSpreadsheet className="w-5 h-5" />, bgClass: "bg-emerald-50 dark:bg-emerald-500/10", borderClass: "border-emerald-100 dark:border-emerald-500/20", textClass: "text-emerald-500" },
    DOCUMENT: { icon: <FileText className="w-5 h-5" />, bgClass: "bg-blue-50 dark:bg-blue-500/10", borderClass: "border-blue-100 dark:border-blue-500/20", textClass: "text-blue-500" },
    IMAGE: { icon: <ImageIcon className="w-5 h-5" />, bgClass: "bg-violet-50 dark:bg-violet-500/10", borderClass: "border-violet-100 dark:border-violet-500/20", textClass: "text-violet-500" },
    OTHER: { icon: <Paperclip className="w-5 h-5" />, bgClass: "bg-slate-50 dark:bg-slate-500/10", borderClass: "border-slate-100 dark:border-slate-500/20", textClass: "text-slate-500" },
};

const statusColors: Record<string, { badge: string; label: string }> = {
    PENDING: { badge: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20", label: "Pending DEO Review" },
    APPROVED: { badge: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20", label: "Approved by DEO" },
    REJECTED: { badge: "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20", label: "Revision Requested" },
};

export default function DEOResourcesPage() {
    const { isArchiveMode, selectedTermId } = useTerm();
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [msg, setMsg] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [typeFilter, setTypeFilter] = useState<string>("ALL");
    const [lecturerFilter, setLecturerFilter] = useState<string>("ALL");
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        setPage(1);
    }, [searchQuery, statusFilter, typeFilter, lecturerFilter, selectedTermId]);

    // Modal state for revision request
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [targetResource, setTargetResource] = useState<Resource | null>(null);
    const [feedbackText, setFeedbackText] = useState("");

    const fetchResources = useCallback(async () => {
        setLoading(true);
        try {
            const url = selectedTermId ? `/api/deo/resources?termId=${selectedTermId}` : "/api/deo/resources";
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setResources(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error("Failed to load DEO resources:", e);
        } finally {
            setLoading(false);
        }
    }, [selectedTermId]);

    useEffect(() => {
        fetchResources();
        const onLiveRefresh = () => { fetchResources(); };
        window.addEventListener("lamas:refresh-data", onLiveRefresh);
        return () => window.removeEventListener("lamas:refresh-data", onLiveRefresh);
    }, [fetchResources]);

    const updateStatus = async (id: number, status: "APPROVED" | "REJECTED" | "PENDING", feedback?: string) => {
        if (isArchiveMode) {
            setMsg("Action Disabled: Historical archive mode is read-only.");
            setTimeout(() => setMsg(""), 3500);
            return;
        }

        setActionLoading(true);
        try {
            const res = await fetch(`/api/deo/resources/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, feedback }),
            });

            if (res.ok) {
                setMsg(status === "APPROVED" ? "Resource approved successfully!" : "Revision request sent to lecturer.");
                fetchResources();
                if (isFeedbackModalOpen) {
                    setIsFeedbackModalOpen(false);
                    setTargetResource(null);
                    setFeedbackText("");
                }
            } else {
                const err = await res.json().catch(() => ({}));
                setMsg(err.error || "Failed to update resource moderation status.");
            }
        } catch {
            setMsg("Network error occurred. Please try again.");
        } finally {
            setActionLoading(false);
            setTimeout(() => setMsg(""), 4000);
        }
    };

    const openFeedbackModal = (res: Resource) => {
        setTargetResource(res);
        setFeedbackText("");
        setIsFeedbackModalOpen(true);
    };

    const handleDownloadClick = async (e: React.MouseEvent, url: string, filename: string) => {
        e.preventDefault();
        try {
            if (url.includes("vercel-storage.com")) {
                const downloadUrl = url.includes("?") ? `${url}&download=1` : `${url}?download=1`;
                window.location.href = downloadUrl;
                return;
            }
            const res = await fetch(url);
            if (!res.ok) throw new Error("Fetch failed");
            const blob = await res.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = filename || "resource";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        } catch {
            window.open(url, "_blank");
        }
    };

    // Filter resources
    const filteredResources = resources.filter(r => {
        const matchesSearch = !searchQuery.trim() || 
            r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.lecturer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.description?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
        const matchesType = typeFilter === "ALL" || r.type === typeFilter;
        const matchesLecturer = lecturerFilter === "ALL" || String(r.lecturer?.id) === lecturerFilter;

        return matchesSearch && matchesStatus && matchesType && matchesLecturer;
    });

    const uniqueLecturers = Array.from(new Map(resources.filter(r => r.lecturer).map(r => [r.lecturer.id, r.lecturer.name])).entries());

    const pendingCount = resources.filter(r => r.status === "PENDING").length;
    const approvedCount = resources.filter(r => r.status === "APPROVED").length;
    const rejectedCount = resources.filter(r => r.status === "REJECTED").length;

    return (
        <div className="w-full space-y-8 animate-in fade-in duration-400 pb-12">
            {/* Header Card */}
            <div 
                className="rounded-2xl sm:rounded-3xl border p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}
            >
                <div>
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-teal-600/10 dark:bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-500/30 flex items-center justify-center shadow-xs shrink-0">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                Educational Resource Moderation
                            </h1>
                            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                Review, vet, and moderate lecture slides, course outlines, and materials submitted by departmental faculty.
                            </p>
                        </div>
                    </div>
                </div>
                <RefreshButton
                    onClick={fetchResources}
                    isRefreshing={loading}
                    label="Refresh"
                    size="sm"
                    variant="outline"
                    title="Reload submitted resources"
                />
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <KPICard
                    label="Total Uploads"
                    value={resources.length}
                    icon={<Library className="w-5 h-5" />}
                    color="#3b82f6"
                    delay={0}
                    size="sm"
                />
                <KPICard
                    label="Pending Vetting"
                    value={pendingCount}
                    icon={<Clock className="w-5 h-5" />}
                    color="#f59e0b"
                    delay={100}
                    size="sm"
                />
                <KPICard
                    label="Approved Resources"
                    value={approvedCount}
                    icon={<CheckCircle2 className="w-5 h-5" />}
                    color="#10b981"
                    delay={200}
                    size="sm"
                />
                <KPICard
                    label="Revision Requested"
                    value={rejectedCount}
                    icon={<AlertCircle className="w-5 h-5" />}
                    color="#ef4444"
                    delay={300}
                    size="sm"
                />
            </div>

            {msg && (
                <div className={`p-4 rounded-xl text-sm border flex items-center gap-2.5 font-semibold transition-all animate-in slide-in-from-top-2 ${
                    msg.includes("approved") || msg.includes("successfully")
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                }`}>
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{msg}</span>
                </div>
            )}

            {/* Filter Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search resource title, lecturer, or keyword..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <SearchableSelect
                        value={lecturerFilter}
                        onChange={val => setLecturerFilter(String(val))}
                        placeholder="All Lecturers"
                        options={[
                            { label: "All Lecturers", value: "ALL" },
                            ...uniqueLecturers.map(([id, name]) => ({ label: name, value: String(id) }))
                        ]}
                    />
                    <SearchableSelect
                        value={statusFilter}
                        onChange={val => setStatusFilter(String(val))}
                        placeholder="All Statuses"
                        options={[
                            { label: "All Statuses", value: "ALL" },
                            { label: "Pending DEO Review", value: "PENDING" },
                            { label: "Approved", value: "APPROVED" },
                            { label: "Revision Requested", value: "REJECTED" },
                        ]}
                    />
                    <SearchableSelect
                        value={typeFilter}
                        onChange={val => setTypeFilter(String(val))}
                        placeholder="All File Types"
                        options={[
                            { label: "All File Types", value: "ALL" },
                            { label: "PDF Document", value: "PDF" },
                            { label: "Presentation Slides", value: "SLIDES" },
                            { label: "Source Code", value: "CODE" },
                            { label: "Video Tutorial", value: "VIDEO" },
                            { label: "External Link", value: "LINK" },
                            { label: "Spreadsheet", value: "SPREADSHEET" },
                        ]}
                    />
                </div>
            </div>

            {/* Resources List / Table */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Library className="w-4 h-4 text-teal-500" />
                        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                            Department Submissions Queue ({filteredResources.length})
                        </h2>
                    </div>
                </div>

                {loading ? (
                    <TableSkeleton rows={4} />
                ) : filteredResources.length === 0 ? (
                    <div className="p-16 text-center">
                        <Library className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No resources found</h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                            {searchQuery || statusFilter !== "ALL" || typeFilter !== "ALL" 
                                ? "No items match your active search or filter criteria."
                                : "There are currently no educational resources submitted for review."}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredResources.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE).map((res) => {
                                const typeMeta = typeConfig[res.type] || typeConfig.OTHER;
                                const statusMeta = statusColors[res.status] || statusColors.PENDING;

                                return (
                                    <div key={res.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition-colors">
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${typeMeta.bgClass} ${typeMeta.borderClass} ${typeMeta.textClass}`}>
                                                {typeMeta.icon}
                                            </div>
                                            <div className="space-y-1.5 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                                                        {res.title}
                                                    </h3>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusMeta.badge}`}>
                                                        {statusMeta.label}
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                        {res.type}
                                                    </span>
                                                </div>

                                                {res.description && (
                                                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl whitespace-pre-line">
                                                        {res.description}
                                                    </p>
                                                )}

                                                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                        Lecturer: <span className="font-bold text-teal-600 dark:text-teal-400">{res.lecturer?.name || "Faculty Member"}</span>
                                                    </span>
                                                    <span>•</span>
                                                    <span>{new Date(res.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-wrap items-center gap-2 shrink-0 self-end lg:self-center">
                                            {isBrowserViewable(res.url, res.type) && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        openInBrowserViewer(res.url, res.title, res.id);
                                                    }}
                                                    className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                                                    title="View file in browser"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    <span>View</span>
                                                </button>
                                            )}

                                            <button
                                                onClick={(e) => handleDownloadClick(e, res.url, res.title)}
                                                className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                                                title="Download file"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                <span>Download</span>
                                            </button>

                                            {res.status !== "APPROVED" && (
                                                <button
                                                    onClick={() => updateStatus(res.id, "APPROVED")}
                                                    disabled={actionLoading || isArchiveMode}
                                                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                                    title="Approve resource for departmental use"
                                                >
                                                    <Check className="w-3.5 h-3.5" />
                                                    <span>Approve</span>
                                                </button>
                                            )}

                                            {res.status !== "REJECTED" && (
                                                <button
                                                    onClick={() => openFeedbackModal(res)}
                                                    disabled={actionLoading || isArchiveMode}
                                                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                                    title="Request changes from lecturer"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5" />
                                                    <span>Request Revision</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <Pagination currentPage={page} totalPages={Math.ceil(filteredResources.length / ITEMS_PER_PAGE) || 1} onPageChange={setPage} />
                    </>
                )}
            </div>

            {/* Revision Request Feedback Modal */}
            <Modal
                isOpen={isFeedbackModalOpen}
                onClose={() => {
                    setIsFeedbackModalOpen(false);
                    setTargetResource(null);
                }}
                title="Request Resource Revision"
                size="md"
            >
                <div className="space-y-4">
                    <p className="text-xs text-slate-500">
                        Provide constructive notes to <span className="font-bold text-slate-800 dark:text-white">{targetResource?.lecturer?.name}</span> regarding what needs updating in <span className="font-semibold text-teal-600 dark:text-teal-400">&quot;{targetResource?.title}&quot;</span>.
                    </p>

                    <div>
                        <label htmlFor="deo-feedback-notes" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Moderation Feedback Notes
                        </label>
                        <textarea
                            id="deo-feedback-notes"
                            value={feedbackText}
                            onChange={e => setFeedbackText(e.target.value)}
                            placeholder="e.g., Please update the syllabus week 5 reference and re-upload with high-resolution diagrams..."
                            rows={4}
                            className="w-full p-3 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                setIsFeedbackModalOpen(false);
                                setTargetResource(null);
                            }}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (!targetResource) return;
                                updateStatus(targetResource.id, "REJECTED", feedbackText.trim());
                            }}
                            disabled={actionLoading}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition shadow-sm cursor-pointer disabled:opacity-50"
                        >
                            {actionLoading ? "Submitting..." : "Send Revision Request"}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
