"use client";
import { BookOpen, AlertTriangle, HelpCircle } from "lucide-react";
import { useState, useEffect } from "react";

const LEVELS = [100, 200, 300, 400, 500];
const SEMESTERS = [1, 2];
const LEVEL_LABELS: Record<number, string> = {
    100: "Level 100 — Freshman",
    200: "Level 200 — Sophomore",
    300: "Level 300 — Junior",
    400: "Level 400 — Senior",
    500: "Postgraduate",
};

type CurriculumMapEntry = {
    id: number;
    level: number;
    semester: number;
    isMandatory: boolean;
    course: { id: number; code: string; title: string; credits: number };
};

type Program = {
    id: number;
    name: string;
    code: string;
    description?: string;
    curriculumMaps: CurriculumMapEntry[];
};

type Course = {
    id: number;
    code: string;
    title: string;
    credits: number;
};

export default function CurriculumMapTab() {
    const [programs, setPrograms] = useState<Program[]>([]);
    const [allCourses, setAllCourses] = useState<Course[]>([]);
    const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [levelFilter, setLevelFilter] = useState<string>("All");

    // Add-course modal state
    const [addModal, setAddModal] = useState<{ level: number; semester: number } | null>(null);
    const [courseSearch, setCourseSearch] = useState("");

    // New program modal
    const [showNewProgram, setShowNewProgram] = useState(false);
    const [newProgram, setNewProgram] = useState({ name: "", code: "", description: "" });

    // Custom Alert/Confirm Modal State
    const [customModal, setCustomModal] = useState<{ isOpen: boolean; type: "alert" | "confirm"; title: string; message: string; onConfirm?: () => void } | null>(null);
    const showAlert = (title: string, message: string) => setCustomModal({ isOpen: true, type: "alert", title, message });
    const showConfirm = (title: string, message: string, onConfirm: () => void) => setCustomModal({ isOpen: true, type: "confirm", title, message, onConfirm });


    useEffect(() => {
        fetch("/api/admin/curriculum")
            .then(r => r.ok ? r.json() : null)
            .then(d => {
                if (d) {
                    setPrograms(d.programs || []);
                    setAllCourses(d.courses || []);
                    if (d.programs?.length > 0) {
                        // Find the program with the most mapped courses
                        let bestProgram = d.programs[0];
                        let maxCourses = 0;
                        for (const p of d.programs) {
                            if (p.curriculumMaps && p.curriculumMaps.length > maxCourses) {
                                maxCourses = p.curriculumMaps.length;
                                bestProgram = p;
                            }
                        }
                        setSelectedProgramId(bestProgram.id);
                    }
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
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

    const handleAddCourse = async (courseId: number) => {
        if (!selectedProgramId || !addModal) return;
        setSaving(true);
        try {
            const res = await fetch("/api/admin/curriculum/map", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    programId: selectedProgramId,
                    courseId,
                    level: addModal.level,
                    semester: addModal.semester,
                    isMandatory: true
                })
            });
            if (res.ok) {
                const newEntry = await res.json();
                setPrograms(prev => prev.map(p => {
                    if (p.id !== selectedProgramId) return p;
                    // Remove any previous mapping for this course then add new one
                    const filtered = p.curriculumMaps.filter(m => m.course.id !== courseId);
                    return { ...p, curriculumMaps: [...filtered, newEntry] };
                }));
                setAddModal(null);
                setCourseSearch("");
            } else {
                const err = await res.json().catch(() => ({}));
                showAlert("Error", err.error || "Failed to add course.");
            }
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveCourse = (courseId: number) => {
        if (!selectedProgramId) return;
        showConfirm("Remove Course", "Are you sure you want to remove this course from the program curriculum?", async () => {
            setCustomModal(null);
            try {
                const res = await fetch(`/api/admin/curriculum/map?programId=${selectedProgramId}&courseId=${courseId}`, { method: "DELETE" });
                if (res.ok) {
                    setPrograms(prev => prev.map(p => {
                        if (p.id !== selectedProgramId) return p;
                        return { ...p, curriculumMaps: p.curriculumMaps.filter(m => m.course.id !== courseId) };
                    }));
                } else {
                    showAlert("Error", "Failed to remove course.");
                }
            } catch {
                showAlert("Error", "Error removing course.");
            }
        });
    };

    const handleCreateProgram = async () => {
        if (!newProgram.name || !newProgram.code) { showAlert("Validation Error", "Name and code are required."); return; }
        setSaving(true);
        try {
            const res = await fetch("/api/admin/curriculum", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...newProgram, type: "PROGRAM" })
            });
            if (res.ok) {
                const created = await res.json();
                const prog = { ...created, curriculumMaps: [] };
                setPrograms(prev => [...prev, prog]);
                setSelectedProgramId(prog.id);
                setShowNewProgram(false);
                setNewProgram({ name: "", code: "", description: "" });
            } else {
                showAlert("Error", "Failed to create program.");
            }
        } finally {
            setSaving(false);
        }
    };

    // Courses not yet mapped to selected program
    const mappedCourseIds = new Set(selectedProgram?.curriculumMaps.map(m => m.course.id) || []);
    const unmappedCourses = allCourses.filter(c =>
        !mappedCourseIds.has(c.id) &&
        (courseSearch === "" || c.title.toLowerCase().includes(courseSearch.toLowerCase()) || c.code.toLowerCase().includes(courseSearch.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-6">
                <div>
                    <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
                        Curriculum Roadmapper
                    </h2>
                    <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                        Assign courses to year groups and semesters per academic program.
                    </p>
                </div>
                <button
                    onClick={() => setShowNewProgram(true)}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition shadow-lg shadow-blue-500/20 flex items-center gap-2 self-start"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    New Program
                </button>
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
                {programs.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center p-12 mt-8 text-center rounded-3xl border-2 border-dashed bg-blue-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 w-full animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 mb-6 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shadow-inner">
                            <BookOpen className="w-10 h-10 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mb-2">No Programs Found</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                            There are currently no academic programs available. Create your first program to start mapping out the curriculum matrix.
                        </p>
                        <button
                            onClick={() => setShowNewProgram(true)}
                            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-lg shadow-blue-500/25 flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create First Program
                        </button>
                    </div>
                )}
            </div>

            {/* Matrix Grid */}
            {selectedProgram && (
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

                    {LEVELS.filter(l => levelFilter === "All" || (levelFilter === "Postgraduate" ? l === 500 : l.toString() === levelFilter)).map(level => {
                        const credits = totalCredits(level);
                        const creditWarning = credits < 12 || credits > 24;
                        return (
                            <div key={level} className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                                {/* Level Header */}
                                <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--bg-border)", backgroundColor: "var(--bg-hover)" }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 font-black text-sm">
                                            {level}
                                        </div>
                                        <div>
                                            <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>{LEVEL_LABELS[level]}</h3>
                                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                                {selectedProgram.curriculumMaps.filter(m => m.level === level).length} courses mapped
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                                        creditWarning
                                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                            : "bg-green-500/10 text-green-500 border-green-500/20"
                                    }`}>
                                        {credits} Total Credits
                                    </div>
                                </div>

                                {/* Semester Columns */}
                                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x" style={{ borderColor: "var(--bg-border)" }}>
                                    {SEMESTERS.map(sem => {
                                        const entries = getMappedCourses(level, sem);
                                        const semCredits = entries.reduce((s, e) => s + (e.course?.credits || 0), 0);
                                        return (
                                            <div key={sem} className="p-5 space-y-3">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                                                        Semester {sem}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/10" style={{ color: "var(--text-muted)" }}>
                                                            {semCredits} cr
                                                        </span>
                                                        <button
                                                            onClick={() => { setAddModal({ level, semester: sem }); setCourseSearch(""); }}
                                                            className="w-6 h-6 rounded-md bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition text-xs font-bold"
                                                            title={`Add course to Level ${level} Semester ${sem}`}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>

                                                {entries.length === 0 ? (
                                                    <button
                                                        onClick={() => { setAddModal({ level, semester: sem }); setCourseSearch(""); }}
                                                        className="w-full py-4 border-2 border-dashed rounded-xl text-xs font-semibold transition hover:border-blue-500 hover:bg-blue-500/5 flex items-center justify-center gap-2"
                                                        style={{ borderColor: "var(--bg-border)", color: "var(--text-muted)" }}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                                        Add courses
                                                    </button>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {entries.map(entry => (
                                                            <div
                                                                key={entry.id}
                                                                className="group flex items-center justify-between p-3 rounded-xl border transition"
                                                                style={{ backgroundColor: "var(--bg-hover)", borderColor: "var(--bg-border)" }}
                                                            >
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-black flex items-center justify-center shrink-0">
                                                                        {entry.course.credits}cr
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <div className="text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>{entry.course.title}</div>
                                                                        <div className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>{entry.course.code}</div>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleRemoveCourse(entry.course.id)}
                                                                    className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20 flex items-center justify-center transition ml-2 shrink-0"
                                                                    title="Remove course"
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        ))}
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
            )}

            {!selectedProgram && programs.length > 0 && (
                <div className="text-center py-16">
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>Select a program above to view its curriculum map.</p>
                </div>
            )}

            {/* Add Course Modal */}
            {addModal && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--bg-border)" }}>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Add Course</h2>
                                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                                    Level {addModal.level} — Semester {addModal.semester}
                                </p>
                            </div>
                            <button onClick={() => setAddModal(null)} className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:bg-slate-500/10 text-xl" style={{ color: "var(--text-muted)" }}>×</button>
                        </div>

                        <input
                            type="text"
                            value={courseSearch}
                            onChange={e => setCourseSearch(e.target.value)}
                            placeholder="Search by course code or title..."
                            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500/30 mb-3 transition"
                            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)", color: "var(--text-primary)" }}
                            autoFocus
                        />

                        <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                            {unmappedCourses.length === 0 ? (
                                <p className="text-sm italic text-center py-8" style={{ color: "var(--text-muted)" }}>
                                    {courseSearch ? "No matching courses found." : "All courses are already mapped."}
                                </p>
                            ) : (
                                unmappedCourses.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => handleAddCourse(c.id)}
                                        disabled={saving}
                                        className="w-full flex items-center justify-between p-3 rounded-xl border text-left transition hover:border-blue-500 hover:bg-blue-500/5 group disabled:opacity-50"
                                        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}
                                    >
                                        <div>
                                            <div className="text-sm font-semibold group-hover:text-blue-500 transition" style={{ color: "var(--text-primary)" }}>{c.title}</div>
                                            <div className="text-[10px] font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>{c.code}</div>
                                        </div>
                                        <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0 ml-3">
                                            {c.credits} cr
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* New Program Modal */}
            {showNewProgram && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--bg-border)" }}>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>New Academic Program</h2>
                            <button onClick={() => setShowNewProgram(false)} className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:bg-slate-500/10 text-xl" style={{ color: "var(--text-muted)" }}>×</button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>Program Name</label>
                                <input type="text" value={newProgram.name} onChange={e => setNewProgram({ ...newProgram, name: e.target.value })} placeholder="e.g. BTech Computer Science" className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500/30 transition" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)", color: "var(--text-primary)" }} autoFocus />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>Program Code</label>
                                <input type="text" value={newProgram.code} onChange={e => setNewProgram({ ...newProgram, code: e.target.value.toUpperCase() })} placeholder="e.g. BTECH_CS" className="w-full px-4 py-2.5 rounded-xl border text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500/30 transition" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)", color: "var(--text-primary)" }} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>Description (optional)</label>
                                <textarea value={newProgram.description} onChange={e => setNewProgram({ ...newProgram, description: e.target.value })} rows={2} className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500/30 resize-none transition" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)", color: "var(--text-primary)" }} />
                            </div>
                            <button onClick={handleCreateProgram} disabled={saving || !newProgram.name || !newProgram.code} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition shadow-lg shadow-blue-500/20 disabled:opacity-50">
                                {saving ? "Creating..." : "Create Program"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Custom Modal */}
            {customModal && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--bg-border)" }}>
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: customModal.type === "alert" ? "var(--bg-hover)" : "var(--bg-hover)" }}>
                            {customModal.type === "alert" ? <AlertTriangle className="w-6 h-6" /> : <HelpCircle className="w-6 h-6" />}
                        </div>
                        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>{customModal.title}</h2>
                        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>{customModal.message}</p>
                        
                        {customModal.type === "alert" ? (
                            <button
                                onClick={() => setCustomModal(null)}
                                className="w-full py-2.5 rounded-xl font-bold transition text-white"
                                style={{ backgroundColor: "var(--primary)" }}
                            >
                                OK
                            </button>
                        ) : (
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setCustomModal(null)}
                                    className="flex-1 py-2.5 rounded-xl font-bold transition border"
                                    style={{ borderColor: "var(--bg-border)", color: "var(--text-primary)" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        if (customModal.onConfirm) customModal.onConfirm();
                                    }}
                                    className="flex-1 py-2.5 rounded-xl font-bold transition bg-red-600 hover:bg-red-500 text-white"
                                >
                                    Confirm
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
