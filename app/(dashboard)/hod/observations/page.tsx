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
            <div className="mb-8"><h1 className="text-3xl font-bold text-white">Observations</h1><p className="text-white/50 mt-1">Assign and track classroom observations</p></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-semibold mb-5">➕ Assign Observation</h3>
                    {msg && <div className={`mb-4 p-3 rounded-xl text-sm border ${msg.startsWith("✅") ? "bg-green-500/10 border-green-500/30 text-green-300" : "bg-red-500/10 border-red-500/30 text-red-300"}`}>{msg}</div>}
                    <form onSubmit={assign} className="space-y-4">
                        {[{ label: "Lecturer to Observe (User ID)", key: "lecturerId", ph: "e.g. 5" }, { label: "Assigned Observer (User ID)", key: "observerId", ph: "e.g. 6" }, { label: "Course Code", key: "courseCode", ph: "e.g. CS101" }].map(f => (
                            <div key={f.key}><label className="block text-sm text-white/60 mb-1.5">{f.label}</label>
                                <input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} required placeholder={f.ph}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50" /></div>
                        ))}
                        <div><label className="block text-sm text-white/60 mb-1.5">Session Date</label>
                            <input type="date" value={form.sessionDate} onChange={e => setForm(p => ({ ...p, sessionDate: e.target.value }))} required
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50" /></div>
                        <button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold text-sm transition">Assign</button>
                    </form>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-semibold mb-4">📋 Observation List</h3>
                    {loading ? <div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full" /></div> :
                        observations.length === 0 ? <p className="text-white/40 text-sm text-center py-8">No observations yet.</p> :
                            <div className="space-y-3">
                                {observations.map(o => (
                                    <div key={o.id} className="p-4 rounded-xl bg-white/3 border border-white/5">
                                        <div className="flex justify-between items-start">
                                            <div><div className="text-white font-medium">{o.courseCode}</div>
                                                <div className="text-white/40 text-xs mt-0.5">Observed: {o.lecturer?.name} · Observer: {o.observer?.name}</div>
                                                <div className="text-white/30 text-xs">{new Date(o.sessionDate).toLocaleDateString()}</div>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded-full ${statusColors[o.status] ?? ""}`}>{o.status}</span>
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
