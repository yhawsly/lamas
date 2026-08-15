"use client";

import { useState, useEffect } from "react";
import { 
    Folder, 
    FileText, 
    BarChart2, 
    Code, 
    Video, 
    Link as LinkIcon, 
    Paperclip, 
    Download, 
    Eye,
    Check,
    X,
    RotateCcw,
    FileSpreadsheet,
    Image as ImageIcon
} from "lucide-react";

import { useTerm } from "@/context/TermContext";

interface Resource {
    id: number;
    title: string;
    description?: string;
    type: string;
    url: string;
    status: string;
    createdAt: string;
    lecturer: { name: string; email?: string; role?: string };
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

const TableSkeleton = () => (
    <div className="p-6 space-y-4">
        <div className="animate-pulse flex space-x-4 border-b border-slate-100 dark:border-slate-850 pb-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/6"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/6"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/6"></div>
        </div>
        <div className="space-y-4">
            {[1, 2, 3].map((n) => (
                <div key={n} className="animate-pulse flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-850">
                    <div className="flex items-center space-x-3 w-1/3">
                        <div className="rounded-xl bg-slate-200 dark:bg-slate-800 h-10 w-10"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
                            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
                        </div>
                    </div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
                    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-28"></div>
                </div>
            ))}
        </div>
    </div>
);

const statusColors: Record<string, string> = {
    PENDING: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    APPROVED: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    REJECTED: "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
};

export default function HODResourcesPage() {
    const { isArchiveMode, selectedTermId } = useTerm();
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState("");
    const [rejectingId, setRejectingId] = useState<number | null>(null);
    const [feedback, setFeedback] = useState("");

    const fetchResources = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/hod/resources");
            if (res.ok) {
                const data = await res.json();
                setResources(data);
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchResources();
    }, [selectedTermId]);

