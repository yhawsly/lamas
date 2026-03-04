"use client";
import { useEffect, useState } from "react";

export default function HoDLecturersPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetch("/api/admin/analytics").then(r => r.json()).then(d => { setData(d); setLoading(false); }); }, []);

    const scores = data?.scores ?? [];

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8"><h1 className="text-3xl font-bold text-white">My Lecturers</h1><p className="text-white/50 mt-1">Compliance overview for your department</p></div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                {loading ? <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" /></div> :
                    scores.length === 0 ? <div className="text-center py-12 text-white/40">No lecturers in your department yet.</div> :
                        <div className="space-y-3">
                            {scores.sort((a: any, b: any) => b.score - a.score).map((s: any, i: number) => (
                                <div key={s.lecturerId} className="flex items-center gap-4 p-4 rounded-xl bg-white/3 hover:bg-white/5 transition">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? "bg-yellow-500/20 text-yellow-400" : i === 1 ? "bg-slate-400/20 text-slate-400" : i === 2 ? "bg-orange-600/20 text-orange-400" : "bg-white/5 text-white/30"}`}>{i + 1}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white font-medium">{s.lecturerName}</div>
                                        <div className="text-white/40 text-xs">{s.email}</div>
                                        <div className="mt-2 h-1.5 rounded-full bg-white/10"><div className={`h-1.5 rounded-full ${s.score >= 70 ? "bg-green-500" : "bg-red-500"}`} style={{ width: `${s.score}%` }} /></div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className={`text-xl font-bold ${s.score >= 70 ? "text-green-400" : "text-red-400"}`}>{s.score}%</div>
                                        <div className="text-white/30 text-xs">{s.submitted} / {s.totalRequired} submitted</div>
                                    </div>
                                    {s.isAtRisk && <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-300 shrink-0">At Risk</span>}
                                </div>
                            ))}
                        </div>
                }
            </div>
        </div>
    );
}
