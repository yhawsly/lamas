"use client";
import { BookOpen, CheckCircle, AlertTriangle, BarChart, Search, Edit2, AlertCircle } from "lucide-react";
import SearchableSelect from "@/components/ui/SearchableSelect";
import KPICard from "@/components/ui/KPICard";

import { useEffect, useState } from "react";

export default function AssignmentsTab() {
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
            const data = await res.json().catch(() => ({}));
            showAlert("Error", data.error || "Failed to assign lecturer.");
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
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>Course Assignments</h1>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Manage department curriculum distribution and assign academic staff to specific class sections.</p>
            </div>

            {/* Department Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Classes", value: totalClasses, icon: <BookOpen className="w-6 h-6" />, color: "#3b82f6" },
                    { label: "Assigned Workload", value: assignedClasses, icon: <CheckCircle className="w-6 h-6" />, color: "#10b981" },
                    { label: "Pending Assignment", value: pendingClasses, icon: <AlertTriangle className="w-6 h-6" />, color: "#f59e0b" },
                    { label: "Staff Coverage", value: `${coverage}%`, icon: <BarChart className="w-6 h-6" />, color: "#a855f7" },
                ].map((stat, i) => (
                    <KPICard key={stat.label} delay={i * 100} size="sm" {...stat} />
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

            {/* Courses List - Professional List UI */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800/60 overflow-hidden shadow-sm" style={{ backgroundColor: "var(--bg-surface)" }}>
                {/* Header Row */}
                <div className="hidden sm:grid grid-cols-12 gap-4 p-4 border-b border-slate-200 dark:border-slate-800/60 text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: "var(--bg-hover)", color: "var(--text-muted)" }}>
                    <div className="col-span-3">Course</div>
                    <div className="col-span-2">Level / Credits</div>
                    <div className="col-span-5">Sections & Assignments</div>
                    <div className="col-span-2 text-right">Action</div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
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
                        <div key={course.id} className="group flex flex-col transition-colors hover:bg-[var(--bg-hover)]" style={{ backgroundColor: "var(--bg-base)" }}>
                            {/* Main Course Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 sm:p-5 items-start sm:items-center relative">
                                {/* Course Info */}
                                <div className="col-span-1 sm:col-span-3 flex flex-col gap-1">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-[10px] border shrink-0" style={{ backgroundColor: "var(--primary)", color: "#fff", borderColor: "rgba(255,255,255,0.1)" }}>
                                            {course.code}
                                        </div>
                                        <div className="font-bold text-sm leading-tight" style={{ color: "var(--text-primary)" }}>
                                            {course.title}
                                        </div>
                                    </div>
                                </div>

                                {/* Meta Info */}
                                <div className="col-span-1 sm:col-span-2 flex flex-row sm:flex-col gap-4 sm:gap-1 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                                    <div className="flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        {course.credits} Credits
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2" /></svg>
                                        {course.curriculumMaps?.[0] ? `Level ${course.curriculumMaps[0].level}` : "Unmapped"}
                                    </div>
                                </div>

                                {/* Inline Stats */}
                                <div className="col-span-1 sm:col-span-5 flex items-center text-xs">
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-sm">
                                        <span className="font-bold text-blue-600 dark:text-blue-400">{course.sections?.length || 0}</span>
                                        <span className="font-medium" style={{ color: "var(--text-muted)" }}>Total Sections</span>
                                        <span className="mx-1 text-slate-300 dark:text-slate-700">|</span>
                                        <span className="font-bold text-amber-600 dark:text-amber-500">{course.sections?.filter((s:any)=>!s.lecturerId).length || 0}</span>
                                        <span className="font-medium" style={{ color: "var(--text-muted)" }}>Unassigned</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="col-span-1 sm:col-span-2 flex justify-end">
                                    <button
                                        onClick={() => {
                                            setActiveAddClassCourseId(prev => prev === course.id ? null : course.id);
                                            setNewClassName("");
                                            setNewClassSession("REGULAR");
                                        }}
                                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800/60 text-xs font-bold transition flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                                        style={{ color: "var(--text-primary)" }}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                        Add Section
                                    </button>
                                </div>
                            </div>

                            {/* Expanded Sections Container */}
                            <div className="pl-4 sm:pl-[72px] pr-4 sm:pr-5 pb-5 space-y-3">
                                
                                {/* Add Class Form */}
                                {activeAddClassCourseId === course.id && (
                                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-inner animate-in slide-in-from-top-2 duration-300" style={{ backgroundColor: "var(--bg-surface)" }}>
                                        <div className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>New Section Configuration</div>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <input 
                                                type="text"
                                                placeholder="e.g. Group A (Morning)"
                                                value={newClassName}
                                                onChange={(e) => setNewClassName(e.target.value)}
                                                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-lg px-4 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/30 transition shadow-sm"
                                                style={{ color: "var(--text-primary)" }}
                                                autoFocus
                                            />
                                            <select
                                                value={newClassSession}
                                                onChange={(e) => setNewClassSession(e.target.value as "REGULAR" | "WEEKEND")}
                                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-lg px-4 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/30 transition shadow-sm"
                                                style={{ color: "var(--text-primary)" }}
                                            >
                                                <option value="REGULAR">Regular Session</option>
                                                <option value="WEEKEND">Weekend Session</option>
                                            </select>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleCreateClass(course.id)}
                                                    disabled={isSavingClass || !newClassName.trim()}
                                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition disabled:opacity-50 shadow-md shadow-blue-500/20"
                                                >
                                                    {isSavingClass ? "..." : "Save"}
                                                </button>
                                                <button
                                                    onClick={() => setActiveAddClassCourseId(null)}
                                                    className="px-4 py-2 border border-slate-200 dark:border-slate-800/60 rounded-lg text-sm font-bold transition hover:bg-slate-100 dark:hover:bg-slate-800"
                                                    style={{ color: "var(--text-primary)" }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Sections List */}
                                <div className="space-y-2">
                                    {course.sections?.length > 0 ? course.sections.map((section: any) => {
                                        const currentLecturer = lecturers.find(l => l.id === section.lecturerId);
                                        
                                        return (
                                            <div key={section.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 pl-4 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-850 shadow-sm hover:shadow-md transition-shadow group/section">
                                                {/* Section Info */}
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className={`w-1.5 h-8 rounded-full ${section.session === 'WEEKEND' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                                                    <div className="flex-1">
                                                        <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{section.name}</div>
                                                        <div className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: "var(--text-muted)" }}>{section.session}</div>
                                                    </div>
                                                </div>

                                                {/* Assignment Controls */}
                                                <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800/60 pt-3 sm:pt-0 sm:pl-5 mt-3 sm:mt-0">
                                                    <div className="w-[180px] shrink-0 flex items-center justify-end sm:justify-start">
                                                        {currentLecturer ? (
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-7 h-7 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-full flex items-center justify-center border border-blue-200 dark:border-blue-500/20 uppercase shrink-0">
                                                                    {currentLecturer.name.substring(0, 2).toUpperCase()}
                                                                </div>
                                                                <div className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                                                                    {currentLecturer.name}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-200/50 dark:border-amber-500/20">
                                                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                                                <span className="text-[10px] font-bold uppercase tracking-widest">Unassigned</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <select
                                                        value={section.lecturerId || ""}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            handleAssignLecturer(course.id, section.id, val ? parseInt(val) : null);
                                                        }}
                                                        className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/40 transition hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer w-[140px] shrink-0"
                                                        style={{ color: "var(--text-primary)" }}
                                                    >
                                                        <option value="">+ Assign Staff</option>
                                                        {lecturers.length > 0 ? (
                                                            lecturers.map(l => (
                                                                <option key={l.id} value={l.id}>{l.name}</option>
                                                            ))
                                                        ) : (
                                                            <option value="" disabled>No staff available</option>
                                                        )}
                                                    </select>
                                                </div>
                                            </div>
                                        );
                                    }) : (
                                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-sm font-medium italic" style={{ color: "var(--text-muted)" }}>
                                            <BookOpen className="w-4 h-4 opacity-50" />
                                            No sections configured yet. Click "Add Section" to create one.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        )) : (
                            <div className="p-16 text-center flex flex-col items-center justify-center">
                                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-inner" style={{ backgroundColor: "var(--bg-hover)" }}>
                                    <BookOpen className="w-10 h-10 text-slate-400" />
                                </div>
                                <h3 className="text-xl font-extrabold mb-2" style={{ color: "var(--text-primary)" }}>No Courses Found</h3>
                                <p className="text-sm max-w-sm" style={{ color: "var(--text-muted)" }}>
                                    {courses.length === 0 ? "There are no courses assigned to this department curriculum yet." : "No courses match the selected filters."}
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
                            <AlertCircle className="w-6 h-6" />
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
