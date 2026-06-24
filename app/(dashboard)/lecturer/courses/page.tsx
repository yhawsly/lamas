"use client";

import useSWR from "swr";
import Link from "next/link";
import Loader from "@/components/ui/Loader";

export default function LecturerCoursesPage() {
    const { data, error: swrError, mutate } = useSWR("/api/courses/my-sections", (url) =>
        fetch(url).then(async (r) => {
            if (!r.ok) {
                const d = await r.json().catch(() => ({}));
                throw new Error(d.error || "Failed to load courses");
            }
            return r.json();
        })
    );

    const courses = data?.courses || [];
    const loading = !data && !swrError;
    const error = swrError?.message || "";

    if (loading) return <Loader message="Loading your courses..." />;

    return (
        <div className="max-w-6xl mx-auto p-6 md:p-10 animate-in fade-in duration-500">
            {/* Header */}
            <div className="mb-10">
                <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight" style={{ color: "var(--primary)", opacity: 0.9 }}>
                    Syllabus Submissions
                </h1>
                <p className="text-lg" style={{ color: "var(--text-muted)" }}>
                    Draft, import, validate, and manage your semester plan outlines.
                </p>
            </div>

            {/* Info Banner */}
            <div className="mb-10 p-6 rounded-2xl flex gap-4 items-start shadow-sm" style={{ backgroundColor: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
                <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-white shadow-sm mt-0.5" style={{ backgroundColor: "var(--primary)" }}>
                    i
                </div>
                <div>
                    <h3 className="font-bold text-[15px] mb-1.5" style={{ color: "var(--primary)" }}>Unified Course Workspaces</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        LAMAS now uses integrated workspaces for syllabus draft preparation. Select one of your assigned courses below to manage the course topics, outcomes, grading weights registry, weekly outlines, and approvals in a single place.
                    </p>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="mb-8 p-5 rounded-2xl border flex gap-4 items-start" style={{ backgroundColor: "rgba(239,68,68,0.07)", borderColor: "rgba(239,68,68,0.2)", color: "#ef4444" }}>
                    <span className="text-xl mt-0.5">⚠️</span>
                    <div>
                        <p className="font-bold mb-1">Could not load courses</p>
                        <p className="text-sm opacity-80">{error}</p>
                        <button
                            onClick={() => mutate()}
                            className="mt-3 px-4 py-1.5 text-xs font-bold rounded-lg border border-red-400/30 hover:bg-red-500/10 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            )}

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Course Workspaces */}
                <div className="lg:col-span-2 space-y-5">
                    <h2 className="text-xl font-bold flex items-center gap-3" style={{ color: "var(--text-primary)" }}>
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 shadow-sm">
                            📚
                        </span>
                        Select Course Workspace
                    </h2>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
                        {!error && courses.length === 0 ? (
                            <div className="text-center py-16 space-y-3">
                                <div className="text-5xl mb-4">🎓</div>
                                <p className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>No Courses Assigned Yet</p>
                                <p className="text-sm max-w-sm mx-auto" style={{ color: "var(--text-muted)" }}>
                                    Your department HOD hasn&apos;t assigned any course sections to you yet. Please contact your Head of Department.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {courses.map(({ course, sections, activeTerm }: any) => (
                                    <Link
                                        href={`/lecturer/courses/${course.id}`}
                                        key={course.id}
                                        className="block border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-blue-400 hover:shadow-md transition-all group"
                                        style={{ backgroundColor: "var(--bg-surface)" }}
                                    >
                                        <div>
                                            <div className="mb-3 flex items-center justify-between">
                                                <span className="px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest" style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", color: "var(--primary)" }}>
                                                    {course.code}
                                                </span>
                                                {activeTerm && (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                        Active Term
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-lg font-bold mb-1 leading-snug group-hover:text-blue-600 transition-colors" style={{ color: "var(--text-primary)" }}>
                                                {course.title}
                                            </h3>
                                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                                                {course.credits} Credits
                                            </p>
                                            <div className="mt-3 flex flex-wrap gap-1.5">
                                                {sections.map((sec: any) => (
                                                    <span
                                                        key={sec.id}
                                                        className="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider"
                                                        style={{
                                                            backgroundColor: sec.session === "WEEKEND" ? "rgba(245,158,11,0.08)" : "rgba(59,130,246,0.08)",
                                                            borderColor: sec.session === "WEEKEND" ? "rgba(245,158,11,0.2)" : "rgba(59,130,246,0.2)",
                                                            color: sec.session === "WEEKEND" ? "#d97706" : "var(--primary)"
                                                        }}
                                                    >
                                                        {sec.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center justify-between text-sm font-bold w-full transition-colors" style={{ color: "var(--primary)" }}>
                                                <span>Open Planner Workspace</span>
                                                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Stats / Info */}
                <div className="lg:col-span-1 space-y-5">
                    <h2 className="text-xl font-bold flex items-center gap-3" style={{ color: "var(--text-primary)" }}>
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-orange-50 dark:bg-orange-900/20 shadow-sm">
                            📊
                        </span>
                        Workload Summary
                    </h2>

                    <div className="rounded-3xl p-6 shadow-sm space-y-4" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Total Courses</span>
                            <span className="text-xl font-black" style={{ color: "var(--primary)" }}>{courses.length}</span>
                        </div>
                        <div className="h-px" style={{ backgroundColor: "var(--bg-border)" }} />
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Active Term Courses</span>
                            <span className="text-xl font-black text-emerald-500">{courses.filter((c: any) => c.activeTerm).length}</span>
                        </div>
                        <div className="h-px" style={{ backgroundColor: "var(--bg-border)" }} />
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Total Sections</span>
                            <span className="text-xl font-black text-amber-500">
                                {courses.reduce((sum: number, c: any) => sum + (c.sections?.length || 0), 0)}
                            </span>
                        </div>
                    </div>

                    {/* Help Card */}
                    <div className="rounded-3xl p-6 shadow-sm" style={{ backgroundColor: "rgba(59,130,246,0.04)", border: "1px solid rgba(59,130,246,0.15)" }}>
                        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--primary)" }}>Need Help?</p>
                        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                            If your courses aren&apos;t showing, contact your HOD to ensure you are assigned to the correct course sections for the active academic term.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
