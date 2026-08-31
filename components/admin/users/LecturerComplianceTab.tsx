"use client";
import { useEffect, useState } from "react";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { TableSkeleton } from "@/components/ui/Skeleton";
import KPICard from "@/components/ui/KPICard";
import RefreshButton from "@/components/ui/RefreshButton";
import { AlertCircle, BarChart, CheckCircle, Clock, Search, AlertTriangle, UserPlus } from "lucide-react";

export default function LecturerComplianceTab() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Modal state for creating user
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", role: "LECTURER", departmentId: "" });
    const [departments, setDepartments] = useState<any[]>([]);
    const [actionLoading, setActionLoading] = useState(false);
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");

    const fetchData = () => {
        setLoading(true);
        fetch("/api/admin/analytics")
            .then(r => r.ok ? r.json().catch(() => ({ scores: [] })) : ({ scores: [] }))
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { 
        fetchData();
        fetch("/api/admin/departments")
            .then(r => r.ok ? r.json().catch(() => []) : [])
            .then(d => setDepartments(Array.isArray(d) ? d : []))
            .catch(() => setDepartments([]));
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const res = await fetch("/api/admin/users", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(createForm),
            });
            if (res.ok) {
                setIsCreateModalOpen(false);
                setCreateForm({ name: "", email: "", password: "", role: "LECTURER", departmentId: "" });
                fetchData(); // Refresh list after adding
            } else {
                const data = await res.json();
                setAlertMessage(data.error || "Failed to create user.");
                setIsAlertModalOpen(true);
            }
        } catch {
            setAlertMessage("An error occurred.");
            setIsAlertModalOpen(true);
        } finally { setActionLoading(false); }
    };

    const scores = (data?.scores ?? []).filter((s: any) =>
        s.lecturerName.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase()) ||
        s.department.toLowerCase().includes(search.toLowerCase())
    );

    const totalLecturers = (data?.scores ?? []).length;
    const goodCompliance = (data?.scores ?? []).filter((s:any) => !s.isAtRisk).length;
    const atRisk = (data?.scores ?? []).filter((s:any) => s.isAtRisk).length;
    const avgScore = totalLecturers > 0 ? Math.round((data?.scores ?? []).reduce((acc:any, s:any) => acc + s.score, 0) / totalLecturers) : 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>Lecturer Compliance</h1>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Monitor appraisal submissions, identify late submissions, and track at-risk staff.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {[
                    { label: "Total Lecturers", value: totalLecturers, icon: <BarChart className="w-6 h-6" />, color: "#3b82f6" },
                    { label: "Avg Compliance", value: `${avgScore}%`, icon: <CheckCircle className="w-6 h-6" />, color: "#a855f7" },
                    { label: "On Track", value: goodCompliance, icon: <CheckCircle className="w-6 h-6" />, color: "#10b981" },
                    { label: "At Risk", value: atRisk, icon: <AlertTriangle className="w-6 h-6" />, color: "#ef4444" },
                ].map((stat, i) => (
                    <KPICard key={stat.label} delay={i * 100} size="sm" {...stat} />
                ))}
            </div>

            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative w-full max-w-md">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                        placeholder="Search by name, email or department..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition shadow-sm border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500" 
                        style={{ color: "var(--text-primary)" }} 
                    />
                </div>
                <div className="flex items-center gap-3">
                    <RefreshButton
                        onClick={fetchData}
                        isRefreshing={loading}
                        label="Refresh"
                        size="md"
                        variant="outline"
                        title="Reload compliance scores"
                    />
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:opacity-90 active:scale-95 text-white shadow-md shadow-blue-500/20 cursor-pointer"
                        style={{ backgroundColor: "var(--primary)" }}
                    >
                        <UserPlus className="w-5 h-5" />
                        Add Lecturer
                    </button>
                </div>
            </div>

            {/* Professional List UI */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800/60 overflow-hidden shadow-sm" style={{ backgroundColor: "var(--bg-surface)" }}>
                {/* Header Row */}
                <div className="hidden sm:grid grid-cols-12 gap-4 p-4 border-b border-slate-200 dark:border-slate-800/60 text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: "var(--bg-hover)", color: "var(--text-muted)" }}>
                    <div className="col-span-3">Lecturer</div>
                    <div className="col-span-3">Department</div>
                    <div className="col-span-3">Compliance Rate</div>
                    <div className="col-span-2 text-center">Submissions (Late)</div>
                    <div className="col-span-1 text-right">Status</div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {loading ? (
                        <TableSkeleton rows={5} />
                    ) : scores.length > 0 ? (
                        scores.map((s: any) => (
                            <div key={s.lecturerId} className="group flex flex-col transition-colors hover:bg-[var(--bg-hover)]" style={{ backgroundColor: "var(--bg-base)" }}>
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 sm:p-5 items-center relative">
                                    {/* Lecturer */}
                                    <div className="col-span-1 sm:col-span-3 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs border shrink-0 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700" style={{ color: "var(--text-primary)" }}>
                                            {s.lecturerName.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm leading-tight truncate" style={{ color: "var(--text-primary)" }} title={s.lecturerName}>{s.lecturerName}</div>
                                            <div className="text-xs font-semibold mt-0.5 truncate" style={{ color: "var(--text-muted)" }} title={s.email}>{s.email}</div>
                                        </div>
                                    </div>

                                    {/* Department */}
                                    <div className="col-span-1 sm:col-span-3 flex items-center text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
                                        {s.department || "—"}
                                    </div>

                                    {/* Compliance Rate */}
                                    <div className="col-span-1 sm:col-span-3 flex items-center gap-3">
                                        <div className="w-full max-w-[120px] h-2 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                                            <div className="h-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, Math.max(0, s.score))}%`, backgroundColor: s.score >= 70 ? "#10b981" : "#ef4444" }} />
                                        </div>
                                        <span className="text-xs font-bold w-9" style={{ color: s.score >= 70 ? "#10b981" : "#ef4444" }}>{Math.min(100, Math.max(0, s.score))}%</span>
                                    </div>

                                    {/* Submissions (Late) */}
                                    <div className="col-span-1 sm:col-span-2 flex items-center sm:justify-center gap-2">
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 font-bold text-xs border border-emerald-200 dark:border-emerald-500/20">
                                            <CheckCircle className="w-3.5 h-3.5" />
                                            {s.submitted}
                                        </div>
                                        {s.late > 0 && (
                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 font-bold text-xs border border-red-200 dark:border-red-500/20">
                                                <Clock className="w-3.5 h-3.5" />
                                                {s.late}
                                            </div>
                                        )}
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-1 sm:col-span-1 flex items-center justify-end">
                                        {s.isAtRisk ? (
                                            <span className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">
                                                <AlertTriangle className="w-3 h-3" />
                                                At Risk
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                                                <CheckCircle className="w-3 h-3" />
                                                Good
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-16 text-center flex flex-col items-center justify-center">
                            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-inner" style={{ backgroundColor: "var(--bg-hover)" }}>
                                <BarChart className="w-10 h-10 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-extrabold mb-2" style={{ color: "var(--text-primary)" }}>No Compliance Data</h3>
                            <p className="text-sm max-w-sm" style={{ color: "var(--text-muted)" }}>
                                There is no lecturer compliance data available or matching your search.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Lecturer Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--bg-border)" }}>
                        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800/60 rounded-t-2xl flex items-center justify-between">
                            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Add New Lecturer</h2>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>Full Name</label>
                                <input required value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} type="text" className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition shadow-sm border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900" style={{ color: "var(--text-primary)" }} placeholder="e.g. Dr. Jane Doe" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>Email Address</label>
                                <input required value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} type="email" className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition shadow-sm border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900" style={{ color: "var(--text-primary)" }} placeholder="jane.doe@university.edu" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>Password</label>
                                <input required value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} type="password" minLength={6} className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition shadow-sm border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900" style={{ color: "var(--text-primary)" }} placeholder="Enter a secure password" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>Role</label>
                                    <SearchableSelect
                                        value={createForm.role}
                                        onChange={(val) => setCreateForm({ ...createForm, role: String(val) })}
                                        options={[
                                            { label: "Lecturer", value: "LECTURER" },
                                            { label: "Head of Department", value: "HOD" },
                                        ]}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>Department</label>
                                    <SearchableSelect
                                        value={createForm.departmentId}
                                        onChange={(val) => setCreateForm({ ...createForm, departmentId: String(val) })}
                                        options={[
                                            { label: "None", value: "" },
                                            ...departments.map(d => ({ label: d.name, value: String(d.id) }))
                                        ]}
                                        placeholder="Select Dept..."
                                    />
                                </div>
                            </div>
                            <div className="pt-6 flex items-center justify-end gap-3 mt-6 border-t border-slate-200 dark:border-slate-800/60">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold transition hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800/60" style={{ color: "var(--text-primary)" }}>Cancel</button>
                                <button type="submit" disabled={actionLoading} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50 shadow-md shadow-blue-500/20" style={{ backgroundColor: "var(--primary)" }}>
                                    {actionLoading ? "Creating..." : "Create Lecturer"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Alert Modal */}
            {isAlertModalOpen && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--bg-border)" }}>
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-blue-500/10 text-blue-500">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Notice</h2>
                        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>{alertMessage}</p>
                        
                        <button
                            onClick={() => setIsAlertModalOpen(false)}
                            className="w-full py-2.5 rounded-xl font-bold transition text-white shadow-md shadow-blue-500/20"
                            style={{ backgroundColor: "var(--primary)" }}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
