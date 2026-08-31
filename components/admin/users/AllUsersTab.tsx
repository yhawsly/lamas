"use client";
import { useEffect, useState } from "react";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { TableSkeleton } from "@/components/ui/Skeleton";
import KPICard from "@/components/ui/KPICard";
import RefreshButton from "@/components/ui/RefreshButton";
import { AlertCircle, Trash2, Key, Users, CheckCircle, Search, UserPlus, ShieldCheck } from "lucide-react";



export default function AllUsersTab() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Modal state for creating user
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: "", email: "", password: "", role: "LECTURER", departmentId: ""
    });
    const [departments, setDepartments] = useState<any[]>([]);
    const [actionLoading, setActionLoading] = useState(false);

    // Modal state for alerts and confirmations
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<number | null>(null);

    useEffect(() => {
        fetchUsers();
        fetch("/api/admin/departments").then(r => r.ok ? r.json() : []).then(d => setDepartments(Array.isArray(d) ? d : []));
    }, []);

    const fetchUsers = () => {
        setLoading(true);
        fetch("/api/admin/users")
            .then(r => r.json())
            .then(d => {
                setUsers(Array.isArray(d) ? d : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    const confirmDelete = (id: number) => {
        setUserToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (userToDelete === null) return;
        try {
            const res = await fetch(`/api/admin/users/${userToDelete}`, { method: "DELETE" });
            if (res.ok) {
                setUsers(prev => prev.filter(u => u.id !== userToDelete));
                setIsDeleteModalOpen(false);
                setUserToDelete(null);
            } else {
                setAlertMessage("Failed to delete user.");
                setIsAlertModalOpen(true);
            }
        } catch {
            setAlertMessage("Error deleting user.");
            setIsAlertModalOpen(true);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(createForm),
            });

            if (res.ok) {
                setIsCreateModalOpen(false);
                setCreateForm({ name: "", email: "", password: "", role: "LECTURER", departmentId: "" });
                fetchUsers();
            } else {
                const data = await res.json();
                setAlertMessage(data.error || "Failed to create user.");
                setIsAlertModalOpen(true);
            }
        } catch {
            setAlertMessage("An error occurred.");
            setIsAlertModalOpen(true);
        } finally {
            setActionLoading(false);
        }
    };

    const filteredUsers = users.filter((u: any) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.department?.name || "").toLowerCase().includes(search.toLowerCase())
    );

    const totalUsers = users.length;
    const adminCount = users.filter(u => u.role === "ADMIN" || u.role === "SUPER_ADMIN").length;
    const hodCount = users.filter(u => u.role === "HOD").length;
    const deoCount = users.filter(u => u.role === "DEO").length;
    const lecturerCount = users.filter(u => u.role === "LECTURER").length;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>All Users</h1>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Manage user accounts, assign roles, and handle security credentials across the institution.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {[
                    { label: "Total Users", value: totalUsers, icon: <Users className="w-6 h-6" />, color: "#3b82f6" },
                    { label: "Administrators", value: adminCount, icon: <Key className="w-6 h-6" />, color: "#a855f7" },
                    { label: "HODs", value: hodCount, icon: <CheckCircle className="w-6 h-6" />, color: "#f59e0b" },
                    { label: "Exam Officers (DEO)", value: deoCount, icon: <ShieldCheck className="w-6 h-6" />, color: "#06b6d4" },
                    { label: "Lecturers", value: lecturerCount, icon: <Users className="w-6 h-6" />, color: "#10b981" },
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
                        onClick={fetchUsers}
                        isRefreshing={loading}
                        label="Refresh"
                        size="md"
                        variant="outline"
                        title="Reload users list"
                    />
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:opacity-90 active:scale-95 text-white shadow-md shadow-blue-500/20 cursor-pointer"
                        style={{ backgroundColor: "var(--primary)" }}
                    >
                        <UserPlus className="w-5 h-5" />
                        Add User
                    </button>
                </div>
            </div>

            {/* Professional List UI */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800/60 overflow-hidden shadow-sm" style={{ backgroundColor: "var(--bg-surface)" }}>
                {/* Header Row */}
                <div className="hidden sm:grid grid-cols-12 gap-4 p-4 border-b border-slate-200 dark:border-slate-800/60 text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: "var(--bg-hover)", color: "var(--text-muted)" }}>
                    <div className="col-span-4">Name & Email</div>
                    <div className="col-span-3">Role</div>
                    <div className="col-span-2">Department</div>
                    <div className="col-span-2">Security</div>
                    <div className="col-span-1 text-right">Actions</div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {loading ? (
                        <TableSkeleton rows={5} />
                    ) : filteredUsers.length > 0 ? (
                        filteredUsers.map((u: any) => (
                            <div key={u.id} className="group flex flex-col transition-colors hover:bg-[var(--bg-hover)]" style={{ backgroundColor: "var(--bg-base)" }}>
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 sm:p-5 items-center relative">
                                    {/* Name & Email */}
                                    <div className="col-span-1 sm:col-span-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs border shrink-0 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700" style={{ color: "var(--text-primary)" }}>
                                            {u.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm leading-tight" style={{ color: "var(--text-primary)" }}>{u.name}</div>
                                            <div className="text-xs font-semibold mt-0.5" style={{ color: "var(--text-muted)" }}>{u.email}</div>
                                        </div>
                                    </div>

                                    {/* Role */}
                                    <div className="col-span-1 sm:col-span-3 flex items-center">
                                        <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${
                                            u.role === 'SUPER_ADMIN' || u.role === 'ADMIN' ? 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20' :
                                            u.role === 'HOD' ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' :
                                            'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
                                        }`}>
                                            {u.role.replace('_', ' ')}
                                        </div>
                                    </div>

                                    {/* Department */}
                                    <div className="col-span-1 sm:col-span-2 flex items-center text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                                        {u.department?.name || "—"}
                                    </div>

                                    {/* Security */}
                                    <div className="col-span-1 sm:col-span-2 flex items-center">
                                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${
                                            u.requirePasswordReset ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' : 
                                            'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                        }`}>
                                            {u.requirePasswordReset ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                            {u.requirePasswordReset ? "Reset Reqd" : "Secure"}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="col-span-1 sm:col-span-1 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!u.requirePasswordReset && (
                                            <button
                                                onClick={async () => {
                                                    const res = await fetch(`/api/admin/users/${u.id}`, {
                                                        method: 'PATCH',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ requirePasswordReset: true })
                                                    });
                                                    if (res.ok) fetchUsers();
                                                }}
                                                className="p-2 rounded-xl text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                                                title="Force Password Reset"
                                            >
                                                <Key className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => confirmDelete(u.id)}
                                            className="p-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                            title="Delete User"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-16 text-center flex flex-col items-center justify-center">
                            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-inner" style={{ backgroundColor: "var(--bg-hover)" }}>
                                <Users className="w-10 h-10 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-extrabold mb-2" style={{ color: "var(--text-primary)" }}>No Users Found</h3>
                            <p className="text-sm max-w-sm" style={{ color: "var(--text-muted)" }}>
                                No users match the selected filters or there are no users in the system.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create User Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--bg-border)" }}>
                        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800/60 rounded-t-2xl flex items-center justify-between">
                            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Add New User</h2>
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
                                            { label: "Department Examination Officer", value: "DEO" },
                                            { label: "Admin", value: "ADMIN" }
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
                                    {actionLoading ? "Creating..." : "Create User"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200 text-center" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--bg-border)" }}>
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-500/10 text-red-500">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Delete User?</h3>
                        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                            Are you sure you want to delete this user? This action cannot be undone.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button onClick={() => { setIsDeleteModalOpen(false); setUserToDelete(null); }} className="w-full px-4 py-2.5 rounded-xl text-sm font-bold transition hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800/60" style={{ color: "var(--text-primary)" }}>Cancel</button>
                            <button onClick={handleDelete} className="w-full px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-500 transition-colors shadow-md shadow-red-500/20">
                                Delete
                            </button>
                        </div>
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
