"use client";
import { useState, useEffect } from "react";
import Loader from "@/components/ui/Loader";

export default function AdminCurriculumPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<"PROGRAM" | "CATEGORY" | null>(null);

    const [form, setForm] = useState({ name: "", code: "", description: "", isGlobal: false });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch("/api/admin/curriculum")
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d) setData(d); setLoading(false); })
            .catch(() => { setLoading(false); });
    }, []);

    const handleSave = async () => {
        if (!form.name || (!form.code && modal === "PROGRAM")) {
            alert("Please fill in required fields.");
            return;
        }

        setSaving(true);
        try {
            const r = await fetch("/api/admin/curriculum", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, type: modal })
            });

            if (r.ok) {
                const newItem = await r.json();
                setData((prev: any) => ({
                    ...prev,
                    [modal === "PROGRAM" ? "programs" : "categories"]: [...prev[modal === "PROGRAM" ? "programs" : "categories"], newItem]
                }));
                setModal(null);
                setForm({ name: "", code: "", description: "", isGlobal: false });
            } else {
                alert("Failed to save.");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Loader message="Synchronizing Institutional Registry..." />;

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>Curriculum Manager</h1>
                    <p className="mt-1" style={{ color: "var(--text-muted)" }}>Institutional Alignment & Master Syllabus Registry</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => setModal("PROGRAM")} className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform shadow-xl">
                        + New Program
                    </button>
                    <button onClick={() => setModal("CATEGORY")} className="px-6 py-2.5 rounded-xl border-2 border-primary/20 text-primary text-xs font-bold uppercase tracking-widest hover:bg-primary/5 transition-all">
                        + New Category
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Programs List */}
                <div className="rounded-3xl p-8" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold">Academic Programs</h2>
                            <p className="text-xs opacity-60">Degrees and departments registered across the institution.</p>
                        </div>
                        <span className="text-3xl font-black opacity-10">{data.programs.length}</span>
                    </div>
                    <div className="space-y-4">
                        {data.programs.map((p: any) => (
                            <div key={p.id} className="p-5 rounded-2xl border bg-white/5 hover:bg-white/10 transition-colors group cursor-pointer" style={{ borderColor: "var(--bg-border)" }}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/20">{p.code}</span>
                                            <h3 className="font-bold">{p.name}</h3>
                                        </div>
                                        <p className="text-xs mt-2 opacity-60">{p.description || "Institutional degree program under regulation."}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-black">{p._count.courses}</div>
                                        <div className="text-[10px] font-bold opacity-30 uppercase tracking-widest">Courses</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Categories List */}
                <div className="rounded-3xl p-8" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold">Course Categories</h2>
                            <p className="text-xs opacity-60">Core requirements and cross-departmental classifications.</p>
                        </div>
                        <span className="text-3xl font-black opacity-10">{data.categories.length}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {data.categories.map((c: any) => (
                            <div key={c.id} className="p-5 rounded-2xl border bg-white/5 hover:bg-white/10 transition-colors h-full flex flex-col justify-between" style={{ borderColor: "var(--bg-border)" }}>
                                <div>
                                    <h3 className="font-bold flex items-center justify-between">
                                        {c.name}
                                        {c.isGlobal && <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 rounded-full border border-emerald-500/20">GLOBAL</span>}
                                    </h3>
                                    <p className="text-[10px] mt-2 opacity-60 leading-relaxed">{c.description || "Standard institutional classification."}</p>
                                </div>
                                <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                                    <span className="text-xs font-bold opacity-40">{c._count.courses} Courses</span>
                                    <span className="p-1 px-2 rounded bg-white/5 text-[9px] font-black uppercase">Standard</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {modal && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-md rounded-3xl p-8 relative shadow-2xl animate-in zoom-in-95 duration-300" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--bg-border)" }}>
                        <button onClick={() => setModal(null)} className="absolute top-6 right-6 text-xl opacity-40 hover:opacity-100 transition-opacity">✕</button>
                        <h2 className="text-2xl font-black mb-6">New {modal === "PROGRAM" ? "Academic Program" : "Course Category"}</h2>
                        
                        <div className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-2">Registry Name</label>
                                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder={modal === "PROGRAM" ? "BSc Computer Science" : "Core Courses"} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary transition-all text-sm outline-none" />
                            </div>
                            {modal === "PROGRAM" && (
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-2">Program Code</label>
                                    <input type="text" value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="CS-101-BSC" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary transition-all text-sm outline-none uppercase font-mono" />
                                </div>
                            )}
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-2">Description</label>
                                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary transition-all text-sm outline-none resize-none" />
                            </div>
                            {modal === "CATEGORY" && (
                                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <input type="checkbox" checked={form.isGlobal} onChange={e => setForm({...form, isGlobal: e.target.checked})} className="w-5 h-5 rounded border-white/10" id="global-check" />
                                    <label htmlFor="global-check" className="text-xs font-bold cursor-pointer">Global Access (Cross-Departmental)</label>
                                </div>
                            )}
                            
                            <button onClick={handleSave} disabled={saving} className="w-full py-4 mt-6 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
                                {saving ? "MINTING REGISTRY..." : "CREATE REGISTRY ENTRY"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
