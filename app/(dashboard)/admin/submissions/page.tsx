"use client";
import { useEffect, useState } from "react";
import SearchableSelect from "@/components/ui/SearchableSelect";

const statusColors: Record<string, string> = {
    SUBMITTED: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300",
    LATE: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
    PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300",
    DRAFT: "bg-slate-100 text-slate-800 dark:bg-slate-500/20 dark:text-slate-300",
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
                <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>All Submissions</h1>
                <p className="mt-1" style={{ color: "var(--text-muted)" }}>Review and monitor all lecturer submissions</p>
            </div>

            <div className="flex flex-wrap gap-3 mb-6 items-center">
                <div className="w-44">
                    <SearchableSelect
                        value={filter.status}
                        onChange={val => setFilter(f => ({ ...f, status: String(val) }))}
                        placeholder="All Statuses"
                        options={[
                            { label: "All Statuses", value: "" },
                            { label: "Submitted", value: "SUBMITTED" },
                            { label: "Late", value: "LATE" },
                            { label: "Pending", value: "PENDING" },
                            { label: "Draft", value: "DRAFT" },
                        ]}
                    />
                </div>
                <div className="w-52">
                    <SearchableSelect
                        value={filter.type}
                        onChange={val => setFilter(f => ({ ...f, type: String(val) }))}
                        placeholder="All Types"
                        options={[
                            { label: "All Types", value: "" },
                            { label: "Semester Calendar", value: "SEMESTER_CALENDAR" },
                            { label: "Course Topics", value: "COURSE_TOPICS" },
                            { label: "Observation Report", value: "OBSERVATION_REPORT" },
                        ]}
                    />
                </div>
                <span className="text-sm" style={{ color: "var(--text-muted)", marginLeft: "auto" }}>{submissions.length} records</span>
            </div>

            <div className="rounded-2xl p-6" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                {loading ? (
                    <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>
                ) : submissions.length === 0 ? (
                    <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>No submissions found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left border-b" style={{ color: "var(--text-muted)", borderBottomColor: "var(--bg-border)" }}>
                                    <th className="pb-3 pr-4">Lecturer</th>
                                    <th className="pb-3 pr-4">Department</th>
                                    <th className="pb-3 pr-4">Title</th>
                                    <th className="pb-3 pr-4">Type</th>
                                    <th className="pb-3 pr-4">Status</th>
                                    <th className="pb-3">Submitted</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ borderTopColor: "var(--bg-border)" }}>
                                {submissions.map(s => (
                                    <tr key={s.id} style={{ color: "var(--text-secondary)", borderBottomColor: "var(--bg-border)" }}>
                                        <td className="py-3 pr-4">
                                            <div className="font-medium" style={{ color: "var(--text-primary)" }}>{s.lecturer?.name ?? "—"}</div>
                                            <div className="text-xs" style={{ color: "var(--text-muted)" }}>{s.lecturer?.email}</div>
                                        </td>
                                        <td className="py-3 pr-4" style={{ color: "var(--text-muted)" }}>{s.lecturer?.department?.name ?? "—"}</td>
                                        <td className="py-3 pr-4 max-w-xs truncate">{s.title}</td>
                                        <td className="py-3 pr-4 text-xs" style={{ color: "var(--text-muted)" }}>{s.type?.replace(/_/g, " ")}</td>
                                        <td className="py-3 pr-4">
                                            <span className="text-xs px-2 py-1 rounded-full" style={statusColors[s.status] ? { backgroundColor: statusColors[s.status].split(" ")[0].replace("bg-", "").replace("text-", ""), color: statusColors[s.status].split(" ")[1].replace("text-", "") } : {}}>{s.status}</span>
                                        </td>
                                        <td className="py-3" style={{ color: "var(--text-muted)" }}>{s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : "—"}</td>
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
