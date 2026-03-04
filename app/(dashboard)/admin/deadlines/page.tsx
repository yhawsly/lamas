"use client";
import { useEffect, useState } from "react";

export default function AdminDeadlinesPage() {
    const [deadlines, setDeadlines] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ type: "SEMESTER_CALENDAR", label: "", dueDate: "" });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState("");
    const [now, setNow] = useState<number | null>(null);

    useEffect(() => {
        fetch("/api/deadlines").then(r => r.json()).then(d => { setDeadlines(Array.isArray(d) ? d : []); setLoading(false); });
        setNow(Date.now());
    }, []);

    async function createDeadline(e: React.FormEvent) {
        e.preventDefault(); setSaving(true);
        const res = await fetch("/api/deadlines", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        if (res.ok) { const d = await res.json(); setDeadlines(p => [d, ...p]); setMsg("Deadline created and lecturers notified!"); setForm({ type: "SEMESTER_CALENDAR", label: "", dueDate: "" }); }
        else setMsg("Failed to create deadline.");
        setSaving(false); setTimeout(() => setMsg(""), 3000);
    }

    function daysLeft(d: string) {
        if (!now) return 0;
        return Math.ceil((new Date(d).getTime() - now) / 86400000);
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Deadlines</h1>
                <p className="text-white/50 mt-1">Create and manage submission deadlines</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Create form */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-semibold mb-5">➕ New Deadline</h3>
                    {msg && <div className={`mb-4 p-3 rounded-xl text-sm border ${msg.includes("Failed") ? "bg-red-500/10 border-red-500/30 text-red-300" : "bg-green-500/10 border-green-500/30 text-green-300"}`}>{msg}</div>}
                    <form onSubmit={createDeadline} className="space-y-4">
                        <div>
                            <label className="block text-sm text-white/60 mb-1.5">Submission Type</label>
                            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                                <option value="SEMESTER_CALENDAR">Semester Calendar</option>
                                <option value="COURSE_TOPICS">Course Topics</option>
                                <option value="OBSERVATION_REPORT">Observation Report</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-white/60 mb-1.5">Label</label>
                            <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} required placeholder="e.g. Semester Calendar — Sem 2 2025/2026"
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                        </div>
                        <div>
                            <label className="block text-sm text-white/60 mb-1.5">Due Date</label>
                            <input type="datetime-local" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} required
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                        </div>
                        <button type="submit" disabled={saving}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm transition disabled:opacity-50">
                            {saving ? "Creating..." : "Create Deadline & Notify Lecturers"}
                        </button>
                    </form>
                </div>
                {/* Existing deadlines */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-semibold mb-4">⏰ Existing Deadlines</h3>
                    {loading ? <div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" /></div> :
                        deadlines.length === 0 ? <p className="text-white/40 text-sm text-center py-8">No deadlines yet.</p> :
                            <div className="space-y-3">
                                {deadlines.map(d => {
                                    const days = daysLeft(d.dueDate);
                                    return (
                                        <div key={d.id} className="p-4 rounded-xl bg-white/3 border border-white/5">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="text-white font-medium">{d.label}</div>
                                                    <div className="text-white/40 text-xs mt-0.5">{d.type.replace(/_/g, " ")} · Due {new Date(d.dueDate).toLocaleDateString()}</div>
                                                </div>
                                                <span className={`text-xs px-2 py-1 rounded-full shrink-0 ml-2 ${days > 3 ? "bg-green-500/20 text-green-300" : days > 0 ? "bg-yellow-500/20 text-yellow-300" : "bg-red-500/20 text-red-300"}`}>
                                                    {days > 0 ? `${days}d left` : "Overdue"}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                    }
                </div>
            </div>
        </div>
    );
}
