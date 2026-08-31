"use client";

import React, { useState } from "react";
import {
    ArrowLeft,
    CheckCircle2,
    AlertTriangle,
    FileText,
    BookOpen,
    Layers,
    Calendar,
    Award,
    Download,
    Eye,
    Printer,
    Clock,
    Sparkles,
    ShieldCheck,
    CheckSquare,
    XCircle,
    Send,
    Tag,
    User,
    Mail,
    Building,
    FileCheck,
    Check,
    Search,
    Filter,
    X
} from "lucide-react";
import ReviewDossierViewer from "@/components/workspace/ReviewDossierViewer";
import { useTerm } from "@/context/TermContext";

export interface SubmissionAuditData {
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

interface SubmissionAuditWorkspaceProps {
    submission: SubmissionAuditData;
    onBack: () => void;
    onStatusUpdate: (submissionId: number, status: string, feedback: string) => Promise<void>;
}

export default function SubmissionAuditWorkspace({
    submission,
    onBack,
    onStatusUpdate
}: SubmissionAuditWorkspaceProps) {
    const { isArchiveMode } = useTerm();
    const [activeTab, setActiveTab] = useState<"OVERVIEW" | "ROADMAP" | "RESOURCES" | "ASSESSMENTS" | "AUDIT">("OVERVIEW");
    
    // Class & Module Filter State
    const [selectedClassId, setSelectedClassId] = useState<string>("ALL");
    const [moduleSearch, setModuleSearch] = useState<string>("");
    const [moduleStatusFilter, setModuleStatusFilter] = useState<"ALL" | "TAUGHT" | "PENDING">("ALL");

    // Audit Form State
    const [feedback, setFeedback] = useState(submission.feedback || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [auditChecklist, setAuditChecklist] = useState({
        cloAligned: true,
        topicsCoverage: true,
        assessmentPolicy: true,
        resourcesAdequate: true,
        pacingBalanced: true
    });

    const content = submission.content || {};
    const basicInfo = content.basicInfo || {};
    const courseCode = basicInfo.courseCode || submission.title.split(" ")[0] || "CS403";
    const courseTitle = basicInfo.title || submission.title.replace(`${courseCode} - `, "") || "Course Syllabus";
    const credits = basicInfo.credits || "3";
    const description = basicInfo.description || "Comprehensive academic syllabus and weekly modular roadmap.";
    const outcomes = content.outcomes || [];
    const topics = content.topics || [];
    const classes = content.classes || [];
    const assessments = content.assessments || [
        { id: 1, name: "Continuous Assessment / Quizzes", weight: 20, description: "Weekly quizzes, assignments, and practical exercises." },
        { id: 2, name: "Mid-Semester Examination & Labs", weight: 20, description: "Mid-term theoretical evaluation and laboratory test." },
        { id: 3, name: "End of Semester Examination", weight: 60, description: "Comprehensive final examination." }
    ];

    const totalWeight = assessments.reduce((acc: number, a: any) => acc + (Number(a.weight) || 0), 0);

    const handleAuditDecision = async (status: "APPROVED" | "REJECTED") => {
        setIsSubmitting(true);
        try {
            await onStatusUpdate(submission.id, status, feedback);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const getStatusBadge = (st: string) => {
        switch (st) {
            case "APPROVED":
            case "REVIEWED":
                return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
            case "REJECTED":
                return "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800";
            case "LATE":
                return "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800";
            default:
                return "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800";
        }
    };

    const quickFeedbackSuggestions = [
        "Syllabus structure and learning outcomes fully aligned with departmental standards. Approved.",
        "Please clarify the practical laboratory component in Weeks 4 and 5 before final sign-off.",
        "Assessment weighting exceeds maximum continuous assessment threshold. Please recalibrate.",
        "Textbook references should be updated to the latest standard 2025/2026 edition."
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-20">
            {/* Top Navigation & Submissions Header */}
            <div className="rounded-3xl border p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Review Inbox</span>
                    </button>

                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {courseCode}
                        </span>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            {submission.title}
                        </h1>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${getStatusBadge(submission.status)}`}>
                            {submission.status}
                        </span>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5 font-medium">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <strong className="text-slate-700 dark:text-slate-200">{submission.lecturer.name}</strong>
                        </div>
                        <div className="flex items-center gap-1.5 font-medium">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{submission.lecturer.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Submitted: {new Date(submission.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="px-4 py-2.5 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-600 text-xs font-black text-slate-700 dark:text-slate-300 transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
                    >
                        <Printer className="w-4 h-4 text-slate-500" />
                        <span>Print Dossier</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("AUDIT")}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all flex items-center gap-2 shadow-sm shadow-amber-600/20 active:scale-95 cursor-pointer"
                    >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Perform Audit</span>
                    </button>
                </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="flex gap-2 border-b-2 overflow-x-auto no-scrollbar pb-1.5" style={{ borderColor: "var(--bg-border)" }}>
                {[
                    { id: "OVERVIEW", label: "Syllabus Overview & CLOs", icon: BookOpen },
                    { id: "ROADMAP", label: "Weekly Roadmap & Modules", icon: Layers, badge: classes[0]?.modules?.length || topics.length || null },
                    { id: "RESOURCES", label: "Uploaded PDFs & Resources", icon: FileText },
                    { id: "ASSESSMENTS", label: "Assessment Matrix", icon: Award, badge: `${totalWeight}%` },
                    { id: "AUDIT", label: "Quality Audit & Sign-off", icon: ShieldCheck, highlight: true }
                ].map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap border ${
                                isActive
                                    ? tab.highlight
                                        ? "bg-amber-600 border-amber-600 text-white shadow-sm shadow-amber-600/20"
                                        : "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-600/20"
                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/30"
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                            {tab.badge && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                                    isActive ? "bg-white/20 border-white/40 text-white" : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                                }`}>
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* TAB 1: OVERVIEW & CLOs */}
            {activeTab === "OVERVIEW" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                    {/* Course Metadata Card */}
                    <div className="rounded-3xl border p-6 shadow-sm space-y-4" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                        <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "var(--bg-border)" }}>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Official Course Specifications</span>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{courseTitle}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border" style={{ borderColor: "var(--bg-border)" }}>
                                    {credits} Academic Credits
                                </span>
                                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                    Code: {courseCode}
                                </span>
                            </div>
                        </div>

                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Course Description & Pedagogical Scope</span>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                {description}
                            </p>
                        </div>
                    </div>

                    {/* Course Learning Outcomes (CLOs) */}
                    <div className="rounded-3xl border p-6 shadow-sm space-y-4" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Course Learning Outcomes (CLOs)
                                    </h4>
                                    <p className="text-xs text-slate-500">Measurable competency benchmarks for this academic syllabus.</p>
                                </div>
                            </div>
                            <span className="text-xs font-bold text-slate-400">
                                {outcomes.length > 0 ? `${outcomes.length} Outcomes Defined` : "Standard Departmental CLOs"}
                            </span>
                        </div>

                        <div className="space-y-3 pt-2">
                            {outcomes.length > 0 ? (
                                outcomes.map((clo: any, idx: number) => (
                                    <div
                                        key={clo.id || idx}
                                        className="p-4 rounded-2xl border flex items-start gap-3 transition-colors"
                                        style={{ backgroundColor: "var(--bg-surface-elevated, var(--bg-hover))", borderColor: "var(--bg-border)" }}
                                    >
                                        <span className="px-2 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-black shrink-0">
                                            {clo.id || `CLO-${idx + 1}`}
                                        </span>
                                        <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium pt-0.5">
                                            {clo.text || clo}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                [
                                    "Master foundational theoretical paradigms, architecture patterns, and domain standards.",
                                    "Implement, debug, and optimize complex software and systems solutions using modern frameworks.",
                                    "Evaluate and synthesize design trade-offs adhering to professional quality, security, and ethics."
                                ].map((clo, idx) => (
                                    <div
                                        key={idx}
                                        className="p-4 rounded-2xl border flex items-start gap-3 transition-colors"
                                        style={{ backgroundColor: "var(--bg-surface-elevated, var(--bg-hover))", borderColor: "var(--bg-border)" }}
                                    >
                                        <span className="px-2 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-black shrink-0">
                                            CLO-{idx + 1}
                                        </span>
                                        <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium pt-0.5">
                                            {clo}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: WEEKLY ROADMAP & MODULES */}
            {activeTab === "ROADMAP" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                    {/* Class & Module Filter Header */}
                    {classes.length > 0 && (
                        <div className="p-4 sm:p-5 rounded-3xl border-2 shadow-sm space-y-4" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div>
                                    <div className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                        <Filter className="w-3.5 h-3.5 text-indigo-500" /> Filter by Assigned Class / Cohort
                                    </div>
                                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                                        {classes.length} Registered {classes.length === 1 ? "Class Cohort" : "Class Cohorts"}
                                    </h3>
                                </div>

                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                    <span>
                                        Total Modules: {classes.reduce((sum: number, c: any) => sum + (c.modules?.length || 0), 0)}
                                    </span>
                                </div>
                            </div>

                            {/* Class Tabs / Pills */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                                <button
                                    type="button"
                                    onClick={() => setSelectedClassId("ALL")}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 flex items-center gap-1.5 border-2 ${
                                        selectedClassId === "ALL"
                                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/25 scale-105"
                                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50"
                                    }`}
                                >
                                    <Layers className="w-3.5 h-3.5" />
                                    <span>All Classes</span>
                                    <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black border ${
                                        selectedClassId === "ALL" ? "bg-white/20 border-white/40 text-white" : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                                    }`}>
                                        {classes.length}
                                    </span>
                                </button>

                                {classes.map((cls: any) => {
                                    const isSelected = String(cls.id) === selectedClassId || cls.name === selectedClassId;
                                    const modCount = cls.modules?.length || 0;
                                    return (
                                        <button
                                            key={cls.id}
                                            type="button"
                                            onClick={() => setSelectedClassId(String(cls.id))}
                                            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 flex items-center gap-1.5 border-2 ${
                                                isSelected
                                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/25 scale-105"
                                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50"
                                            }`}
                                        >
                                            <Building className="w-3.5 h-3.5 text-indigo-400" />
                                            <span className="truncate max-w-[220px]">{cls.name}</span>
                                            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black border ${
                                                isSelected ? "bg-white/20 border-white/40 text-white" : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                                            }`}>
                                                {modCount}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Search and Status Filters */}
                            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                                <div className="relative w-full sm:flex-1">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search modules by week, title, or lesson plan activities..."
                                        value={moduleSearch}
                                        onChange={(e) => setModuleSearch(e.target.value)}
                                        className="w-full pl-10 pr-8 py-2 rounded-xl text-xs font-semibold border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 shadow-xs"
                                    />
                                    {moduleSearch && (
                                        <button
                                            type="button"
                                            onClick={() => setModuleSearch("")}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setModuleStatusFilter("ALL")}
                                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all border-2 ${
                                            moduleStatusFilter === "ALL"
                                                ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/25 scale-105"
                                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400"
                                        }`}
                                    >
                                        All Status
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setModuleStatusFilter("TAUGHT")}
                                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 border-2 ${
                                            moduleStatusFilter === "TAUGHT"
                                                ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/20 scale-105"
                                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-400"
                                        }`}
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Taught
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setModuleStatusFilter("PENDING")}
                                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 border-2 ${
                                            moduleStatusFilter === "PENDING"
                                                ? "bg-amber-600 border-amber-600 text-white shadow-md shadow-amber-500/20 scale-105"
                                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-400"
                                        }`}
                                    >
                                        <Clock className="w-3.5 h-3.5" /> Upcoming
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {classes.length > 0 ? (
                        (() => {
                            const filteredClasses = classes
                                .filter((cls: any) => {
                                    if (selectedClassId !== "ALL" && String(cls.id) !== selectedClassId && cls.name !== selectedClassId) {
                                        return false;
                                    }
                                    return true;
                                })
                                .map((cls: any) => {
                                    const filteredModules = (cls.modules || []).filter((m: any) => {
                                        if (moduleStatusFilter === "TAUGHT" && !m.completed) return false;
                                        if (moduleStatusFilter === "PENDING" && m.completed) return false;
                                        if (moduleSearch.trim()) {
                                            const query = moduleSearch.toLowerCase();
                                            const weekStr = `week ${m.week}`.toLowerCase();
                                            const titleStr = (m.title || "").toLowerCase();
                                            const descStr = (m.description || "").toLowerCase();
                                            const planStr = (m.lesson_plan || "").toLowerCase();
                                            return (
                                                weekStr.includes(query) ||
                                                titleStr.includes(query) ||
                                                descStr.includes(query) ||
                                                planStr.includes(query)
                                            );
                                        }
                                        return true;
                                    });
                                    return {
                                        ...cls,
                                        filteredModules
                                    };
                                });

                            const totalVisibleModules = filteredClasses.reduce((sum: number, c: any) => sum + c.filteredModules.length, 0);

                            if (totalVisibleModules === 0) {
                                return (
                                    <div className="py-12 text-center rounded-3xl border border-dashed p-8 text-slate-400" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                                        <Layers className="w-8 h-8 mx-auto mb-2 opacity-50 text-indigo-400" />
                                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No modules match current filter</h4>
                                        <p className="text-xs text-slate-500 mt-1 mb-4">Try clearing your search query or switching to All Classes.</p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedClassId("ALL");
                                                setModuleSearch("");
                                                setModuleStatusFilter("ALL");
                                            }}
                                            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                                        >
                                            Reset All Filters
                                        </button>
                                    </div>
                                );
                            }

                            return filteredClasses.map((cls: any) => {
                                if (cls.filteredModules.length === 0) return null;
                                return (
                                    <div key={cls.id} className="rounded-3xl border p-6 shadow-sm space-y-4" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                                        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--bg-border)" }}>
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                <Building className="w-4 h-4 text-indigo-500" />
                                                <span>{cls.name}</span>
                                            </h3>
                                            <span className="text-xs font-semibold text-slate-500">
                                                {cls.filteredModules.length} {cls.filteredModules.length === 1 ? "Module" : "Modules"} Visible
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            {cls.filteredModules.map((m: any) => (
                                                <div
                                                    key={m.id || m.week}
                                                    className="p-4 rounded-2xl border transition-all hover:shadow-sm space-y-2.5"
                                                    style={{ backgroundColor: "var(--bg-surface-elevated, var(--bg-hover))", borderColor: "var(--bg-border)" }}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <span className="px-2.5 py-1 rounded-xl bg-indigo-600 text-white text-[11px] font-black shrink-0">
                                                                Week {m.week}
                                                            </span>
                                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                                                {m.title}
                                                            </h4>
                                                        </div>
                                                        {m.completed ? (
                                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                                                                <CheckCircle2 className="w-3 h-3" /> Taught
                                                            </span>
                                                        ) : (
                                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                                                                <Clock className="w-3 h-3" /> Upcoming
                                                            </span>
                                                        )}
                                                    </div>

                                                    {m.description && (
                                                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-1">
                                                            {m.description}
                                                        </p>
                                                    )}

                                                    {m.lesson_plan && (
                                                        <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 text-xs text-slate-700 dark:text-slate-300">
                                                            <div className="font-bold text-[10px] uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-1 flex items-center gap-1">
                                                                <FileCheck className="w-3 h-3" /> Lesson Plan & Laboratory Activities:
                                                            </div>
                                                            <div className="whitespace-pre-line text-[11px] leading-relaxed">
                                                                {m.lesson_plan}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            });
                        })()
                    ) : topics.length > 0 ? (
                        <div className="rounded-3xl border p-6 shadow-sm space-y-4" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Course Syllabus Topics</h3>
                            <div className="space-y-3">
                                {topics.map((t: any, idx: number) => (
                                    <div
                                        key={t.id || idx}
                                        className="p-4 rounded-2xl border space-y-2"
                                        style={{ backgroundColor: "var(--bg-surface-elevated, var(--bg-hover))", borderColor: "var(--bg-border)" }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-black flex items-center justify-center">
                                                {idx + 1}
                                            </span>
                                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">{t.title}</h4>
                                        </div>
                                        {t.description && <p className="text-xs text-slate-500 pl-8">{t.description}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="py-12 text-center rounded-3xl border border-dashed p-8 text-slate-400">
                            <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-xs font-bold">No custom weekly modules provided in this submission.</p>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: UPLOADED RESOURCES & PDFS */}
            {activeTab === "RESOURCES" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                    <ReviewDossierViewer
                        courseCode={courseCode}
                        lecturerName={submission.lecturer.name}
                        reviewType="A"
                        defaultExpanded={true}
                    />
                </div>
            )}

            {/* TAB 4: ASSESSMENTS MATRIX */}
            {activeTab === "ASSESSMENTS" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="rounded-3xl border p-6 shadow-sm space-y-6" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: "var(--bg-border)" }}>
                            <div className="space-y-1">
                                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Award className="w-5 h-5 text-indigo-500" />
                                    <span>Continuous & Summative Assessment Matrix</span>
                                </h3>
                                <p className="text-xs text-slate-500">Grading policy allocation across quizzes, midterms, and final exam.</p>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className={`px-3 py-1.5 rounded-xl text-xs font-black border ${
                                    totalWeight === 100
                                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                                        : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                                }`}>
                                    Total Weight: {totalWeight}%
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {assessments.map((a: any, idx: number) => (
                                <div
                                    key={a.id || idx}
                                    className="p-5 rounded-2xl border flex flex-col justify-between space-y-4"
                                    style={{ backgroundColor: "var(--bg-surface-elevated, var(--bg-hover))", borderColor: "var(--bg-border)" }}
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                Component #{idx + 1}
                                            </span>
                                            <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                                                {a.weight}%
                                            </span>
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                                            {a.name}
                                        </h4>
                                        {a.description && (
                                            <p className="text-xs text-slate-500 leading-relaxed">
                                                {a.description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-indigo-600 h-full rounded-full transition-all"
                                            style={{ width: `${Math.min(100, a.weight * 2)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 5: QUALITY AUDIT & SIGN-OFF */}
            {activeTab === "AUDIT" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Quality Rubric Checklist (Left 7 Cols) */}
                        <div className="lg:col-span-7 rounded-3xl border p-6 shadow-sm space-y-5" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                            <div className="flex items-center gap-2 border-b pb-4" style={{ borderColor: "var(--bg-border)" }}>
                                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                    <ShieldCheck className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                        Quality Assurance Rubric Checklist
                                    </h3>
                                    <p className="text-xs text-slate-500">Verify syllabus compliance before issuing audit sign-off.</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {[
                                    { key: "cloAligned", title: "Learning Outcomes (CLOs) Compliance", desc: "Course outcomes conform to Bloom's taxonomy & faculty accreditation criteria." },
                                    { key: "topicsCoverage", title: "Comprehensive Curriculum Coverage", desc: "Weekly modules cover all mandatory master syllabus themes and topics." },
                                    { key: "assessmentPolicy", title: "Assessment Weighting & Policy Adherence", desc: "Continuous and final exam weights sum to 100% and follow departmental limits." },
                                    { key: "resourcesAdequate", title: "Instructional Resources & Materials Currency", desc: "Uploaded PDFs, notes, slides, and textbook editions are current and accessible." },
                                    { key: "pacingBalanced", title: "Laboratory & Contact Hours Pacing", desc: "Schedule balances theoretical instruction with hands-on practical lab activities." }
                                ].map(item => (
                                    <label
                                        key={item.key}
                                        className="p-4 rounded-2xl border flex items-start gap-3.5 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                        style={{ borderColor: "var(--bg-border)" }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={(auditChecklist as any)[item.key]}
                                            onChange={e => setAuditChecklist(p => ({ ...p, [item.key]: e.target.checked }))}
                                            className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500 mt-0.5 cursor-pointer"
                                        />
                                        <div className="space-y-0.5 flex-1">
                                            <div className="text-xs font-bold text-slate-900 dark:text-white">
                                                {item.title}
                                            </div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                {item.desc}
                                            </p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Audit Decision & Feedback Panel (Right 5 Cols) */}
                        <div className="lg:col-span-5 rounded-3xl border p-6 shadow-sm flex flex-col justify-between space-y-6" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                            <div className="space-y-4">
                                <div className="border-b pb-4" style={{ borderColor: "var(--bg-border)" }}>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">HOD / Quality Audit Verdict</span>
                                    <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">Reviewer Assessment & Directives</h4>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Formal Audit Commentary / Feedback
                                    </label>
                                    <textarea
                                        value={feedback}
                                        onChange={e => setFeedback(e.target.value)}
                                        placeholder="Provide structured feedback for the instructor..."
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-2xl text-xs font-medium focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition shadow-xs border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Quick Suggestions</span>
                                    <div className="flex flex-col gap-1.5">
                                        {quickFeedbackSuggestions.map((sug, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => setFeedback(sug)}
                                                className="text-left text-[11px] font-bold p-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/40 text-slate-700 dark:text-slate-300 transition-all flex items-center gap-2 cursor-pointer"
                                            >
                                                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                                <span className="truncate">{sug}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {isArchiveMode ? (
                                <div className="w-full py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-xs uppercase tracking-widest text-center border-2 border-slate-300 dark:border-slate-700">
                                    Read-Only Historical Archive
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3 pt-4 border-t" style={{ borderColor: "var(--bg-border)" }}>
                                    <button
                                        type="button"
                                        onClick={() => handleAuditDecision("REJECTED")}
                                        disabled={isSubmitting}
                                        className="py-3 px-4 rounded-xl border-2 border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-600 hover:text-white hover:border-rose-600 text-rose-700 dark:text-rose-300 text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        <span>Request Revision</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleAuditDecision("APPROVED")}
                                        disabled={isSubmitting}
                                        className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider shadow-sm shadow-emerald-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                                    >
                                        <Check className="w-4 h-4" />
                                        <span>{isSubmitting ? "Certifying..." : "Approve Syllabus"}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
