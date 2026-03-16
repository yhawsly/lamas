"use client";
import { useEffect, useState } from "react";
import SearchableSelect from "@/components/ui/SearchableSelect";

export default function AdminUsersPage() {
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
        // Fetch proper departments route
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

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>User Management</h1>
                    <p className="mt-1" style={{ color: "var(--text-muted)" }}>Create, view, and manage application users</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all hover:opacity-90 active:scale-95 text-white"
                    style={{ backgroundColor: "var(--primary)" }}
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add User
                </button>
            </div>

            <div className="mb-4">
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email or department..."
                    className="w-full max-w-md px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} />
            </div>

            <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                {loading ? <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left border-b" style={{ color: "var(--text-muted)", borderBottomColor: "var(--bg-border)" }}>
                                    <th className="pb-3 pr-4">Name & Email</th>
                                    <th className="pb-3 pr-4">Role</th>
                                    <th className="pb-3 pr-4">Department</th>
                                    <th className="pb-3 pr-4">Joined</th>
                                    <th className="pb-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ borderBottomColor: "var(--bg-border)" }}>
                                {filteredUsers.map((u: any) => (
                                    <tr key={u.id} className="group hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ color: "var(--text-secondary)", borderBottomColor: "var(--bg-border)" }}>
                                        <td className="py-3 pr-4">
                                            <div style={{ color: "var(--text-primary)" }} className="font-medium">{u.name}</div>
                                            <div className="text-xs" style={{ color: "var(--text-muted)" }}>{u.email}</div>
                                        </td>
                                        <td className="py-3 pr-4">
                                            <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: "var(--bg-hover)", color: "var(--text-secondary)", border: "1px solid var(--bg-border)" }}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="py-3 pr-4" style={{ color: "var(--text-muted)" }}>{u.department?.name || "-"}</td>
                                        <td className="py-3 pr-4" style={{ color: "var(--text-muted)" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                                        <td className="py-3 text-right">
                                            <button
                                                onClick={() => confirmDelete(u.id)}
                                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                                                title="Delete User"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredUsers.length === 0 && <tr><td colSpan={5} className="py-12 text-center" style={{ color: "var(--text-muted)" }}>No users found matching your search.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create User Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl shadow-xl flex flex-col" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                        <div className="px-6 py-4 border-b rounded-t-2xl" style={{ borderColor: "var(--bg-border)" }}>
                            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Add New User</h2>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Full Name</label>
                                <input required value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} type="text" className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} placeholder="e.g. Dr. Jane Doe" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Email Address</label>
                                <input required value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} type="email" className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} placeholder="jane.doe@university.edu" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Password</label>
                                <input required value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} type="password" minLength={6} className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} placeholder="Enter a secure password" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Role</label>
                                    <SearchableSelect
                                        value={createForm.role}
                                        onChange={(val) => setCreateForm({ ...createForm, role: String(val) })}
                                        options={[
                                            { label: "Lecturer", value: "LECTURER" },
                                            { label: "Head of Department", value: "HOD" },
                                            { label: "Admin", value: "ADMIN" }
                                        ]}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Department</label>
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
                            <div className="pt-4 flex items-center justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ color: "var(--text-secondary)" }}>Cancel</button>
                                <button type="submit" disabled={actionLoading} className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 rounded-b-2xl" style={{ backgroundColor: "var(--primary)" }}>
                                    {actionLoading ? "Creating..." : "Create User"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-2xl shadow-xl overflow-hidden p-6" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Delete User?</h3>
                            </div>
                        </div>
                        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
                            Are you sure you want to delete this user? This action cannot be undone.
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button onClick={() => { setIsDeleteModalOpen(false); setUserToDelete(null); }} className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ color: "var(--text-secondary)" }}>Cancel</button>
                            <button onClick={handleDelete} className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors">
                                Delete User
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Alert Modal */}
            {isAlertModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-2xl shadow-xl overflow-hidden p-6 text-center" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "var(--bg-hover)", color: "var(--text-primary)" }}>
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>Notice</h3>
                        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
                            {alertMessage}
                        </p>
                        <button onClick={() => setIsAlertModalOpen(false)} className="w-full px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "var(--primary)" }}>
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
