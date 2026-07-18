"use client";

import { useState, useEffect, useMemo } from "react";
import { Calendar, CheckCircle, Clock } from "lucide-react";

function computeWeeks(start: string, end: string) {
    if (!start || !end) return null;
    const ms = new Date(end).getTime() - new Date(start).getTime();
    if (ms <= 0) return null;
    return Math.max(1, Math.ceil(ms / (7 * 24 * 60 * 60 * 1000)));
}

export default function AcademicTermsTab() {
    const [terms, setTerms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ name: "", startDate: "", endDate: "" });
    const [msg, setMsg] = useState("");

    // Live preview of weeks based on form dates
    const previewWeeks = useMemo(() => computeWeeks(form.startDate, form.endDate), [form.startDate, form.endDate]);

    const fetchTerms = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/terms");
            if (res.ok) {
                const data = await res.json();
                setTerms(data);
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTerms();
    }, []);

    const createTerm = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg("");
        try {
            const res = await fetch("/api/admin/terms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                setMsg("✅ Academic Term created successfully");
                setForm({ name: "", startDate: "", endDate: "" });
                fetchTerms();
            } else {
                const data = await res.json();
                setMsg("❌ Error: " + (data.error || "Failed to create term"));
            }
        } catch (e: any) {
            setMsg("❌ Error: " + e.message);
        }
    };

    const activateTerm = async (id: number) => {
        setMsg("");
        try {
            const res = await fetch(`/api/admin/terms/${id}`, { method: "PATCH" });
            if (res.ok) {
                setMsg("✅ Term activated successfully.");
                fetchTerms();
            } else {
                setMsg("❌ Failed to activate term.");
            }
        } catch (e: any) {
            setMsg("❌ Error: " + e.message);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>Academic Terms</h2>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Manage University Semesters. Week count is calculated automatically from start/end dates.
                </p>
            </div>

            {msg && (
                <div className="p-4 rounded-xl text-sm border font-semibold" style={{
                    backgroundColor: msg.startsWith("✅") ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                    borderColor: msg.startsWith("✅") ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)",
                    color: msg.startsWith("✅") ? "#10b981" : "#ef4444"
                }}>
                    {msg}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Form */}
                <div className="lg:col-span-1 border rounded-2xl p-6 shadow-sm" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                    <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>Create New Term</h2>
                    <form onSubmit={createTerm} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>Term Name</label>
                            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                                placeholder="Semester 1 2026/2027"
                                className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition shadow-sm border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900" style={{ color: "var(--text-primary)" }} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>Start Date</label>
                            <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required
                                className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition shadow-sm border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900" style={{ color: "var(--text-primary)" }} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>End Date</label>
                            <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required
                                className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition shadow-sm border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900" style={{ color: "var(--text-primary)" }} />
                        </div>

                        {/* Live week preview */}
                        {previewWeeks !== null ? (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ backgroundColor: "rgba(99,102,241,0.08)", borderColor: "rgba(99,102,241,0.25)" }}>
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-sm font-bold" style={{ color: "var(--primary)" }}>
                                    {previewWeeks}
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--primary)" }}>Weeks Auto-Calculated</div>
                                    <div className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>
                                        Calendar will generate {previewWeeks} week slots
                                    </div>
                                </div>
                            </div>
                        ) : (form.startDate && form.endDate) ? (
                            <div className="px-4 py-2 rounded-xl text-xs font-semibold" style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#ef4444" }}>
                                ⚠️ End date must be after start date
                            </div>
                        ) : null}

                        <button type="submit" className="w-full py-2.5 rounded-xl text-sm font-bold transition-opacity active:scale-95 text-white flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 mt-2"
                            style={{ backgroundColor: "var(--primary)" }}>
                            <span>➕ Add Term</span>
                        </button>
                    </form>
                </div>

                {/* Term List - Professional UI */}
                <div className="lg:col-span-2 border border-slate-200 dark:border-slate-800/60 rounded-2xl overflow-hidden shadow-sm flex flex-col" style={{ backgroundColor: "var(--bg-surface)" }}>
                    <div className="hidden sm:grid grid-cols-12 gap-4 p-4 border-b border-slate-200 dark:border-slate-800/60 text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: "var(--bg-hover)", color: "var(--text-muted)" }}>
                        <div className="col-span-4">Term Name</div>
                        <div className="col-span-4">Period</div>
                        <div className="col-span-2 text-center">Weeks</div>
                        <div className="col-span-2 text-right">Status</div>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60 flex-1">
                        {loading ? (
                            <div className="flex justify-center items-center h-48">
                                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
                            </div>
                        ) : terms.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-center p-8">
                                <Calendar className="w-10 h-10 text-slate-400 mb-4" />
                                <h3 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>No Terms Created</h3>
                                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Create your first academic term on the left.</p>
                            </div>
                        ) : (
                            terms.map(t => {
                                const weeks = computeWeeks(t.startDate, t.endDate);
                                return (
                                    <div key={t.id} className="group flex flex-col transition-colors hover:bg-[var(--bg-hover)]" style={{ backgroundColor: "var(--bg-base)" }}>
                                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 sm:p-5 items-center">
                                            {/* Name */}
                                            <div className="col-span-1 sm:col-span-4">
                                                <div className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{t.name}</div>
                                            </div>

                                            {/* Period */}
                                            <div className="col-span-1 sm:col-span-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="px-2 py-1 rounded border text-xs font-bold border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" style={{ color: "var(--text-secondary)" }}>
                                                        {new Date(t.startDate).toLocaleDateString()}
                                                    </div>
                                                    <span className="text-slate-400 text-xs">→</span>
                                                    <div className="px-2 py-1 rounded border text-xs font-bold border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" style={{ color: "var(--text-secondary)" }}>
                                                        {new Date(t.endDate).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Weeks */}
                                            <div className="col-span-1 sm:col-span-2 flex justify-center">
                                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {weeks ?? "—"}
                                                </span>
                                            </div>

                                            {/* Status & Action */}
                                            <div className="col-span-1 sm:col-span-2 flex justify-end items-center gap-2">
                                                {t.isActive ? (
                                                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                                                        <CheckCircle className="w-3 h-3" />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <button 
                                                        onClick={() => activateTerm(t.id)} 
                                                        className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 transition-colors dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400"
                                                    >
                                                        Activate
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
