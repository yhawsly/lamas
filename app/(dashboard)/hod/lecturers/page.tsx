"use client";
import { useEffect, useState } from "react";

export default function HoDLecturersPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetch("/api/admin/analytics").then(r => r.json()).then(d => { setData(d); setLoading(false); }); }, []);

    const scores = data?.scores ?? [];

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8"><h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>My Lecturers</h1><p className="mt-1" style={{ color: "var(--text-muted)" }}>Compliance overview for your department</p></div>
            <div className="rounded-2xl p-6" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                {loading ? <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div> :
                    scores.length === 0 ? <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>No lecturers in your department yet.</div> :
                        <div className="space-y-3">
                            {scores.sort((a: any, b: any) => b.score - a.score).map((s: any, i: number) => (
                                <div key={s.lecturerId} className="flex items-center gap-4 p-4 rounded-xl transition" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)" }}>
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{
                                      backgroundColor: i === 0 ? "rgba(251, 191, 36, 0.1)" : i === 1 ? "rgba(148, 163, 184, 0.1)" : i === 2 ? "rgba(234, 88, 12, 0.1)" : "var(--bg-border)",
                                      color: i === 0 ? "#fbbf24" : i === 1 ? "#94a3b8" : i === 2 ? "#ea580c" : "var(--text-muted)"
                                    }}>{i + 1}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium" style={{ color: "var(--text-primary)" }}>{s.lecturerName}</div>
                                        <div className="text-xs" style={{ color: "var(--text-muted)" }}>{s.email}</div>
                                        <div className="mt-2 h-1.5 rounded-full" style={{ backgroundColor: "var(--bg-border)" }}><div className="h-1.5 rounded-full" style={{ width: `${s.score}%`, backgroundColor: s.score >= 70 ? "#10b981" : "#ef4444" }} /></div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-xl font-bold" style={{ color: s.score >= 70 ? "#10b981" : "#ef4444" }}>{s.score}%</div>
                                        <div className="text-xs" style={{ color: "var(--text-muted)" }}>{s.submitted} / {s.totalRequired} submitted</div>
                                    </div>
                                    {s.isAtRisk && <span className="text-xs px-2 py-1 rounded-full shrink-0" style={{ backgroundColor: "rgba(239, 68, 68, 0.2)", color: "#ef4444" }}>At Risk</span>}
                                </div>
                            ))}
                        </div>
                }
            </div> 
        </div>
    );
}
