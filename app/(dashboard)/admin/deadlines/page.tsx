"use client";
import { useEffect, useMemo, useState } from "react";

export default function AdminDeadlinesPage() {
    const [deadlines, setDeadlines] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ type: "SEMESTER_CALENDAR", label: "", dueDate: "" });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState("");

    useEffect(() => {
        fetch("/api/deadlines").then(r => r.json()).then(d => { setDeadlines(Array.isArray(d) ? d : []); setLoading(false); });
    }, []);

    async function createDeadline(e: React.FormEvent) {
        e.preventDefault(); setSaving(true);
        const res = await fetch("/api/deadlines", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        if (res.ok) { const d = await res.json(); setDeadlines(p => [d, ...p]); setMsg("Deadline created and lecturers notified!"); setForm({ type: "SEMESTER_CALENDAR", label: "", dueDate: "" }); }
        else setMsg("Failed to create deadline.");
        setSaving(false); setTimeout(() => setMsg(""), 3000);
    }

    // eslint-disable-next-line react-hooks/purity
    const now = useMemo(() => Date.now(), []);

    function daysLeft(d: string) {
        return Math.ceil((new Date(d).getTime() - now) / 86400000);
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Deadlines</h1>
                <p className="mt-1" style={{ color: "var(--text-muted)" }}>Create and manage submission deadlines</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Create form */}
                <div className="rounded-2xl p-6" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                    <h3 className="font-semibold mb-5" style={{ color: "var(--text-primary)" }}>➕ New Deadline</h3>
                    {msg && <div className={`mb-4 p-3 rounded-xl text-sm border`} style={{ backgroundColor: msg.includes("Failed") ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)", borderColor: msg.includes("Failed") ? "rgba(239, 68, 68, 0.3)" : "rgba(16, 185, 129, 0.3)", color: msg.includes("Failed") ? "#ef4444" : "#10b981" }}>{msg}</div>}
                    <form onSubmit={createDeadline} className="space-y-4">
                        <div>
                            <label className="block text-sm mb-1.5" style={{ color: "var(--text-muted)" }}>Submission Type</label>
                            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }}>
                                <option value="SEMESTER_CALENDAR">Semester Calendar</option>
                                <option value="COURSE_TOPICS">Course Topics</option>
                                <option value="OBSERVATION_REPORT">Observation Report</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm mb-1.5" style={{ color: "var(--text-muted)" }}>Label</label>
                            <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} required placeholder="e.g. Semester Calendar — Sem 2 2025/2026"
                                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} />
                        </div>
                        <div>
                            <label className="block text-sm mb-1.5" style={{ color: "var(--text-muted)" }}>Due Date</label>
                            <input type="datetime-local" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} required
                                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} />
                        </div>
                        <button type="submit" disabled={saving}
                            className="w-full py-3 rounded-xl text-white font-semibold text-sm transition disabled:opacity-50"
                            style={{ backgroundColor: "var(--primary)" }}>
                            {saving ? "Creating..." : "Create Deadline & Notify Lecturers"}
                        </button>
                    </form>
                </div>
                {/* Existing deadlines */}
                <div className="rounded-2xl p-6" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                    <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>⏰ Existing Deadlines</h3>
                    {loading ? <div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-2" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div> :
                        deadlines.length === 0 ? <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>No deadlines yet.</p> :
                            <div className="space-y-3">
                                {deadlines.map(d => {
                                    const days = daysLeft(d.dueDate);
                                    return (
                                        <div key={d.id} className="p-4 rounded-xl" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)" }}>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-medium" style={{ color: "var(--text-primary)" }}>{d.label}</div>
                                                    <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{d.type.replace(/_/g, " ")} · Due {new Date(d.dueDate).toLocaleDateString()}</div>
                                                </div>
                                                <span className="text-xs px-2 py-1 rounded-full shrink-0 ml-2" style={{ backgroundColor: days > 3 ? "rgba(16, 185, 129, 0.2)" : days > 0 ? "rgba(245, 158, 11, 0.2)" : "rgba(239, 68, 68, 0.2)", color: days > 3 ? "#10b981" : days > 0 ? "#f59e0b" : "#ef4444" }}>
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
