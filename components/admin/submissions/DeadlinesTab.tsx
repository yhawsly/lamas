"use client";
import { useEffect, useState } from "react";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { Clock, Plus, Calendar, AlertTriangle } from "lucide-react";
import { useTerm } from "@/context/TermContext";

const DeadlinesSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-3xl border p-5 flex flex-col justify-between h-48 bg-slate-50/50 dark:bg-slate-900/30" style={{ borderColor: "var(--bg-border)", backgroundColor: "var(--bg-surface)" }}>
                <div className="space-y-4">
                    <div className="h-4 w-20 bg-slate-205 dark:bg-slate-800 rounded-full" />
                    <div className="h-5 w-44 bg-slate-205 dark:bg-slate-800 rounded" />
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-205 dark:bg-slate-800" />
                        <div className="space-y-2">
                            <div className="h-3.5 w-24 bg-slate-205 dark:bg-slate-800 rounded" />
                            <div className="h-3 w-16 bg-slate-205 dark:bg-slate-800 rounded" />
                        </div>
                    </div>
                </div>
                <div className="pt-4 border-t flex justify-between items-center" style={{ borderColor: "var(--bg-border)" }}>
                    <div className="h-3.5 w-16 bg-slate-205 dark:bg-slate-800 rounded" />
                    <div className="h-5 w-20 bg-slate-205 dark:bg-slate-800 rounded-full" />
                </div>
            </div>
        ))}
    </div>
);

export default function DeadlinesTab() {
    const { isArchiveMode, selectedTermId } = useTerm();
    const [deadlines, setDeadlines] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ type: "SEMESTER_CALENDAR", label: "", dueDate: "" });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState("");

    useEffect(() => {
        async function load() {
            const termParam = selectedTermId ? `?termId=${selectedTermId}` : "";
            const r = await fetch(`/api/deadlines${termParam}`);
            const d = await r.ok ? r.json().catch(() => []) : [];
            setDeadlines(Array.isArray(d) ? d : []);
            setLoading(false);
        }
        load();
    }, [selectedTermId]);

    async function createDeadline(e: React.FormEvent) {
        e.preventDefault(); 
        if (isArchiveMode) {
            setMsg("❌ Action Disabled: You are currently viewing a read-only historical archive.");
            setTimeout(() => setMsg(""), 3000);
            return;
        }
        setSaving(true);
        const res = await fetch("/api/deadlines", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, termId: selectedTermId }) });
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

            <div className="space-y-6">
                {/* Create Form - Row Aligned (Horizontal) */}
                <div className="border rounded-2xl p-6 shadow-sm" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <Plus className="w-4 h-4 font-bold" />
                        </div>
                        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>New Deadline</h2>
                    </div>

                    <form onSubmit={createDeadline} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
                        <div className="lg:col-span-3">
                            <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                                Submission Type
                            </label>
                            <SearchableSelect
                                value={form.type}
                                onChange={val => setForm({ ...form, type: String(val) })}
                                options={[
                                    { label: "Semester Calendar", value: "SEMESTER_CALENDAR" },
                                    { label: "Course Topics", value: "COURSE_TOPICS" },
                                    { label: "Observation Report", value: "OBSERVATION_REPORT" },
                                    { label: "Weekly Topics", value: "WEEKLY_TOPICS" },
                                ]}
                            />
                        </div>

                        <div className="lg:col-span-4">
                            <label htmlFor="deadline-label" className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                                Deadline Label
                            </label>
                            <input 
                                id="deadline-label" 
                                name="label" 
                                value={form.label} 
                                onChange={e => setForm({ ...form, label: e.target.value })} 
                                required 
                                placeholder="e.g. Semester 2 Calendar Submission"
                                className="w-full px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" 
                                style={{ color: "var(--text-primary)" }} 
                            />
                        </div>

                        <div className="lg:col-span-3">
                            <label htmlFor="deadline-due-date" className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                                Due Date & Time
                            </label>
                            <input 
                                id="deadline-due-date" 
                                name="dueDate" 
                                type="datetime-local" 
                                value={form.dueDate} 
                                onChange={e => setForm({ ...form, dueDate: e.target.value })} 
                                required
                                className="w-full px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" 
                                style={{ color: "var(--text-primary)" }} 
                            />
                        </div>

                        <div className="lg:col-span-2">
                            <button 
                                type="submit" 
                                disabled={saving}
                                className="w-full px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-105 active:scale-[0.98] text-white flex items-center justify-center gap-2 shrink-0 h-[42px] shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                                style={{ backgroundColor: "var(--primary)" }}
                            >
                                {saving ? "Creating..." : "Create & Notify"}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Deadlines List - Grid of Cards */}
                <div className="w-full space-y-4">
                    {loading ? (
                        <DeadlinesSkeleton />
                    ) : deadlines.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-center p-8 border border-slate-200 dark:border-slate-800/60 rounded-2xl bg-white dark:bg-slate-900">
                            <Clock className="w-10 h-10 text-slate-400 mb-4" />
                            <h3 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>No Active Deadlines</h3>
                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Create a deadline to alert your staff.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {deadlines.map(d => {
                                const days = daysLeft(d.dueDate);
                                return (
                                    <div key={d.id} className="group relative rounded-3xl border p-6 flex flex-col justify-between min-h-[220px] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 bg-white dark:bg-slate-900" style={{ borderColor: "var(--bg-border)", backgroundColor: "var(--bg-surface)" }}>
                                        {/* Background Glow based on urgency */}
                                        <div 
                                            className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-10 pointer-events-none"
                                            style={{ backgroundColor: days <= 0 ? "#ef4444" : days <= 3 ? "#f59e0b" : "#10b981" }}
                                        />

                                        <div className="relative z-10 flex-1 flex flex-col justify-between">
                                            {/* Header: Label & Type */}
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-start gap-2">
                                                    <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border bg-slate-50 dark:bg-slate-800" style={{ color: "var(--text-muted)", borderColor: "var(--bg-border)" }}>
                                                        {d.type.replace(/_/g, " ")}
                                                    </span>
                                                </div>
                                                <h4 className="font-extrabold text-sm leading-snug" style={{ color: "var(--text-primary)" }}>{d.label}</h4>
                                            </div>

                                            {/* Due Date Indicator */}
                                            <div className="flex items-center gap-2.5 mt-4">
                                                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                                                    <Calendar className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
                                                        {new Date(d.dueDate).toLocaleDateString()}
                                                    </div>
                                                    <div className="text-[10px] font-semibold text-slate-400 mt-0.5">
                                                        {new Date(d.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Footer */}
                                        <div className="mt-5 pt-4 border-t flex justify-between items-center relative z-10" style={{ borderColor: "var(--bg-border)" }}>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remaining</span>
                                            {days > 3 ? (
                                                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                                                    {days} days left
                                                </span>
                                            ) : days > 0 ? (
                                                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 animate-pulse">
                                                    <Clock className="w-3 h-3" /> {days} days left
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">
                                                    <AlertTriangle className="w-3 h-3" /> Overdue
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
