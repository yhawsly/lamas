"use client";

import { useState, useEffect, useRef } from "react";
import ExportPDFButton from "@/components/ui/ExportPDFButton";

export default function LecturerReportsPage() {
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [stats, setStats] = useState({ compliance: 0, attendance: 0, sessions: 0 });

    useEffect(() => {
        fetch("/api/submissions").then(r => r.json()).then(data => setSubmissions(Array.isArray(data) ? data : []));
        fetch("/api/sessions").then(r => r.json()).then(data => {
            if (Array.isArray(data)) {
                const totalMatrics = data.reduce((acc, s) => acc + (s._count?.attendance || 0), 0);
                setStats({
                    compliance: 85, // Mock baseline
                    attendance: data.length > 0 ? Math.round(totalMatrics / data.length) : 0,
                    sessions: data.length
                });
            }
        });
    }, []);

    const reportTypes = [
        { id: "personal_compliance", title: "Compliance Summary", desc: "Detailed breakdown of your submission rates and deadlines", icon: "📊", color: "bg-blue-500/10 text-blue-400" },
        { id: "observation_history", title: "Observation History", desc: "Complete log of all peer observations conducted and received", icon: "👁️", color: "bg-purple-500/10 text-purple-400" },
        { id: "attendance_summary", title: "Attendance Analytics", desc: "Student check-in stats across all your sessions", icon: "👥", color: "bg-green-500/10 text-green-400" },
    ];

    const reportRef = useRef<HTMLDivElement>(null);

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Reports & Analytics</h1>
                    <p className="text-white/50 mt-1">Export and analyze your academic performance data</p>
                </div>
                <ExportPDFButton targetRef={reportRef} filename={`LAMAS_Full_Portfolio_${new Date().getFullYear()}.pdf`} />
            </div>

            <div ref={reportRef} className="space-y-8 p-4 bg-slate-900 rounded-3xl">

                {/* Analytics Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                        <div className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Compliance Score</div>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-bold text-white">{stats.compliance}%</span>
                            <span className="text-green-500 text-xs font-medium mb-1">↑ 2%</span>
                        </div>
                        <div className="mt-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600" style={{ width: `${stats.compliance}%` }} />
                        </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                        <div className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Avg. Session Attendance</div>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-bold text-white">{stats.attendance}</span>
                            <span className="text-white/20 text-xs mb-1">Students/Session</span>
                        </div>
                        <div className="mt-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600" style={{ width: '70%' }} />
                        </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                        <div className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Total Documents</div>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-bold text-white">{submissions.length}</span>
                            <span className="text-blue-400 text-xs font-medium mb-1">{submissions.filter(s => s.status === 'SUBMITTED').length} Verified</span>
                        </div>
                        <div className="mt-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-600" style={{ width: '100%' }} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-3 space-y-6">
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-1 overflow-hidden">
                            {reportTypes.map((r, i) => (
                                <div key={r.id} className={`p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-all ${i !== reportTypes.length - 1 ? 'border-b border-white/5' : ''}`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`w-14 h-14 shrink-0 rounded-2xl ${r.color} flex items-center justify-center text-3xl shadow-inner border border-white/5`}>
                                            {r.icon}
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold text-lg">{r.title}</h3>
                                            <p className="text-white/40 text-sm max-w-md">{r.desc}</p>
                                        </div>
                                    </div>
                                    <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold text-sm hover:bg-blue-600/20 hover:border-blue-500/40 transition-all shadow-xl flex items-center gap-2">
                                        <span>✓</span> Included in Report
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-gradient-to-br from-indigo-600/20 to-emerald-600/20 border border-white/10 rounded-3xl p-8 text-center relative overflow-hidden h-full flex flex-col items-center justify-center">
                            <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center text-3xl mb-4 border border-white/10">✨</div>
                            <h3 className="text-white font-bold text-lg mb-2">Automated Exports</h3>
                            <p className="text-white/40 text-xs leading-relaxed">
                                Reports are automatically compiled at the end of each academic cycle.
                                You can download previous semester archives here when available.
                            </p>
                            <button className="mt-6 text-indigo-400 font-bold text-xs uppercase tracking-widest hover:text-indigo-300 transition">
                                Explore Archives
                            </button>
                            {/* Background decoration */}
                            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl" />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
