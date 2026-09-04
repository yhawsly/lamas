"use client";

import React, { useState, useEffect } from "react";
import {
    FileText,
    Download,
    Eye,
    BookOpen,
    Layers,
    ExternalLink,
    X,
    Maximize2,
    Minimize2,
    Sparkles,
    ChevronDown,
    ChevronUp,
    Printer,
    Tag
} from "lucide-react";
import { isBrowserViewable, openInBrowserViewer } from "@/lib/file-preview";

interface DossierDocument {
    id: string;
    title: string;
    type: "PDF" | "SLIDES" | "DOCUMENT" | "CODE" | "SPREADSHEET" | "SYLLABUS";
    category: string;
    url: string;
    fileSize: string;
    submittedBy: string;
    status: string;
    date: string;
}

interface DossierData {
    course: {
        id: number;
        code: string;
        title: string;
        domain?: string | null;
        credits: number;
        department: string;
    };
    documents: DossierDocument[];
    syllabus: {
        mandatoryTopics: Array<{ id: number; title: string; description: string }>;
        learningOutcomes: string[];
        textbooks: Array<{ title: string; isCurrent: boolean }>;
    };
}

interface ReviewDossierViewerProps {
    courseCode: string;
    lecturerId?: number | string | null;
    lecturerName?: string;
    reviewType?: "A" | "B" | "C";
    defaultExpanded?: boolean;
}

