"use client";
import { useEffect, useState } from "react";

const statusColors: Record<string, string> = {
    SUBMITTED: "bg-green-500/20 text-green-300",
    LATE: "bg-red-500/20 text-red-300",
    PENDING: "bg-yellow-500/20 text-yellow-300",
    DRAFT: "bg-slate-500/20 text-slate-300",
};

export default function AdminSubmissionsPage() {
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ status: "", type: "" });

    useEffect(() => {
        const params = new URLSearchParams();
        if (filter.status) params.set("status", filter.status);
        if (filter.type) params.set("type", filter.type);
        fetch(`/api/submissions?${params}`).then(r => r.json()).then(d => { setSubmissions(Array.isArray(d) ? d : []); setLoading(false); });
    }, [filter]);

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">All Submissions</h1>
                <p className="text-white/50 mt-1">Review and monitor all lecturer submissions</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                    <option value="">All Statuses</option>
                    <option value="SUBMITTED">Submitted</option>
                    <option value="LATE">Late</option>
                    <option value="PENDING">Pending</option>
                    <option value="DRAFT">Draft</option>
                </select>
                <select value={filter.type} onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                    <option value="">All Types</option>
                    <option value="SEMESTER_CALENDAR">Semester Calendar</option>
                    <option value="COURSE_TOPICS">Course Topics</option>
                    <option value="OBSERVATION_REPORT">Observation Report</option>
                </select>
                <span className="ml-auto text-white/40 text-sm self-center">{submissions.length} records</span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                {loading ? (
                    <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div>
                ) : submissions.length === 0 ? (
                    <div className="text-center py-12 text-white/40">No submissions found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-white/40 text-left border-b border-white/5">
                                    <th className="pb-3 pr-4">Lecturer</th>
                                    <th className="pb-3 pr-4">Department</th>
                                    <th className="pb-3 pr-4">Title</th>
                                    <th className="pb-3 pr-4">Type</th>
                                    <th className="pb-3 pr-4">Status</th>
                                    <th className="pb-3">Submitted</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {submissions.map(s => (
                                    <tr key={s.id} className="text-white/70 hover:bg-white/3">
                                        <td className="py-3 pr-4">
                                            <div className="font-medium text-white">{s.lecturer?.name ?? "—"}</div>
                                            <div className="text-white/30 text-xs">{s.lecturer?.email}</div>
                                        </td>
                                        <td className="py-3 pr-4 text-white/50">{s.lecturer?.department?.name ?? "—"}</td>
                                        <td className="py-3 pr-4 max-w-xs truncate">{s.title}</td>
                                        <td className="py-3 pr-4 text-white/50 text-xs">{s.type?.replace(/_/g, " ")}</td>
                                        <td className="py-3 pr-4">
                                            <span className={`text-xs px-2 py-1 rounded-full ${statusColors[s.status] ?? ""}`}>{s.status}</span>
                                        </td>
                                        <td className="py-3 text-white/40">{s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
