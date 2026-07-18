"use client";
import { useState, useEffect } from "react";
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from "recharts";

interface PortfolioData {
    stats: {
        compliance: number;
        activeTerm: string;
        institution: string;
    };
    radarData: any[] | null; 
    velocity: any[];
    auditHistory: any[];
    auditArtifacts: any[];
    leaderboard?: { name: string; score: number }[];
    metrics?: { outlines: number; observations: number; alerts: number };
}

export default function InstitutionalIntelligenceSuite({ role }: { role: string }) {
    const [data, setData] = useState<PortfolioData | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<"dossier" | "department" | "audit">(role === "LECTURER" ? "dossier" : "department");
    const [toast, setToast] = useState<string | null>(null);
    
    useEffect(() => {
        fetch("/api/reports/portfolio")
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d) setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 4000);
    };

    const handleExport = async (title: string) => {
        // Trigger native print dialog which works flawlessly with Tailwind v4
        setTimeout(() => window.print(), 100);
        showToast(`Ready to Print or Save as PDF: ${title}`);
    };

    if (loading || !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium animate-pulse" style={{ color: "var(--text-muted)" }}>Synthesizing Intelligence Suite...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400">
                        Institutional Intelligence Suite
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider border border-blue-500/20">Academic Accountability Platform</span>
                        <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>{data.stats.activeTerm} Cycle</p>
                    </div>
                </div>
                
                <div className="flex p-1.5 rounded-2xl border backdrop-blur-md" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                    {[
                        { id: "dossier", label: "My Reports", roles: ["LECTURER", "ADMIN", "SUPER_ADMIN"] },
                        { id: "department", label: "Command Center", roles: ["HOD", "ADMIN", "SUPER_ADMIN"] },
                        { id: "audit", label: "Audit Vault", roles: ["ADMIN", "SUPER_ADMIN"] }
                    ].filter(t => t.roles.includes(role)).map(t => (
                        <button key={t.id} onClick={() => setTab(t.id as any)}
                            className="px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 transform active:scale-95"
                            style={{
                                backgroundColor: tab === t.id ? "var(--primary)" : "transparent",
                                color: tab === t.id ? "white" : "var(--text-muted)",
                                boxShadow: tab === t.id ? "0 8px 16px -4px rgba(59, 130, 246, 0.3)" : "none"
                            }}>
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Department Command Center View - NOW WITH 2 CHARTS SIDE-BY-SIDE */}
            {tab === "department" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Syllabus Coverage Velocity */}
                    <div className="rounded-3xl p-8 relative overflow-hidden transition-all hover:border-blue-500/30" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                        <h3 className="font-bold text-lg mb-2" style={{ color: "var(--text-primary)" }}>Syllabus Coverage Velocity</h3>
                        <p className="text-xs mb-8 underline decoration-blue-500/30 underline-offset-4" style={{ color: "var(--text-muted)" }}>Tracking intended vs actual curriculum delivery.</p>
                        
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={data.velocity}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: 'var(--bg-hover)' }} contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--bg-border)', borderRadius: '12px', color: 'var(--text-primary)' }} />
                                <Bar dataKey="planned" fill="#3b82f6" name="Planned %" radius={[4, 4, 0, 0]} opacity={0.6} />
                                <Bar dataKey="actual" fill="#10b981" name="Actual %" radius={[4, 4, 0, 0]} />
                                <Legend wrapperStyle={{ paddingTop: 20, fontSize: 11 }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Pedagogical Radar */}
                    <div className="rounded-3xl p-8 relative overflow-hidden transition-all hover:border-emerald-500/30" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                        <h3 className="font-bold text-lg mb-2" style={{ color: "var(--text-primary)" }}>Pedagogical Radar</h3>
                        <p className="text-xs mb-8 underline decoration-emerald-500/30 underline-offset-4" style={{ color: "var(--text-muted)" }}>Multi-dimensional instructional benchmarking.</p>

                        {data.radarData ? (
                            <ResponsiveContainer width="100%" height={260}>
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.radarData}>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 'bold' }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar name="Performance" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.35} dot />
                                    <Tooltip
                                        formatter={(value: number) => [`${value}%`, 'Score']}
                                        contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--bg-border)', borderRadius: '12px', color: "var(--text-primary)" }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: 10, fontSize: 11 }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[260px] gap-3 rounded-2xl border border-dashed" style={{ borderColor: 'var(--bg-border)' }}>
                                <span className="text-4xl">🕸️</span>
                                <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>No rated observations yet</p>
                                <p className="text-xs text-center max-w-[220px]" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                                    Ratings will appear here once observers submit scores for completed observations.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Professional Lecturer Report View */}
            {tab === "dossier" && (
                <div className="space-y-6">
                    <div className="rounded-3xl p-8 lg:p-12 relative overflow-hidden" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
                        
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                            <div>
                                <h2 className="text-3xl font-black mb-3 tracking-tight" style={{ color: "var(--text-primary)" }}>My Performance Report</h2>
                                <p className="max-w-xl text-base opacity-70 leading-relaxed mb-8">
                                    A professional summary of your academic responsibilities, teaching evaluations, and institutional compliance metrics for the current session.
                                </p>
                                <button 
                                    onClick={() => handleExport("Lecturer Performance Report")}
                                    className="px-8 py-3.5 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
                                    style={{ background: "var(--primary)" }}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Export Official PDF
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 lg:min-w-[300px]">
                                <div className="p-6 rounded-2xl bg-blue-50/50 border border-blue-100">
                                    <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Compliance</p>
                                    <p className="text-4xl font-black text-slate-800">{data.stats.compliance}%</p>
                                </div>
                                <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Observations</p>
                                    <p className="text-4xl font-black text-slate-800">{data.metrics?.observations || 0}</p>
                                </div>
                                <div className="p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100 col-span-2">
                                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Active Outlines</p>
                                    <p className="text-4xl font-black text-slate-800">{data.metrics?.outlines || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Audit Vault View */}
            {tab === "audit" && (
                <div className="rounded-3xl p-10" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-black mb-2" style={{ color: "var(--text-primary)" }}>Institutional Audit Vault</h2>
                            <p className="text-sm opacity-60 max-w-xl">
                                Tamper-proof regulatory artifacts. Designed for NUC alignment and accreditation readiness.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {data.auditArtifacts.map((audit, i) => (
                            <div key={i} className="p-6 rounded-2xl transition-all hover:bg-white/5 border border-dashed border-white/10 group" style={{ backgroundColor: "var(--bg-hover)" }}>
                                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform inline-block">{audit.icon}</div>
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-lg">{audit.title}</h4>
                                    <span className="text-[10px] font-black opacity-40 uppercase tracking-tighter">{audit.date}</span>
                                </div>
                                <p className="text-xs opacity-60 mb-8">{audit.desc}</p>
                                <button 
                                    onClick={() => handleExport(audit.title)}
                                    className="w-full py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all"
                                    style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }}
                                >
                                    EXPORT PDF
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Premium Toast Notification */}
            {toast && (
                <div className="fixed bottom-10 right-10 flex items-center gap-3 px-6 py-4 rounded-3xl shadow-3xl z-[200] border border-white/10 backdrop-blur-2xl animate-in slide-in-from-bottom-10"
                    style={{ backgroundColor: "rgba(15, 23, 42, 0.9)", color: "white" }}>
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl">✓</div>
                    <div className="font-bold text-sm tracking-tight">{toast}</div>
                </div>
            )}
            {/* HIDDEN PRINT TEMPLATE USING NATIVE PRINTING */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    body * { visibility: hidden; }
                    .print-section, .print-section * { visibility: visible; }
                    .print-section {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: white;
                        color: black;
                        padding: 20px;
                    }
                }
            `}} />
            <div className="print-section hidden">
                <div className="p-8 font-serif">
                    <h1 className="text-2xl font-black mb-4 border-b pb-2">Academic Report - {data.stats.activeTerm}</h1>
                    <div className="grid grid-cols-2 gap-8 mt-8">
                        <div>
                            <p className="text-sm font-bold opacity-60 uppercase mb-1">Compliance Rating</p>
                            <p className="text-3xl font-black">{data.stats.compliance}%</p>
                        </div>
                        <div>
                            <p className="text-sm font-bold opacity-60 uppercase mb-1">Total Observations</p>
                            <p className="text-3xl font-black">{data.metrics?.observations || 0}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