export default function ReviewDossierViewer({
    courseCode,
    lecturerId,
    lecturerName = "Course Instructor",
    reviewType = "A",
    defaultExpanded = true
}: ReviewDossierViewerProps) {
    const [dossier, setDossier] = useState<DossierData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const [activeTab, setActiveTab] = useState<"DOCS" | "SYLLABUS">("DOCS");
    
    // Modal Preview State
    const [previewDoc, setPreviewDoc] = useState<DossierDocument | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        if (!courseCode) return;
        setLoading(true);
        const lecturerParam = lecturerId ? `&lecturerId=${lecturerId}` : "";
        fetch(`/api/review-dossier?courseCode=${courseCode}${lecturerParam}&type=${reviewType}`)
            .then(r => (r.ok ? r.json() : null))
            .then(data => {
                if (data && data.course) {
                    setDossier(data);
                }
            })
            .catch(err => console.error("Error loading review dossier:", err))
            .finally(() => setLoading(false));
    }, [courseCode, lecturerId, reviewType]);

    if (!courseCode) return null;

    const handlePrintSummary = () => {
        window.print();
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "PDF":
                return "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800";
            case "SLIDES":
                return "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800";
            case "DOCUMENT":
                return "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800";
            default:
                return "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800";
        }
    };

    return (
        <div className="rounded-3xl border shadow-sm transition-all overflow-hidden mb-6" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
            {/* Header / Expand Toggle Bar */}
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b" style={{ borderColor: "var(--bg-border)" }}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                Course Dossier & Educational Materials
                            </h3>
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                {courseCode}
                            </span>
                            {dossier?.course?.domain && (
                                <span className="text-[11px] px-2 py-0.5 rounded-md font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                                    <Tag className="w-3 h-3 text-blue-500" />
                                    <span>{dossier.course.domain}</span>
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Target Lecturer: <strong className="text-slate-700 dark:text-slate-200">{lecturerName}</strong> — Inspect syllabus outlines, lecture notes, & exam materials before completing review.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto print:hidden">
                    <button
                        type="button"
                        onClick={handlePrintSummary}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border hover:bg-slate-100 dark:hover:bg-slate-800"
                        style={{ borderColor: "var(--bg-border)", color: "var(--text-muted)" }}
                        title="Print dossier summary"
                    >
                        <Printer className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Print Summary</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800"
                    >
                        {isExpanded ? (
                            <>
                                <span>Collapse Dossier</span>
                                <ChevronUp className="w-3.5 h-3.5" />
                            </>
                        ) : (
                            <>
                                <span>Expand Dossier ({dossier?.documents?.length || 0} Files)</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Dossier Expanded Content */}
            {isExpanded && (
                <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-200">
                    {/* Tab Navigation */}
                    <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: "var(--bg-border)" }}>
                        <button
                            type="button"
                            onClick={() => setActiveTab("DOCS")}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                                activeTab === "DOCS"
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                            }`}
                        >
                            <FileText className="w-4 h-4" />
                            <span>Submitted Documents & PDFs ({dossier?.documents?.length || 0})</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab("SYLLABUS")}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                                activeTab === "SYLLABUS"
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                            }`}
                        >
                            <Layers className="w-4 h-4" />
                            <span>Weekly Syllabus & Learning Outcomes</span>
                        </button>
                    </div>

                    {loading ? (
                        <div className="py-12 flex flex-col items-center justify-center space-y-3">
                            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-xs text-slate-500 font-medium">Loading course materials & syllabus dossier...</p>
                        </div>
                    ) : activeTab === "DOCS" ? (
                        /* Document Grid */
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(!dossier?.documents || dossier.documents.length === 0) ? (
                                <div className="col-span-2 py-8 text-center border rounded-2xl p-6 bg-slate-50/50 dark:bg-slate-900/30 border-dashed" style={{ borderColor: "var(--bg-border)" }}>
                                    <FileText className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No standalone document uploads found</p>
                                    <p className="text-xs text-slate-500 mt-1">Review the Master Syllabus & weekly topics in the adjacent tab.</p>
                                </div>
                            ) : (
                                dossier.documents.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="p-4 rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between space-y-4"
                                        style={{ backgroundColor: "var(--bg-surface-elevated, var(--bg-hover))", borderColor: "var(--bg-border)" }}
                                    >
                                        <div className="space-y-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getTypeColor(doc.type)}`}>
                                                    {doc.type} • {doc.category}
                                                </span>
                                                <span className="text-[11px] font-semibold text-slate-400">
                                                    {doc.fileSize}
                                                </span>
                                            </div>
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                                                {doc.title}
                                            </h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Submitted by: <span className="font-semibold text-slate-700 dark:text-slate-300">{doc.submittedBy}</span>
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: "var(--bg-border)" }}>
                                            {isBrowserViewable(doc.url, doc.type) ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => openInBrowserViewer(doc.url, doc.title, doc.id)}
                                                        className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                                                        title="Open document in browser"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        <span>View Document</span>
                                                    </button>

                                                    <a
                                                        href={doc.url}
                                                        download
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="py-2 px-3 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                                                        style={{ borderColor: "var(--bg-border)" }}
                                                        title="Download file to computer"
                                                    >
                                                        <Download className="w-3.5 h-3.5" />
                                                        <span className="hidden sm:inline">Download</span>
                                                    </a>
                                                </>
                                            ) : (
                                                <a
                                                    href={doc.url}
                                                    download
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 py-2 px-3 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-800/80 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                                    title="Download file to computer"
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                    <span>Download File</span>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        /* Syllabus & Learning Outcomes Inspector */
                        <div className="space-y-6">
                            {/* Learning Outcomes */}
                            <div className="p-4 rounded-2xl border bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/40 space-y-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                    Course Learning Outcomes (Form A/B Benchmark)
                                </h4>
                                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 list-disc list-inside">
                                    {(dossier?.syllabus?.learningOutcomes || []).map((outcome, i) => (
                                        <li key={i} className="leading-relaxed">{outcome}</li>
                                    ))}
                                </ul>
                            </div>

                            {/* Weekly Topics Roadmap */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Weekly Instructional Topics & Syllabus Breakdown
                                </h4>
                                <div className="space-y-2.5">
                                    {(dossier?.syllabus?.mandatoryTopics || []).map((topic, idx) => (
                                        <div
                                            key={topic.id || idx}
                                            className="p-3.5 rounded-2xl border flex items-start gap-3 transition-colors"
                                            style={{ backgroundColor: "var(--bg-surface-elevated, var(--bg-hover))", borderColor: "var(--bg-border)" }}
                                        >
                                            <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs flex items-center justify-center shrink-0">
                                                {idx + 1}
                                            </span>
                                            <div className="space-y-1 flex-1">
                                                <div className="text-xs font-bold text-slate-900 dark:text-white">
                                                    {topic.title}
                                                </div>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                                                    {topic.description}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Interactive Document Preview Modal */}
            {previewDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 animate-in fade-in duration-200">
                    <div
                        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
                        onClick={() => setPreviewDoc(null)}
                    />
                    <div
                        className={`relative w-full ${
                            isFullscreen ? "h-full max-w-none rounded-none" : "max-w-5xl h-[88vh] rounded-3xl"
                        } flex flex-col shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200`}
                        style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}
                    >
                        {/* Modal Header */}
                        <div className="p-4 border-b flex items-center justify-between gap-4 shrink-0" style={{ borderColor: "var(--bg-border)" }}>
                            <div className="flex items-center gap-3 min-w-0">
                                <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0 ${getTypeColor(previewDoc.type)}`}>
                                    {previewDoc.type}
                                </span>
                                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                                    {previewDoc.title}
                                </h3>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <a
                                    href={previewDoc.url}
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                    style={{ borderColor: "var(--bg-border)" }}
                                    title="Download File"
                                >
                                    <Download className="w-4 h-4" />
                                    <span className="hidden sm:inline">Download</span>
                                </a>

                                <a
                                    href={previewDoc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                    style={{ borderColor: "var(--bg-border)" }}
                                    title="Open in new window"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    <span className="hidden sm:inline">New Tab</span>
                                </a>

                                <button
                                    type="button"
                                    onClick={() => setIsFullscreen(!isFullscreen)}
                                    className="p-2 rounded-xl border hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                                    style={{ borderColor: "var(--bg-border)" }}
                                    title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                                >
                                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPreviewDoc(null)}
                                    className="p-2 rounded-xl border hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-600"
                                    style={{ borderColor: "var(--bg-border)" }}
                                    title="Close Preview"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Viewer Body */}
                        <div className="flex-1 bg-slate-900/90 relative overflow-hidden flex flex-col">
                            {previewDoc.type === "PDF" || previewDoc.url.toLowerCase().endsWith(".pdf") ? (
                                <iframe
                                    src={`${previewDoc.url}#toolbar=1&navpanes=0`}
                                    className="w-full h-full border-0"
                                    title={previewDoc.title}
                                />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-300 space-y-4">
                                    <FileText className="w-16 h-16 text-indigo-400" />
                                    <div className="space-y-1 max-w-md">
                                        <h4 className="text-base font-bold text-white">{previewDoc.title}</h4>
                                        <p className="text-xs text-slate-400">
                                            This file ({previewDoc.type}) is ready for download and local application viewing.
                                        </p>
                                    </div>
                                    <a
                                        href={previewDoc.url}
                                        download
                                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download & Open in System Viewer
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
