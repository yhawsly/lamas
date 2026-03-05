"use client";
import { useEffect, useState } from "react";

export default function HoDObservationsPage() {
    const [observations, setObservations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ lecturerId: "", observerId: "", sessionDate: "", courseCode: "" });
    const [msg, setMsg] = useState("");

    useEffect(() => { fetch("/api/observations").then(r => r.json()).then(d => { setObservations(Array.isArray(d) ? d : []); setLoading(false); }); }, []);

    async function assign(e: React.FormEvent) {
        e.preventDefault();
        const res = await fetch("/api/observations", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...form, lecturerId: parseInt(form.lecturerId), observerId: parseInt(form.observerId) }),
        });
        if (res.ok) { const d = await res.json(); setObservations(p => [d, ...p]); setMsg("✅ Observation assigned!"); setForm({ lecturerId: "", observerId: "", sessionDate: "", courseCode: "" }); }
        else setMsg("❌ Failed to assign.");
        setTimeout(() => setMsg(""), 3000);
    }

    const statusColors: Record<string, string> = { PENDING: "bg-yellow-500/20 text-yellow-300", COMPLETED: "bg-green-500/20 text-green-300", REVIEWED: "bg-blue-500/20 text-blue-300" };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8"><h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Observations</h1><p className="mt-1" style={{ color: "var(--text-muted)" }}>Assign and track classroom observations</p></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl p-6" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                    <h3 className="font-semibold mb-5" style={{ color: "var(--text-primary)" }}>➕ Assign Observation</h3>
                    {msg && <div className={`mb-4 p-3 rounded-xl text-sm border`} style={{ backgroundColor: msg.startsWith("✅") ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", borderColor: msg.startsWith("✅") ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)", color: msg.startsWith("✅") ? "#10b981" : "#ef4444" }}>{msg}</div>}
                    <form onSubmit={assign} className="space-y-4">
                        {[{ label: "Lecturer to Observe (User ID)", key: "lecturerId", ph: "e.g. 5" }, { label: "Assigned Observer (User ID)", key: "observerId", ph: "e.g. 6" }, { label: "Course Code", key: "courseCode", ph: "e.g. CS101" }].map(f => (
                            <div key={f.key}><label className="block text-sm mb-1.5" style={{ color: "var(--text-muted)" }}>{f.label}</label>
                                <input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} required placeholder={f.ph}
                                    className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} /></div>
                        ))}
                        <div><label className="block text-sm mb-1.5" style={{ color: "var(--text-muted)" }}>Session Date</label>
                            <input type="date" value={form.sessionDate} onChange={e => setForm(p => ({ ...p, sessionDate: e.target.value }))} required
                                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} /></div>
                        <button type="submit" className="w-full py-3 rounded-xl text-white font-semibold text-sm transition" style={{ backgroundColor: "var(--primary)" }}>Assign</button>
                    </form>
                </div>
                <div className="rounded-2xl p-6" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                    <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>📋 Observation List</h3>
                    {loading ? <div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-2" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div> :
                        observations.length === 0 ? <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>No observations yet.</p> :
                            <div className="space-y-3">
                                {observations.map(o => (
                                    <div key={o.id} className="p-4 rounded-xl" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)" }}>
                                        <div className="flex justify-between items-start">
                                            <div><div className="font-medium" style={{ color: "var(--text-primary)" }}>{o.courseCode}</div>
                                                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Observed: {o.lecturer?.name} · Observer: {o.observer?.name}</div>
                                                <div className="text-xs" style={{ color: "var(--text-muted)" }}>{new Date(o.sessionDate).toLocaleDateString()}</div>
                                            </div>
                                            <span className="text-xs px-2 py-1 rounded-full" style={statusColors[o.status] ? { backgroundColor: statusColors[o.status].split(" ")[0].replace("bg-", "").replace("text-", ""), color: statusColors[o.status].split(" ")[1].replace("text-", "") } : {}}>{o.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                    }
                </div>
            </div>
        </div>
    );
}
