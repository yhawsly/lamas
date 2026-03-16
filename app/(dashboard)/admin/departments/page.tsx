"use client";

import { useState, useEffect } from "react";

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ name: "", code: "" });
    const [msg, setMsg] = useState("");

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/departments");
            if (res.ok) {
                const data = await res.json();
                setDepartments(data);
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchDepartments();
    }, []);

    const createDepartment = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg("");
        try {
            const res = await fetch("/api/admin/departments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                setMsg("✅ Department created successfully");
                setForm({ name: "", code: "" });
                fetchDepartments();
            } else {
                const data = await res.json();
                setMsg("❌ Error: " + (data.error || "Failed to create department"));
            }
        } catch (e: any) {
            setMsg("❌ Error: " + e.message);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
            <header className="flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Departments</h1>
                    <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
                        Manage University Departments.
                    </p>
                </div>
            </header>

            {msg && (
                <div className="p-4 rounded-xl text-sm border" style={{
                    backgroundColor: msg.startsWith("✅") ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                    borderColor: msg.startsWith("✅") ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)",
                    color: msg.startsWith("✅") ? "#10b981" : "#ef4444"
                }}>
                    {msg}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Form */}
                <div className="lg:col-span-1 border rounded-2xl p-6 shadow-sm h-fit sticky top-8" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                    <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>Add Department</h2>
                    <form onSubmit={createDepartment} className="space-y-4">
                        <div>
                            <label className="block text-sm mb-1.5 font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Department Name</label>
                            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                                placeholder="Computer Science"
                                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} />
                        </div>
                        <div>
                            <label className="block text-sm mb-1.5 font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Code</label>
                            <input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} required
                                placeholder="CS"
                                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 uppercase" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} />
                        </div>
                        <button type="submit" className="w-full py-3 rounded-xl text-sm font-semibold transition-transform active:scale-[0.98] text-white flex items-center justify-center gap-2"
                            style={{ background: "linear-gradient(135deg, var(--primary) 0%, #4338ca 100%)" }}>
                            <span>➕ Add Department</span>
                        </button>
                    </form>
                </div>

                {/* List */}
                <div className="lg:col-span-2 border rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead style={{ backgroundColor: "var(--bg-hover)", borderBottom: "1px solid var(--bg-border)" }}>
                                <tr>
                                    <th className="px-6 py-4 font-semibold" style={{ color: "var(--text-secondary)" }}>Code</th>
                                    <th className="px-6 py-4 font-semibold" style={{ color: "var(--text-secondary)" }}>Name</th>
                                    <th className="px-6 py-4 font-semibold" style={{ color: "var(--text-secondary)" }}>Lecturers</th>
                                    <th className="px-6 py-4 font-semibold" style={{ color: "var(--text-secondary)" }}>Courses</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--bg-border)]">
                                {loading ? (
                                    <tr><td colSpan={4} className="p-8 text-center" style={{ color: "var(--text-muted)" }}>Loading departments...</td></tr>
                                ) : departments.length === 0 ? (
                                    <tr><td colSpan={4} className="p-8 text-center" style={{ color: "var(--text-muted)" }}>No Departments found.</td></tr>
                                ) : (
                                    departments.map(d => (
                                        <tr key={d.id} className="transition-colors hover:bg-[var(--bg-hover)]">
                                            <td className="px-6 py-4 font-bold" style={{ color: "var(--primary)" }}>{d.code}</td>
                                            <td className="px-6 py-4 font-medium" style={{ color: "var(--text-primary)" }}>{d.name}</td>
                                            <td className="px-6 py-4" style={{ color: "var(--text-muted)" }}>{d._count?.users || 0}</td>
                                            <td className="px-6 py-4" style={{ color: "var(--text-muted)" }}>{d._count?.courses || 0}</td>
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
