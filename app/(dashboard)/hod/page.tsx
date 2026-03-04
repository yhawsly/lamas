"use client";

import { useEffect, useState } from "react";

interface LecturerScore {
    lecturerId: number; lecturerName: string; email: string;
    score: number; submitted: number; late: number; missing: number; isAtRisk: boolean;
}

export default function HoDDashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [obsForm, setObsForm] = useState({ lecturerId: "", observerId: "", sessionDate: "", courseCode: "" });
    const [obsMsg, setObsMsg] = useState("");
    const [tab, setTab] = useState<"overview" | "observations" | "notify">("overview");
    const [notify, setNotify] = useState({ message: "", sent: false });

    useEffect(() => {
        fetch("/api/admin/analytics").then(r => r.json()).then(d => { setData(d); setLoading(false); });
    }, []);

    async function assignObservation(e: React.FormEvent) {
        e.preventDefault();
        const res = await fetch("/api/observations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...obsForm, lecturerId: parseInt(obsForm.lecturerId), observerId: parseInt(obsForm.observerId) }),
        });
        if (res.ok) {
            setObsMsg("✅ Observation assigned successfully! Both parties have been notified.");
            setObsForm({ lecturerId: "", observerId: "", sessionDate: "", courseCode: "" });
        } else {
            setObsMsg("❌ Failed to assign observation. Please check the inputs.");
        }
        setTimeout(() => setObsMsg(""), 4000);
    }

    async function sendBroadcast() {
        const res = await fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: notify.message }),
        });
        if (res.ok) setNotify(n => ({ ...n, sent: true }));
        setTimeout(() => setNotify({ message: "", sent: false }), 4000);
    }

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
        </div>
    );

    const scores: LecturerScore[] = data?.scores || [];
    const atRisk = scores.filter((s) => s.isAtRisk);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b.score, 0) / scores.length) : 0;

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Head of Department</h1>
                <p className="text-white/50 mt-1">Department compliance and observation management</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: "Dept. Lecturers", value: scores.length, icon: "👥", color: "text-blue-400" },
                    { label: "Avg Compliance", value: `${avgScore}%`, icon: "📊", color: avgScore >= 70 ? "text-green-400" : "text-red-400" },
                    { label: "At Risk", value: atRisk.length, icon: "⚠️", color: "text-red-400" },
                    { label: "Total Submissions", value: scores.reduce((a, b) => a + b.submitted, 0), icon: "📋", color: "text-purple-400" },
                ].map(k => (
                    <div key={k.label} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                        <div className="text-2xl mb-2">{k.icon}</div>
                        <div className={`text-3xl font-bold ${k.color}`}>{k.value}</div>
                        <div className="text-white/40 text-sm mt-1">{k.label}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-6 w-fit flex-wrap">
                {(["overview", "observations", "notify"] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${tab === t ? "bg-amber-600 text-white" : "text-white/50 hover:text-white"}`}>
                        {t === "overview" ? "👥 Lecturer Scores" : t === "notify" ? "📢 Department Broadcast" : "👁️ Assign Observation"}
                    </button>
                ))}
            </div>

            {/* Lecturer Scores */}
            {tab === "overview" && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-semibold mb-4">Lecturer Compliance Rankings</h3>
                    <div className="space-y-3">
                        {scores.sort((a, b) => b.score - a.score).map((s, i) => (
                            <div key={s.lecturerId} className="flex items-center gap-4 p-4 rounded-xl bg-white/3 hover:bg-white/5 transition">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? "bg-yellow-500/20 text-yellow-400" : i === 1 ? "bg-slate-400/20 text-slate-400" : i === 2 ? "bg-orange-600/20 text-orange-400" : "bg-white/5 text-white/30"}`}>
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-white font-medium truncate">{s.lecturerName}</div>
                                    <div className="text-white/40 text-xs">{s.email}</div>
                                    <div className="mt-2 h-1.5 rounded-full bg-white/10 w-full">
                                        <div className={`h-1.5 rounded-full transition-all ${s.score >= 70 ? "bg-green-500" : "bg-red-500"}`} style={{ width: `${s.score}%` }} />
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className={`text-xl font-bold ${s.score >= 70 ? "text-green-400" : "text-red-400"}`}>{s.score}%</div>
                                    <div className="text-white/30 text-xs">{s.submitted} submitted</div>
                                </div>
                                {s.isAtRisk && <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-300 shrink-0">At Risk</span>}
                            </div>
                        ))}
                        {scores.length === 0 && <p className="text-white/40 text-sm text-center py-8">No lecturers in your department yet.</p>}
                    </div>
                </div>
            )}

            {/* Assign Observation */}
            {tab === "observations" && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 max-w-xl">
                    <h3 className="text-white font-semibold mb-6">👁️ Assign Peer Observation</h3>
                    {obsMsg && (
                        <div className={`mb-4 p-3 rounded-xl text-sm border ${obsMsg.startsWith("✅") ? "bg-green-500/10 border-green-500/30 text-green-300" : "bg-red-500/10 border-red-500/30 text-red-300"}`}>
                            {obsMsg}
                        </div>
                    )}
                    <form onSubmit={assignObservation} className="space-y-4">
                        <div>
                            <label className="block text-sm text-white/60 mb-1.5">Lecturer to be Observed (User ID)</label>
                            <input type="number" value={obsForm.lecturerId} onChange={e => setObsForm({ ...obsForm, lecturerId: e.target.value })} required placeholder="e.g. 5"
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
                        </div>
                        <div>
                            <label className="block text-sm text-white/60 mb-1.5">Assigned Observer (User ID)</label>
                            <input type="number" value={obsForm.observerId} onChange={e => setObsForm({ ...obsForm, observerId: e.target.value })} required placeholder="e.g. 6"
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
                        </div>
                        <div>
                            <label className="block text-sm text-white/60 mb-1.5">Session Date</label>
                            <input type="date" value={obsForm.sessionDate} onChange={e => setObsForm({ ...obsForm, sessionDate: e.target.value })} required
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
                        </div>
                        <div>
                            <label className="block text-sm text-white/60 mb-1.5">Course Code</label>
                            <input type="text" value={obsForm.courseCode} onChange={e => setObsForm({ ...obsForm, courseCode: e.target.value })} required placeholder="e.g. CS101"
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
                        </div>
                        <button type="submit"
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold text-sm transition shadow-lg shadow-amber-500/10">
                            Assign Observation
                        </button>
                    </form>
                </div>
            )}

            {/* Department Broadcast */}
            {tab === "notify" && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 max-w-2xl">
                    <h3 className="text-white font-semibold mb-4">📢 Notify Department</h3>
                    <p className="text-white/50 text-sm mb-6">Send an instant alert to all active lecturers in your department. They will receive it via the notification bell on their dashboards.</p>

                    {notify.sent ? (
                        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 font-medium">✅ Broadcast sent successfully!</div>
                    ) : (
                        <div className="space-y-4">
                            <textarea
                                value={notify.message}
                                onChange={e => setNotify(n => ({ ...n, message: e.target.value }))}
                                placeholder="Type your broadcast message here..."
                                rows={4}
                                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none text-sm"
                            />
                            <div className="flex justify-end">
                                <button
                                    onClick={sendBroadcast}
                                    disabled={!notify.message}
                                    className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm transition shadow-lg shadow-amber-500/20 disabled:opacity-50">
                                    Send Notification
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
