"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function LecturerObservationsPage() {
    const { data: session } = useSession();
    const userId = parseInt(session?.user?.id || "0");
    const [observations, setObservations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState<any | null>(null);
    const [form, setForm] = useState({ strengths: "", improvements: "", rating: "5" });
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState("");

    const load = () => {
        fetch("/api/observations").then(r => r.json()).then(data => {
            setObservations(Array.isArray(data) ? data : []);
            setLoading(false);
        });
    };

    useEffect(() => { load(); }, []);

    async function submitReport(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        const res = await fetch(`/api/observations/${completing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        if (res.ok) {
            setMsg("✅ Report submitted!");
            setCompleting(null);
            setForm({ strengths: "", improvements: "", rating: "5" });
            load();
        } else {
            const d = await res.json();
            setMsg(`❌ Error: ${d.error}`);
        }
        setSubmitting(false);
        setTimeout(() => setMsg(""), 3000);
    }

    const statusColors: Record<string, string> = {
        PENDING: "bg-yellow-500/20 text-yellow-300",
        COMPLETED: "bg-green-500/20 text-green-300",
        REVIEWED: "bg-blue-500/20 text-blue-300",
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Peer Observations</h1>
                <p className="text-white/50 mt-1">Track classroom observations where you are either the lecturer or the observer</p>
            </div>

            {msg && <div className={`p-4 rounded-xl text-sm border ${msg.startsWith("✅") ? "bg-green-500/10 border-green-500/30 text-green-300" : "bg-red-500/10 border-red-500/30 text-red-300"}`}>{msg}</div>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl flex flex-col justify-center">
                    <div className="text-emerald-400 text-sm font-medium mb-1">Assigned to Observe</div>
                    <div className="text-3xl font-bold text-white">{observations.filter(o => o.observerId === userId).length}</div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-2xl flex flex-col justify-center">
                    <div className="text-blue-400 text-sm font-medium mb-1">To be Observed</div>
                    <div className="text-3xl font-bold text-white">{observations.filter(o => o.lecturerId === userId).length}</div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl flex flex-col justify-center">
                    <div className="text-amber-400 text-sm font-medium mb-1">Pending Reports</div>
                    <div className="text-3xl font-bold text-white">{observations.filter(o => o.status === "PENDING" && o.observerId === userId).length}</div>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <h3 className="text-white font-semibold mb-6 flex items-center gap-2 relative z-10">
                    <span>👁️</span> Observation Schedule & History
                </h3>
                {loading ? <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div> :
                    observations.length === 0 ? <p className="text-center py-12 text-white/30">No observations found.</p> :
                        <div className="overflow-x-auto relative z-10">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-white/40 text-left border-b border-white/5">
                                        <th className="pb-3 pr-4">Course</th>
                                        <th className="pb-3 pr-4">Role</th>
                                        <th className="pb-3 pr-4">Partner</th>
                                        <th className="pb-3 pr-4">Date</th>
                                        <th className="pb-3 pr-4">Status</th>
                                        <th className="pb-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {observations.map(o => {
                                        const isObserver = o.observerId === userId;
                                        return (
                                            <tr key={o.id} className="text-white/70 hover:bg-white/3 transition group">
                                                <td className="py-4 pr-4 font-medium text-white group-hover:text-blue-400 transition">{o.courseCode}</td>
                                                <td className="py-4 pr-4">
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isObserver ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`}>
                                                        {isObserver ? 'OBSERVER' : 'LECTURER'}
                                                    </span>
                                                </td>
                                                <td className="py-4 pr-4 text-white/50">{isObserver ? (o.lecturer?.name || "Peer") : (o.observer?.name || "Peer")}</td>
                                                <td className="py-4 pr-4 text-white/40">{new Date(o.sessionDate).toLocaleDateString()}</td>
                                                <td className="py-4 pr-4">
                                                    <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${statusColors[o.status] || ""}`}>
                                                        {o.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-right">
                                                    {isObserver && o.status === "PENDING" && (
                                                        <button onClick={() => setCompleting(o)} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition">
                                                            Complete Report
                                                        </button>
                                                    )}
                                                    {o.status === "COMPLETED" && (
                                                        <span className="text-white/20 text-xs">Submitted</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                }
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Completion Modal */}
            {completing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-3xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Complete Observation Report</h2>
                            <button onClick={() => setCompleting(null)} className="text-white/30 hover:text-white text-2xl">×</button>
                        </div>
                        <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/5">
                            <div className="text-white/40 text-[10px] font-bold uppercase">Observing</div>
                            <div className="text-white font-medium">{completing.lecturer?.name} — {completing.courseCode}</div>
                        </div>
                        <form onSubmit={submitReport} className="space-y-4">
                            <div>
                                <label className="block text-sm text-white/60 mb-1.5">Key Strengths</label>
                                <textarea value={form.strengths} onChange={e => setForm({ ...form, strengths: e.target.value })} required rows={3}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                                    placeholder="What went well? (e.g. content delivery, student engagement)" />
                            </div>
                            <div>
                                <label className="block text-sm text-white/60 mb-1.5">Areas for Improvement</label>
                                <textarea value={form.improvements} onChange={e => setForm({ ...form, improvements: e.target.value })} required rows={3}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                                    placeholder="Any recommendations? (e.g. time management, visual aids)" />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm text-white/60">Rating (1-10)</label>
                                <input type="number" min="1" max="10" value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value })}
                                    className="w-20 px-4 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                            </div>
                            <button type="submit" disabled={submitting} className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold transition shadow-lg shadow-blue-500/20 disabled:opacity-50 mt-4">
                                {submitting ? "Submitting..." : "Submit Final Report"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
