"use client";
import { useState, useEffect } from "react";
import KPICard from "@/components/ui/KPICard";
import { Building, Search, FolderPlus } from "lucide-react";

export default function DepartmentsTab() {
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    
    // Modal state for creating department
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [form, setForm] = useState({ name: "", code: "" });
    const [isSaving, setIsSaving] = useState(false);

    // Alert modal state
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [alertType, setAlertType] = useState<"success" | "error">("success");

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/departments");
            if (res.ok) {
                const data = await res.json();
                setDepartments(data);
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const createDepartment = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await fetch("/api/admin/departments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                setAlertType("success");
                setAlertMessage("Department created successfully");
                setIsAlertModalOpen(true);
                setForm({ name: "", code: "" });
                setIsCreateModalOpen(false);
                fetchDepartments();
            } else {
                const data = await res.json();
                setAlertType("error");
                setAlertMessage(data.error || "Failed to create department");
                setIsAlertModalOpen(true);
            }
        } catch (e: any) {
            setAlertType("error");
            setAlertMessage(e.message || "An error occurred");
            setIsAlertModalOpen(true);
        } finally {
            setIsSaving(false);
        }
    };

    const filteredDepartments = departments.filter((d: any) =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.code.toLowerCase().includes(search.toLowerCase())
    );

    const totalDepartments = departments.length;
    const totalStaff = departments.reduce((acc, d) => acc + (d._count?.users || 0), 0);
    const totalCourses = departments.reduce((acc, d) => acc + (d._count?.courses || 0), 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>Departments</h1>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Manage university departments, faculty assignments, and structural organization.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                    { label: "Total Departments", value: totalDepartments, icon: <Building className="w-6 h-6" />, color: "#3b82f6" },
                    { label: "Total Staff Assigned", value: totalStaff, icon: <Building className="w-6 h-6" />, color: "#f59e0b" },
                    { label: "Total Courses Hosted", value: totalCourses, icon: <Building className="w-6 h-6" />, color: "#a855f7" },
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
                        placeholder="Search by code or department name..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition shadow-sm border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500" 
                        style={{ color: "var(--text-primary)" }} 
                    />
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:opacity-90 active:scale-95 text-white shadow-md shadow-blue-500/20"
                    style={{ backgroundColor: "var(--primary)" }}
                >
                    <FolderPlus className="w-5 h-5" />
                    Add Department
                </button>
            </div>

            {/* Professional List UI */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800/60 overflow-hidden shadow-sm" style={{ backgroundColor: "var(--bg-surface)" }}>
                {/* Header Row */}
                <div className="hidden sm:grid grid-cols-12 gap-4 p-4 border-b border-slate-200 dark:border-slate-800/60 text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: "var(--bg-hover)", color: "var(--text-muted)" }}>
                    <div className="col-span-2">Code</div>
                    <div className="col-span-6">Department Name</div>
                    <div className="col-span-2 text-center">Assigned Staff</div>
                    <div className="col-span-2 text-center">Courses Hosted</div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {loading ? (
                        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div>
                    ) : filteredDepartments.length > 0 ? (
                        filteredDepartments.map((d: any) => (
                            <div key={d.id} className="group flex flex-col transition-colors hover:bg-[var(--bg-hover)]" style={{ backgroundColor: "var(--bg-base)" }}>
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 sm:p-5 items-center relative">
                                    {/* Code */}
                                    <div className="col-span-1 sm:col-span-2 flex items-center">
                                        <div className="px-3 py-1.5 rounded-lg border text-xs font-bold bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
                                            {d.code}
                                        </div>
                                    </div>

                                    {/* Name */}
                                    <div className="col-span-1 sm:col-span-6 flex items-center">
                                        <div className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{d.name}</div>
                                    </div>

                                    {/* Staff Count */}
                                    <div className="col-span-1 sm:col-span-2 flex items-center sm:justify-center">
                                        <div className="text-sm font-bold" style={{ color: "var(--text-secondary)" }}>
                                            {d._count?.users || 0}
                                        </div>
                                    </div>

                                    {/* Courses Count */}
                                    <div className="col-span-1 sm:col-span-2 flex items-center sm:justify-center">
                                        <div className="text-sm font-bold" style={{ color: "var(--text-secondary)" }}>
                                            {d._count?.courses || 0}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-16 text-center flex flex-col items-center justify-center">
                            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-inner" style={{ backgroundColor: "var(--bg-hover)" }}>
                                <Building className="w-10 h-10 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-extrabold mb-2" style={{ color: "var(--text-primary)" }}>No Departments Found</h3>
                            <p className="text-sm max-w-sm" style={{ color: "var(--text-muted)" }}>
                                No departments match your search or none have been created yet.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Department Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--bg-border)" }}>
                        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800/60 rounded-t-2xl flex items-center justify-between">
                            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Add New Department</h2>
                        </div>
                        <form onSubmit={createDepartment} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>Department Name</label>
                                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} type="text" className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition shadow-sm border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900" style={{ color: "var(--text-primary)" }} placeholder="e.g. Computer Science" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>Department Code</label>
                                <input required value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} type="text" className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition shadow-sm border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900 uppercase" style={{ color: "var(--text-primary)" }} placeholder="e.g. CS" />
                            </div>
                            <div className="pt-6 flex items-center justify-end gap-3 mt-6 border-t border-slate-200 dark:border-slate-800/60">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold transition hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800/60" style={{ color: "var(--text-primary)" }}>Cancel</button>
                                <button type="submit" disabled={isSaving} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50 shadow-md shadow-blue-500/20" style={{ backgroundColor: "var(--primary)" }}>
                                    {isSaving ? "Creating..." : "Create Department"}
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
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${alertType === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                            {alertType === 'success' ? <Building className="w-6 h-6" /> : <Building className="w-6 h-6" />}
                        </div>
                        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>{alertType === 'success' ? 'Success' : 'Error'}</h2>
                        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>{alertMessage}</p>
                        
                        <button
                            onClick={() => setIsAlertModalOpen(false)}
                            className="w-full py-2.5 rounded-xl font-bold transition text-white shadow-md"
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
