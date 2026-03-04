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
                <h1 className="text-3xl font-bold text-white">Lecturers</h1>
                <p className="text-white/50 mt-1">All active lecturers and their compliance scores</p>
            </div>
            <div className="mb-4">
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email or department..."
                    className="w-full max-w-md px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                {loading ? <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="text-white/40 text-left border-b border-white/5">
                                <th className="pb-3 pr-4">Lecturer</th><th className="pb-3 pr-4">Department</th>
                                <th className="pb-3 pr-4">Compliance</th><th className="pb-3 pr-4">Submitted</th>
                                <th className="pb-3 pr-4">Late</th><th className="pb-3">Status</th>
                            </tr></thead>
                            <tbody className="divide-y divide-white/5">
                                {scores.map((s: any) => (
                                    <tr key={s.lecturerId} className="text-white/70 hover:bg-white/3">
                                        <td className="py-3 pr-4"><div className="text-white font-medium">{s.lecturerName}</div><div className="text-white/30 text-xs">{s.email}</div></td>
                                        <td className="py-3 pr-4 text-white/50">{s.department}</td>
                                        <td className="py-3 pr-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-1.5 rounded-full bg-white/10"><div className={`h-1.5 rounded-full ${s.score >= 70 ? "bg-green-500" : "bg-red-500"}`} style={{ width: `${s.score}%` }} /></div>
                                                <span className={s.score >= 70 ? "text-green-400" : "text-red-400"}>{s.score}%</span>
                                            </div>
                                        </td>
                                        <td className="py-3 pr-4 text-green-400">{s.submitted}</td>
                                        <td className="py-3 pr-4 text-red-400">{s.late}</td>
                                        <td className="py-3">{s.isAtRisk ? <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-300">At Risk</span> : <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-300">Good</span>}</td>
                                    </tr>
                                ))}
                                {scores.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-white/40">No lecturers found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
