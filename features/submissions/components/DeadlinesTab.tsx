"use client";
import { useEffect, useState, useCallback } from "react";
import SearchableSelect from "@/components/ui/SearchableSelect";
import RefreshButton from "@/components/ui/RefreshButton";
import { Clock, Plus, Calendar, AlertTriangle, Zap, CheckCircle2, AlertCircle } from "lucide-react";
import { useTerm } from "@/context/TermContext";

const DeadlinesSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-3xl border p-5 flex flex-col justify-between h-48 bg-slate-50/50 dark:bg-slate-900/30" style={{ borderColor: "var(--bg-border)", backgroundColor: "var(--bg-surface)" }}>
                <div className="space-y-4">
                    <div className="h-4 w-20 bg-slate-205 dark:bg-slate-700/80 rounded-full" />
                    <div className="h-5 w-44 bg-slate-205 dark:bg-slate-700/80 rounded" />
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-205 dark:bg-slate-800" />
                        <div className="space-y-2">
                            <div className="h-3.5 w-24 bg-slate-205 dark:bg-slate-700/80 rounded" />
                            <div className="h-3 w-16 bg-slate-205 dark:bg-slate-700/80 rounded" />
                        </div>
                    </div>
                </div>
                <div className="pt-4 border-t flex justify-between items-center" style={{ borderColor: "var(--bg-border)" }}>
                    <div className="h-3.5 w-16 bg-slate-205 dark:bg-slate-700/80 rounded" />
                    <div className="h-5 w-20 bg-slate-205 dark:bg-slate-700/80 rounded-full" />
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

    const loadDeadlines = useCallback(async () => {
        setLoading(true);
        const termParam = selectedTermId ? `?termId=${selectedTermId}` : "";
        const r = await fetch(`/api/deadlines${termParam}`);
        const d = await r.ok ? r.json().catch(() => []) : [];
        setDeadlines(Array.isArray(d) ? d : []);
        setLoading(false);
    }, [selectedTermId]);

    useEffect(() => {
        loadDeadlines();
    }, [loadDeadlines]);

    async function createDeadline(e: React.FormEvent) {
        e.preventDefault(); 
        if (isArchiveMode) {
            setMsg("Action Disabled: You are currently viewing a read-only historical archive.");
            setTimeout(() => setMsg(""), 3000);
            return;
        }
        setSaving(true);
        const res = await fetch("/api/deadlines", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, termId: selectedTermId }) });
        if (res.ok) {
            const d = await res.json().catch(() => ({}));
            setDeadlines(p => [d, ...p]);
            setMsg("Deadline created and lecturers notified!");
            setForm({ type: "SEMESTER_CALENDAR", label: "", dueDate: "" });
        }
        else setMsg("Failed to create deadline.");
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

    const [isAutoGenerating, setIsAutoGenerating] = useState(false);

    async function handleAutoGenerate() {
        if (isArchiveMode) {
            setMsg("Action Disabled: You are currently viewing a read-only historical archive.");
            setTimeout(() => setMsg(""), 3000);
            return;
        }
        setIsAutoGenerating(true);
        try {
            const res = await fetch("/api/deadlines/auto", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ termId: selectedTermId })
            });
            const data = await res.json();
            if (res.ok) {
                setMsg(`Automated Milestones Generated! (${data.count || 0} milestones created).`);
                // Reload deadlines
                const termParam = selectedTermId ? `?termId=${selectedTermId}` : "";
                const r = await fetch(`/api/deadlines${termParam}`);
                const d = await r.ok ? r.json().catch(() => []) : [];
                setDeadlines(Array.isArray(d) ? d : []);
            } else {
                setMsg(`Error: ${data.error || "Failed to auto-generate milestones"}`);
            }
        } catch (e: any) {
            setMsg(`Error: ${e.message}`);
        } finally {
            setIsAutoGenerating(false);
            setTimeout(() => setMsg(""), 4000);
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>Submission Deadlines</h2>
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>Create and manage due dates for lecturer appraisals and curriculum submissions.</p>
                </div>

                <button
                    type="button"
                    onClick={handleAutoGenerate}
                    disabled={isAutoGenerating || isArchiveMode}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{isAutoGenerating ? "Generating..." : "Auto-Populate 4 Active Milestones"}</span>
                </button>
            </div>

            {/* Automated Milestone Framework Banner */}
            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-xs font-extrabold text-blue-900 dark:text-blue-300">Automated Milestone Engine Active</h4>
                        <p className="text-[11px] text-blue-700/80 dark:text-blue-400 mt-0.5">
                            Standard active milestones: <strong>Wk 2</strong> (Calendar) · <strong>Wk 3</strong> (Topics) · <strong>Wk 8</strong> (Mid-Term Log) · <strong>Wk 9</strong> (Observation)
                        </p>
                    </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 self-start md:self-auto">
                    Auto-Linked to Term Start
                </span>
            </div>

            {msg && (
                <div className={`p-4 rounded-xl text-sm border font-semibold flex items-center gap-2.5 ${
                    !msg.toLowerCase().includes("failed") && !msg.toLowerCase().includes("error") && !msg.toLowerCase().includes("disabled")
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
                }`}>
                    {!msg.toLowerCase().includes("failed") && !msg.toLowerCase().includes("error") && !msg.toLowerCase().includes("disabled") ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                    <span>{msg.replace(/^Error:\s*/i, "")}</span>
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
                                disabled={isArchiveMode}
                                placeholder="e.g. Semester 2 Calendar Submission"
                                className="w-full px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-50" 
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
                                disabled={isArchiveMode}
                                className="w-full px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-50" 
                                style={{ color: "var(--text-primary)" }} 
                            />
                        </div>

                        <div className="lg:col-span-2">
                            <button 
                                type="submit" 
                                disabled={saving || isArchiveMode}
                                className="w-full px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-105 active:scale-[0.98] text-white flex items-center justify-center gap-2 shrink-0 h-[42px] shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                                style={{ backgroundColor: "var(--primary)" }}
                            >
                                {isArchiveMode ? "Read Only" : saving ? "Creating..." : "Create & Notify"}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Deadlines List - Grid of Cards */}
                <div className="w-full space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Active Submission Deadlines</h3>
                        </div>
                        <RefreshButton
                            onClick={loadDeadlines}
                            isRefreshing={loading}
                            label="Refresh"
                            size="sm"
                            variant="outline"
                            title="Reload active deadlines"
                        />
                    </div>
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
