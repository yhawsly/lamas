"use client";
import { useEffect, useState } from "react";
import SearchableSelect from "@/components/ui/SearchableSelect";

export default function AdminLecturersPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Modal state for creating user
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", role: "LECTURER", departmentId: "" });
    const [departments, setDepartments] = useState<any[]>([]);
    const [actionLoading, setActionLoading] = useState(false);
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");

    const fetchData = () => {
        fetch("/api/admin/analytics")
            .then(r => r.ok ? r.json().catch(() => ({ scores: [] })) : ({ scores: [] }))
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { 
        fetchData();
        fetch("/api/admin/departments")
            .then(r => r.ok ? r.json().catch(() => []) : [])
            .then(d => setDepartments(Array.isArray(d) ? d : []))
            .catch(() => setDepartments([]));
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const res = await fetch("/api/admin/users", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(createForm),
            });
            if (res.ok) {
                setIsCreateModalOpen(false);
                setCreateForm({ name: "", email: "", password: "", role: "LECTURER", departmentId: "" });
                fetchData(); // Refresh list after adding
            } else {
                const data = await res.json();
                setAlertMessage(data.error || "Failed to create user.");
                setIsAlertModalOpen(true);
            }
        } catch {
            setAlertMessage("An error occurred.");
            setIsAlertModalOpen(true);
        } finally { setActionLoading(false); }
    };

    const scores = (data?.scores ?? []).filter((s: any) =>
        s.lecturerName.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase()) ||
        s.department.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Lecturers</h1>
                    <p className="mt-1" style={{ color: "var(--text-muted)" }}>All active lecturers and their compliance scores</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all hover:opacity-90 active:scale-95 text-white"
                    style={{ backgroundColor: "var(--primary)" }}
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add Lecturer
                </button>
            </div>
            <div className="mb-4">
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email or department..."
                    className="w-full max-w-md px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} />
            </div>
            <div className="rounded-2xl p-6" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                {loading ? <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="text-left border-b" style={{ color: "var(--text-muted)", borderBottomColor: "var(--bg-border)" }}>
                                <th className="pb-3 pr-4">Lecturer</th><th className="pb-3 pr-4">Department</th>
                                <th className="pb-3 pr-4">Compliance</th><th className="pb-3 pr-4">Submitted</th>
                                <th className="pb-3 pr-4">Late</th><th className="pb-3">Status</th>
                            </tr></thead>
                            <tbody className="divide-y" style={{ borderBottomColor: "var(--bg-border)" }}>
                                {scores.map((s: any) => (
                                    <tr key={s.lecturerId} style={{ color: "var(--text-secondary)", borderBottomColor: "var(--bg-border)" }}>
                                        <td className="py-3 pr-4"><div style={{ color: "var(--text-primary)" }} className="font-medium">{s.lecturerName}</div><div className="text-xs" style={{ color: "var(--text-muted)" }}>{s.email}</div></td>
                                        <td className="py-3 pr-4" style={{ color: "var(--text-muted)" }}>{s.department}</td>
                                        <td className="py-3 pr-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-1.5 rounded-full" style={{ backgroundColor: "var(--bg-border)" }}><div className="h-1.5 rounded-full" style={{ width: `${s.score}%`, backgroundColor: s.score >= 70 ? "#10b981" : "#ef4444" }} /></div>
                                                <span style={{ color: s.score >= 70 ? "#10b981" : "#ef4444" }}>{s.score}%</span>
                                            </div>
                                        </td>
                                        <td className="py-3 pr-4" style={{ color: "#10b981" }}>{s.submitted}</td>
                                        <td className="py-3 pr-4" style={{ color: "#ef4444" }}>{s.late}</td>
                                        <td className="py-3">{s.isAtRisk ? <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "rgba(239, 68, 68, 0.2)", color: "#ef4444" }}>At Risk</span> : <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "rgba(16, 185, 129, 0.2)", color: "#10b981" }}>Good</span>}</td>
                                    </tr>
                                ))}
                                {scores.length === 0 && <tr><td colSpan={6} className="py-12 text-center" style={{ color: "var(--text-muted)" }}>No lecturers found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create User Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl shadow-xl flex flex-col" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                        <div className="px-6 py-4 border-b rounded-t-2xl" style={{ borderColor: "var(--bg-border)" }}>
                            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Add New Lecturer</h2>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Full Name</label>
                                <input required value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} type="text" className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} placeholder="e.g. Dr. Jane Doe" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Email Address</label>
                                <input required value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} type="email" className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} placeholder="jane.doe@university.edu" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Password</label>
                                <input required value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} type="password" minLength={6} className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} placeholder="Enter a secure password" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Role</label>
                                    <SearchableSelect
                                        value={createForm.role}
                                        onChange={(val) => setCreateForm({ ...createForm, role: String(val) })}
                                        options={[
                                            { label: "Lecturer", value: "LECTURER" },
                                            { label: "Head of Department", value: "HOD" },
                                        ]}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Department</label>
                                    <SearchableSelect
                                        value={createForm.departmentId}
                                        onChange={(val) => setCreateForm({ ...createForm, departmentId: String(val) })}
                                        options={[
                                            { label: "None", value: "" },
                                            ...departments.map(d => ({ label: d.name, value: String(d.id) }))
                                        ]}
                                        placeholder="Select Dept..."
                                    />
                                </div>
                            </div>
                            <div className="pt-4 flex items-center justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ color: "var(--text-secondary)" }}>Cancel</button>
                                <button type="submit" disabled={actionLoading} className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 rounded-b-2xl" style={{ backgroundColor: "var(--primary)" }}>
                                    {actionLoading ? "Creating..." : "Create Lecturer"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Alert Modal */}
            {isAlertModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-2xl shadow-xl overflow-hidden p-6 text-center" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "var(--bg-hover)", color: "var(--text-primary)" }}>
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>Notice</h3>
                        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>{alertMessage}</p>
                        <button onClick={() => setIsAlertModalOpen(false)} className="w-full px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "var(--primary)" }}>
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
