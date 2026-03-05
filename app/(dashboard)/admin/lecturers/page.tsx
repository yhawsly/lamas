"use client";
import { useEffect, useState } from "react";

export default function AdminLecturersPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => { fetch("/api/admin/analytics").then(r => r.json()).then(d => { setData(d); setLoading(false); }); }, []);

    const scores = (data?.scores ?? []).filter((s: any) =>
        s.lecturerName.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase()) ||
        s.department.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Lecturers</h1>
                <p className="mt-1" style={{ color: "var(--text-muted)" }}>All active lecturers and their compliance scores</p>
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
        </div>
    );
}
