"use client";

import { useEffect, useState } from "react";
import OnboardingCard from "@/components/ui/OnboardingCard";

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
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="mb-4">
                <h1 className="text-3xl font-bold tracking-tight text-center sm:text-left" style={{ color: "var(--text-primary)" }}>Head of Department</h1>
                <p className="mt-1 text-center sm:text-left" style={{ color: "var(--text-muted)" }}>Department compliance and observation management</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Dept. Lecturers", value: scores.length, icon: "👥", color: "#3b82f6" },
                    { label: "Avg Compliance", value: `${avgScore}%`, icon: "📊", color: avgScore >= 70 ? "#10b981" : "#ef4444" },
                    { label: "At Risk", value: atRisk.length, icon: "⚠️", color: "#ef4444" },
                    { label: "Total Submissions", value: scores.reduce((a, b) => a + b.submitted, 0), icon: "📋", color: "#a855f7" },
                ].map(k => (
                    <div key={k.label} className="rounded-3xl p-6 transition-all" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                        <div className="text-2xl mb-3">{k.icon}</div>
                        <div className="text-4xl font-bold" style={{ color: k.color }}>{k.value}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: "var(--text-muted)" }}>{k.label}</div>
                    </div>
                ))}
            </div>

            {/* HOD Onboarding */}
            <OnboardingCard 
                role="HOD"
                steps={[
                    { title: "Review Resources", description: "Review and approve pending resources from your department lecturers.", actionLabel: "Review Resources", href: "/lecturer/resources", completed: scores.length > 0 },
                    { title: "Departmental Broadcast", description: "Send a welcome message or important update to your team.", actionLabel: "Send Broadcast", href: "#", completed: false },
                    { title: "Assign Observations", description: "Schedule peer observations for effective academic monitoring.", actionLabel: "Schedule Now", href: "#", completed: false },
                    { title: "Compliance Check", description: "Audit the overall submission rates of your department.", actionLabel: "Check Analytics", href: "#", completed: true }
                ]}
            />

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-2xl w-fit flex-wrap" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                {(["overview", "observations", "notify"] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className="px-6 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all duration-300"
                        style={{
                          backgroundColor: tab === t ? "var(--primary)" : "transparent",
                          color: tab === t ? "white" : "var(--text-muted)"
                        }}>
                        {t === "overview" ? "Lecturer Scores" : t === "notify" ? "Broadcast" : "Assign Observation"}
                    </button>
                ))}
            </div>

            {/* Content Sections */}
            <div className="rounded-3xl overflow-hidden shadow-2xl" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                {/* Lecturer Scores */}
                {tab === "overview" && (
                    <div className="p-8">
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                            <span>📊</span> Lecturer Compliance Rankings
                        </h3>
                        <div className="space-y-4">
                            {scores.sort((a, b) => b.score - a.score).map((s, i) => (
                                <div key={s.lecturerId} className="flex items-center gap-4 p-5 rounded-2xl hover:translate-x-1 transition-all" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)" }}>
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg" style={{
                                      backgroundColor: i === 0 ? "rgba(251, 191, 36, 0.1)" : i === 1 ? "rgba(148, 163, 184, 0.1)" : i === 2 ? "rgba(234, 88, 12, 0.1)" : "var(--bg-border)",
                                      color: i === 0 ? "#fbbf24" : i === 1 ? "#94a3b8" : i === 2 ? "#ea580c" : "var(--text-muted)"
                                    }}>
                                        #{i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold truncate" style={{ color: "var(--text-primary)" }}>{s.lecturerName}</div>
                                        <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{s.email}</div>
                                        <div className="mt-3 h-1.5 rounded-full w-full overflow-hidden" style={{ backgroundColor: "var(--bg-border)" }}>
                                            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${s.score}%`, backgroundColor: s.score >= 70 ? "#10b981" : "#ef4444" }} />
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-2xl font-black" style={{ color: s.score >= 70 ? "#10b981" : "#ef4444" }}>{s.score}%</div>
                                        <div className="text-[10px] font-bold uppercase" style={{ color: "var(--text-muted)" }}>{s.submitted} SUBMITTED</div>
                                    </div>
                                    {s.isAtRisk && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/20 uppercase tracking-tighter">AT RISK</span>}
                                </div>
                            ))}
                            {scores.length === 0 && (
                                <div className="text-center py-16">
                                    <div className="text-4xl mb-4">🏜️</div>
                                    <p className="text-sm font-medium italic" style={{ color: "var(--text-muted)" }}>No lecturers in your department yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Assign Observation */}
                {tab === "observations" && (
                    <div className="p-8 max-w-2xl mx-auto">
                        <div className="text-center mb-8">
                            <h3 className="font-bold text-xl mb-2" style={{ color: "var(--text-primary)" }}>👁️ Assign Peer Observation</h3>
                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Schedule a mandatory session observation between two lecturers.</p>
                        </div>
                        
                        {obsMsg && (
                            <div className={`mb-6 p-4 rounded-2xl text-sm border animate-in slide-in-from-top-2 duration-300 ${obsMsg.startsWith("✅") ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"}`}>
                                {obsMsg}
                            </div>
                        )}
                        
                        <form onSubmit={assignObservation} className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Lecturer to Observe *</label>
                                    <input type="number" value={obsForm.lecturerId} onChange={e => setObsForm({ ...obsForm, lecturerId: e.target.value })} required 
                                        placeholder="User ID (e.g. 5)"
                                        className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)", focusColor: "var(--primary)" }} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Assigned Observer *</label>
                                    <input type="number" value={obsForm.observerId} onChange={e => setObsForm({ ...obsForm, observerId: e.target.value })} required 
                                        placeholder="User ID (e.g. 6)"
                                        className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Session Date *</label>
                                    <input type="date" value={obsForm.sessionDate} onChange={e => setObsForm({ ...obsForm, sessionDate: e.target.value })} required
                                        className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Course Code *</label>
                                    <input type="text" value={obsForm.courseCode} onChange={e => setObsForm({ ...obsForm, courseCode: e.target.value })} required 
                                        placeholder="e.g. CS101"
                                        className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} />
                                </div>
                            </div>
                            <button type="submit"
                                className="w-full py-4 rounded-xl text-white font-bold text-sm transition-all shadow-xl active:scale-[0.98]"
                                style={{ backgroundColor: "var(--primary)" }}>
                                Assign Observation Notification
                            </button>
                        </form>
                    </div>
                )}

                {/* Department Broadcast */}
                {tab === "notify" && (
                    <div className="p-8 max-w-2xl mx-auto">
                        <div className="text-center mb-8">
                            <h3 className="font-bold text-xl mb-2" style={{ color: "var(--text-primary)" }}>📢 Departmental Broadcast</h3>
                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Send a priority alert to all lecturers in your department.</p>
                        </div>

                        {notify.sent ? (
                            <div className="p-8 rounded-3xl border text-center animate-in zoom-in duration-300" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                                <div className="text-4xl mb-4">🚀</div>
                                <h4 className="font-bold mb-1" style={{ color: "#10b981" }}>Broadcast Sent!</h4>
                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>All colleagues have been notified via their dashboards.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="relative">
                                    <textarea
                                        value={notify.message}
                                        onChange={e => setNotify(n => ({ ...n, message: e.target.value }))}
                                        placeholder="Write your announcement here..."
                                        rows={6}
                                        className="w-full px-6 py-5 rounded-3xl text-sm focus:outline-none focus:ring-2 resize-none" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} />
                                    <div className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-tighter" style={{ color: "var(--text-muted)" }}>Department Alert</div>
                                </div>
                                <button
                                    onClick={sendBroadcast}
                                    disabled={!notify.message}
                                    className="w-full py-4 rounded-xl text-white font-bold text-sm transition-all shadow-xl disabled:opacity-50 active:scale-[0.98]"
                                    style={{ backgroundColor: "var(--primary)" }}>
                                    Push Notification to Department
                                </button>
                                <p className="text-[10px] text-center" style={{ color: "var(--text-muted)" }}>Note: This action is permanent and logged in the audit trail.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
