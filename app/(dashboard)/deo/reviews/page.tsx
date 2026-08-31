"use client";

import {
    Plus,
    ClipboardList,
    Inbox,
    BookOpen,
    Video,
    ShieldCheck,
    BellRing,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Sparkles,
    Tag,
    Info
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import SearchableSelect from "@/components/ui/SearchableSelect";
import RefreshButton from "@/components/ui/RefreshButton";
import { useRouter } from "next/navigation";
import { useTerm } from "@/context/TermContext";
import { useModal } from "@/context/ModalContext";
import { getCourseTitle } from "@/lib/courses";

const RegistrySkeleton = () => (
    <div className="space-y-3 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 rounded-2xl border bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800/60">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700/80 shrink-0" />
                        <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700/80 rounded" />
                                <div className="h-4.5 w-16 bg-slate-200 dark:bg-slate-700/80 rounded-full" />
                            </div>
                            <div className="h-3 w-40 bg-slate-200 dark:bg-slate-700/80 rounded" />
                            <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700/80 rounded" />
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right space-y-1">
                            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700/80 rounded" />
                            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700/80 rounded" />
                        </div>
                        <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700/80 rounded-xl" />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

const DeoDashboardSkeleton = () => (
    <div className="w-full space-y-6 sm:space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="space-y-2">
            <div className="h-8 w-72 bg-slate-200 dark:bg-slate-700/80 rounded-lg" />
            <div className="h-4 w-96 bg-slate-200 dark:bg-slate-700/80 rounded" />
        </div>

        {/* 3 Horizontal Dispatch Cards Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
            {[1, 2, 3].map(i => (
                <div key={i} className="p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700/80 shrink-0" />
                    <div className="space-y-2 flex-1">
                        <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700/80 rounded" />
                        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700/80 rounded" />
                    </div>
                </div>
            ))}
        </div>

        {/* Dispatch Form Skeleton */}
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700/80 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                ))}
            </div>
        </div>

        {/* Registry Skeleton */}
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700/80 rounded" />
                <div className="h-8 w-44 bg-slate-200 dark:bg-slate-700/80 rounded-xl" />
            </div>
            <RegistrySkeleton />
        </div>
    </div>
);

