"use client";

import { useState, useEffect } from "react";
import SearchableSelect from "@/components/ui/SearchableSelect";

export default function CoursesPage() {
    const [courses, setCourses] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ code: "", title: "", credits: "3", departmentId: "" });
    const [msg, setMsg] = useState("");

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
            setMsg("❌ Error: You must select a department."); return;
        }

        try {
            const res = await fetch("/api/courses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                setMsg("✅ Course created successfully");
                setForm({ code: "", title: "", credits: "3", departmentId: "" });
                fetchCourses();
            } else {
                const data = await res.json();
                setMsg("❌ Error: " + (data.error || "Failed to create course"));
            }
        } catch (e: any) {
            setMsg("❌ Error: " + e.message);
        }
    };

    const deleteCourse = async (id: number) => {
        if (!confirm("Are you sure you want to delete this course?")) return;
        setMsg("");
        try {
            const res = await fetch(`/api/courses/${id}`, { method: "DELETE" });
            if (res.ok) {
                setMsg("✅ Course deleted successfully");
                fetchCourses();
            } else {
                const data = await res.json();
                setMsg("❌ Error: " + (data.error || "Failed to delete course"));
            }
        } catch (e: any) {
            setMsg("❌ Error: " + e.message);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Course Management</h1>
                    <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
                        Add and manage subject configurations for the curriculum.
                    </p>
                </div>
            </header>

            {msg && (
                <div className={`p-4 rounded-xl text-sm border ${msg.startsWith("✅") ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : "bg-rose-500/10 border-rose-500/30 text-rose-500"}`}>
                    {msg}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Form */}
                <div className="lg:col-span-1 border rounded-2xl p-6 shadow-sm h-fit sticky top-8" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                    <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>New Course</h2>
                    <form onSubmit={createCourse} className="space-y-4">
                        <div>
                            <label className="block text-[10px] mb-1.5 font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Course Code (e.g. COMP101)</label>
                            <input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} required
                                placeholder="CS101"
                                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 uppercase" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} />
                        </div>
                        <div>
                            <label className="block text-[10px] mb-1.5 font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Course Title</label>
                            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required
                                placeholder="Intro to Programming"
                                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} />
                        </div>
                        <div>
                            <label className="block text-[10px] mb-1.5 font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Credits</label>
                            <input type="number" min="1" max="10" value={form.credits} onChange={e => setForm({ ...form, credits: e.target.value })} required
                                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} />
                        </div>
                        <div>
                            <label className="block text-[10px] mb-1.5 font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Department</label>
                            <SearchableSelect
                                value={form.departmentId}
                                onChange={(val) => setForm({ ...form, departmentId: String(val) })}
                                options={departments.map(d => ({ label: d.name, value: String(d.id) }))}
                                placeholder="Select Department..."
                            />
                        </div>

                        <button type="submit" className="w-full py-4 mt-2 rounded-xl text-sm font-bold transition-transform active:scale-[0.98] text-white flex items-center justify-center gap-2"
                            style={{ background: "var(--primary)", boxShadow: "0 4px 14px 0 rgba(0, 0, 0, 0.1)" }}>
                            <span>➕ Add Course</span>
                        </button>
                    </form>
                </div>

                {/* List */}
                <div className="lg:col-span-2 border rounded-2xl overflow-hidden shadow-sm flex flex-col" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
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
                                    <tr><td colSpan={4} className="p-8 text-center animate-pulse" style={{ color: "var(--text-primary)" }}>Loading courses...</td></tr>
                                ) : courses.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-16 text-center">
                                            <div className="text-4xl mb-4">📚</div>
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
        </div>
    );
}
