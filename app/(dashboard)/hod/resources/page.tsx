"use client";

import { useState, useEffect } from "react";

export default function HODResourcesPage() {
    const [resources, setResources] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState("");
    const [rejectingId, setRejectingId] = useState<number | null>(null);
    const [feedback, setFeedback] = useState("");

    const fetchResources = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/hod/resources");
            if (res.ok) {
                const data = await res.json();
                setResources(data);
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchResources();
    }, []);

    const updateStatus = async (id: number, status: string, providedFeedback?: string) => {
        setMsg("");
        try {
            const bodyData: any = { status };
            if (providedFeedback) bodyData.feedback = providedFeedback;

            const res = await fetch(`/api/hod/resources/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bodyData)
            });

            if (res.ok) {
                setMsg(`✅ Resource marked as ${status}`);
                fetchResources();
            } else {
                setMsg("❌ Failed to update resource status");
            }
        } catch (e: any) {
            setMsg(`❌ Error: ${e.message}`);
        }
        setTimeout(() => setMsg(""), 4000);
    };

    const statusColors: Record<string, string> = {
        PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-500 dark:border-amber-500/20",
        APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-500 dark:border-emerald-500/20",
        REJECTED: "bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-500 dark:border-rose-500/20",
    };

    const typeIcons: Record<string, string> = {
        PDF: "📄", SLIDES: "📊", CODE: "💻", VIDEO: "🎥", LINK: "🔗", OTHER: "📎",
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Resource Approvals</h1>
                <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
                    Review and approve resources uploaded by lecturers in your department. Approved resources can be shared across the department.
                </p>
            </header>

            {msg && (
                <div className="p-4 rounded-xl text-sm border transition-all animate-in slide-in-from-top-2" style={{
                    backgroundColor: msg.startsWith("✅") ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                    borderColor: msg.startsWith("✅") ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)",
                    color: msg.startsWith("✅") ? "#10b981" : "#ef4444"
                }}>
                    {msg}
                </div>
            )}

            <div className="border rounded-3xl overflow-hidden shadow-sm" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
                    </div>
                ) : resources.length === 0 ? (
                    <div className="text-center py-20" style={{ color: "var(--text-muted)" }}>
                        <div className="text-4xl mb-4">📁</div>
                        <p>No resources found in your department.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--bg-border)]">
                        {resources.map(r => (
                            <div key={r.id} className="p-6 transition-colors hover:bg-[var(--bg-hover)] flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)" }}>
                                        {typeIcons[r.type] || "📎"}
                                    </div>
                                    <div>
                                        <div className="font-bold text-lg leading-tight mb-1" style={{ color: "var(--text-primary)" }}>{r.title}</div>
                                        <div className="text-xs mb-2 font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{r.type} FORMAT • BY {r.lecturer?.name}</div>
                                        {r.description && <p className="text-sm line-clamp-2" style={{ color: "var(--text-muted)" }}>{r.description}</p>}
                                        <div className="mt-3">
                                            <span className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${statusColors[r.status] || ""}`}>
                                                {r.status}
                                            </span>
                                            <span className="text-[10px] ml-3" style={{ color: "var(--text-muted)" }}>Posted {new Date(r.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0 uppercase tracking-widest text-[10px] font-bold">
                                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="px-4 py-3 rounded-xl border hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2" style={{ borderColor: "var(--bg-border)", color: "var(--text-primary)" }}>
                                        👀 View Source
                                    </a>
                                    {r.status === "PENDING" && (
                                        <>
                                            <button onClick={() => updateStatus(r.id, "APPROVED")} className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]">
                                                Approve
                                            </button>
                                            <button onClick={() => setRejectingId(r.id)} className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/20 transition-all active:scale-[0.98]">
                                                Reject
                                            </button>
                                        </>
                                    )}
                                    {r.status === "APPROVED" && (
                                        <button onClick={() => setRejectingId(r.id)} className="px-5 py-3 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20 transition-all active:scale-[0.98]">
                                            Revoke
                                        </button>
                                    )}
                                    {r.status === "REJECTED" && (
                                        <button onClick={() => updateStatus(r.id, "APPROVED")} className="px-5 py-3 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all active:scale-[0.98]">
                                            Restore
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {rejectingId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 w-full max-w-md rounded-3xl shadow-2xl p-6 relative">
                        <button onClick={() => { setRejectingId(null); setFeedback(""); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white transition">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Reject Resource</h3>
                        <p className="text-slate-500 dark:text-white/50 text-sm mb-4">Please provide a reason for rejecting this resource so the lecturer knows what to fix.</p>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="e.g. Needs more detailed references..."
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 mb-4 resize-none"
                            rows={4}
                        />
                        <button
                            onClick={() => {
                                updateStatus(rejectingId, "REJECTED", feedback);
                                setRejectingId(null);
                                setFeedback("");
                            }}
                            disabled={!feedback.trim()}
                            className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition disabled:opacity-50"
                        >
                            Confirm Rejection
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
