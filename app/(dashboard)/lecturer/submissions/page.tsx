"use client";
import { useEffect, useState } from "react";
import CalendarView, { WeeklyTopic } from "@/components/ui/CalendarView";

const TOTAL_WEEKS = 18;

interface WeekEntry {
    week: number;
    topic: string;
    description: string;
    status: "planned" | "delivered" | "postponed";
}

const defaultWeeks = (): WeekEntry[] =>
    Array.from({ length: TOTAL_WEEKS }, (_, i) => ({
        week: i + 1,
        topic: "",
        description: "",
        status: "planned",
    }));

const statusConfig = {
    planned: { label: "Planned", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
    delivered: { label: "Delivered", color: "bg-green-500/20 text-green-300 border-green-500/30" },
    postponed: { label: "Postponed", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
};

interface Submission {
    id: number;
    title: string;
    status: string;
    submittedAt: string | null;
    content: string | null;
}

export default function CourseOutlinePage() {
    const [mode, setMode] = useState<"outline" | "weekly">("outline");

    // ── Course Outline fields ──────────────────────────────
    const [outline, setOutline] = useState({
        courseCode: "",
        courseName: "",
        credits: "3",
        semester: "1",
        year: new Date().getFullYear().toString(),
        objectives: "",
        textbook: "",
        assessment: "",
    });

    // ── Weekly Planner ────────────────────────────────────
    const [weeks, setWeeks] = useState<WeekEntry[]>(defaultWeeks());
    const [courseCodeForWeekly, setCourseCodeForWeekly] = useState("");
    const [viewMode, setViewMode] = useState<"edit" | "calendar">("edit");

    // ── Shared state ──────────────────────────────────────
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
    const [history, setHistory] = useState<Submission[]>([]);
    const [expandedWeek, setExpandedWeek] = useState<number | null>(1);

    // Map internal WeekEntry to CalendarView's WeeklyTopic
    const calendarTopics: WeeklyTopic[] = weeks.map(w => ({
        week: w.week,
        title: w.topic,
        description: w.description,
        status: w.status === "planned" ? "PENDING" : w.status === "delivered" ? "COMPLETED" : "IN_PROGRESS"
    }));

    useEffect(() => {
        fetch("/api/submissions")
            .then(r => r.json())
            .then(d => {
                const arr = Array.isArray(d) ? d : [];
                setHistory(arr.filter((s: Submission) =>
                    s.title?.includes("Course Outline") || s.title?.includes("Weekly Topics")
                ));
            });
    }, []);

    function showMsg(text: string, ok: boolean) {
        setMsg({ text, ok });
        setTimeout(() => setMsg(null), 4000);
    }

    function updateWeek(i: number, field: keyof WeekEntry, value: string) {
        setWeeks(prev => prev.map((w, idx) => idx === i ? { ...w, [field]: value } : w));
    }

    async function submitOutline(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        const res = await fetch("/api/submissions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: `Course Outline — ${outline.courseCode} ${outline.courseName}`,
                type: "SEMESTER_CALENDAR",
                content: { ...outline },
            }),
        });
        setSubmitting(false);
        if (res.ok) {
            const newSub = await res.json();
            setHistory(prev => [newSub, ...prev]);
            showMsg("✅ Course outline submitted successfully!", true);
            setOutline({ courseCode: "", courseName: "", credits: "3", semester: "1", year: new Date().getFullYear().toString(), objectives: "", textbook: "", assessment: "" });
        } else {
            showMsg("❌ Submission failed. Please try again.", false);
        }
    }

    async function submitWeeklyTopics(e: React.FormEvent) {
        e.preventDefault();
        const filled = weeks.filter(w => w.topic.trim());
        if (filled.length === 0) { showMsg("❌ Please fill in at least one week's topic.", false); return; }
        setSubmitting(true);
        const res = await fetch("/api/submissions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: `Weekly Topics — ${courseCodeForWeekly || "Course"}`,
                type: "COURSE_TOPICS",
                content: { courseCode: courseCodeForWeekly, weeks },
            }),
        });
        setSubmitting(false);
        if (res.ok) {
            const newSub = await res.json();
            setHistory(prev => [newSub, ...prev]);
            showMsg("✅ Weekly plan submitted successfully!", true);
            setCourseCodeForWeekly("");
            setWeeks(defaultWeeks());
        } else {
            showMsg("❌ Submission failed. Please try again.", false);
        }
    }

    const filled = weeks.filter(w => w.topic.trim()).length;

    return (
        <div className="max-w-6xl mx-auto animate-in fade-in duration-400">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white tracking-tight">Academic Planning</h1>
                <p className="text-white/50 mt-1">Submit your course outline or weekly topic plan for the semester</p>
            </div>

            {/* Mode Switcher */}
            <div className="flex gap-1 p-1 bg-white/5 rounded-2xl mb-8 w-fit border border-white/10">
                <button
                    onClick={() => setMode("outline")}
                    className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${mode === "outline" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25" : "text-white/50 hover:text-white"}`}
                >
                    📋 Course Outline
                </button>
                <button
                    onClick={() => setMode("weekly")}
                    className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${mode === "weekly" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25" : "text-white/50 hover:text-white"}`}
                >
                    📅 Weekly Topics
                </button>
            </div>

            {/* Feedback message */}
            {msg && (
                <div className={`mb-6 p-4 rounded-2xl text-sm border ${msg.ok ? "bg-green-500/10 border-green-500/30 text-green-300" : "bg-red-500/10 border-red-500/30 text-red-300"}`}>
                    {msg.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ─── COURSE OUTLINE FORM ─── */}
                {mode === "outline" && (
                    <div className="lg:col-span-2">
                        <form onSubmit={submitOutline} className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
                            <h2 className="text-white font-bold text-lg flex items-center gap-2">
                                <span className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-300">📋</span>
                                Course Outline Form
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Course Code *</label>
                                    <input value={outline.courseCode} onChange={e => setOutline({ ...outline, courseCode: e.target.value })} required
                                        placeholder="e.g. CS301"
                                        className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Course Name *</label>
                                    <input value={outline.courseName} onChange={e => setOutline({ ...outline, courseName: e.target.value })} required
                                        placeholder="e.g. Data Structures & Algorithms"
                                        className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Credit Hours</label>
                                    <select value={outline.credits} onChange={e => setOutline({ ...outline, credits: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                                        {["1", "2", "3", "4", "6"].map(v => <option key={v} value={v}>{v} Credits</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Semester</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <select value={outline.semester} onChange={e => setOutline({ ...outline, semester: e.target.value })}
                                            className="px-4 py-3 rounded-xl bg-slate-900/60 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                                            <option value="1">Semester 1</option>
                                            <option value="2">Semester 2</option>
                                            <option value="3">Short Sem</option>
                                        </select>
                                        <input type="number" value={outline.year} onChange={e => setOutline({ ...outline, year: e.target.value })}
                                            min="2024" max="2030"
                                            className="px-4 py-3 rounded-xl bg-slate-900/60 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Course Objectives *</label>
                                <textarea value={outline.objectives} onChange={e => setOutline({ ...outline, objectives: e.target.value })} required rows={4}
                                    placeholder="List the main learning objectives of this course, one per line..."
                                    className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Primary Textbook</label>
                                    <input value={outline.textbook} onChange={e => setOutline({ ...outline, textbook: e.target.value })}
                                        placeholder="Author, Title, Edition, Year"
                                        className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Assessment Breakdown</label>
                                    <input value={outline.assessment} onChange={e => setOutline({ ...outline, assessment: e.target.value })}
                                        placeholder="e.g. Assignments 30%, Midterm 30%, Final 40%"
                                        className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                                </div>
                            </div>

                            <button type="submit" disabled={submitting}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 flex items-center justify-center gap-2">
                                {submitting ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Submitting...</> : "Submit Course Outline"}
                            </button>
                        </form>
                    </div>
                )}

                {/* ─── WEEKLY TOPICS FORM ─── */}
                {mode === "weekly" && (
                    <div className="lg:col-span-2">
                        <form onSubmit={submitWeeklyTopics} className="space-y-4">
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Course Code *</label>
                                    <input value={courseCodeForWeekly} onChange={e => setCourseCodeForWeekly(e.target.value)} required
                                        placeholder="e.g. CS301"
                                        className="w-full sm:w-48 px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <div className="text-white/30 text-xs">{filled} / {TOTAL_WEEKS} weeks filled</div>
                                    <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
                                        <div className="h-full bg-indigo-500 transition-all duration-300 rounded-full" style={{ width: `${(filled / TOTAL_WEEKS) * 100}%` }} />
                                    </div>
                                    <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/10">
                                        <button type="button" onClick={() => setViewMode("edit")} className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${viewMode === "edit" ? "bg-indigo-500 text-white" : "text-white/40 hover:text-white"}`}>Edit</button>
                                        <button type="button" onClick={() => setViewMode("calendar")} className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${viewMode === "calendar" ? "bg-indigo-500 text-white" : "text-white/40 hover:text-white"}`}>Calendar</button>
                                    </div>
                                </div>
                            </div>

                            {viewMode === "calendar" ? (
                                <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6">
                                    <CalendarView
                                        topics={calendarTopics}
                                        onTopicClick={(topic) => {
                                            setExpandedWeek(topic.week);
                                            setViewMode("edit");
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {weeks.map((w, i) => (
                                        <div key={w.week} className={`border rounded-2xl overflow-hidden transition-all duration-200 ${expandedWeek === w.week ? "border-indigo-500/40 bg-indigo-500/5" : "border-white/8 bg-white/3 hover:border-white/15"}`}>
                                            <button type="button"
                                                onClick={() => setExpandedWeek(expandedWeek === w.week ? null : w.week)}
                                                className="w-full flex items-center gap-4 px-5 py-4 text-left">
                                                <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${w.topic ? "bg-indigo-500/30 text-indigo-300" : "bg-white/5 text-white/30"}`}>
                                                    {w.week}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <div className={`font-medium text-sm truncate ${w.topic ? "text-white" : "text-white/30"}`}>
                                                        {w.topic || "Click to add topic for this week"}
                                                    </div>
                                                    {w.description && <div className="text-white/30 text-[11px] truncate mt-0.5">{w.description}</div>}
                                                </div>
                                                {w.topic && (
                                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${statusConfig[w.status].color}`}>
                                                        {statusConfig[w.status].label}
                                                    </span>
                                                )}
                                                <svg className={`w-4 h-4 text-white/30 flex-shrink-0 transition-transform ${expandedWeek === w.week ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                            {expandedWeek === w.week && (
                                                <div className="px-5 pb-5 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div className="sm:col-span-2">
                                                        <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5">Week {w.week} Topic *</label>
                                                        <input value={w.topic} onChange={e => updateWeek(i, "topic", e.target.value)}
                                                            placeholder={`e.g. Introduction to ${w.week === 1 ? "the Course" : "Advanced Concepts"}`}
                                                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5">Details / Sub-topics</label>
                                                        <textarea value={w.description} onChange={e => updateWeek(i, "description", e.target.value)} rows={2}
                                                            placeholder="Key points, lab exercises, readings..."
                                                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm resize-none" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5">Status</label>
                                                        <select value={w.status} onChange={e => updateWeek(i, "status", e.target.value)}
                                                            className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm">
                                                            <option value="planned">Planned</option>
                                                            <option value="delivered">Delivered</option>
                                                            <option value="postponed">Postponed</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {viewMode === "edit" && (
                                <button type="submit" disabled={submitting}
                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
                                    {submitting ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Submitting...</> : `Submit Weekly Plan (${filled} weeks)`}
                                </button>
                            )}
                        </form>
                    </div>
                )}

                {/* Right column: Submission History */}
                <div className="lg:col-span-1">
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sticky top-8">
                        <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
                            <span className="text-indigo-400">📜</span> Submission History
                        </h3>
                        {history.length === 0 ? (
                            <div className="text-center py-10 text-white/20">
                                <div className="text-4xl mb-3">📄</div>
                                <p className="text-sm">No submissions yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {history.slice(0, 8).map(s => (
                                    <div key={s.id} className="p-4 rounded-2xl bg-white/3 border border-white/5 hover:bg-white/5 transition">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <div className="text-white font-medium text-sm truncate">{s.title}</div>
                                                <div className="text-white/30 text-[11px] mt-0.5">{s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : "Draft"}</div>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${s.status === "SUBMITTED" ? "bg-green-500/20 text-green-300" : "bg-yellow-500/20 text-yellow-300"}`}>
                                                {s.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
