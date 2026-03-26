"use client";
import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { z } from "zod";
import Pagination from "@/components/ui/Pagination";
import CalendarView, { WeeklyTopic } from "@/components/ui/CalendarView";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { ValidationErrorAlert, parseValidationErrors, ValidationError } from "@/lib/validation-errors";

const DEFAULT_WEEKS = 18;
const DRAFT_KEY_OUTLINE = "lamas_draft_outline";
const DRAFT_KEY_WEEKS = "lamas_draft_weeks";
const DRAFT_KEY_COURSE = "lamas_draft_weekly_course";

interface Session {
    id: string;
    topic: string;
    description: string;
    status: "PLANNED" | "DELIVERED" | "POSTPONED";
}

interface WeekEntry {
    week: number;
    sessions: Session[];
}

const defaultWeeks = (count: number): WeekEntry[] =>
    Array.from({ length: count }, (_, i) => ({
        week: i + 1,
        sessions: [{
            id: Math.random().toString(36).substr(2, 9),
            topic: "",
            description: "",
            status: "PLANNED"
        }]
    }));

interface Submission {
    id: number;
    title: string;
    type: string;
    status: string;
    submittedAt: string | null;
    content: string | null;
}

// Validation schemas
const courseOutlineSchema = z.object({
    courseName: z.string().min(3, "Course name must be at least 3 characters"),
    courseCode: z.string().min(2, "Course code required"),
    credits: z.string(),
    semester: z.string(),
    objectives: z.string().min(10, "Objectives must be at least 10 characters"),
    textbook: z.string().optional(),
    assessment: z.string().optional(),
});

const weeklyTopicSchema = z.object({
    topic: z.string().min(3, "Topic must be at least 3 characters"),
    description: z.string().optional(),
});

interface Course { id: number; code: string; title: string; }

function CourseOutlineContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const mode = (searchParams.get("mode") as "outline" | "weekly") || "outline";

    // Derived state for mode is handled by searchParams directly now

    const changeMode = (newMode: "outline" | "weekly") => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("mode", newMode);
        router.push(`?${params.toString()}`);
    };

    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

    // ── Course list (fetched from API) ─────────────────────
    const [courses, setCourses] = useState<Course[]>([]);

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

    const [weeks, setWeeks] = useState<WeekEntry[]>([]); // Initialized as empty to detect FIRST load
    const [courseCodeForWeekly, setCourseCodeForWeekly] = useState("");
    const courseNameForWeekly = useMemo(() => {
        const match = courses.find(c => c.code === courseCodeForWeekly);
        return match ? match.title : "";
    }, [courses, courseCodeForWeekly]);
    const [viewMode, setViewMode] = useState<"edit" | "calendar">("edit");
    const [activeTerm, setActiveTerm] = useState<{ name: string; startDate: string; endDate: string; totalWeeks: number } | null>(null);

    const totalWeeks = activeTerm?.totalWeeks ?? DEFAULT_WEEKS;

    // ── Shared state ──────────────────────────────────────
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
    const [history, setHistory] = useState<Submission[]>([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [expandedWeek, setExpandedWeek] = useState<number | null>(1);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Map internal WeekEntry to CalendarView's WeeklyTopic
    const calendarTopics: WeeklyTopic[] = weeks.map(w => {
        const total = w.sessions.length;
        const delivered = w.sessions.filter(s => s.status === "DELIVERED").length;
        const postponed = w.sessions.filter(s => s.status === "POSTPONED").length;
        // const filled = w.sessions.filter(s => s.topic.trim()).length; // Unused

        let status: "PENDING" | "COMPLETED" | "IN_PROGRESS" = "PENDING";
        if (delivered === total && total > 0) status = "COMPLETED";
        else if (delivered > 0 || postponed > 0) status = "IN_PROGRESS";

        return {
            week: w.week,
            title: w.sessions[0]?.topic || "",
            description: total > 1 ? `${total} sessions planned` : w.sessions[0]?.description,
            status
        };
    });

    const fetchHistory = (page: number) => {
        fetch(`/api/submissions?page=${page}&limit=5`)
            .then(r => r.ok ? r.json().catch(() => ({ data: [], meta: { totalPages: 1 } })) : ({ data: [], meta: { totalPages: 1 } }))
            .then(d => {
                const arr = Array.isArray((d as any).data) ? (d as any).data : [];
                setHistory(arr.filter((s: Submission) =>
                    s.title?.includes("Course Outline") || s.title?.includes("Weekly Topics") || s.type === "SEMESTER_CALENDAR" || s.type === "COURSE_TOPICS"
                ));
                setPagination({ page, totalPages: (d as any).meta?.totalPages || 1 });
            })
            .catch(() => {
                setHistory([]);
            });
    };

    useEffect(() => {
        fetchHistory(pagination.page);
    }, [pagination.page]);

    const fetchActiveTerm = () => {
        fetch("/api/active-term")
            .then(r => {
                setFetchError(null);
                if (!r.ok) throw new Error("Could not fetch active term");
                return r.json().catch(() => null);
            })
            .then(term => {
                if (term?.totalWeeks) {
                    setActiveTerm(term);
                } else {
                    setWeeks(defaultWeeks(DEFAULT_WEEKS));
                }
            })
            .catch(err => {
                console.error("Term fetch error:", err);
                setFetchError("Database connection interrupted. Using default 18 weeks as fallback.");
                setWeeks(defaultWeeks(DEFAULT_WEEKS));
            });
    };

    // Consolidate draft restoration and weeks adjustment in one place
    useEffect(() => {
        if (!activeTerm) return;

        const savedWeeks = localStorage.getItem(DRAFT_KEY_WEEKS);
        if (savedWeeks && savedWeeks.trim() !== "" && savedWeeks !== "undefined") {
            try {
                const parsed = JSON.parse(savedWeeks);
                let migrated = parsed.map((w: any) => {
                    if (w.topic !== undefined) {
                        return {
                            week: w.week,
                            sessions: [{
                                id: Math.random().toString(36).substr(2, 9),
                                topic: w.topic || "",
                                description: w.description || "",
                                status: w.status || "PLANNED"
                            }]
                        };
                    }
                    return w;
                });

                if (migrated.length !== activeTerm.totalWeeks) {
                    if (migrated.length < activeTerm.totalWeeks) {
                        const extra = Array.from({ length: activeTerm.totalWeeks - migrated.length }, (_, i) => ({
                            week: migrated.length + i + 1,
                            sessions: [{
                                id: Math.random().toString(36).substr(2, 9),
                                topic: "",
                                description: "",
                                status: "PLANNED"
                            }]
                        }));
                        migrated = [...migrated, ...extra];
                    } else {
                        migrated = migrated.slice(0, activeTerm.totalWeeks);
                    }
                }
                // Defer state update to avoid cascading render lint warning
                Promise.resolve().then(() => {
                    setWeeks(migrated);
                });
            } catch {
                Promise.resolve().then(() => {
                    setWeeks(defaultWeeks(activeTerm.totalWeeks));
                });
            }
        } else {
            Promise.resolve().then(() => {
                setWeeks(defaultWeeks(activeTerm.totalWeeks));
            });
        }
    }, [activeTerm]);

    useEffect(() => {
        fetchActiveTerm();

        fetch("/api/courses")
            .then(r => r.ok ? r.json().catch(() => []) : [])
            .then(data => setCourses(Array.isArray(data) ? data : []))
            .catch(() => { });

        // Restore outline draft
        const savedOutline = localStorage.getItem(DRAFT_KEY_OUTLINE);
        if (savedOutline && savedOutline.trim() !== "" && savedOutline !== "undefined") {
            Promise.resolve().then(() => {
                try { setOutline(JSON.parse(savedOutline)); } catch { }
            });
        }

        const savedCourse = localStorage.getItem(DRAFT_KEY_COURSE);
        if (savedCourse) {
            Promise.resolve().then(() => {
                setCourseCodeForWeekly(savedCourse);
            });
        }

        // Only clear loading after we have been able to attempt the fetches
        // We'll give it a tiny buffer for states to settle
        const timer = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    // courseNameForWeekly is now a derived value from useMemo

    // Save outline draft on change
    useEffect(() => {
        localStorage.setItem(DRAFT_KEY_OUTLINE, JSON.stringify(outline));
    }, [outline]);

    // Save weekly draft on change
    useEffect(() => {
        localStorage.setItem(DRAFT_KEY_WEEKS, JSON.stringify(weeks));
    }, [weeks]);

    useEffect(() => {
        localStorage.setItem(DRAFT_KEY_COURSE, courseCodeForWeekly);
    }, [courseCodeForWeekly]);

    // When a course is selected from the dropdown, autofill code + name
    function handleCourseSelect(courseCode: string) {
        const match = courses.find(c => c.code === courseCode);
        if (match) {
            setOutline(prev => ({ ...prev, courseCode: match.code, courseName: match.title }));
        }
    }

    // When code is typed manually, look up + autofill the name
    function handleCodeTyped(code: string) {
        const match = courses.find(c => c.code.toLowerCase() === code.toLowerCase());
        setOutline(prev => ({ ...prev, courseCode: code, courseName: match ? match.title : prev.courseName }));
    }

    // Weekly topics course select
    function handleWeeklyCourseSelect(code: string) {
        setCourseCodeForWeekly(code);
    }

    function showMsg(text: string, ok: boolean) {
        setMsg({ text, ok });
        setTimeout(() => setMsg(null), 4000);
    }

    function updateSession(weekIdx: number, sessionIdx: number, field: keyof Session, value: string) {
        setWeeks(prev => prev.map((w, idx) => {
            if (idx !== weekIdx) return w;
            const newSessions = [...w.sessions];
            newSessions[sessionIdx] = { ...newSessions[sessionIdx], [field]: value as any };
            return { ...w, sessions: newSessions };
        }));
    }

    function addSession(weekIdx: number) {
        setWeeks(prev => prev.map((w, idx) => {
            if (idx !== weekIdx) return w;
            return {
                ...w,
                sessions: [...w.sessions, {
                    id: Math.random().toString(36).substr(2, 9),
                    topic: "",
                    description: "",
                    status: "PLANNED"
                }]
            };
        }));
    }

    function removeSession(weekIdx: number, sessionIdx: number) {
        setWeeks(prev => prev.map((w, idx) => {
            if (idx !== weekIdx || w.sessions.length <= 1) return w;
            return {
                ...w,
                sessions: w.sessions.filter((_, sIdx) => sIdx !== sessionIdx)
            };
        }));
    }

    async function submitOutline(e: React.FormEvent) {
        e.preventDefault();
        setValidationErrors([]);

        // Validate form
        const result = courseOutlineSchema.safeParse(outline);
        if (!result.success) {
            setValidationErrors(parseValidationErrors(result.error));
            return;
        }

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
            localStorage.removeItem(DRAFT_KEY_OUTLINE);
        } else {
            showMsg("❌ Submission failed. Please try again.", false);
        }
    }

    async function submitWeeklyTopics(e: React.FormEvent) {
        e.preventDefault();
        setValidationErrors([]);

        // Validate course info
        if (!courseCodeForWeekly.trim()) {
            setValidationErrors([{ field: "courseCodeForWeekly", message: "Course Code is required for the weekly plan" }]);
            return;
        }
        if (!courseNameForWeekly.trim()) {
            setValidationErrors([{ field: "courseNameForWeekly", message: "Course Name is required for the weekly plan" }]);
            return;
        }

        // Validate at least one session filled in any week
        const filledSessions = weeks.flatMap(w => w.sessions).filter(s => s.topic.trim());
        if (filledSessions.length === 0) {
            setValidationErrors([{ field: "weekly_topics", message: "Please fill in at least one week's topic before submitting." }]);
            return;
        }

        // Validate individual sessions
        for (const week of weeks) {
            for (const session of week.sessions) {
                if (session.topic.trim()) {
                    const result = weeklyTopicSchema.safeParse({ topic: session.topic, description: session.description });
                    if (!result.success) {
                        const errors = parseValidationErrors(result.error);
                        setValidationErrors(errors.map(e => ({ ...e, field: `Week ${week.week} Session: ${e.field}` })));
                        return;
                    }
                }
            }
        }

        setSubmitting(true);
        const res = await fetch("/api/submissions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: `Weekly Topics — ${courseCodeForWeekly} ${courseNameForWeekly}`,
                type: "COURSE_TOPICS",
                content: { courseCode: courseCodeForWeekly, courseName: courseNameForWeekly, weeks },
            }),
        });
        setSubmitting(false);
        if (res.ok) {
            const newSub = await res.json();
            setHistory(prev => [newSub, ...prev]);
            showMsg("✅ Weekly plan submitted successfully!", true);
            setCourseCodeForWeekly("");
            setWeeks(defaultWeeks(totalWeeks));
            localStorage.removeItem(DRAFT_KEY_WEEKS);
            localStorage.removeItem(DRAFT_KEY_COURSE);
        } else {
            showMsg("❌ Submission failed. Please try again.", false);
        }
    }

    const filled = weeks.filter(w => w.sessions.some(s => s.topic.trim())).length;

    if (loading || (mode === "weekly" && weeks.length === 0)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 animate-in fade-in duration-500">
                <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full" />
                <p className="font-medium text-sm" style={{ color: "var(--text-muted)" }}>Preparing your academic planner...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto animate-in fade-in duration-400">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Academic Planning</h1>
                <p className="mt-1" style={{ color: "var(--text-secondary)" }}>Submit your course outline or weekly topic plan for the semester</p>
                {activeTerm && (
                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border" style={{ backgroundColor: "rgba(99, 102, 241, 0.1)", borderColor: "rgba(99, 102, 241, 0.3)", color: "rgb(165, 180, 252)" }}>
                        <span>🗓️</span>
                        <span>{activeTerm.name}</span>
                        <span className="opacity-50">·</span>
                        <span>{totalWeeks} weeks</span>
                        <span className="opacity-50">·</span>
                        <span>{new Date(activeTerm.startDate).toLocaleDateString()} – {new Date(activeTerm.endDate).toLocaleDateString()}</span>
                    </div>
                )}
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
                <div className="mb-6">
                    <ValidationErrorAlert errors={validationErrors} />
                </div>
            )}

            {/* Mode Switcher */}
            <div className="flex gap-1 p-1 rounded-2xl mb-8 w-fit border" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                <button
                    onClick={() => changeMode("outline")}
                    className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${mode === "outline" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25" : "hover:text-blue-300 text-white"}`}
                    style={mode !== "outline" ? { color: "var(--text-secondary)" } : {}}
                >
                    📋 Course Outline
                </button>
                <button
                    onClick={() => changeMode("weekly")}
                    className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${mode === "weekly" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25" : "hover:text-indigo-300 text-white"}`}
                    style={mode !== "weekly" ? { color: "var(--text-secondary)" } : {}}
                >
                    📅 Weekly Topics
                </button>
            </div>

            {fetchError && (
                <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-xl">⚠️</span>
                        <div>
                            <p className="text-sm font-semibold text-amber-200">{fetchError}</p>
                            <p className="text-[11px] text-amber-500/70 text-amber-200">The 18-week limit is a fallback. Please check your connection.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => fetchActiveTerm()}
                        className="px-4 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-bold transition-all"
                    >
                        Retry Connection
                    </button>
                </div>
            )}

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
                        <form onSubmit={submitOutline} className="border rounded-3xl p-8 space-y-6" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                            <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                                <span className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-300">📋</span>
                                Course Outline Form
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Course picker — selects by code+name, autofills both fields */}
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Select Course</label>
                                    <SearchableSelect
                                        value={outline.courseCode}
                                        onChange={val => handleCourseSelect(String(val))}
                                        placeholder="Search by code or name..."
                                        options={courses.map(c => ({ label: `${c.code} — ${c.title}`, value: c.code }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Course Code *</label>
                                    <input value={outline.courseCode} onChange={e => handleCodeTyped(e.target.value)} required
                                        placeholder="e.g. CS301"
                                        className="w-full px-4 py-3 rounded-xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Course Name *</label>
                                    <input value={outline.courseName} onChange={e => setOutline({ ...outline, courseName: e.target.value })} required
                                        placeholder="Auto-filled or type manually"
                                        className="w-full px-4 py-3 rounded-xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Credit Hours</label>
                                    <SearchableSelect
                                        value={outline.credits}
                                        onChange={val => setOutline({ ...outline, credits: String(val) })}
                                        options={["1", "2", "3", "4", "6"].map(v => ({ label: `${v} Credits`, value: v }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Semester</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <SearchableSelect
                                            value={outline.semester}
                                            onChange={val => setOutline({ ...outline, semester: String(val) })}
                                            options={[
                                                { label: "Semester 1", value: "1" },
                                                { label: "Semester 2", value: "2" },
                                                { label: "Short Sem", value: "3" },
                                            ]}
                                        />
                                        <input type="number" value={outline.year} onChange={e => setOutline({ ...outline, year: e.target.value })}
                                            min="2024" max="2030"
                                            className="px-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Course Objectives *</label>
                                <textarea value={outline.objectives} onChange={e => setOutline({ ...outline, objectives: e.target.value })} required rows={4}
                                    placeholder="List the main learning objectives of this course, one per line..."
                                    className="w-full px-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Primary Textbook</label>
                                    <input value={outline.textbook} onChange={e => setOutline({ ...outline, textbook: e.target.value })}
                                        placeholder="Author, Title, Edition, Year"
                                        className="w-full px-4 py-3 rounded-xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Assessment Breakdown</label>
                                    <input value={outline.assessment} onChange={e => setOutline({ ...outline, assessment: e.target.value })}
                                        placeholder="e.g. Assignments 30%, Midterm 30%, Final 40%"
                                        className="w-full px-4 py-3 rounded-xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} />
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
                            <div className="border rounded-3xl p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                                <div className="flex-1 min-w-0 space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Select Course</label>
                                        <SearchableSelect
                                            value={courseCodeForWeekly}
                                            onChange={val => handleWeeklyCourseSelect(String(val))}
                                            placeholder="Search by code or name..."
                                            options={courses.map(c => ({ label: `${c.code} — ${c.title}`, value: c.code }))}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Course Code *</label>
                                            <input value={courseCodeForWeekly} onChange={e => setCourseCodeForWeekly(e.target.value)} required
                                                placeholder="e.g. CS301"
                                                className="w-full px-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Course Name *</label>
                                            <input value={courseNameForWeekly} onChange={() => {}} readOnly
                                                placeholder="Course title"
                                                className="w-full px-4 py-3 rounded-xl text-white opacity-70 cursor-not-allowed" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>{filled} / {totalWeeks} weeks filled</div>
                                    <div className="w-48 h-1.5 rounded-full overflow-hidden mb-2" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)" }}>
                                        <div className="h-full bg-indigo-500 transition-all duration-300 rounded-full" style={{ width: `${(filled / totalWeeks) * 100}%` }} />
                                    </div>
                                    <div className="flex rounded-lg p-0.5 border" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                                        <button type="button" onClick={() => setViewMode("edit")} className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${viewMode === "edit" ? "bg-indigo-500 text-white" : "hover:text-indigo-400 text-white"}`} style={viewMode !== "edit" ? { color: "var(--text-secondary)" } : {}}>Edit</button>
                                        <button type="button" onClick={() => setViewMode("calendar")} className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${viewMode === "calendar" ? "bg-indigo-500 text-white" : "hover:text-indigo-400 text-white"}`} style={viewMode !== "calendar" ? { color: "var(--text-secondary)" } : {}}>Calendar</button>
                                    </div>
                                </div>
                            </div>

                            {viewMode === "calendar" ? (
                                <div className="border rounded-3xl p-6" style={{ backgroundColor: "var(--bg-hover)", borderColor: "var(--bg-border)" }}>
                                    <CalendarView
                                        topics={calendarTopics}
                                        totalWeeks={totalWeeks}
                                        onTopicClick={(topic) => {
                                            setExpandedWeek(topic.week);
                                            setViewMode("edit");
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {weeks.map((w, i) => (
                                        <div key={w.week} className="border rounded-2xl transition-all duration-200" 
                                            style={{ 
                                                borderColor: expandedWeek === w.week ? "rgb(79, 70, 229)" : "var(--bg-border)", 
                                                backgroundColor: expandedWeek === w.week ? "rgb(79, 70, 229, 0.05)" : "var(--bg-hover)",
                                                position: "relative",
                                                zIndex: expandedWeek === w.week ? 50 : 1
                                            }}>
                                            <button type="button"
                                                onClick={() => setExpandedWeek(expandedWeek === w.week ? null : w.week)}
                                                className="w-full flex items-center gap-4 px-5 py-4 text-left">
                                                <span className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                                                    style={{
                                                        backgroundColor: w.sessions.some(s => s.topic.trim()) ? "rgba(79, 70, 229, 0.2)" : "var(--bg-hover)",
                                                        color: w.sessions.some(s => s.topic.trim()) ? "rgb(165, 180, 252)" : "var(--text-muted)",
                                                        border: "1px solid",
                                                        borderColor: w.sessions.some(s => s.topic.trim()) ? "rgba(79, 70, 229, 0.35)" : "var(--bg-border)",
                                                    }}
                                                >
                                                    {w.week}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm truncate" style={{ color: w.sessions.some(s => s.topic.trim()) ? "var(--text-primary)" : "var(--text-muted)" }}>
                                                        {w.sessions[0]?.topic || "Click to add topics for this week"}
                                                        {w.sessions.length > 1 && <span className="ml-2 opacity-50 text-[10px]">(+{w.sessions.length - 1} more)</span>}
                                                    </div>
                                                    {w.sessions[0]?.description && <div className="text-[11px] truncate mt-0.5" style={{ color: "var(--text-muted)" }}>{w.sessions[0]?.description}</div>}
                                                </div>
                                                {w.sessions.some(s => s.topic.trim()) && (
                                                <div className="flex gap-1 flex-wrap overflow-hidden max-h-5 items-center">
                                                    {w.sessions.map((s) => s.topic.trim() && (
                                                        <div key={s.id} className={`w-1.5 h-1.5 rounded-full ${s.status === 'DELIVERED' ? 'bg-green-400' : s.status === 'POSTPONED' ? 'bg-amber-400' : 'bg-blue-400'}`} />
                                                    ))}
                                                </div>
                                                )}
                                                <svg className={`w-4 h-4 flex-shrink-0 transition-transform ${expandedWeek === w.week ? "rotate-180" : ""}`} style={{ color: "var(--text-muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                            {expandedWeek === w.week && (
                                                <div className="px-5 pb-5 pt-0 space-y-4">
                                                    {w.sessions.map((s, sIdx) => (
                                                        <div key={s.id} className="p-4 rounded-xl border relative group" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                                                            {w.sessions.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeSession(i, sIdx)}
                                                                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                                >
                                                                    ×
                                                                </button>
                                                            )}
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                <div className="sm:col-span-2">
                                                                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>
                                                                        Session {sIdx + 1} Topic *
                                                                    </label>
                                                                    <input value={s.topic} onChange={e => updateSession(i, sIdx, "topic", e.target.value)}
                                                                        placeholder="e.g. Lecture or Lab Topic"
                                                                        className="w-full px-4 py-2.5 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>Details</label>
                                                                    <textarea value={s.description} onChange={e => updateSession(i, sIdx, "description", e.target.value)} rows={1}
                                                                        placeholder="Brief details..."
                                                                        className="w-full px-4 py-2.5 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm resize-none" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>Status</label>
                                                                    <SearchableSelect
                                                                        value={s.status}
                                                                        onChange={val => updateSession(i, sIdx, "status", String(val))}
                                                                        searchable={false}
                                                                        options={[
                                                                            { label: "Planned", value: "PLANNED" },
                                                                            { label: "Delivered", value: "DELIVERED" },
                                                                            { label: "Postponed", value: "POSTPONED" },
                                                                        ]}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        onClick={() => addSession(i)}
                                                        className="w-full py-2 rounded-xl border-2 border-dashed border-indigo-500/30 text-indigo-400 text-xs font-bold hover:bg-indigo-500/5 transition-all"
                                                    >
                                                        + Add Another Session for Week {w.week}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {viewMode === "edit" && (
                                <button type="submit" disabled={submitting}
                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
                                    {submitting ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Submitting...</> : `Submit Weekly Plan (${filled}/${totalWeeks} weeks)`}
                                </button>
                            )}
                        </form>
                    </div>
                )}

                {/* Right column: Submission History */}
                <div className="lg:col-span-1">
                    <div className="border rounded-3xl p-6 sticky top-8" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                        <h3 className="font-semibold mb-5 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                            <span className="text-indigo-400">📜</span> Submission History
                        </h3>
                        {history.length === 0 ? (
                            <div className="text-center py-10" style={{ color: "var(--text-muted)" }}>
                                <div className="text-4xl mb-3">📄</div>
                                <p className="text-sm">No submissions yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {history.map(s => (
                                    <div key={s.id} className="p-4 rounded-2xl border transition" style={{ backgroundColor: "var(--bg-hover)", borderColor: "var(--bg-border)" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-surface)"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}>
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <div className="font-medium text-sm truncate" style={{ color: "var(--text-primary)" }}>{s.title}</div>
                                                <div className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : "Draft"}</div>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${s.status === "SUBMITTED" ? "bg-green-500/20 text-green-300" : "bg-yellow-500/20 text-yellow-300"}`}>
                                                {s.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}

                                <Pagination
                                    currentPage={pagination.page}
                                    totalPages={pagination.totalPages}
                                    onPageChange={(p: number) => setPagination(prev => ({ ...prev, page: p }))}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CourseOutlinePage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full" /></div>}>
            <CourseOutlineContent />
        </Suspense>
    );
}