export default function DEOReviewsPage() {
    const router = useRouter();
    const { selectedTermId, isArchiveMode } = useTerm();
    const { showWarning, showError, showSuccess } = useModal();
    const [assignments, setAssignments] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [lecturers, setLecturers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Form State for Review Dispatching
    const [reviewType, setReviewType] = useState<"A" | "B" | "C">("A");
    const [form, setForm] = useState({ lecturerId: "", observerId: "", courseCode: "" });
    const [msg, setMsg] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<"ALL" | "A" | "B" | "C">("ALL");

    // Nudge Reminder States
    const [isNudgingAll, setIsNudgingAll] = useState(false);
    const [nudgingId, setNudgingId] = useState<string | null>(null);

    useEffect(() => {
        loadData();
        const onLiveRefresh = () => { loadData(); };
        window.addEventListener("lamas:refresh-data", onLiveRefresh);
        return () => window.removeEventListener("lamas:refresh-data", onLiveRefresh);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTermId]);

    // Auto-populate lecturer if exactly 1 lecturer is assigned to sections of the selected course
    useEffect(() => {
        if (!form.courseCode) {
            setForm(p => ({ ...p, lecturerId: "" }));
            return;
        }
        const selectedCourseObj = courses.find(c => c.code === form.courseCode);
        if (selectedCourseObj) {
            const assignedIds = Array.from(new Set(selectedCourseObj.sections.map((s: any) => s.lecturerId).filter(Boolean)));
            if (assignedIds.length === 1) {
                setForm(p => ({ ...p, lecturerId: String(assignedIds[0]) }));
            }
        }
    }, [form.courseCode, courses]);

    async function loadData() {
        setLoading(true);
        try {
            const [assRes, cRes, lRes] = await Promise.all([
                fetch(`/api/deo/assignments${selectedTermId ? `?termId=${selectedTermId}` : ""}`),
                fetch("/api/courses"),
                fetch("/api/lecturers")
            ]);
            
            const assData = assRes.ok ? await assRes.json().catch(() => ({})) : {};
            const cData = cRes.ok ? await cRes.json().catch(() => []) : [];
            const lData = lRes.ok ? await lRes.json().catch(() => []) : [];

            setAssignments(assData.assignments || []);
            setCourses(Array.isArray(cData) ? cData : cData.courses || []);
            setLecturers(Array.isArray(lData) ? lData : lData.data || []);
        } catch (e) {
            console.error("Failed to load DEO reviews data:", e);
        } finally {
            setLoading(false);
        }
    }

    async function assign(e: React.FormEvent) {
        e.preventDefault();
        if (isArchiveMode) {
            showWarning("Action Disabled", "You are viewing a read-only historical archive. Dispatching reviews is disabled.");
            return;
        }
        if (!form.lecturerId || !form.observerId || !form.courseCode) {
            setMsg("Please complete all required fields.");
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/deo/assignments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    formType: reviewType,
                    lecturerId: Number(form.lecturerId),
                    observerId: Number(form.observerId),
                    courseCode: form.courseCode,
                    termId: selectedTermId || undefined
                })
            });
            if (res.ok) {
                setMsg("Review assigned successfully!");
                setForm({ lecturerId: "", observerId: "", courseCode: "" });
                loadData();
            } else {
                const errData = await res.json().catch(() => ({}));
                setMsg(errData.error || "Failed to assign review."); 
            }
        } catch {
            setMsg("Network error occurred.");
        } finally {
            setIsSubmitting(false);
            setTimeout(() => setMsg(""), 3000);
        }
    }

    // Individual Reviewer Nudge
    const handleNudgeReviewer = async (formType: string, reviewId: number) => {
        if (isArchiveMode) {
            showWarning("Action Disabled", "You are viewing a read-only historical archive.");
            return;
        }
        const key = `${formType}-${reviewId}`;
        setNudgingId(key);
        try {
            const res = await fetch("/api/deo/reminders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ formType, reviewId })
            });
            const data = await res.json();
            if (res.ok) {
                showSuccess("Reminder Sent", "Notification reminder sent to the assigned reviewer!");
            } else {
                showError("Reminder Failed", data.error || "Failed to send reminder");
            }
        } catch {
            showError("Network Error", "Network error sending reminder");
        } finally {
            setNudgingId(null);
        }
    };

    // Bulk Nudge All Pending Reviewers
    const handleNudgeAllOverdue = async () => {
        if (isArchiveMode) {
            showWarning("Action Disabled", "You are viewing a read-only historical archive.");
            return;
        }
        setIsNudgingAll(true);
        try {
            const res = await fetch("/api/deo/reminders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bulk: true, termId: selectedTermId })
            });
            const data = await res.json();
            if (res.ok) {
                showSuccess("Reminders Sent", data.message || "Reminders sent successfully!");
            } else {
                showError("Reminders Failed", data.error || "Failed to send bulk reminders");
            }
        } catch {
            showError("Network Error", "Network error sending reminders");
        } finally {
            setIsNudgingAll(false);
        }
    };

    const statusColors: Record<string, string> = { 
        PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300", 
        COMPLETED: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300", 
        REVIEWED: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300" 
    };

    const getRoute = (formType: string, id: number) => {
        if (formType === "A") return `/deo/observations/${id}`;
        if (formType === "B") return `/deo/teaching-observations/${id}`;
        if (formType === "C") return `/deo/moderations/${id}`;
        return "#";
    };

    // Calculate days elapsed for pending reviews
    const getDaysElapsed = (dateString: string) => {
        const diffMs = Date.now() - new Date(dateString).getTime();
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    };

    const pendingAssignments = assignments.filter(a => a.status === "PENDING");
    const overdueAssignments = pendingAssignments.filter(a => getDaysElapsed(a.createdAt) >= 5);

    const partnerLabel = reviewType === "C" ? "Assigned Moderator" : "Assigned Observer";
    const selectedCourseObj = courses.find(c => c.code === form.courseCode);

    // Dynamic Target Lecturer Options (prioritizing assigned instructors)
    const targetLecturerOptions = useMemo(() => {
        if (!selectedCourseObj) {
            return lecturers.map(l => ({ label: `${l.name} (${l.email})`, value: String(l.id) }));
        }

        let deptLecturers = lecturers;
        if (selectedCourseObj.departmentId) {
            deptLecturers = lecturers.filter(l => !l.departmentId || l.departmentId === selectedCourseObj.departmentId);
        }
        if (deptLecturers.length === 0) deptLecturers = lecturers;

        const assignedIds = new Set(
            (selectedCourseObj.sections || []).map((s: any) => Number(s.lecturerId)).filter(Boolean)
        );

        return deptLecturers
            .map(l => {
                const isAssigned = assignedIds.has(Number(l.id));
                return {
                    label: isAssigned ? `[Assigned Instructor] ${l.name} (${l.email})` : `${l.name} (${l.email})`,
                    value: String(l.id),
                    isAssigned
                };
            })
            .sort((a, b) => {
                if (a.isAssigned && !b.isAssigned) return -1;
                if (!a.isAssigned && b.isAssigned) return 1;
                return a.label.localeCompare(b.label);
            });
    }, [selectedCourseObj, lecturers]);

    // Dynamic Reviewer Options (Approach 1: Department Boundary + Approach 2: Domain Specialization Match)
    const partnerOptions: Array<{ label: string; value: string; isDomainMatch: boolean }> = useMemo(() => {
        if (!selectedCourseObj) {
            return lecturers.map(l => ({ label: `${l.name} (${l.email})`, value: String(l.id), isDomainMatch: false }));
        }

        // 1. Department Boundary Filter (Approach 1):
        // Only include faculty in the same academic department as the selected course
        let eligibleLecturers = lecturers;
        if (selectedCourseObj.departmentId) {
            eligibleLecturers = lecturers.filter(l => !l.departmentId || l.departmentId === selectedCourseObj.departmentId);
        }
        if (eligibleLecturers.length === 0) eligibleLecturers = lecturers;

        // 2. Specialization Domain Clustering (Approach 2):
        const courseDomain = (selectedCourseObj.domain || "").toLowerCase().trim();
        const domainKeywords = courseDomain
            .replace(/[^\w\s]/g, "")
            .split(/\s+/)
            .filter((w: string) => w.length > 2 && !["and", "the", "for", "systems", "practices"].includes(w));

        return eligibleLecturers
            .map(l => {
                const specs: string[] = Array.isArray(l.specializations) ? l.specializations : [];
                let matchedSpec = "";
                
                const isDomainMatch = courseDomain && specs.some((s: string) => {
                    const cleanS = s.toLowerCase();
                    if (courseDomain.includes(cleanS) || cleanS.includes(courseDomain)) {
                        matchedSpec = s;
                        return true;
                    }
                    const specKeywords = cleanS
                        .replace(/[^\w\s]/g, "")
                        .split(/\s+/)
                        .filter((w: string) => w.length > 2 && !["and", "the", "for", "systems", "practices"].includes(w));

                    const hasOverlap = domainKeywords.some((dk: string) => 
                        specKeywords.some((sk: string) => dk === sk || (dk.length >= 4 && sk.startsWith(dk)) || (sk.length >= 4 && dk.startsWith(sk)))
                    );

                    if (hasOverlap) {
                        matchedSpec = s;
                        return true;
                    }
                    return false;
                });

                let label = l.name;
                if (isDomainMatch) {
                    label = `[Domain Match] ${l.name} — (${matchedSpec || specs[0]})`;
                } else if (specs.length > 0) {
                    label = `${l.name} — (${specs[0]})`;
                } else {
                    label = `${l.name} (${l.email})`;
                }

                return {
                    label,
                    value: String(l.id),
                    isDomainMatch: Boolean(isDomainMatch)
                };
            })
            .sort((a, b) => {
                if (a.isDomainMatch && !b.isDomainMatch) return -1;
                if (!a.isDomainMatch && b.isDomainMatch) return 1;
                return a.label.localeCompare(b.label);
            });
    }, [selectedCourseObj, lecturers]);

    if (loading && assignments.length === 0 && courses.length === 0) {
        return <DeoDashboardSkeleton />;
    }

    return (
        <div className="w-full space-y-6 sm:space-y-8 animate-in fade-in duration-500">
            {/* Header & Primary Navigation Tabs */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Peer Review Hub</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Centralized dispatch for peer reviews, overdue reviewer alerts, and moderation monitoring.
                    </p>
                </div>
                <RefreshButton
                    onClick={loadData}
                    isRefreshing={loading}
                    label="Refresh Hub"
                    size="sm"
                    variant="outline"
                    title="Reload peer review assignments"
                />
            </div>

            {/* Notification alert banner */}
            {msg && (
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>{msg}</span>
                </div>
            )}

            {/* PEER REVIEWS & OVERDUE NUDGES */}
            <div className="space-y-8 animate-in fade-in duration-300">
                    {/* 3 Clickable Horizontal Dispatch Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
                        {/* Card 1: Form A */}
                        <button
                            type="button"
                            onClick={() => setReviewType("A")}
                            className={`text-left p-3.5 sm:p-5 rounded-[20px] sm:rounded-[24px] border-2 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center group relative overflow-hidden ${
                                reviewType === "A"
                                    ? "bg-amber-500/5 dark:bg-amber-500/10 border-amber-500 shadow-md"
                                    : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 hover:border-amber-500/40"
                            }`}
                        >
                            <div className={`w-9 sm:w-12 h-9 sm:h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                reviewType === "A"
                                    ? "bg-amber-500 text-white"
                                    : "bg-slate-100 dark:bg-slate-900 text-slate-400 group-hover:bg-amber-500/10 group-hover:text-amber-500"
                            }`}>
                                <BookOpen className="w-4 h-4 sm:w-6 sm:h-6" />
                            </div>
                            <div>
                                <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-550 dark:text-amber-400">Form A Audit</div>
                                <h4 className="text-xs sm:text-sm font-extrabold mt-0.5 sm:mt-1 text-slate-900 dark:text-white truncate">Instructional Materials</h4>
                                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 leading-snug font-medium line-clamp-2">Syllabus outlines & notes.</p>
                            </div>
                        </button>

                        {/* Card 2: Form B */}
                        <button
                            type="button"
                            onClick={() => setReviewType("B")}
                            className={`text-left p-3.5 sm:p-5 rounded-[20px] sm:rounded-[24px] border-2 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center group relative overflow-hidden ${
                                reviewType === "B"
                                    ? "bg-blue-500/5 dark:bg-blue-500/10 border-blue-500 shadow-md"
                                    : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 hover:border-blue-500/40"
                            }`}
                        >
                            <div className={`w-9 sm:w-12 h-9 sm:h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                reviewType === "B"
                                    ? "bg-blue-500 text-white"
                                    : "bg-slate-100 dark:bg-slate-900 text-slate-400 group-hover:bg-blue-500/10 group-hover:text-blue-500"
                            }`}>
                                <Video className="w-4 h-4 sm:w-6 sm:h-6" />
                            </div>
                            <div>
                                <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-blue-550 dark:text-blue-400">Form B Review</div>
                                <h4 className="text-xs sm:text-sm font-extrabold mt-0.5 sm:mt-1 text-slate-900 dark:text-white truncate">Teaching Observation</h4>
                                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 leading-snug font-medium line-clamp-2">Classroom pacing & slides.</p>
                            </div>
                        </button>

                        {/* Card 3: Form C */}
                        <button
                            type="button"
                            onClick={() => setReviewType("C")}
                            className={`text-left p-3.5 sm:p-5 rounded-[20px] sm:rounded-[24px] border-2 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center group relative overflow-hidden col-span-2 md:col-span-1 ${
                                reviewType === "C"
                                    ? "bg-purple-500/5 dark:bg-purple-500/10 border-purple-500 shadow-md"
                                    : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 hover:border-purple-500/40"
                            }`}
                        >
                            <div className={`w-9 sm:w-12 h-9 sm:h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                reviewType === "C"
                                    ? "bg-purple-500 text-white"
                                    : "bg-slate-100 dark:bg-slate-900 text-slate-400 group-hover:bg-purple-500/10 group-hover:text-purple-500"
                            }`}>
                                <ShieldCheck className="w-4 h-4 sm:w-6 sm:h-6" />
                            </div>
                            <div>
                                <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-purple-550 dark:text-purple-400">Form C Moderation</div>
                                <h4 className="text-xs sm:text-sm font-extrabold mt-0.5 sm:mt-1 text-slate-900 dark:text-white truncate">Exam Moderation</h4>
                                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 leading-snug font-medium line-clamp-2">Question paper vetting & mark scheme.</p>
                            </div>
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Dispatch Form */}
                        <div className="rounded-3xl p-6 shadow-sm border" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                                <h3 className="font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                                    <Plus className="w-5 h-5 text-blue-500" /> Dispatch Review
                                </h3>
                                {selectedCourseObj && (
                                    <div className="flex flex-wrap items-center gap-2">
                                        {selectedCourseObj.domain && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                <Tag className="w-3.5 h-3.5 text-blue-500" />
                                                <span>Domain: {selectedCourseObj.domain}</span>
                                            </span>
                                        )}
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                            <ShieldCheck className="w-3.5 h-3.5" /> Same-Department Filter Active
                                        </span>
                                    </div>
                                )}
                            </div>
                            
                            {(() => {
                                const existingSameReview = (form.courseCode && form.lecturerId) ? assignments.find(a => 
                                    a.formType === reviewType && 
                                    a.courseCode === form.courseCode && 
                                    (String(a.lecturer?.id) === form.lecturerId || String(a.lecturerId) === form.lecturerId)
                                ) : null;

                                const otherActiveReviews = (form.courseCode && form.lecturerId) ? assignments.filter(a =>
                                    a.courseCode === form.courseCode &&
                                    (String(a.lecturer?.id) === form.lecturerId || String(a.lecturerId) === form.lecturerId) &&
                                    a.formType !== reviewType
                                ) : [];

                                return (
                                    <>
                                        {existingSameReview && (
                                            <div className="mb-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-medium flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <strong className="font-bold">Review Already Dispatched:</strong> {form.courseCode} with {existingSameReview.lecturer?.name || "this lecturer"} already has an active <strong>{reviewType === "A" ? "Form A (Instructional Materials Audit)" : reviewType === "B" ? "Form B (Teaching Observation)" : "Form C (Exam Moderation)"}</strong> assigned to <strong>{existingSameReview.observer?.name || existingSameReview.moderator?.name || "Assigned Colleague"}</strong>. Duplicate assignment is blocked.
                                                </div>
                                            </div>
                                        )}

                                        {!existingSameReview && otherActiveReviews.length > 0 && (
                                            <div className="mb-4 p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-300 text-xs font-medium flex items-center gap-2.5 animate-in fade-in">
                                                <Info className="w-4 h-4 text-blue-500 shrink-0" />
                                                <span>
                                                    <strong>Active Reviews on Course:</strong> This lecturer already has {otherActiveReviews.map(r => `Form ${r.formType} (${r.typeName})`).join(", ")} scheduled for {form.courseCode}.
                                                </span>
                                            </div>
                                        )}

                                        <form onSubmit={assign} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Course Code</label>
                                                <SearchableSelect
                                                    value={form.courseCode}
                                                    onChange={(val) => setForm(p => ({ ...p, courseCode: String(val) }))}
                                                    options={courses.map(c => ({ label: `${c.code} - ${c.title}`, value: c.code }))}
                                                    placeholder="Search Course..."
                                                />
                                            </div>

                                            <div className="relative">
                                                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>{reviewType === "C" ? "Internal Examiner" : "Lecturer to Observe"}</label>
                                                <SearchableSelect
                                                    value={form.lecturerId}
                                                    onChange={(val) => setForm(p => ({ ...p, lecturerId: String(val) }))}
                                                    options={targetLecturerOptions}
                                                    placeholder={form.courseCode ? "Select lecturer..." : "Select Course first..."}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider mb-2 flex items-center justify-between" style={{ color: "var(--text-muted)" }}>
                                                    <span>{partnerLabel}</span>
                                                    {partnerOptions.some(o => o.isDomainMatch) && (
                                                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5">
                                                            <Sparkles className="w-3 h-3" /> Domain Match Available
                                                        </span>
                                                    )}
                                                </label>
                                                <SearchableSelect
                                                    value={form.observerId}
                                                    onChange={(val) => setForm(p => ({ ...p, observerId: String(val) }))}
                                                    options={partnerOptions}
                                                    placeholder={`Select ${reviewType === "C" ? "Moderator" : "Observer"}...`}
                                                    disabledValues={form.lecturerId ? [form.lecturerId] : []}
                                                />
                                            </div>

                                            <button 
                                                type="submit" 
                                                disabled={isSubmitting || !form.courseCode || !form.lecturerId || !form.observerId || Boolean(existingSameReview)} 
                                                className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex justify-center items-center gap-2 h-[42px]" 
                                                style={{ backgroundColor: "var(--primary)", boxShadow: "0 8px 16px -4px var(--primary-muted)" }}
                                            >
                                                {isSubmitting ? (
                                                    <span className="animate-pulse">Dispatching...</span>
                                                ) : existingSameReview ? (
                                                    <span>Already Dispatched</span>
                                                ) : (
                                                    <span>Assign {reviewType === "A" ? "Form A" : reviewType === "B" ? "Form B" : "Form C"}</span>
                                                )}
                                            </button>
                                        </form>
                                    </>
                                );
                            })()}
                        </div>

                        {/* Registry Column */}
                        <div className="rounded-3xl p-6 shadow-sm border" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-4 border-b" style={{ borderColor: "var(--bg-border)" }}>
                                <div className="flex items-center gap-3">
                                    <h3 className="font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                                        <ClipboardList className="w-5 h-5 text-blue-500" /> Assignments Registry
                                    </h3>
                                    {overdueAssignments.length > 0 && (
                                        <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" />
                                            {overdueAssignments.length} Overdue (&gt;5 days)
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center flex-wrap gap-2.5">
                                    {/* Bulk Nudge Action */}
                                    {pendingAssignments.length > 0 && !isArchiveMode && (
                                        <button
                                            onClick={handleNudgeAllOverdue}
                                            disabled={isNudgingAll}
                                            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                                        >
                                            <BellRing className="w-3.5 h-3.5" />
                                            {isNudgingAll ? "Dispatching Alerts..." : `Nudge All Reviewers (${pendingAssignments.length})`}
                                        </button>
                                    )}

                                    {/* Tabs for Form Types */}
                                    <div className="flex flex-wrap gap-1 p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50">
                                        {[
                                            { id: "ALL", label: "All", icon: null, count: assignments.length },
                                            { id: "A", label: "Form A", icon: BookOpen, count: assignments.filter(o => o.formType === "A").length },
                                            { id: "B", label: "Form B", icon: Video, count: assignments.filter(o => o.formType === "B").length },
                                            { id: "C", label: "Form C", icon: ShieldCheck, count: assignments.filter(o => o.formType === "C").length },
                                        ].map((t) => {
                                            const Icon = t.icon;
                                            const isActive = activeTab === t.id;
                                            return (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => setActiveTab(t.id as any)}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                                                        isActive
                                                            ? "bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white"
                                                            : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                                                    }`}
                                                >
                                                    {Icon && <Icon className="w-3 h-3" />}
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
                            </div>
                            
                            {loading ? (
                                <RegistrySkeleton />
                            ) : assignments.length === 0 ? (
                                <div className="text-center py-20" style={{ color: "var(--text-muted)" }}>
                                    <div className="flex justify-center mb-4"><Inbox className="w-10 h-10 text-gray-400" /></div>
                                    <p>No reviews assigned yet.</p>
                                </div>
                            ) : assignments.filter(o => activeTab === "ALL" || o.formType === activeTab).length === 0 ? (
                                <div className="text-center py-20" style={{ color: "var(--text-muted)" }}>
                                    <div className="flex justify-center mb-4"><Inbox className="w-10 h-10 text-gray-400" /></div>
                                    <p>No {activeTab === "A" ? "Instructional Materials" : activeTab === "B" ? "Teaching Observation" : "Exam Moderation"} reviews assigned yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {assignments
                                        .filter(o => activeTab === "ALL" || o.formType === activeTab)
                                        .map(o => {
                                            const days = getDaysElapsed(o.createdAt);
                                            const isPending = o.status === "PENDING";
                                            const isNudging = nudgingId === `${o.formType}-${o.id}`;

                                            return (
                                                <div key={`${o.formType}-${o.id}`} className="group p-4 rounded-2xl transition-all hover:shadow-md border" style={{ backgroundColor: "var(--bg-hover)", borderColor: "var(--bg-border)" }}>
                                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
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
                                                                {/* Form Name & Type */}
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

                                                                    {isPending && days >= 5 && (
                                                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1">
                                                                            <Clock className="w-2.5 h-2.5 shrink-0" />
                                                                            <span>{days}d overdue</span>
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {/* Course & Status */}
                                                                <div className="font-bold text-base mt-1 flex items-center flex-wrap gap-2.5" style={{ color: "var(--text-primary)" }}>
                                                                    <span className="font-black text-blue-600 dark:text-blue-400">{o.courseCode}</span>
                                                                    {(getCourseTitle(o.courseCode) || courses.find(c => c.code === o.courseCode)?.title) && (
                                                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                                            — {getCourseTitle(o.courseCode) || courses.find(c => c.code === o.courseCode)?.title}
                                                                        </span>
                                                                    )}
                                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${statusColors[o.status]}`}>
                                                                        {o.status}
                                                                    </span>
                                                                </div>

                                                                {/* Target & Assigned Partners */}
                                                                <div className="flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-0.5 mt-2 text-xs">
                                                                    <div style={{ color: "var(--text-secondary)" }}>
                                                                        Target: <span className="font-bold text-slate-900 dark:text-white">{o.lecturer?.name}</span>
                                                                    </div>
                                                                    <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
                                                                    <div style={{ color: "var(--text-muted)" }}>
                                                                        Assigned: <span className="font-semibold text-slate-700 dark:text-slate-300">{o.formType === "C" ? o.moderator?.name : o.observer?.name}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                                            {isPending && !isArchiveMode && (
                                                                <button
                                                                    onClick={() => handleNudgeReviewer(o.formType, o.id)}
                                                                    disabled={isNudging}
                                                                    className="px-3 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                                                                    title="Send notification nudge to the assigned reviewer"
                                                                >
                                                                    <BellRing className="w-3.5 h-3.5" />
                                                                    {isNudging ? "Nudging..." : "Send Nudge"}
                                                                </button>
                                                            )}

                                                            <button 
                                                                onClick={() => router.push(getRoute(o.formType, o.id))}
                                                                className="px-4 py-2 rounded-xl text-xs font-bold transition-all border"
                                                                style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)", color: "var(--text-primary)" }}
                                                            >
                                                                View Details →
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
                </div>
            </div>
    );
}
