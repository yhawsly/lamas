"use client";
import { Plus, ClipboardList, Inbox, BookOpen, Video, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { useRouter } from "next/navigation";
import { useTerm } from "@/context/TermContext";

const RegistrySkeleton = () => (
    <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-2xl border bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800/60">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                        <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                                <div className="h-4.5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
                            </div>
                            <div className="h-3 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
                            <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right space-y-1">
                            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                        </div>
                        <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

export default function DeoDashboard() {
    const router = useRouter();
    const { selectedTermId, isArchiveMode } = useTerm();
    const [assignments, setAssignments] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [lecturers, setLecturers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Form State
    const [reviewType, setReviewType] = useState<"A" | "B" | "C">("A");
    const [form, setForm] = useState({ lecturerId: "", observerId: "", courseCode: "" });
    const [msg, setMsg] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<"ALL" | "A" | "B" | "C">("ALL");

    useEffect(() => {
        loadData();
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
            } else {
                setForm(p => ({ ...p, lecturerId: "" }));
            }
        }
    }, [form.courseCode, courses]);

    const loadData = async () => {
        setLoading(true);
        try {
            const termParam = selectedTermId ? `?termId=${selectedTermId}` : "";
            const termLimitParam = selectedTermId ? `?termId=${selectedTermId}&limit=100` : "?limit=100";

            const [obsRes, teachRes, modRes, coursesData, lecturersData] = await Promise.all([
                fetch(`/api/observations${termLimitParam}`).then(r => r.json()),
                fetch(`/api/teaching-observations${termParam}`).then(r => r.json()),
                fetch(`/api/moderations${termParam}`).then(r => r.json()),
                fetch("/api/courses").then(r => r.json()),
                fetch("/api/lecturers").then(r => r.json())
            ]);

            setCourses(Array.isArray(coursesData) ? coursesData : []);
            setLecturers(Array.isArray(lecturersData) ? lecturersData : []);

            const obs = (obsRes.data || (Array.isArray(obsRes) ? obsRes : [])).map((o: any) => ({ ...o, formType: "A", typeName: "Instructional Materials" }));
            const teach = (Array.isArray(teachRes) ? teachRes : []).map((o: any) => ({ ...o, formType: "B", typeName: "Teaching Observation" }));
            const mod = (Array.isArray(modRes) ? modRes : []).map((o: any) => ({ ...o, formType: "C", typeName: "Exam Moderation", observerId: o.moderatorId }));

            setAssignments([...obs, ...teach, ...mod].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch (err) {
            console.error("Failed to load data:", err);
        } finally {
            setLoading(false);
        }
    };

    async function assign(e: React.FormEvent) {
        e.preventDefault();
        if (isArchiveMode) {
            setMsg("❌ Action Disabled: You are currently viewing a read-only historical archive.");
            setTimeout(() => setMsg(""), 4000);
            return;
        }
        setIsSubmitting(true);
        
        let endpoint = "";
        const body: any = { 
            courseCode: form.courseCode, 
            lecturerId: parseInt(form.lecturerId),
            termId: selectedTermId,
        };

        if (reviewType === "A") {
            endpoint = "/api/observations";
            body.observerId = parseInt(form.observerId);
        } else if (reviewType === "B") {
            endpoint = "/api/teaching-observations";
            body.observerId = parseInt(form.observerId);
        } else if (reviewType === "C") {
            endpoint = "/api/moderations";
            body.moderatorId = parseInt(form.observerId);
        }

        try {
            const res = await fetch(endpoint, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (res.ok) { 
                setMsg("✅ Review assigned successfully!"); 
                setForm({ lecturerId: "", observerId: "", courseCode: "" }); 
                loadData();
            } else { 
                const errData = await res.json().catch(() => ({}));
                setMsg(`❌ ${errData.error || "Failed to assign."}`); 
            }
        } catch {
            setMsg("❌ Network error.");
        } finally {
            setIsSubmitting(false);
            setTimeout(() => setMsg(""), 3000);
        }
    }

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

    const partnerLabel = reviewType === "C" ? "Assigned Moderator" : "Assigned Observer";
    const selectedCourseObj = courses.find(c => c.code === form.courseCode);

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">DEO Dispatch Dashboard</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Centralized dispatch for peer reviews, teaching observations, and moderations.</p>
            </div>

            {/* 3 Clickable Horizontal Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                {/* Card 1: Form A */}
                <button
                    type="button"
                    onClick={() => setReviewType("A")}
                    className={`text-left p-5 rounded-[24px] border-2 transition-all duration-200 cursor-pointer flex gap-4 items-center group relative overflow-hidden ${
                        reviewType === "A"
                            ? "bg-amber-500/5 dark:bg-amber-500/10 border-amber-500 shadow-md"
                            : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 hover:border-amber-500/40"
                    }`}
                >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        reviewType === "A"
                            ? "bg-amber-500 text-white"
                            : "bg-slate-100 dark:bg-slate-900 text-slate-400 group-hover:bg-amber-500/10 group-hover:text-amber-500"
                    }`}>
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-amber-550 dark:text-amber-400">Form A Audit</div>
                        <h4 className="text-sm font-extrabold mt-1 text-slate-900 dark:text-white">Instructional Materials</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug font-medium">Syllabus outlines, textbook relevance, notes audit.</p>
                    </div>
                </button>

                {/* Card 2: Form B */}
                <button
                    type="button"
                    onClick={() => setReviewType("B")}
                    className={`text-left p-5 rounded-[24px] border-2 transition-all duration-200 cursor-pointer flex gap-4 items-center group relative overflow-hidden ${
                        reviewType === "B"
                            ? "bg-blue-500/5 dark:bg-blue-500/10 border-blue-500 shadow-md"
                            : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 hover:border-blue-500/40"
                    }`}
                >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        reviewType === "B"
                            ? "bg-blue-500 text-white"
                            : "bg-slate-100 dark:bg-slate-900 text-slate-400 group-hover:bg-blue-500/10 group-hover:text-blue-500"
                    }`}>
                        <Video className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-blue-550 dark:text-blue-400">Form B Review</div>
                        <h4 className="text-sm font-extrabold mt-1 text-slate-900 dark:text-white">Teaching Observation</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug font-medium">Classroom pacing, slides structure, student dialogue.</p>
                    </div>
                </button>

                {/* Card 3: Form C */}
                <button
                    type="button"
                    onClick={() => setReviewType("C")}
                    className={`text-left p-5 rounded-[24px] border-2 transition-all duration-200 cursor-pointer flex gap-4 items-center group relative overflow-hidden ${
                        reviewType === "C"
                            ? "bg-purple-500/5 dark:bg-purple-500/10 border-purple-500 shadow-md"
                            : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 hover:border-purple-500/40"
                    }`}
                >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        reviewType === "C"
                            ? "bg-purple-500 text-white"
                            : "bg-slate-100 dark:bg-slate-900 text-slate-450 dark:text-slate-400 group-hover:bg-purple-500/10 group-hover:text-purple-500"
                    }`}>
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-purple-550 dark:text-purple-400">Form C Moderation</div>
                        <h4 className="text-sm font-extrabold mt-1 text-slate-900 dark:text-white">Exam Moderation</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug font-medium">Marking rubrics, Bloom taxonomy, question feasibility.</p>
                    </div>
                </button>
            </div>
                   <div className="space-y-6">
                {/* Form Creation Column */}
                <div className="rounded-3xl p-6 shadow-sm border" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                    <h3 className="font-semibold mb-6 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                        <Plus className="w-5 h-5 text-blue-500" /> Dispatch Review
                    </h3>
                    
                    {msg && (
                        <div className={`mb-6 p-3 rounded-xl text-sm border`} style={{ 
                            backgroundColor: msg.startsWith("✅") ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", 
                            borderColor: msg.startsWith("✅") ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)", 
                            color: msg.startsWith("✅") ? "#10b981" : "#ef4444" 
                        }}>
                            {msg}
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
                                options={
                                    form.courseCode
                                        ? selectedCourseObj && selectedCourseObj.sections.some((s: any) => s.lecturerId)
                                            ? lecturers
                                                .filter(l => selectedCourseObj.sections.some((s: any) => s.lecturerId === l.id))
                                                .map(l => ({ label: `${l.name} (${l.email})`, value: String(l.id) }))
                                            : lecturers.map(l => ({ label: `${l.name} (${l.email})`, value: String(l.id) }))
                                        : []
                                }
                                placeholder={form.courseCode ? "Select target..." : "Select Course first..."}
                                disabled={!form.courseCode}
                            />
                            {form.courseCode && selectedCourseObj && !selectedCourseObj.sections.some((s: any) => s.lecturerId) && (
                                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-1.5 absolute top-full left-0 w-max">
                                    ⚠️ No lecturers officially assigned to this course yet.
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>{partnerLabel}</label>
                            <SearchableSelect
                                value={form.observerId}
                                onChange={(val) => setForm(p => ({ ...p, observerId: String(val) }))}
                                options={lecturers.map(l => ({ label: `${l.name} (${l.email})`, value: String(l.id) }))}
                                placeholder={`Select ${reviewType === "C" ? "Moderator" : "Observer"}...`}
                                disabledValues={form.lecturerId ? [form.lecturerId] : []}
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSubmitting || !form.courseCode || !form.lecturerId || !form.observerId} 
                            className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex justify-center items-center gap-2 h-[42px]" 
                            style={{ backgroundColor: "var(--primary)", boxShadow: "0 8px 16px -4px var(--primary-muted)" }}
                        >
                            {isSubmitting ? <span className="animate-pulse">Dispatching...</span> : <span>Assign {reviewType === "A" ? "Form A" : reviewType === "B" ? "Form B" : "Form C"}</span>}
                        </button>
                    </form>
                </div>

                {/* Registry Column */}
                <div className="rounded-3xl p-6 shadow-sm border" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-4 border-b" style={{ borderColor: "var(--bg-border)" }}>
                        <h3 className="font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                            <ClipboardList className="w-5 h-5 text-blue-500" /> Assignments Registry
                        </h3>

                        {/* Tabs for Form Types */}
                        <div className="flex flex-wrap gap-1 p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50">
                            {[
                                { id: "ALL", label: "All", icon: null, color: "text-blue-600 dark:text-blue-450", bgActive: "bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white", count: assignments.length },
                                { id: "A", label: "Instructional Materials", icon: BookOpen, color: "text-amber-600 dark:text-amber-450", bgActive: "bg-white dark:bg-slate-800 shadow-sm text-amber-600 dark:text-amber-400", count: assignments.filter(o => o.formType === "A").length },
                                { id: "B", label: "Teaching Observation", icon: Video, color: "text-blue-600 dark:text-blue-450", bgActive: "bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400", count: assignments.filter(o => o.formType === "B").length },
                                { id: "C", label: "Exam Moderation", icon: ShieldCheck, color: "text-purple-600 dark:text-purple-450", bgActive: "bg-white dark:bg-slate-800 shadow-sm text-purple-600 dark:text-purple-400", count: assignments.filter(o => o.formType === "C").length },
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
                                .map(o => (
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

                                                    {/* Course & Status - Secondary Important */}
                                                    <div className="font-bold text-base mt-1 flex items-center gap-3.5" style={{ color: "var(--text-primary)" }}>
                                                        {o.courseCode}
                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${statusColors[o.status]}`}>
                                                            {o.status}
                                                        </span>
                                                    </div>

                                                    {/* Target & Assigned Partners - Details */}
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
                                            <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                                                <div className="text-right hidden sm:block mr-2">
                                                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Dispatched</div>
                                                    <div className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{new Date(o.createdAt).toLocaleDateString()}</div>
                                                </div>
                                                <button 
                                                    onClick={() => router.push(getRoute(o.formType, o.id))}
                                                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all border opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                    style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)", color: "var(--text-primary)" }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--primary)"; e.currentTarget.style.color = "white"; e.currentTarget.style.borderColor = "var(--primary)"; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-surface)"; e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.borderColor = "var(--bg-border)"; }}
                                                >
                                                    View Details →
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
