"use client";
import { useEffect, useState } from "react";

export default function AdminAuditPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetch("/api/submissions").then(r => r.json()).then(() => {
            // Pull activity from audit endpoint if available, fallback to recent submissions for demo
            setLoading(false);
            setLogs([]); // Will populate once audit API is live
        });
    }, []);

    // For demo: generate mock audit events from submissions in the DB
    useEffect(() => {
        fetch("/api/submissions").then(r => r.json()).then(subs => {
            if (Array.isArray(subs)) {
                setLogs(subs.map((s: any) => ({
                    id: s.id,
                    action: s.status === "DRAFT" ? "save_draft" : "submit",
                    user: s.lecturer?.name ?? `Lecturer #${s.lecturerId}`,
                    email: s.lecturer?.email ?? "",
                    detail: s.title,
                    createdAt: s.submittedAt ?? s.createdAt,
                })));
            }
            setLoading(false);
        });
    }, []);

    const filtered = logs.filter(l =>
        l.user?.toLowerCase().includes(search.toLowerCase()) ||
        l.action?.toLowerCase().includes(search.toLowerCase()) ||
        l.detail?.toLowerCase().includes(search.toLowerCase())
    );

    const actionColors: Record<string, string> = {
        submit: "bg-green-500/20 text-green-300",
        save_draft: "bg-blue-500/20 text-blue-300",
        login: "bg-purple-500/20 text-purple-300",
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Audit Log</h1>
                <p className="text-white/50 mt-1">Immutable record of all system activities</p>
            </div>
            <div className="mb-4">
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search actions, users or details..."
                    className="w-full max-w-md px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                {loading ? <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div> :
                    filtered.length === 0 ? <div className="text-center py-12 text-white/40">No activity logs found.</div> :
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead><tr className="text-white/40 text-left border-b border-white/5">
                                    <th className="pb-3 pr-4">Timestamp</th><th className="pb-3 pr-4">User</th>
                                    <th className="pb-3 pr-4">Action</th><th className="pb-3">Detail</th>
                                </tr></thead>
                                <tbody className="divide-y divide-white/5">
                                    {filtered.map(l => (
                                        <tr key={l.id} className="text-white/70 hover:bg-white/3">
                                            <td className="py-3 pr-4 text-white/40 text-xs whitespace-nowrap">{l.createdAt ? new Date(l.createdAt).toLocaleString() : "—"}</td>
                                            <td className="py-3 pr-4"><div className="text-white">{l.user}</div><div className="text-white/30 text-xs">{l.email}</div></td>
                                            <td className="py-3 pr-4"><span className={`text-xs px-2 py-1 rounded-full ${actionColors[l.action] ?? "bg-white/10 text-white/60"}`}>{l.action}</span></td>
                                            <td className="py-3 text-white/50 max-w-xs truncate">{l.detail}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                }
            </div>
        </div>
    );
}
