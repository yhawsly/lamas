"use client";

import { useState, useEffect, useMemo } from "react";

function computeWeeks(start: string, end: string) {
    if (!start || !end) return null;
    const ms = new Date(end).getTime() - new Date(start).getTime();
    if (ms <= 0) return null;
    return Math.max(1, Math.ceil(ms / (7 * 24 * 60 * 60 * 1000)));
}

export default function AcademicTermsPage() {
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
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
            <header className="flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Academic Terms</h1>
                    <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
                        Manage University Semesters. Week count is calculated automatically from start/end dates.
                    </p>
                </div>
            </header>

            {msg && (
                <div className="p-4 rounded-xl text-sm border" style={{
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
                            <label className="block text-sm mb-1.5 font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Term Name</label>
                            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                                placeholder="Semester 1 2026/2027"
                                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} />
                        </div>
                        <div>
                            <label className="block text-sm mb-1.5 font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Start Date</label>
                            <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required
                                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} />
                        </div>
                        <div>
                            <label className="block text-sm mb-1.5 font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>End Date</label>
                            <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required
                                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} />
                        </div>

                        {/* Live week preview */}
                        {previewWeeks !== null ? (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ backgroundColor: "rgba(99,102,241,0.08)", borderColor: "rgba(99,102,241,0.25)" }}>
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-sm font-bold" style={{ color: "var(--primary)" }}>
                                    {previewWeeks}
                                </div>
                                <div>
                                    <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--primary)" }}>Weeks Auto-Calculated</div>
                                    <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                                        Calendar will generate {previewWeeks} week slots
                                    </div>
                                </div>
                            </div>
                        ) : (form.startDate && form.endDate) ? (
                            <div className="px-4 py-2 rounded-xl text-xs" style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#ef4444" }}>
                                ⚠️ End date must be after start date
                            </div>
                        ) : null}

                        <button type="submit" className="w-full py-3 rounded-xl text-sm font-semibold transition-transform active:scale-[0.98] text-white flex items-center justify-center gap-2"
                            style={{ background: "linear-gradient(135deg, var(--primary) 0%, #4338ca 100%)" }}>
                            <span>➕ Add Term</span>
                        </button>
                    </form>
                </div>

                {/* Term List */}
                <div className="lg:col-span-2 border rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead style={{ backgroundColor: "var(--bg-hover)", borderBottom: "1px solid var(--bg-border)" }}>
                                <tr>
                                    <th className="px-6 py-4 font-semibold" style={{ color: "var(--text-secondary)" }}>Name</th>
                                    <th className="px-6 py-4 font-semibold" style={{ color: "var(--text-secondary)" }}>Period</th>
                                    <th className="px-6 py-4 font-semibold text-center" style={{ color: "var(--text-secondary)" }}>Weeks</th>
                                    <th className="px-6 py-4 font-semibold" style={{ color: "var(--text-secondary)" }}>Status</th>
                                    <th className="px-6 py-4 font-semibold text-right" style={{ color: "var(--text-secondary)" }}>Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--bg-border)]">
                                {loading ? (
                                    <tr><td colSpan={5} className="p-8 text-center" style={{ color: "var(--text-muted)" }}>Loading terms...</td></tr>
                                ) : terms.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center" style={{ color: "var(--text-muted)" }}>No Academic Terms created yet.</td></tr>
                                ) : (
                                    terms.map(t => {
                                        const weeks = computeWeeks(t.startDate, t.endDate);
                                        return (
                                            <tr key={t.id} className="transition-colors hover:bg-[var(--bg-hover)]">
                                                <td className="px-6 py-4 font-medium" style={{ color: "var(--text-primary)" }}>{t.name}</td>
                                                <td className="px-6 py-4" style={{ color: "var(--text-muted)" }}>
                                                    <div>{new Date(t.startDate).toLocaleDateString()}</div>
                                                    <div className="text-[11px]">→ {new Date(t.endDate).toLocaleDateString()}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold" style={{ backgroundColor: "rgba(99,102,241,0.1)", color: "var(--primary)" }}>
                                                        📅 {weeks ?? "—"} wks
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {t.isActive ? (
                                                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400">ACTIVE</span>
                                                    ) : (
                                                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-500/20 text-gray-400">INACTIVE</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {!t.isActive && (
                                                        <button onClick={() => activateTerm(t.id)} className="px-4 py-2 text-xs font-medium rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors">
                                                            Activate
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
