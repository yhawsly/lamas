"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ListPlus } from "lucide-react";

const LEVELS = [100, 200, 300, 400, 500];
const SEMESTERS = [1, 2];
const LEVEL_LABELS: Record<number, string> = {
    100: "Level 100 — Freshman",
    200: "Level 200 — Sophomore",
    300: "Level 300 — Junior",
    400: "Level 400 — Senior",
    500: "Postgraduate",
};

type Section = {
    id: number;
    name: string;
    session: "REGULAR" | "WEEKEND";
    lecturerId: number | null;
    lecturer?: { id: number; name: string; email: string } | null;
};

type Course = {
    id: number;
    code: string;
    title: string;
    credits: number;
    departmentId: number | null;
    isInstitutional: boolean;
    department?: { id: number; name: string; code: string } | null;
    sections?: Section[];
};

type CurriculumMapEntry = {
    id: number;
    level: number;
    semester: number;
    isMandatory: boolean;
    course: Course;
};

type Program = {
    id: number;
    name: string;
    code: string;
    description?: string;
    curriculumMaps: CurriculumMapEntry[];
};

type Lecturer = {
    id: number;
    name: string;
    email: string;
};

export default function HODCurriculumMapTab() {
    const { data: session } = useSession();
    const userDeptId = (session?.user as any)?.departmentId;

    const [programs, setPrograms] = useState<Program[]>([]);
    const [lecturers, setLecturers] = useState<Lecturer[]>([]);
    const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
    const [levelFilter, setLevelFilter] = useState<string>("All");
    const [loading, setLoading] = useState(true);

    // Selected course for detail modal
    const [activeCourse, setActiveCourse] = useState<Course | null>(null);

    // Inline section creator state
    const [showAddSection, setShowAddSection] = useState(false);
    const [newSectionName, setNewSectionName] = useState("");
    const [newSectionSession, setNewSectionSession] = useState<"REGULAR" | "WEEKEND">("REGULAR");
    const [isSavingSection, setIsSavingSection] = useState(false);

    // Custom Alert Modal State
    const [customModal, setCustomModal] = useState<{ isOpen: boolean; title: string; message: string } | null>(null);
    const showAlert = (title: string, message: string) => setCustomModal({ isOpen: true, title, message });

    useEffect(() => {
        Promise.all([
            fetch("/api/admin/curriculum").then(r => r.ok ? r.json() : null),
            fetch("/api/lecturers").then(r => r.ok ? r.json() : [])
        ]).then(([curriculumData, lecturersData]) => {
            if (curriculumData) {
                setPrograms(curriculumData.programs || []);
                if (curriculumData.programs?.length > 0) {
                    // Pre-select program with maximum mappings or first program
                    let bestProgram = curriculumData.programs[0];
                    let maxCourses = 0;
                    for (const p of curriculumData.programs) {
                        if (p.curriculumMaps && p.curriculumMaps.length > maxCourses) {
                            maxCourses = p.curriculumMaps.length;
                            bestProgram = p;
                        }
                    }
                    setSelectedProgramId(bestProgram.id);
                }
            }
            setLecturers(Array.isArray(lecturersData) ? lecturersData : []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const selectedProgram = programs.find(p => p.id === selectedProgramId) || null;

    const getMappedCourses = (level: number, semester: number): CurriculumMapEntry[] => {
        if (!selectedProgram) return [];
        return selectedProgram.curriculumMaps.filter(m => m.level === level && m.semester === semester);
    };

    const totalCredits = (level: number) =>
        selectedProgram?.curriculumMaps
            .filter(m => m.level === level)
            .reduce((s, m) => s + (m.course?.credits || 0), 0) || 0;

    // Assignment & Section Management Actions
    const handleAssignLecturer = async (courseId: number, sectionId: number, lecturerId: number | null) => {
        const res = await fetch("/api/courses/assignments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sectionId, lecturerId })
        });

        if (res.ok) {
            const updatedLecturer = lecturerId ? lecturers.find(l => l.id === lecturerId) || null : null;
            
            const updateCourseInList = (course: Course) => {
                if (course.id !== courseId) return course;
                return {
                    ...course,
                    sections: (course.sections || []).map(s => 
                        s.id === sectionId ? { ...s, lecturerId, lecturer: updatedLecturer } : s
                    )
                };
            };

            // Update local state in programs
            setPrograms(prev => prev.map(p => ({
                ...p,
                curriculumMaps: p.curriculumMaps.map(m => ({
                    ...m,
                    course: updateCourseInList(m.course)
                }))
            })));

            // Update active modal course
            if (activeCourse && activeCourse.id === courseId) {
                setActiveCourse(prev => {
                    if (!prev) return null;
                    return updateCourseInList(prev);
                });
            }
        } else {
            showAlert("Error", "Failed to assign lecturer.");
        }
    };

    const handleCreateSection = async (courseId: number) => {
        if (!newSectionName.trim()) return;
        setIsSavingSection(true);
        try {
            const res = await fetch("/api/courses/sections", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    courseId,
                    name: newSectionName.trim(),
                    session: newSectionSession
                })
            });

            if (res.ok) {
                const createdSection = await res.json();
                
                const updateCourseInList = (course: Course) => {
                    if (course.id !== courseId) return course;
                    return {
                        ...course,
                        sections: [...(course.sections || []), createdSection]
                    };
                };

                setPrograms(prev => prev.map(p => ({
                    ...p,
                    curriculumMaps: p.curriculumMaps.map(m => ({
                        ...m,
                        course: updateCourseInList(m.course)
                    }))
                })));

                if (activeCourse && activeCourse.id === courseId) {
                    setActiveCourse(prev => {
                        if (!prev) return null;
                        return updateCourseInList(prev);
                    });
                }

                setShowAddSection(false);
                setNewSectionName("");
            } else {
                const data = await res.json().catch(() => ({}));
                showAlert("Error", data.error || "Failed to create section.");
            }
        } catch (err) {
            console.error("Failed to create section:", err);
            showAlert("Error", "An error occurred while creating the section.");
        } finally {
            setIsSavingSection(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>Curriculum Matrix</h2>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Explore program curriculum matrices, identify general courses, and staff sections.</p>
            </div>

            {/* Program Tabs */}
            <div className="flex gap-2 flex-wrap">
                {programs.map(p => (
                    <button
                        key={p.id}
                        onClick={() => setSelectedProgramId(p.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition border ${
                            selectedProgramId === p.id
                                ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20"
                                : "border-transparent hover:bg-slate-500/10"
                        }`}
                        style={selectedProgramId !== p.id ? { color: "var(--text-primary)", borderColor: "var(--bg-border)", backgroundColor: "var(--bg-surface)" } : {}}
                    >
                        {p.name}
                    </button>
                ))}
            </div>

            {/* Matrix View */}
            {selectedProgram ? (
                <div className="space-y-6">
                    {/* Level Filter */}
                    <div className="flex gap-2 flex-wrap pb-2 border-b" style={{ borderColor: "var(--bg-border)" }}>
                        {["All", "100", "200", "300", "400", "Postgraduate"].map(lvl => (
                            <button
                                key={lvl}
                                onClick={() => setLevelFilter(lvl)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition border ${
                                    levelFilter === lvl
                                        ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20"
                                        : "border-transparent hover:bg-slate-500/10"
                                }`}
                                style={levelFilter !== lvl ? { color: "var(--text-primary)", borderColor: "var(--bg-border)", backgroundColor: "var(--bg-surface)" } : {}}
                            >
                                {lvl === "All" ? "All Levels" : lvl === "Postgraduate" ? "Postgraduate" : `Level ${lvl}`}
                            </button>
                        ))}
                    </div>

                    {/* Matrix Grid of Levels */}
                    {LEVELS.filter(l => levelFilter === "All" || (levelFilter === "Postgraduate" ? l === 500 : l.toString() === levelFilter)).map(level => {
                        const credits = totalCredits(level);
                        const creditWarning = credits < 12 || credits > 24;
                        return (
                            <div key={level} className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                                {/* Level Header */}
                                <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--bg-border)", backgroundColor: "var(--bg-hover)" }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 font-black text-sm">
                                            {level === 500 ? "PG" : level}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm md:text-base" style={{ color: "var(--text-primary)" }}>{LEVEL_LABELS[level]}</h3>
                                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                                {selectedProgram.curriculumMaps.filter(m => m.level === level).length} courses mapped
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                                        creditWarning
                                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                            : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                    }`}>
                                        {credits} Total Credits
                                    </div>
                                </div>

                                {/* Semesters Columns */}
                                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x" style={{ borderColor: "var(--bg-border)" }}>
                                    {SEMESTERS.map(sem => {
                                        const entries = getMappedCourses(level, sem);
                                        const semCredits = entries.reduce((s, e) => s + (e.course?.credits || 0), 0);
                                        return (
                                            <div key={sem} className="p-5 space-y-3">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                        Semester {sem}
                                                    </span>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/10" style={{ color: "var(--text-muted)" }}>
                                                        {semCredits} cr
                                                    </span>
                                                </div>

                                                {entries.length === 0 ? (
                                                    <div className="py-6 rounded-xl border border-dashed flex items-center justify-center text-xs font-semibold text-slate-400" style={{ borderColor: "var(--bg-border)" }}>
                                                        No courses mapped
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {entries.map(entry => {
                                                            const isDept = entry.course.departmentId === userDeptId;
                                                            const hasUnassigned = (entry.course.sections || []).length === 0 || 
                                                                (entry.course.sections || []).some(s => !s.lecturerId);

                                                            return (
                                                                <div
                                                                    key={entry.id}
                                                                    onClick={() => setActiveCourse(entry.course)}
                                                                    className={`group flex flex-col p-4 rounded-xl border transition cursor-pointer hover:-translate-y-0.5 hover:shadow-md ${
                                                                        isDept 
                                                                            ? "border-blue-500/30 hover:border-blue-500 bg-blue-500/[0.02]" 
                                                                            : "border-slate-500/15 hover:border-slate-400"
                                                                    }`}
                                                                    style={{ backgroundColor: "var(--bg-hover)", borderColor: isDept ? undefined : "var(--bg-border)" }}
                                                                >
                                                                    <div className="flex items-start justify-between gap-2 min-w-0">
                                                                        <div className="min-w-0">
                                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                                <span className="text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>
                                                                                    {entry.course.title}
                                                                                </span>
                                                                                {isDept ? (
                                                                                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-500 border border-blue-500/20">
                                                                                        Your Dept
                                                                                    </span>
                                                                                ) : entry.course.isInstitutional ? (
                                                                                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-500 border border-purple-500/20">
                                                                                        General
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-500/15 text-slate-400 border border-slate-500/20">
                                                                                        {entry.course.department?.code || "Other Dept"}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div className="text-[10px] font-mono mt-0.5 text-slate-400">{entry.course.code}</div>
                                                                        </div>
                                                                        <div className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-500/10 text-slate-400 shrink-0">
                                                                            {entry.course.credits}cr
                                                                        </div>
                                                                    </div>

                                                                    {/* Staffing Overview */}
                                                                    <div className="mt-3 border-t pt-2 border-slate-500/10 space-y-1.5">
                                                                        {entry.course.sections && entry.course.sections.length > 0 ? (
                                                                            entry.course.sections.map(s => (
                                                                                <div key={s.id} className="flex items-center justify-between text-[10px] font-medium text-slate-400">
                                                                                    <span className="truncate max-w-[100px]">{s.name}</span>
                                                                                    {s.lecturer ? (
                                                                                        <span className="font-bold text-slate-500 dark:text-slate-300 truncate max-w-[100px]">👤 {s.lecturer.name}</span>
                                                                                    ) : (
                                                                                        <span className="font-bold text-amber-600 dark:text-amber-500">⚠️ Unassigned</span>
                                                                                    )}
                                                                                </div>
                                                                            ))
                                                                        ) : (
                                                                            <div className="text-[10px] italic text-slate-500">No classes created</div>
                                                                        )}
                                                                    </div>

                                                                    {/* Action Indicator */}
                                                                    {isDept && hasUnassigned && (
                                                                        <div className="mt-2.5 flex items-center gap-1.5 text-[9px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wide">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                                                            Staffing Action Needed
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-16">
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>Select a program above to view its curriculum map.</p>
                </div>
            )}

            {/* Course Detail / Assignment Slide-over Modal */}
            {activeCourse && (
                <div className="fixed inset-0 z-[500] flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-300" style={{ backgroundColor: "var(--bg-base)" }}>
                        <div className="space-y-6">
                            {/* Modal Header */}
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>{activeCourse.code}</span>
                                        {activeCourse.departmentId === userDeptId ? (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">Your Dept</span>
                                        ) : activeCourse.isInstitutional ? (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-500 border border-purple-500/20">General Course</span>
                                        ) : (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-500/10 text-slate-400 border border-slate-500/20">Taught by {activeCourse.department?.name || "Other Department"}</span>
                                        )}
                                    </div>
                                    <h2 className="text-lg font-bold mt-1" style={{ color: "var(--text-primary)" }}>{activeCourse.title}</h2>
                                    <p className="text-xs text-slate-400 mt-1">{activeCourse.credits} Credits</p>
                                </div>
                                <button onClick={() => { setActiveCourse(null); setShowAddSection(false); }} className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:bg-slate-500/10 text-xl" style={{ color: "var(--text-muted)" }}>×</button>
                            </div>

                            {/* Alert for Service/General courses */}
                            {activeCourse.departmentId !== userDeptId && (
                                <div className="p-4 rounded-xl text-xs leading-relaxed border bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400" style={{ borderColor: "var(--bg-border)" }}>
                                    📢 <strong className="text-slate-700 dark:text-slate-300">Read-Only View:</strong> This course is offered and staffed by the <strong className="text-slate-700 dark:text-slate-300">{activeCourse.department?.name || "another"} department</strong>. You can monitor the staffing assignments below, but changes must be made by the offering department HOD.
                                </div>
                            )}

                            {/* Class Management List */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: "var(--bg-border)" }}>
                                    <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400">Classes</h3>
                                    {activeCourse.departmentId === userDeptId && (
                                        <button
                                            onClick={() => setShowAddSection(!showAddSection)}
                                            className="text-xs font-bold text-blue-500 hover:text-blue-400 transition flex items-center gap-1"
                                        >
                                            {showAddSection ? (
                                                <span>Cancel</span>
                                            ) : (
                                                <>
                                                    <ListPlus className="w-3.5 h-3.5" />
                                                    <span>Add Class</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>

                                {/* Add Class Form */}
                                {showAddSection && activeCourse.departmentId === userDeptId && (
                                    <div className="p-4 rounded-xl border space-y-3" style={{ backgroundColor: "var(--bg-hover)", borderColor: "var(--bg-border)" }}>
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Create New Class</div>
                                        <input
                                            type="text"
                                            placeholder="e.g. Regular A"
                                            value={newSectionName}
                                            onChange={(e) => setNewSectionName(e.target.value)}
                                            className="w-full bg-white dark:bg-slate-800 border rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500/30 transition"
                                            style={{ borderColor: "var(--bg-border)" }}
                                            autoFocus
                                        />
                                        <select
                                            value={newSectionSession}
                                            onChange={(e) => setNewSectionSession(e.target.value as "REGULAR" | "WEEKEND")}
                                            className="w-full bg-white dark:bg-slate-800 border rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500/30 transition"
                                            style={{ borderColor: "var(--bg-border)" }}
                                        >
                                            <option value="REGULAR">Regular Session</option>
                                            <option value="WEEKEND">Weekend Session</option>
                                        </select>
                                        <button
                                            onClick={() => handleCreateSection(activeCourse.id)}
                                            disabled={isSavingSection || !newSectionName.trim()}
                                            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                                        >
                                            {isSavingSection ? "Saving Class..." : "Save Class"}
                                        </button>
                                    </div>
                                )}

                                {/* Sections List */}
                                <div className="space-y-3">
                                    {activeCourse.sections && activeCourse.sections.length > 0 ? (
                                        activeCourse.sections.map(section => (
                                            <div key={section.id} className="flex items-center justify-between p-4 rounded-xl border" style={{ backgroundColor: "var(--bg-hover)", borderColor: "var(--bg-border)" }}>
                                                <div>
                                                    <div className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{section.name}</div>
                                                    <div className="text-[9px] font-bold text-slate-500 mt-0.5 uppercase tracking-wide">{section.session} Session</div>
                                                </div>

                                                <div>
                                                    {activeCourse.departmentId === userDeptId ? (
                                                        <select
                                                            value={section.lecturerId || ""}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                handleAssignLecturer(activeCourse.id, section.id, val ? parseInt(val) : null);
                                                            }}
                                                            className="bg-white dark:bg-slate-800 border rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                                                            style={{ borderColor: "var(--bg-border)" }}
                                                        >
                                                            <option value="">Unassigned</option>
                                                            {lecturers.map(l => (
                                                                <option key={l.id} value={l.id}>{l.name}</option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <span className="text-xs font-semibold text-slate-400">
                                                            👤 {section.lecturer?.name || "Unassigned"}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-xs italic text-slate-500 border border-dashed rounded-xl" style={{ borderColor: "var(--bg-border)" }}>
                                            No classes have been created for this course yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-4 border-t" style={{ borderColor: "var(--bg-border)" }}>
                            <button
                                onClick={() => { setActiveCourse(null); setShowAddSection(false); }}
                                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold transition"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Alert Modal */}
            {customModal && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--bg-border)" }}>
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-50 text-red-500 dark:bg-red-500/10">
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