    const updateStatus = async (id: number, status: string, providedFeedback?: string) => {
        if (isArchiveMode) {
            setMsg("❌ Action Disabled: You are currently viewing a read-only historical archive.");
            setTimeout(() => setMsg(""), 4000);
            return;
        }
        setMsg("");
        try {
            const bodyData: any = { status };
            if (providedFeedback) bodyData.feedback = providedFeedback;

            const res = await fetch(`/api/hod/resources/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bodyData)
            });

            if (res.ok) {
                setMsg(`✅ Resource marked as ${status}`);
                fetchResources();
            } else {
                setMsg("❌ Failed to update resource status");
            }
        } catch (e: any) {
            setMsg(`❌ Error: ${e.message}`);
        }
        setTimeout(() => setMsg(""), 4000);
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
        } catch (err) {
            console.error("Download fallback", err);
            window.open(url, "_blank");
        }
    };

    const handleViewClick = (e: React.MouseEvent, url: string, type?: string, title?: string) => {
        e.preventDefault();
        window.open(url, "_blank");
    };

    const getMockSize = (id: number) => {
        const sizes = ["2.4 MB", "720 KB", "1.5 MB", "12.8 MB", "310 KB", "4.1 MB", "950 KB"];
        return sizes[id % sizes.length];
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-400">
            <header className="mb-8">
                <h1 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">Resource Approvals</h1>
                <p className="mt-1 text-slate-600 dark:text-slate-350 max-w-3xl">
                    Review and moderate resources uploaded by lecturers in your department. Approved resources can be accessed by all lecturers department-wide.
                </p>
            </header>

            {msg && (
                <div className="p-4 rounded-xl text-sm border transition-all animate-in slide-in-from-top-2" style={{
                    backgroundColor: msg.startsWith("✅") ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                    borderColor: msg.startsWith("✅") ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)",
                    color: msg.startsWith("✅") ? "#10b981" : "#ef4444"
                }}>
                    {msg}
                </div>
            )}

            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-3xl overflow-hidden shadow-sm">
                {loading ? (
                    <TableSkeleton />
                ) : resources.length === 0 ? (
                    <div className="text-center py-20 text-slate-400 dark:text-white/20 italic text-sm">
                        <Folder className="w-12 h-12 text-slate-300 dark:text-white/10 mx-auto mb-4" />
                        <p>No resources found in your department.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-850 text-slate-400 dark:text-white/30 text-xs font-bold uppercase tracking-wider">
                                    <th className="px-6 py-4">File Name</th>
                                    <th className="px-6 py-4">File Size</th>
                                    <th className="px-6 py-4">Posted Date</th>
                                    <th className="px-6 py-4">Uploaded By</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                                {resources.map(r => {
                                    const config = typeConfig[r.type] || typeConfig.OTHER;
                                    const initials = (r.lecturer?.name || "L").split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
                                    return (
                                        <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${config.bgClass} ${config.borderClass} ${config.textClass} flex-shrink-0`}>
                                                        {config.icon}
                                                    </div>
                                                    <div className="min-w-0 max-w-sm">
                                                        <div className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition truncate">{r.title}</div>
                                                        {r.description && <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{r.description}</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap font-medium">
                                                {getMockSize(r.id)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                {new Date(r.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-bold border border-slate-200 dark:border-slate-750 flex-shrink-0">
                                                        {initials}
                                                    </div>
                                                    <div className="text-xs">
                                                        <div className="font-semibold text-slate-900 dark:text-white">{r.lecturer?.name || "Lecturer"}</div>
                                                        <div className="text-slate-405 mt-0.5">{r.lecturer?.email || "lecturer@lamas.edu"}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColors[r.status] || ""}`}>
                                                    {r.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <a 
                                                        href={r.url} 
                                                        onClick={(e) => handleDownloadClick(e, r.url, r.title)} 
                                                        className="inline-flex items-center justify-center p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 transition"
                                                        title="Download"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </a>
                                                    <a 
                                                        href={r.url} 
                                                        onClick={(e) => handleViewClick(e, r.url, r.type, r.title)} 
                                                        className="inline-flex items-center justify-center p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                                                        title="View Source"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </a>

                                                    {r.status === "PENDING" && (
                                                        <>
                                                            <button 
                                                                onClick={() => updateStatus(r.id, "APPROVED")} 
                                                                className="inline-flex items-center justify-center p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition shadow-sm"
                                                                title="Approve"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                            <button 
                                                                onClick={() => setRejectingId(r.id)} 
                                                                className="inline-flex items-center justify-center p-2 rounded-lg bg-rose-600 text-white hover:bg-rose-500 transition shadow-sm"
                                                                title="Reject"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {r.status === "APPROVED" && (
                                                        <button 
                                                            onClick={() => setRejectingId(r.id)} 
                                                            className="inline-flex items-center justify-center p-2 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 hover:bg-rose-600 hover:text-white transition"
                                                            title="Revoke / Reject"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {r.status === "REJECTED" && (
                                                        <button 
                                                            onClick={() => updateStatus(r.id, "APPROVED")} 
                                                            className="inline-flex items-center justify-center p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-650 hover:bg-emerald-650 hover:text-white transition"
                                                            title="Restore / Approve"
                                                        >
                                                            <RotateCcw className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {rejectingId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 w-full max-w-md rounded-3xl shadow-2xl p-6 relative">
                        <button onClick={() => { setRejectingId(null); setFeedback(""); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white transition">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Reject Resource</h3>
                        <p className="text-slate-500 dark:text-white/50 text-sm mb-4">Please provide a reason for rejecting this resource so the lecturer knows what to fix.</p>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="e.g. Needs more detailed references..."
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 mb-4 resize-none text-sm"
                            rows={4}
                        />
                        <button
                            onClick={() => {
                                updateStatus(rejectingId, "REJECTED", feedback);
                                setRejectingId(null);
                                setFeedback("");
                            }}
                            disabled={!feedback.trim()}
                            className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition disabled:opacity-50 text-sm"
                        >
                            Confirm Rejection
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
