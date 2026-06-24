"use client";

import { useEffect, useState } from "react";

export default function HodCourseAssignments() {
    const [courses, setCourses] = useState<any[]>([]);
    const [lecturers, setLecturers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [programFilter, setProgramFilter] = useState<number | "All">("All");
    const [levelFilter, setLevelFilter] = useState<string>("All");

    const [activeAddClassCourseId, setActiveAddClassCourseId] = useState<number | null>(null);
    const [newClassName, setNewClassName] = useState("");
    const [newClassSession, setNewClassSession] = useState<"REGULAR" | "WEEKEND">("REGULAR");
    const [isSavingClass, setIsSavingClass] = useState(false);

    // Custom Alert Modal State
    const [customModal, setCustomModal] = useState<{ isOpen: boolean; type: "alert"; title: string; message: string } | null>(null);
    const showAlert = (title: string, message: string) => setCustomModal({ isOpen: true, type: "alert", title, message });

    useEffect(() => {
        Promise.all([
            fetch("/api/courses").then(r => r.ok ? r.json() : []),
            fetch("/api/lecturers").then(r => r.ok ? r.json() : [])
        ]).then(([coursesData, lecturersData]) => {
            setCourses(Array.isArray(coursesData) ? coursesData : []);
            setLecturers(Array.isArray(lecturersData) ? lecturersData : []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const handleAssignLecturer = async (courseId: number, sectionId: number, lecturerId: number | null) => {
        const res = await fetch("/api/courses/assignments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sectionId, lecturerId })
        });
        
        if (res.ok) {
            setCourses(prev => prev.map(c => {
                if (c.id !== courseId) return c;
                return {
                    ...c,
                    sections: c.sections.map((s: any) => 
                        s.id === sectionId ? { ...s, lecturerId } : s
                    )
                };
            }));
        } else {
            showAlert("Error", "Failed to assign lecturer.");
        }
    };

    const handleCreateClass = async (courseId: number) => {
        if (!newClassName.trim()) return;
        setIsSavingClass(true);
        try {
            const res = await fetch("/api/courses/sections", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    courseId,
                    name: newClassName.trim(),
                    session: newClassSession
                })
            });

            if (res.ok) {
                const createdClass = await res.json();
                setCourses(prev => prev.map(c => {
                    if (c.id !== courseId) return c;
                    return {
                        ...c,
                        sections: [...(c.sections || []), createdClass]
                    };
                }));
                setActiveAddClassCourseId(null);
                setNewClassName("");
            } else {
                const data = await res.json().catch(() => ({}));
                showAlert("Error", data.error || "Failed to create class.");
            }
        } catch (err) {
            console.error("Failed to create class:", err);
            showAlert("Error", "An error occurred while creating the class.");
        } finally {
            setIsSavingClass(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    const totalClasses = courses.reduce((acc, c) => acc + (c.sections?.length || 0), 0);
    const assignedClasses = courses.reduce((acc, c) => acc + (c.sections?.filter((s: any) => s.lecturerId)?.length || 0), 0);
    const pendingClasses = totalClasses - assignedClasses;
    const coverage = totalClasses > 0 ? Math.round((assignedClasses / totalClasses) * 100) : 0;

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 p-6 md:p-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>Course Assignments</h1>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Manage department curriculum distribution and assign academic staff to specific class sections.</p>
            </div>

            {/* Department Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Classes", value: totalClasses, icon: "📚", color: "text-blue-650 bg-blue-50 border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20" },
                    { label: "Assigned Workload", value: assignedClasses, icon: "✅", color: "text-green-650 bg-green-50 border-green-100 dark:bg-green-500/10 dark:border-green-500/20" },
                    { label: "Pending Assignment", value: pendingClasses, icon: "⚠️", color: "text-amber-650 bg-amber-50 border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20" },
                    { label: "Staff Coverage", value: `${coverage}%`, icon: "📊", color: "text-purple-650 bg-purple-50 border-purple-100 dark:bg-purple-500/10 dark:border-purple-500/20" },
                ].map((stat, i) => (
                    <div key={i} className="p-6 rounded-2xl border flex items-center gap-4" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold border ${stat.color.split(" ").slice(1).join(" ")}`}>
                            {stat.icon}
                        </div>
                        <div>
                            <div className={`text-2xl font-bold ${stat.color.split(" ")[0]}`}>{stat.value}</div>
                            <div className="text-xs font-bold uppercase tracking-wider mt-0.5 text-slate-400">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Program Filter */}
            {(() => {
                const availablePrograms = Array.from(new Map(
                    courses.flatMap(c => c.curriculumMaps?.map((m: any) => m.program) || [])
                    .filter(p => p)
                    .map(p => [p.id, p])
                ).values());

                if (availablePrograms.length === 0) return null;

                return (
                    <div className="flex gap-2 flex-wrap mb-4">
                        <button
                            onClick={() => setProgramFilter("All")}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition border ${
                                programFilter === "All"
                                    ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20"
                                    : "border-transparent hover:bg-slate-500/10"
                            }`}
                            style={programFilter !== "All" ? { color: "var(--text-primary)", borderColor: "var(--bg-border)", backgroundColor: "var(--bg-surface)" } : {}}
                        >
                            All Programs
                        </button>
                        {availablePrograms.map((p: any) => (
                            <button
                                key={p.id}
                                onClick={() => setProgramFilter(p.id)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition border ${
                                    programFilter === p.id
                                        ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20"
                                        : "border-transparent hover:bg-slate-500/10"
                                }`}
                                style={programFilter !== p.id ? { color: "var(--text-primary)", borderColor: "var(--bg-border)", backgroundColor: "var(--bg-surface)" } : {}}
                            >
                                {p.name}
                            </button>
                        ))}
                    </div>
                );
            })()}

            {/* Level Filter */}
            <div className="flex gap-2 flex-wrap">
                {["All", "100", "200", "300", "400", "Postgraduate"].map(lvl => (
                    <button
                        key={lvl}
                        onClick={() => setLevelFilter(lvl)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition border ${
                            levelFilter === lvl
                                ? "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20"
                                : "border-transparent hover:bg-slate-500/10"
                        }`}
                        style={levelFilter !== lvl ? { color: "var(--text-primary)", borderColor: "var(--bg-border)", backgroundColor: "var(--bg-surface)" } : {}}
                    >
                        {lvl === "All" ? "All Levels" : lvl === "Postgraduate" ? "Postgraduate" : `Level ${lvl}`}
                    </button>
                ))}
            </div>

            {/* Courses List */}
            <div className="rounded-3xl border overflow-hidden shadow-sm" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                <div className="divide-y" style={{ borderColor: "var(--bg-border)" }}>
                    {(() => {
                        const filteredCourses = courses.filter(c => {
                            // 1. Program Filter
                            if (programFilter !== "All") {
                                const belongsToProgram = c.curriculumMaps?.some((m: any) => m.programId === programFilter);
                                if (!belongsToProgram) return false;
                            }

                            // 2. Level Filter
                            if (levelFilter === "All") return true;
                            
                            const courseLevels = programFilter !== "All"
                                ? c.curriculumMaps?.filter((m: any) => m.programId === programFilter).map((m: any) => m.level) || []
                                : c.curriculumMaps?.map((m: any) => m.level) || [];
                            
                            if (courseLevels.length === 0 && levelFilter !== "All") return false;

                            if (levelFilter === "Postgraduate") return courseLevels.some((l: number) => l >= 500);
                            return courseLevels.some((l: number) => l.toString() === levelFilter);
                        });

                        return filteredCourses.length > 0 ? filteredCourses.map(course => (
                        <div key={course.id} className="p-6 hover:bg-slate-500/5 transition">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-slate-500/10 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-350 font-bold text-sm shrink-0 border" style={{ borderColor: "var(--bg-border)" }}>
                                        {course.code}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>{course.title}</h4>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2" /></svg>
                                                {course.sections?.length || 0} Classes
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                {course.credits} Credits
                                            </span>
                                            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
                                                {course.curriculumMaps?.[0] ? `Level ${course.curriculumMaps[0].level}` : "No Level"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setActiveAddClassCourseId(prev => prev === course.id ? null : course.id);
                                        setNewClassName("");
                                        setNewClassSession("REGULAR");
                                    }}
                                    className="px-3 py-1.5 rounded-lg border text-xs font-bold transition hover:bg-slate-500/10 flex items-center gap-1.5 shrink-0 self-start"
                                    style={{ borderColor: "var(--bg-border)", color: "var(--text-primary)" }}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    Add Class
                                </button>
                            </div>

                            {/* Classes */}
                            <div className="pl-0 sm:pl-16 space-y-3">
                                {/* Inline Add Class Form */}
                                {activeAddClassCourseId === course.id && (
                                    <div className="p-4 rounded-xl border animate-in slide-in-from-top-2 duration-300 space-y-3" style={{ backgroundColor: "var(--bg-hover)", borderColor: "var(--bg-border)" }}>
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Create New Class</div>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <input 
                                                type="text"
                                                placeholder="e.g. BTECH COMPUTER SCIENCE LVL 100"
                                                value={newClassName}
                                                onChange={(e) => setNewClassName(e.target.value)}
                                                className="flex-1 bg-white dark:bg-slate-850 border rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500/30 transition"
                                                style={{ borderColor: "var(--bg-border)" }}
                                                autoFocus
                                            />
                                            <select
                                                value={newClassSession}
                                                onChange={(e) => setNewClassSession(e.target.value as "REGULAR" | "WEEKEND")}
                                                className="bg-white dark:bg-slate-850 border rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500/30 transition"
                                                style={{ borderColor: "var(--bg-border)" }}
                                            >
                                                <option value="REGULAR">Regular Session</option>
                                                <option value="WEEKEND">Weekend Session</option>
                                            </select>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleCreateClass(course.id)}
                                                    disabled={isSavingClass || !newClassName.trim()}
                                                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 flex items-center justify-center min-w-[70px]"
                                                >
                                                    {isSavingClass ? "Saving..." : "Save"}
                                                </button>
                                                <button
                                                    onClick={() => setActiveAddClassCourseId(null)}
                                                    className="px-3 py-1.5 border rounded-lg text-xs font-bold transition hover:bg-slate-500/10"
                                                    style={{ borderColor: "var(--bg-border)", color: "var(--text-primary)" }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {course.sections?.length > 0 ? course.sections.map((section: any) => {
                                    const currentLecturer = lecturers.find(l => l.id === section.lecturerId);
                                    
                                    return (
                                        <div key={section.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border" style={{ backgroundColor: "var(--bg-hover)", borderColor: "var(--bg-border)" }}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-8 rounded-full ${section.session === 'WEEKEND' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                                                <div>
                                                    <div className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{section.name}</div>
                                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">{section.session} SESSION</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l pt-3 sm:pt-0 sm:pl-4 mt-2 sm:mt-0" style={{ borderColor: "var(--bg-border)" }}>
                                                {currentLecturer ? (
                                                    <div className="flex items-center gap-2 min-w-[140px]">
                                                        <div className="w-6 h-6 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full flex items-center justify-center border border-blue-200 uppercase dark:bg-blue-500/20 dark:border-blue-500/30 dark:text-blue-300">
                                                            {currentLecturer.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div className="text-xs font-semibold truncate max-w-[120px]" style={{ color: "var(--text-primary)" }}>
                                                            {currentLecturer.name}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/20 px-2 py-1 rounded-md border border-amber-100/50 min-w-[140px]">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                                        <span className="text-[10px] font-bold uppercase tracking-wider">Unassigned</span>
                                                    </div>
                                                )}

                                                <select
                                                    value={section.lecturerId || ""}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        handleAssignLecturer(course.id, section.id, val ? parseInt(val) : null);
                                                    }}
                                                    className="bg-white dark:bg-slate-800 border rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-350 outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition hover:border-slate-300"
                                                    style={{ borderColor: "var(--bg-border)" }}
                                                >
                                                    <option value="">Assign...</option>
                                                    {lecturers.length > 0 ? (
                                                        lecturers.map(l => (
                                                            <option key={l.id} value={l.id}>{l.name}</option>
                                                        ))
                                                    ) : (
                                                        <option value="" disabled>No lecturers available</option>
                                                    )}
                                                </select>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="text-sm italic text-slate-500 px-4 py-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                                        No classes created for this course yet.
                                    </div>
                                )}
                            </div>
                        </div>
                        )) : (
                            <div className="p-12 text-center">
                                <div className="text-4xl mb-4">📚</div>
                                <h3 className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>No Courses Found</h3>
                                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                                    {courses.length === 0 ? "There are no courses assigned to this department." : lecturers.length === 0 ? "No lecturers available to assign. // Admins see all users capable of being observed/observing. HODs see users (lecturers) only from their own department – filtered by `departmentId` in the query below." : "No courses match the selected level filter."}
                                </p>
                            </div>
                        );
                    })()}
                </div>
            </div>
            {/* Custom Alert Modal */}
            {customModal && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--bg-border)" }}>
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-500/10 text-red-500">
                            <span className="text-2xl">⚠️</span>
                        </div>
                        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>{customModal.title}</h2>
                        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>{customModal.message}</p>
                        
                        <button
                            onClick={() => setCustomModal(null)}
                            className="w-full py-2.5 rounded-xl font-bold transition text-white"
                            style={{ backgroundColor: "var(--primary)" }}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
