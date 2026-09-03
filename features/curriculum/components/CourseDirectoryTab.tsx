"use client";
import { 
    BookOpen, 
    HelpCircle, 
    BookPlus, 
    CheckCircle2, 
    AlertCircle, 
    Search, 
    Building2, 
    GraduationCap, 
    Trash2,
    Layers
} from "lucide-react";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import SearchableSelect from "@/components/ui/SearchableSelect";
import RefreshButton from "@/components/ui/RefreshButton";

export default function CourseDirectoryTab() {
    const { data: session } = useSession();
    const userRole = (session?.user as any)?.role;
    const userDeptId = (session?.user as any)?.departmentId;
    const isHod = userRole === "HOD";

    const [courses, setCourses] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ code: "", title: "", credits: "3", departmentId: "" });
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDeptFilter, setSelectedDeptFilter] = useState("ALL");
    const [msg, setMsg] = useState("");
    const [customModal, setCustomModal] = useState<{ isOpen: boolean; type: "alert" | "confirm"; title: string; message: string; onConfirm?: () => void } | null>(null);
    const showConfirm = (title: string, message: string, onConfirm: () => void) => setCustomModal({ isOpen: true, type: "confirm", title, message, onConfirm });

    useEffect(() => {
        if (isHod && userDeptId) {
            setForm(prev => ({ ...prev, departmentId: String(userDeptId) }));
        }
    }, [isHod, userDeptId]);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/courses");
            if (res.ok) setCourses(await res.json());
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const fetchDepartments = async () => {
        try {
            const res = await fetch("/api/admin/departments");
            if (res.ok) setDepartments(await res.json());
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchCourses();
        fetchDepartments();
    }, []);

    const createCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg("");

        const targetDeptId = isHod ? (userDeptId || form.departmentId) : form.departmentId;

        if (!targetDeptId) {
            setMsg("Error: You must select a department.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/courses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    departmentId: targetDeptId
                })
            });
            if (res.ok) {
                setMsg("Course created successfully");
                setForm({ code: "", title: "", credits: "3", departmentId: isHod ? String(userDeptId) : "" });
                fetchCourses();
            } else {
                const data = await res.json();
                setMsg("Error: " + (data.error || "Failed to create course"));
            }
        } catch (e: any) {
            setMsg("Error: " + e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const deleteCourse = async (id: number) => {
        showConfirm("Delete Course", "Are you sure you want to delete this course from the curriculum?", async () => {
            setCustomModal(null);
            setMsg("");
            try {
                const res = await fetch(`/api/courses/${id}`, { method: "DELETE" });
                if (res.ok) {
                    setMsg("Course deleted successfully");
                    fetchCourses();
                } else {
                    const data = await res.json();
                    setMsg("Error: " + (data.error || "Failed to delete course"));
                }
            } catch (e: any) {
                setMsg("Error: " + e.message);
            }
        });
    };

    const deptMap = useMemo(() => {
        const map = new Map<number, string>();
        departments.forEach(d => map.set(d.id, d.name));
        return map;
    }, [departments]);

    const filteredCourses = useMemo(() => {
        return courses.filter(c => {
            const deptName = c.department?.name || deptMap.get(c.departmentId) || "";
            const matchesQuery = 
                !searchQuery.trim() ||
                c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                deptName.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesDept = 
                selectedDeptFilter === "ALL" || 
                String(c.departmentId) === selectedDeptFilter;

            return matchesQuery && matchesDept;
        });
    }, [courses, searchQuery, selectedDeptFilter, deptMap]);

    const totalCredits = useMemo(() => {
        return courses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);
    }, [courses]);

    const uniqueDeptsCount = useMemo(() => {
        return new Set(courses.map(c => c.departmentId).filter(Boolean)).size;
    }, [courses]);

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
            {/* Page Sub-Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
                        Course Management
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>
                        Add and manage subject configurations for the curriculum.
                    </p>
                </div>
                
                {/* Stats Chips */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <div 
                        className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 shadow-xs"
                        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)", color: "var(--text-primary)" }}
                    >
                        <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                        <span>{courses.length} Courses</span>
                    </div>
                    {!isHod && (
                        <div 
                            className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 shadow-xs"
                            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)", color: "var(--text-primary)" }}
                        >
                            <Building2 className="w-3.5 h-3.5 text-violet-500" />
                            <span>{uniqueDeptsCount} Departments</span>
                        </div>
                    )}
                    <div 
                        className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 shadow-xs"
                        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)", color: "var(--text-primary)" }}
                    >
                        <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{totalCredits} Total Credits</span>
                    </div>
                </div>
            </div>

            {/* Notification message */}
            {msg && (
                <div className={`p-4 rounded-2xl text-sm border flex items-center gap-3 font-semibold shadow-xs animate-in slide-in-from-top-2 duration-300 ${
                    !msg.toLowerCase().includes("error") && !msg.toLowerCase().includes("failed") 
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" 
                        : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
                }`}>
                    {!msg.toLowerCase().includes("error") && !msg.toLowerCase().includes("failed") ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : (
                        <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    )}
                    <span className="flex-1">{msg.replace(/^Error:\s*/i, "")}</span>
                    <button 
                        onClick={() => setMsg("")}
                        className="text-xs font-bold opacity-60 hover:opacity-100 transition-opacity uppercase tracking-wider"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Form Card: New Course */}
            <div 
                className="rounded-2xl sm:rounded-3xl border p-5 sm:p-7 shadow-sm transition-all"
                style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}
            >
                <div className="flex items-center gap-3 mb-6 pb-4 border-b" style={{ borderColor: "var(--bg-border)" }}>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <BookPlus className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>New Course</h3>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {isHod ? "Register an accredited subject for your department curriculum." : "Register an accredited subject and assign it to an academic department."}
                        </p>
                    </div>
                </div>

                <form onSubmit={createCourse} className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                        {/* Course Code */}
                        <div className="w-full sm:w-40 md:w-48 shrink-0">
                            <label htmlFor="course-code" className="block text-[11px] mb-1.5 font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                                Course Code <span className="text-rose-500">*</span>
                            </label>
                            <input 
                                id="course-code" 
                                name="code" 
                                type="text" 
                                value={form.code} 
                                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} 
                                required
                                placeholder="e.g. CS101"
                                className="w-full h-11 px-4 rounded-xl text-sm font-bold uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition shadow-xs" 
                                style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} 
                            />
                        </div>

                        {/* Course Title */}
                        <div className="w-full sm:flex-1 min-w-0">
                            <label htmlFor="course-title" className="block text-[11px] mb-1.5 font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                                Course Title <span className="text-rose-500">*</span>
                            </label>
                            <input 
                                id="course-title" 
                                name="title" 
                                type="text" 
                                value={form.title} 
                                onChange={e => setForm({ ...form, title: e.target.value })} 
                                required
                                placeholder="e.g. Intro to Programming"
                                className="w-full h-11 px-4 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition shadow-xs" 
                                style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} 
                            />
                        </div>

                        {/* Credits */}
                        <div className="w-full sm:w-28 md:w-32 shrink-0">
                            <label htmlFor="course-credits" className="block text-[11px] mb-1.5 font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                                Credits <span className="text-rose-500">*</span>
                            </label>
                            <input 
                                id="course-credits" 
                                name="credits" 
                                type="number" 
                                min="1" 
                                max="10" 
                                value={form.credits} 
                                onChange={e => setForm({ ...form, credits: e.target.value })} 
                                required
                                className="w-full h-11 px-4 rounded-xl text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition shadow-xs" 
                                style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} 
                            />
                        </div>

                        {/* Department - Only shown for Admin */}
                        {!isHod && (
                            <div className="w-full sm:w-56 md:w-64 shrink-0">
                                <label className="block text-[11px] mb-1.5 font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                                    Department <span className="text-rose-500">*</span>
                                </label>
                                <SearchableSelect
                                    value={form.departmentId}
                                    onChange={(val) => setForm({ ...form, departmentId: String(val) })}
                                    options={departments.map(d => ({ label: d.name, value: String(d.id) }))}
                                    placeholder="Select Department..."
                                    className="w-full"
                                />
                            </div>
                        )}
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t" style={{ borderColor: "var(--bg-border)" }}>
                        <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                            Course codes must be unique across all institutional programs.
                        </p>
                        <button 
                            type="submit" 
                            disabled={submitting}
                            className="w-full sm:w-auto px-7 h-11 rounded-xl text-sm font-bold transition-all hover:brightness-105 active:scale-[0.98] text-white flex items-center justify-center gap-2 shrink-0 shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
                            style={{ backgroundColor: "var(--primary)" }}
                        >
                            <BookPlus className="w-4 h-4" />
                            <span>{submitting ? "Adding Course..." : "Add Course"}</span>
                        </button>
                    </div>
                </form>
            </div>

            {/* Course Directory Table Section */}
            <div 
                className="rounded-2xl sm:rounded-3xl border overflow-hidden shadow-sm flex flex-col transition-all"
                style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}
            >
                {/* Table Header & Controls Bar */}
                <div className="p-4 sm:p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ borderColor: "var(--bg-border)" }}>
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm sm:text-base leading-tight" style={{ color: "var(--text-primary)" }}>
                                Active Course Directory ({filteredCourses.length})
                            </h3>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                Master catalog of academic units and faculty offerings
                            </p>
                        </div>
                    </div>

                    {/* Filters & Actions */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        {/* Search Input */}
                        <div className="relative min-w-[220px]">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search code, title, dept..."
                                className="w-full h-10 pl-9.5 pr-4 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition border"
                                style={{ backgroundColor: "var(--bg-hover)", borderColor: "var(--bg-border)", color: "var(--text-primary)" }}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Department Filter - only for Admin */}
                        {!isHod && (
                            <div className="min-w-[160px]">
                                <select
                                    value={selectedDeptFilter}
                                    onChange={e => setSelectedDeptFilter(e.target.value)}
                                    className="w-full h-10 px-3 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition border cursor-pointer"
                                    style={{ backgroundColor: "var(--bg-hover)", borderColor: "var(--bg-border)", color: "var(--text-primary)" }}
                                >
                                    <option value="ALL">All Departments</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={String(d.id)}>
                                            {d.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <RefreshButton
                            onClick={fetchCourses}
                            isRefreshing={loading}
                            label="Refresh"
                            size="sm"
                            variant="outline"
                            title="Reload course directory"
                        />
                    </div>
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead style={{ backgroundColor: "var(--bg-hover)", borderBottom: "1px solid var(--bg-border)" }}>
                            <tr>
                                <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-[10px]" style={{ color: "var(--text-muted)" }}>Course Code</th>
                                <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-[10px]" style={{ color: "var(--text-muted)" }}>Course Title</th>
                                <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-[10px]" style={{ color: "var(--text-muted)" }}>Department</th>
                                <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-[10px] text-center" style={{ color: "var(--text-muted)" }}>Credits</th>
                                <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-[10px] text-center" style={{ color: "var(--text-muted)" }}>Sections</th>
                                <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-[10px] text-right" style={{ color: "var(--text-muted)" }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-52 bg-slate-200 dark:bg-slate-800 rounded-lg" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" /></td>
                                        <td className="px-6 py-4 text-center"><div className="h-4 w-12 mx-auto bg-slate-200 dark:bg-slate-800 rounded-lg" /></td>
                                        <td className="px-6 py-4 text-center"><div className="h-4 w-12 mx-auto bg-slate-200 dark:bg-slate-800 rounded-lg" /></td>
                                        <td className="px-6 py-4 text-right"><div className="h-7 w-7 ml-auto bg-slate-200 dark:bg-slate-800 rounded-lg" /></td>
                                    </tr>
                                ))
                            ) : filteredCourses.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-16 px-6 text-center">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                                            <BookOpen className="w-6 h-6" />
                                        </div>
                                        <div className="font-bold text-sm mb-1" style={{ color: "var(--text-primary)" }}>
                                            {searchQuery || selectedDeptFilter !== "ALL" ? "No matching courses found" : "No Courses Configured"}
                                        </div>
                                        <div className="text-xs max-w-sm mx-auto" style={{ color: "var(--text-muted)" }}>
                                            {searchQuery || selectedDeptFilter !== "ALL"
                                                ? "Try adjusting your search query or department filter."
                                                : "Use the form above to register the first course offering in the curriculum."}
                                        </div>
                                        {(searchQuery || selectedDeptFilter !== "ALL") && (
                                            <button
                                                onClick={() => {
                                                    setSearchQuery("");
                                                    setSelectedDeptFilter("ALL");
                                                }}
                                                className="mt-4 px-4 py-1.5 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 transition"
                                            >
                                                Reset Filters
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                filteredCourses.map(c => {
                                    const deptName = c.department?.name || deptMap.get(c.departmentId) || `Department #${c.departmentId}`;
                                    const sectionsCount = Array.isArray(c.sections) ? c.sections.length : 0;

                                    return (
                                        <tr key={c.id} className="transition-colors group hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                                            {/* Code */}
                                            <td className="px-6 py-4">
                                                <span 
                                                    className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black tracking-wide border shadow-2xs"
                                                    style={{ 
                                                        backgroundColor: "rgba(59, 130, 246, 0.08)", 
                                                        color: "var(--primary)",
                                                        borderColor: "rgba(59, 130, 246, 0.2)"
                                                    }}
                                                >
                                                    {c.code}
                                                </span>
                                            </td>

                                            {/* Title */}
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-sm leading-snug" style={{ color: "var(--text-primary)" }}>
                                                    {c.title}
                                                </div>
                                            </td>

                                            {/* Department */}
                                            <td className="px-6 py-4">
                                                <span 
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border"
                                                    style={{ 
                                                        backgroundColor: "var(--bg-hover)", 
                                                        borderColor: "var(--bg-border)",
                                                        color: "var(--text-primary)"
                                                    }}
                                                >
                                                    <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                                    <span className="truncate max-w-[200px]">{deptName}</span>
                                                </span>
                                            </td>

                                            {/* Credits */}
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                                    {c.credits || 3} Cr
                                                </span>
                                            </td>

                                            {/* Sections */}
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                    sectionsCount > 0 
                                                        ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" 
                                                        : "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                                }`}>
                                                    <Layers className="w-3 h-3" />
                                                    {sectionsCount} {sectionsCount === 1 ? "Section" : "Sections"}
                                                </span>
                                            </td>

                                            {/* Action */}
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => deleteCourse(c.id)}
                                                    className="w-8 h-8 rounded-xl inline-flex items-center justify-center transition-all text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 active:scale-95"
                                                    title={`Delete course ${c.code}`}
                                                    aria-label={`Delete ${c.code}`}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Confirmation Modal */}
            {customModal && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--bg-border)" }}>
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-rose-500/10 text-rose-500">
                            <HelpCircle className="w-7 h-7" />
                        </div>
                        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>{customModal.title}</h2>
                        <p className="text-xs mb-6 leading-relaxed" style={{ color: "var(--text-muted)" }}>{customModal.message}</p>
                        
                        <div className="flex gap-3">
                            <button
                                onClick={() => setCustomModal(null)}
                                className="flex-1 py-2.5 rounded-xl text-xs font-bold transition border cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                                style={{ borderColor: "var(--bg-border)", color: "var(--text-primary)" }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (customModal.onConfirm) customModal.onConfirm();
                                }}
                                className="flex-1 py-2.5 rounded-xl text-xs font-bold transition bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 cursor-pointer"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

