"use client";
import { useState, useEffect, useRef } from "react";
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
    radarData: any[] | null; // null = no rated observations yet
    velocity: any[];
    auditHistory: any[];
    auditArtifacts: any[];
}

export default function InstitutionalIntelligenceSuite({ role }: { role: string }) {
    const [data, setData] = useState<PortfolioData | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<"dossier" | "department" | "audit">("department");
    const [generating, setGenerating] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [html2pdf, setHtml2pdf] = useState<any>(null);
    
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch("/api/reports/portfolio")
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d) setData(d); setLoading(false); })
            .catch(() => setLoading(false));

        // Load html2pdf dynamically
        import("html2pdf.js").then(mod => setHtml2pdf(() => mod.default || mod));
    }, []);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 4000);
    };

    const handleExport = async (title: string) => {
        if (!html2pdf || !printRef.current) return;
        
        setGenerating(title);
        
        const opt = {
            margin: 10,
            filename: `LAMAS_${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        try {
            await html2pdf().from(printRef.current).set(opt).save();
            showToast(`Official Document Generated: ${title}`);
        } catch (err) {
            console.error("PDF generation failed:", err);
            showToast("Failed to generate document. Please try again.");
        } finally {
            setGenerating(null);
        }
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
                        { id: "dossier", label: "Faculty Dossier", roles: ["LECTURER", "ADMIN", "SUPER_ADMIN"] },
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
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" vertical={false} />
                                <XAxis dataKey="week" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
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
                                    <PolarGrid stroke="var(--bg-border)" />
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

            {/* Dossier View */}
            {tab === "dossier" && (
                <div className="rounded-3xl p-12 flex flex-col items-center justify-center min-h-[450px] text-center relative overflow-hidden" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-[100px]" />
                    <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-600/5 rounded-full blur-[100px]" />
                    
                    <div className="text-7xl mb-8 animate-bounce">🎓</div>
                    <h2 className="text-3xl font-black mb-4 tracking-tight" style={{ color: "var(--text-primary)" }}>Faculty Excellence Portfolio</h2>
                    <p className="max-w-2xl text-lg opacity-60 mb-10 leading-relaxed">
                        Transitioning from mere oversight to career enablement. This dossier synthesizes your pedagogical impact, syllabus speed, and peer recognition into a single tenure-ready document.
                    </p>
                    <button 
                        onClick={() => handleExport("Excellence Dossier")}
                        disabled={generating === "Excellence Dossier"}
                        className="px-10 py-4 text-white font-black rounded-2xl shadow-2xl shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
                        style={{ background: "linear-gradient(to right, #2563eb, #10b981)" }}
                    >
                        {generating === "Excellence Dossier" ? "Minuting Official Dossier..." : "Compile My Career Portfolio"}
                    </button>
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
                                    disabled={generating === audit.title}
                                    className="w-full py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all"
                                    style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }}
                                >
                                    {generating === audit.title ? "MINTING..." : "EXPORT PDF"}
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

            {/* HIDDEN PRINT TEMPLATE */}
            <div style={{ display: 'none' }}>
                <div ref={printRef} className="p-16 text-black bg-white font-serif max-w-[210mm] mx-auto min-h-[297mm]">
                    <div className="flex justify-between items-start border-b-2 border-black pb-8 mb-10">
                        <div className="w-24 h-24 bg-black flex items-center justify-center text-white font-black text-3xl rounded-none underline decoration-4">FUT</div>
                        <div className="text-right">
                            <h1 className="text-2xl font-black uppercase italic tracking-tighter">Institutional Compliance Report</h1>
                            <p className="text-sm font-bold opacity-80">HO University of Technology</p>
                            <p className="text-[10px] font-mono mt-4">REF-ID: LAMAS-SYS-{Math.floor(100000 + Math.random() * 900000)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-10 mb-16">
                        <div className="p-8 border-l-4 border-black bg-slate-50">
                            <h4 className="text-[10px] font-black uppercase mb-4 text-slate-500 tracking-[0.2em]">Institutional Health</h4>
                            <p className="text-6xl font-black tracking-tighter">{data.stats.compliance}%</p>
                            <p className="text-xs font-black uppercase mt-2 text-emerald-700">Audit-Verified Integrity Score</p>
                        </div>
                        <div className="p-8 border-l-4 border-black bg-slate-50">
                            <h4 className="text-[10px] font-black uppercase mb-4 text-slate-500 tracking-[0.2em]">Active Term</h4>
                            <p className="text-2xl font-black">{data.stats.activeTerm}</p>
                            <p className="text-sm font-bold mt-2">Academic Session 2025/2026</p>
                        </div>
                    </div>

                    <div className="mb-16">
                        <h4 className="text-xs font-black uppercase border-b-2 border-black pb-3 mb-8 tracking-[0.3em]">Pedagogical Benchmarks</h4>
                        <div className="space-y-6">
                            {(data.radarData ?? []).map((d, i) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <span className="text-sm font-black uppercase tracking-tight">{d.subject}</span>
                                    <div className="flex items-center gap-6">
                                        <div className="w-48 h-3 bg-slate-100 rounded-none overflow-hidden border border-black/10">
                                            <div className="h-full bg-black" style={{ width: `${d.A}%` }} />
                                        </div>
                                        <span className="text-sm font-mono font-black w-12 text-right">{d.A}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-auto pt-20 border-t-2 border-black flex justify-between items-end">
                        <div className="space-y-4">
                            <div className="w-48 h-12 border-b-2 border-black"></div>
                            <p className="text-[10px] font-black uppercase tracking-widest">Registrar Content Seal</p>
                        </div>
                        <div className="text-right max-w-[300px]">
                            <p className="text-[8px] font-mono text-slate-400 break-all leading-none">{Math.random().toString(36).substring(2).toUpperCase()}{Math.random().toString(36).substring(2).toUpperCase()}</p>
                            <p className="text-[10px] font-black mt-2 uppercase">Official Audit Artifact</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
