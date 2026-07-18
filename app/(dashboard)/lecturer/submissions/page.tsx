"use client";
import { Info, BookOpen, ScrollText, FileText } from "lucide-react";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Pagination from "@/components/ui/Pagination";
import Loader from "@/components/ui/Loader";

interface Submission {
    id: number;
    title: string;
    type: string;
    status: string;
    submittedAt: string | null;
    content: string | null;
}

interface Course {
    id: number;
    code: string;
    title: string;
    credits: number;
    sections?: { lecturerId: number | null }[];
}

function CourseOutlineContent() {
    const { data: session } = useSession();
    const router = useRouter();

    const [courses, setCourses] = useState<Course[]>([]);
    const [history, setHistory] = useState<Submission[]>([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [loading, setLoading] = useState(true);

    const currentLecturerId = session?.user?.id;
    const lecturerCourses = useMemo(() => {
        if (!currentLecturerId) return [];
        return courses.filter(c => c.sections?.some((s: any) => s.lecturerId === parseInt(currentLecturerId)));
    }, [courses, currentLecturerId]);

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
        // Fetch courses list
        fetch("/api/courses")
            .then(r => r.ok ? r.json().catch(() => []) : [])
            .then(data => setCourses(Array.isArray(data) ? data : []))
            .catch(() => {});

        // Fetch initial submission history
        fetchHistory(1);
        
        const timer = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return <Loader message="Accessing curriculum workspace entries..." />;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                    Syllabus Submissions
                </h1>
                <p className="mt-2 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                    Draft, import, validate, and manage your semester plan outlines.
                </p>
            </div>

            {/* Info Banner */}
            <div className="p-5 bg-blue-600/10 border border-blue-500/20 rounded-3xl flex items-start gap-4">
                <Info className="w-6 h-6 text-blue-500 mt-0.5 shrink-0" />
                <div>
                    <h3 className="font-bold text-blue-300 text-sm">Unified Course Workspaces</h3>
                    <p className="text-xs text-blue-200 mt-1 leading-relaxed">
                        LAMAS now uses integrated workspaces for syllabus draft preparation. Select one of your assigned courses below to manage the course topics, outcomes, grading weights registry, weekly outlines, and approvals in a single place.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left Column: Assigned Courses Grid Selector */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="border rounded-3xl p-6 space-y-5" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                        <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-300"><BookOpen className="w-5 h-5" /></div>
                            Select Course Workspace
                        </h2>

                        {lecturerCourses.length === 0 ? (
                          <div className="text-center py-12 border border-dashed rounded-2xl border-slate-200">
                            <p className="text-slate-500 text-sm">You currently do not have any courses assigned to you by the HOD.</p>
                            <p className="text-slate-500 text-xs mt-1">Assigned courses will appear here automatically for you to prepare.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            {lecturerCourses.map(course => (
                              <div
                                key={course.id}
                                onClick={() => router.push(`/lecturer/courses/${course.id}`)}
                                className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-blue-400 hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
                              >
                                <div>
                                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-bold mb-3 border border-blue-100 text-xs">
                                    {course.code}
                                  </div>
                                  <h3 className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition truncate">{course.title}</h3>
                                  <p className="text-xs text-slate-500 mt-1">{course.credits} Credits</p>
                                </div>
                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-blue-600 font-bold group-hover:text-blue-700">
                                  <span>Open Planner Workspace</span>
                                  <svg className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Submission History */}
                <div className="lg:col-span-1">
                    <div className="border rounded-3xl p-6 sticky top-8" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                        <h3 className="font-semibold mb-5 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                            <ScrollText className="w-5 h-5 text-indigo-400" /> Submission History
                        </h3>
                        {history.length === 0 ? (
                            <div className="text-center py-10" style={{ color: "var(--text-muted)" }}>
                                <div className="flex justify-center mb-3"><FileText className="w-10 h-10 text-gray-400" /></div>
                                <p className="text-sm">No submissions found.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {history.map(s => (
                                    <div key={s.id} className="p-4 rounded-2xl border transition" style={{ backgroundColor: "var(--bg-hover)", borderColor: "var(--bg-border)" }}>
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <div className="font-medium text-sm truncate" style={{ color: "var(--text-primary)" }}>{s.title}</div>
                                                <div className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : "Draft"}</div>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${s.status === "SUBMITTED" || s.status === "APPROVED" ? "bg-green-500/20 text-green-300" : "bg-yellow-500/20 text-yellow-300"}`}>
                                                {s.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}

                                <Pagination
                                    currentPage={pagination.page}
                                    totalPages={pagination.totalPages}
                                    onPageChange={(p: number) => fetchHistory(p)}
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
