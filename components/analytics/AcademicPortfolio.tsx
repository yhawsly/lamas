"use client";
import { useState, useEffect } from "react";
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from "recharts";
import { Compass, BarChart2, Shield, Eye, CheckCircle2 } from "lucide-react";

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
    metrics?: { 
        outlines: number; 
        observations: number; 
        alerts: number;
        coursesTaught?: number;
        invigilations?: number;
        moderations?: number;
        userProfile?: any;
    };
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
            <div className="w-full space-y-6 sm:space-y-8">
                {/* Header Skeleton */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div className="space-y-3">
                        <div className="h-10 w-72 sm:w-96 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                        <div className="flex gap-2">
                            <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800/80 rounded-md animate-pulse" />
                            <div className="h-5 w-24 bg-slate-100 dark:bg-slate-800/60 rounded-md animate-pulse" />
                        </div>
                    </div>
                    <div className="flex gap-2 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                        <div className="h-10 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                        <div className="h-10 w-28 bg-transparent rounded-xl" />
                    </div>
                </div>

                {/* Dossier Header Skeleton */}
                <div className="rounded-3xl h-32 md:h-40 bg-slate-100 dark:bg-slate-800/40 animate-pulse border border-slate-200 dark:border-slate-800" />

                {/* Vital Signs Skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-28 rounded-3xl bg-slate-100 dark:bg-slate-800/40 animate-pulse border border-slate-200 dark:border-slate-800" />
                    ))}
                </div>

                {/* Bottom Grid Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-[340px] rounded-3xl bg-slate-100 dark:bg-slate-800/40 animate-pulse border border-slate-200 dark:border-slate-800" />
                    <div className="h-[340px] rounded-3xl bg-slate-100 dark:bg-slate-800/40 animate-pulse border border-slate-200 dark:border-slate-800" />
                </div>
                <p className="text-sm font-medium animate-pulse" style={{ color: "var(--text-muted)" }}>Loading Academic Data...</p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6 sm:space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400">
                        Academic Performance & QA
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider border border-blue-500/20">Quality Assurance Hub</span>
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
                                <Compass className="w-10 h-10 text-slate-400 opacity-60" />
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
                    {/* Identity Header */}
                    <div className="rounded-3xl p-8 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
                        <div className="relative z-10 flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-500/30">
                                {data.metrics?.userProfile?.name?.charAt(0) || "L"}
                            </div>
                            <div>
                                <h2 className="text-3xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                                    {data.metrics?.userProfile?.name || "Lecturer Profile"}
                                </h2>
                                <p className="text-sm font-semibold mt-1" style={{ color: "var(--text-muted)" }}>
                                    {data.metrics?.userProfile?.email || "Academic Staff"}
                                </p>
                            </div>
                        </div>
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="px-4 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Active Term
                            </div>
                            <button 
                                onClick={() => handleExport("Lecturer Performance Report")}
                                className="px-6 py-2.5 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
                                style={{ background: "var(--primary)" }}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                Export PDF
                            </button>
                        </div>
                    </div>

                    {/* Vital Signs Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-6 rounded-3xl" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Courses Taught</p>
                            <p className="text-4xl font-black" style={{ color: "var(--text-primary)" }}>{data.metrics?.coursesTaught || 0}</p>
                        </div>
                        <div className="p-6 rounded-3xl" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                            <p className="text-[11px] font-black text-emerald-500 uppercase tracking-widest mb-1">Outlines Submitted</p>
                            <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400">{data.metrics?.outlines || 0}</p>
                        </div>
                        <div className="p-6 rounded-3xl" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                            <p className="text-[11px] font-black text-indigo-500 uppercase tracking-widest mb-1">Invigilation Duties</p>
                            <p className="text-4xl font-black text-indigo-600 dark:text-indigo-400">{data.metrics?.invigilations || 0}</p>
                        </div>
                        <div className="p-6 rounded-3xl" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                            <p className="text-[11px] font-black text-amber-500 uppercase tracking-widest mb-1">Moderations</p>
                            <p className="text-4xl font-black text-amber-600 dark:text-amber-400">{data.metrics?.moderations || 0}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Pedagogical Radar */}
                        <div className="rounded-3xl p-8 relative overflow-hidden" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                            <h3 className="font-bold text-lg mb-1" style={{ color: "var(--text-primary)" }}>Peer Observation Feedback</h3>
                            <p className="text-xs mb-8" style={{ color: "var(--text-muted)" }}>Average ratings from HOD & Peer Teaching Observations.</p>
                            
                            {data.radarData ? (
                                <ResponsiveContainer width="100%" height={260}>
                                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data.radarData}>
                                        <PolarGrid stroke="#e2e8f0" strokeOpacity={0.5} />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 'bold' }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                        <Radar name="My Score" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.4} dot={{ r: 4, fill: '#10b981' }} />
                                        <Tooltip formatter={(v: number) => [`${v}%`, 'Score']} contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--bg-border)', borderRadius: '12px' }} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[260px] gap-2">
                                    <BarChart2 className="w-8 h-8 opacity-40 text-blue-500" />
                                    <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>No Observations Yet</p>
                                </div>
                            )}
                        </div>

                        {/* Clearance Checklist */}
                        <div className="rounded-3xl p-8" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                            <h3 className="font-bold text-lg mb-1" style={{ color: "var(--text-primary)" }}>End of Semester Clearance</h3>
                            <p className="text-xs mb-8" style={{ color: "var(--text-muted)" }}>Ensure all critical academic duties are completed.</p>
                            
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">✓</div>
                                    <div>
                                        <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Course Syllabuses Uploaded</p>
                                        <p className="text-xs opacity-70">All assigned courses have verified outlines.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">✓</div>
                                    <div>
                                        <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Teaching Observations Completed</p>
                                        <p className="text-xs opacity-70">Peer reviews have been finalized.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5">
                                    <div className="w-8 h-8 rounded-full border-2 border-amber-500 flex items-center justify-center shrink-0 text-amber-500 font-bold">!</div>
                                    <div>
                                        <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Exam Moderations Finalized</p>
                                        <p className="text-xs opacity-70">Ensure all moderated exams are approved.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5">
                                    <div className="w-8 h-8 rounded-full border-2 border-amber-500 flex items-center justify-center shrink-0 text-amber-500 font-bold">!</div>
                                    <div>
                                        <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Invigilation Duties Fulfilled</p>
                                        <p className="text-xs opacity-70">Attend all assigned examination sessions.</p>
                                    </div>
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

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
                        {data.auditArtifacts.map((audit, i) => {
                            const renderIcon = () => {
                                if (audit.iconType === "SHIELD" || audit.title.includes("Pre-Cycle")) {
                                    return <Shield className="w-5 sm:w-8 h-5 sm:h-8 text-blue-500" />;
                                }
                                if (audit.iconType === "EYE" || audit.title.includes("Mid-Term")) {
                                    return <Eye className="w-5 sm:w-8 h-5 sm:h-8 text-amber-500" />;
                                }
                                return <CheckCircle2 className="w-5 sm:w-8 h-5 sm:h-8 text-emerald-500" />;
                            };

                            return (
                                <div key={i} className={`p-3.5 sm:p-6 rounded-2xl transition-all hover:bg-white/5 border border-dashed border-white/10 group flex flex-col justify-between ${i === 2 ? "col-span-2 md:col-span-1" : ""}`} style={{ backgroundColor: "var(--bg-hover)" }}>
                                    <div>
                                        <div className="mb-3 sm:mb-4 group-hover:scale-110 transition-transform inline-block p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800/80">
                                            {renderIcon()}
                                        </div>
                                        <div className="flex justify-between items-start mb-1 gap-2">
                                            <h4 className="font-bold text-sm sm:text-lg truncate">{audit.title}</h4>
                                            <span className="text-[9px] sm:text-[10px] font-black opacity-40 uppercase tracking-tighter shrink-0">{audit.date}</span>
                                        </div>
                                        <p className="text-[11px] sm:text-xs opacity-60 mb-4 sm:mb-8 line-clamp-2">{audit.desc}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleExport(audit.title)}
                                        className="w-full py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-black tracking-widest uppercase transition-all"
                                        style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }}
                                    >
                                        EXPORT PDF
                                    </button>
                                </div>
                            );
                        })}
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
                    <div className="text-center border-b-2 border-slate-900 pb-4 mb-8">
                        <h1 className="text-2xl font-black uppercase tracking-widest">{data.stats.institution}</h1>
                        <h2 className="text-lg font-bold mt-1">End of Semester Clearance Report</h2>
                        <p className="text-sm font-semibold mt-1">Academic Term: {data.stats.activeTerm}</p>
                    </div>

                    <div className="mb-8">
                        <h3 className="font-bold text-lg mb-2 border-b pb-1">Lecturer Details</h3>
                        <p><strong>Name:</strong> {data.metrics?.userProfile?.name}</p>
                        <p><strong>Email:</strong> {data.metrics?.userProfile?.email}</p>
                    </div>

                    <div className="mb-8">
                        <h3 className="font-bold text-lg mb-2 border-b pb-1">Academic Duties & Metrics</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <p><strong>Courses/Sections Taught:</strong> {data.metrics?.coursesTaught || 0}</p>
                            <p><strong>Course Outlines Submitted:</strong> {data.metrics?.outlines || 0}</p>
                            <p><strong>Invigilation Duties:</strong> {data.metrics?.invigilations || 0}</p>
                            <p><strong>Moderations Finalized:</strong> {data.metrics?.moderations || 0}</p>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h3 className="font-bold text-lg mb-2 border-b pb-1">Peer Observation Feedback</h3>
                        {data.radarData ? (
                            <ul className="list-disc pl-5">
                                {data.radarData.map((d: any) => (
                                    <li key={d.subject}><strong>{d.subject}:</strong> {d.A}%</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="italic">No formal teaching observations recorded for this term.</p>
                        )}
                    </div>
                    
                    <div className="mt-16 text-center text-xs opacity-60">
                        <p>Generated securely via LAMAS Academic Accountability Platform</p>
                        <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
