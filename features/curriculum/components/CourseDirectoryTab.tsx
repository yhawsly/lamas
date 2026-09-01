"use client";
import { BookOpen, HelpCircle, BookPlus, CheckCircle2, AlertCircle } from "lucide-react";

import { useState, useEffect } from "react";
import SearchableSelect from "@/components/ui/SearchableSelect";
import RefreshButton from "@/components/ui/RefreshButton";

export default function CourseDirectoryTab() {
    const [courses, setCourses] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ code: "", title: "", credits: "3", departmentId: "" });
    const [msg, setMsg] = useState("");
    const [customModal, setCustomModal] = useState<{ isOpen: boolean; type: "alert" | "confirm"; title: string; message: string; onConfirm?: () => void } | null>(null);
    const showConfirm = (title: string, message: string, onConfirm: () => void) => setCustomModal({ isOpen: true, type: "confirm", title, message, onConfirm });

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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchCourses();
        fetchDepartments();
    }, []);

    const createCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg("");

        if (!form.departmentId) {
            setMsg("Error: You must select a department."); return;
        }

        try {
            const res = await fetch("/api/courses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                setMsg("Course created successfully");
                setForm({ code: "", title: "", credits: "3", departmentId: "" });
                fetchCourses();
            } else {
                const data = await res.json();
                setMsg("Error: " + (data.error || "Failed to create course"));
            }
        } catch (e: any) {
            setMsg("Error: " + e.message);
        }
    };

    const deleteCourse = async (id: number) => {
        showConfirm("Delete Course", "Are you sure you want to delete this course?", async () => {
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

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            
            
            <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Course Management</h2>
                    <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
                        Add and manage subject configurations for the curriculum.
                    </p>
                </div>
            </header>

            {msg && (
                <div className={`p-4 rounded-xl text-sm border flex items-center gap-2.5 font-semibold ${!msg.toLowerCase().includes("error") && !msg.toLowerCase().includes("failed") ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"}`}>
                    {!msg.toLowerCase().includes("error") && !msg.toLowerCase().includes("failed") ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                    <span>{msg.replace(/^Error:\s*/i, "")}</span>
                </div>
            )}

            <div className="space-y-6">
                {/* Create Form - Row Aligned */}
                <div className="border rounded-2xl p-6 shadow-sm" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                    <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>New Course</h2>
                    <form onSubmit={createCourse} className="flex flex-col lg:flex-row gap-4 items-end">
                        <div className="flex-1 w-full min-w-[140px]">
                            <label htmlFor="course-code" className="block text-[10px] mb-1.5 font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Course Code (e.g. COMP101)</label>
                            <input id="course-code" name="code" type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} required
                                placeholder="CS101"
                                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 uppercase" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} />
                        </div>
                        <div className="flex-[2] w-full min-w-[200px]">
                            <label htmlFor="course-title" className="block text-[10px] mb-1.5 font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Course Title</label>
                            <input id="course-title" name="title" type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required
                                placeholder="Intro to Programming"
                                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} />
                        </div>
                        <div className="w-full lg:w-24">
                            <label htmlFor="course-credits" className="block text-[10px] mb-1.5 font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Credits</label>
                            <input id="course-credits" name="credits" type="number" min="1" max="10" value={form.credits} onChange={e => setForm({ ...form, credits: e.target.value })} required
                                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} />
                        </div>
                        <div className="flex-[1.5] w-full min-w-[200px]">
                            <label className="block text-[10px] mb-1.5 font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Department</label>
                            <SearchableSelect
                                value={form.departmentId}
                                onChange={(val) => setForm({ ...form, departmentId: String(val) })}
                                options={departments.map(d => ({ label: d.name, value: String(d.id) }))}
                                placeholder="Select Department..."
                            />
                        </div>

                        <button type="submit" className="w-full lg:w-auto px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-105 active:scale-[0.98] text-white flex items-center justify-center gap-2 shrink-0 h-[42px] shadow-md shadow-blue-500/10"
                            style={{ background: "var(--primary)" }}>
                            <BookPlus className="w-4 h-4" />
                            <span>Add Course</span>
                        </button>
                    </form>
                </div>

                {/* List */}
                <div className="border rounded-2xl overflow-hidden shadow-sm flex flex-col" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Active Course Directory ({courses.length})</h3>
                        </div>
                        <RefreshButton
                            onClick={fetchCourses}
                            isRefreshing={loading}
                            label="Refresh"
                            size="sm"
                            variant="outline"
                            title="Reload course directory"
                        />
                    </div>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead style={{ backgroundColor: "var(--bg-hover)", borderBottom: "1px solid var(--bg-border)" }}>
                                <tr>
                                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]" style={{ color: "var(--text-muted)" }}>Code</th>
                                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]" style={{ color: "var(--text-muted)" }}>Title</th>
                                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]" style={{ color: "var(--text-muted)" }}>Dept. ID</th>
                                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px] text-right" style={{ color: "var(--text-muted)" }}>Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--bg-border)]">
                                {loading ? (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                                            <td className="px-6 py-4"><div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                                            <td className="px-6 py-4"><div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                                            <td className="px-6 py-4 text-right"><div className="h-6 w-6 ml-auto bg-slate-200 dark:bg-slate-800 rounded" /></td>
                                        </tr>
                                    ))
                                ) : courses.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-16 text-center">
                                            <div className="flex justify-center mb-4"><BookOpen className="w-10 h-10 text-gray-400" /></div>
                                            <div className="font-bold mb-1" style={{ color: "var(--text-primary)" }}>No Courses Configured</div>
                                            <div className="text-xs" style={{ color: "var(--text-muted)" }}>Use the panel to create the first course catalog entry.</div>
                                        </td>
                                    </tr>
                                ) : (
                                    courses.map(c => (
                                        <tr key={c.id} className="transition-colors group hover:bg-[var(--bg-hover)]">
                                            <td className="px-6 py-4 font-black tracking-tight" style={{ color: "var(--primary)" }}>{c.code}</td>
                                            <td className="px-6 py-4 font-medium" style={{ color: "var(--text-primary)" }}>{c.title}</td>
                                            <td className="px-6 py-4 text-xs font-mono" style={{ color: "var(--text-muted)" }}>#{c.departmentId}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => deleteCourse(c.id)}
                                                    className="w-8 h-8 rounded-lg inline-flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-rose-500 hover:bg-rose-500/10"
                                                    title="Delete Course"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Custom Modal */}
            {customModal && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--bg-border)" }}>
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "var(--bg-hover)" }}>
                            <HelpCircle className="w-6 h-6" style={{ color: "var(--primary)" }} />
                        </div>
                        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>{customModal.title}</h2>
                        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>{customModal.message}</p>
                        
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
                    </div>
                </div>
            )}
        </div>
    );
}
