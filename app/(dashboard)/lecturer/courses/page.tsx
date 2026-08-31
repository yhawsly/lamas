"use client";

import useSWR from "swr";
import Link from "next/link";
import { AlertCircle, BookOpen, GraduationCap, BarChart3 } from "lucide-react";
import RefreshButton from "@/components/ui/RefreshButton";
import { useTerm } from "@/context/TermContext";

export default function LecturerCoursesPage() {
    const { selectedTermId } = useTerm();
    const urlKey = selectedTermId ? `/api/courses/my-sections?termId=${selectedTermId}` : "/api/courses/my-sections";
    const { data, error: swrError, mutate, isValidating } = useSWR(urlKey, (url) =>
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

    // No early Loader return - skeleton will be shown in content grid

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                        Course Workspaces
                    </h1>
                    <p className="text-sm mt-1 max-w-2xl" style={{ color: "var(--text-secondary)" }}>
                        Select an assigned course to manage its weekly topics, learning outcomes, and grading rubrics.
                    </p>
                </div>
                <RefreshButton
                    onClick={() => mutate()}
                    isRefreshing={isValidating}
                    label="Refresh Courses"
                    size="sm"
                    variant="outline"
                    title="Reload assigned courses"
                />
            </div>

            {/* Error State */}
            {error && (
                <div className="mb-8 p-5 rounded-2xl border flex gap-4 items-start bg-red-500/10 border-red-500/20 text-red-500">
                    <AlertCircle className="w-6 h-6 mt-0.5" />
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
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Left Column: Course Workspaces */}
                <div className="xl:col-span-2 space-y-5">
                    <h2 className="text-xl font-bold flex items-center gap-3" style={{ color: "var(--text-primary)" }}>
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 dark:bg-blue-500/20 shadow-sm border border-blue-500/10">
                            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </span>
                        Select Course Workspace
                    </h2>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800/50 animate-pulse border border-slate-200 dark:border-slate-700/50" />
                                ))}
                            </div>
                        ) : !error && courses.length === 0 ? (
                            <div className="text-center py-16 space-y-3">
                                <GraduationCap className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4 mx-auto" />
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
                                                <span className="px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest bg-blue-500/10 text-blue-600 dark:text-blue-400">
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
                                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${sec.session === "WEEKEND" ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400" : "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"}`}
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
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-orange-50 dark:bg-orange-500/20 shadow-sm border border-orange-500/10">
                            <BarChart3 className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        </span>
                        Workload Summary
                    </h2>

                    <div className="rounded-3xl p-6 shadow-sm space-y-4" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="w-24 h-4 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
                                        <div className="w-8 h-6 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <>
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
                            </>
                        )}
                    </div>

                    {/* Help Card */}
                    <div className="rounded-3xl p-6 shadow-sm bg-blue-500/5 border border-blue-500/20">
                        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--primary)" }}>Missing a course?</p>
                        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                            Contact your HOD to verify your section assignments for the active academic term.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
