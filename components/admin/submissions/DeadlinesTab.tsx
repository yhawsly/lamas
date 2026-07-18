"use client";
import { useEffect, useState } from "react";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { Clock, Plus, Calendar, AlertTriangle } from "lucide-react";

export default function DeadlinesTab() {
    const [deadlines, setDeadlines] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ type: "SEMESTER_CALENDAR", label: "", dueDate: "" });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState("");

    useEffect(() => {
        async function load() {
            const r = await fetch("/api/deadlines");
            const d = await r.ok ? r.json().catch(() => []) : [];
            setDeadlines(Array.isArray(d) ? d : []);
            setLoading(false);
        }
        load();
    }, []);

    async function createDeadline(e: React.FormEvent) {
        e.preventDefault(); setSaving(true);
        const res = await fetch("/api/deadlines", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        if (res.ok) {
            const d = await res.json().catch(() => ({}));
            setDeadlines(p => [d, ...p]);
            setMsg("✅ Deadline created and lecturers notified!");
            setForm({ type: "SEMESTER_CALENDAR", label: "", dueDate: "" });
        }
        else setMsg("❌ Failed to create deadline.");
        setSaving(false); setTimeout(() => setMsg(""), 3000);
    }

    const [now, setNow] = useState<number | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setNow(Date.now());
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    function daysLeft(d: string) {
        if (!now) return 0;
        return Math.ceil((new Date(d).getTime() - now) / 86400000);
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>Submission Deadlines</h2>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Create and manage due dates for lecturer appraisals and curriculum submissions.</p>
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
                <div className="lg:col-span-1 border rounded-2xl p-6 shadow-sm flex flex-col" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <Plus className="w-4 h-4 font-bold" />
                        </div>
                        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>New Deadline</h2>
                    </div>

                    <form onSubmit={createDeadline} className="space-y-4 flex-1">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>Submission Type</label>
                            <SearchableSelect
                                value={form.type}
                                onChange={val => setForm({ ...form, type: String(val) })}
                                options={[
                                    { label: "Semester Calendar", value: "SEMESTER_CALENDAR" },
                                    { label: "Course Topics", value: "COURSE_TOPICS" },
                                    { label: "Observation Report", value: "OBSERVATION_REPORT" },
                                ]}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>Label</label>
                            <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} required placeholder="e.g. Semester Calendar — Sem 2 2025/2026"
                                className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition shadow-sm border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900" style={{ color: "var(--text-primary)" }} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>Due Date</label>
                            <input type="datetime-local" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} required
                                className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition shadow-sm border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900" style={{ color: "var(--text-primary)" }} />
                        </div>

                        <div className="pt-4">
                            <button type="submit" disabled={saving}
                                className="w-full py-2.5 rounded-xl text-sm font-bold transition-opacity active:scale-95 text-white flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-50"
                                style={{ backgroundColor: "var(--primary)" }}>
                                {saving ? "Creating..." : "Create & Notify Staff"}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Deadlines List - Professional UI */}
                <div className="lg:col-span-2 border border-slate-200 dark:border-slate-800/60 rounded-2xl overflow-hidden shadow-sm flex flex-col" style={{ backgroundColor: "var(--bg-surface)" }}>
                    <div className="hidden sm:grid grid-cols-12 gap-4 p-4 border-b border-slate-200 dark:border-slate-800/60 text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: "var(--bg-hover)", color: "var(--text-muted)" }}>
                        <div className="col-span-5">Deadline Details</div>
                        <div className="col-span-4">Due Date</div>
                        <div className="col-span-3 text-right">Status</div>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60 flex-1">
                        {loading ? (
                            <div className="flex justify-center items-center h-48">
                                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
                            </div>
                        ) : deadlines.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-center p-8">
                                <Clock className="w-10 h-10 text-slate-400 mb-4" />
                                <h3 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>No Active Deadlines</h3>
                                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Create a deadline to alert your staff.</p>
                            </div>
                        ) : (
                            deadlines.map(d => {
                                const days = daysLeft(d.dueDate);
                                return (
                                    <div key={d.id} className="group flex flex-col transition-colors hover:bg-[var(--bg-hover)]" style={{ backgroundColor: "var(--bg-base)" }}>
                                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 sm:p-5 items-center">
                                            {/* Details */}
                                            <div className="col-span-1 sm:col-span-5">
                                                <div className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{d.label}</div>
                                                <div className="inline-flex mt-1.5 px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[9px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                                                    {d.type.replace(/_/g, " ")}
                                                </div>
                                            </div>

                                            {/* Due Date */}
                                            <div className="col-span-1 sm:col-span-4 flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                <div>
                                                    <div className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
                                                        {new Date(d.dueDate).toLocaleDateString()}
                                                    </div>
                                                    <div className="text-[10px] font-semibold text-slate-400 mt-0.5">
                                                        {new Date(d.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status */}
                                            <div className="col-span-1 sm:col-span-3 flex justify-end">
                                                {days > 3 ? (
                                                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                                                        {days} days left
                                                    </span>
                                                ) : days > 0 ? (
                                                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                                                        <Clock className="w-3 h-3" /> {days} days left
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">
                                                        <AlertTriangle className="w-3 h-3" /> Overdue
                                                    </span>
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
