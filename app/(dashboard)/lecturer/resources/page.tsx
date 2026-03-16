"use client";

import { useEffect, useState } from "react";
import Pagination from "@/components/ui/Pagination";
import Modal from "@/components/ui/Modal";
import SearchableSelect from "@/components/ui/SearchableSelect";

interface Resource {
    id: number;
    title: string;
    description?: string;
    type: string;
    url: string;
    status: string;
    createdAt: string;
    lecturer: { name: string; email?: string; role?: string };
    department?: { name: string } | null;
}

const typeIcon: Record<string, string> = {
    PDF: "📄", SLIDES: "📊", CODE: "💻", VIDEO: "🎥", LINK: "🔗", OTHER: "📎",
};

const statusColors: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    REJECTED: "bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
};

export default function LecturerResourcesPage() {
    const [activeTab, setActiveTab] = useState<"MY_UPLOADS" | "SHARED">("MY_UPLOADS");
    const [myResources, setMyResources] = useState<Resource[]>([]);
    const [sharedResources, setSharedResources] = useState<Resource[]>([]);
    const [myPagination, setMyPagination] = useState({ page: 1, totalPages: 1 });
    const [sharedPagination, setSharedPagination] = useState({ page: 1, totalPages: 1 });
    const [myLoading, setMyLoading] = useState(true);
    const [sharedLoading, setSharedLoading] = useState(true);
    const [uploadingFile, setUploadingFile] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [file, setFile] = useState<File | null>(null);

    // Search & Filter state for 'Shared' tab
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL");

    const [modal, setModal] = useState<{ isOpen: boolean; type: "alert" | "confirm"; title: string; message: string; onConfirm?: () => void }>({ isOpen: false, type: "alert", title: "", message: "" });
    const showAlert = (title: string, message: string) => setModal({ isOpen: true, type: "alert", title, message });
    const showConfirm = (title: string, message: string, onConfirm: () => void) => setModal({ isOpen: true, type: "confirm", title, message, onConfirm });

    const fetchMyResources = async (page: number) => {
        setMyLoading(true);
        try {
            const res = await fetch(`/api/resources?page=${page}&limit=10`);
            const json = await res.json();
            setMyResources(json.data || []);
            setMyPagination({ page, totalPages: json.meta?.totalPages || 1 });
        } catch (error) {
            console.error("Failed to fetch my resources:", error);
            setMyResources([]);
        } finally {
            setMyLoading(false);
        }
    };

    const fetchSharedResources = async (page: number) => {
        setSharedLoading(true);
        try {
            const res = await fetch(`/api/resources?shared=true&page=${page}&limit=9`);
            const json = await res.json();
            setSharedResources(json.data || []);
            setSharedPagination({ page, totalPages: json.meta?.totalPages || 1 });
        } catch (error) {
            console.error("Failed to fetch shared resources:", error);
            setSharedResources([]);
        } finally {
            setSharedLoading(false);
        }
    };

    useEffect(() => {
        fetchMyResources(myPagination.page);
    }, [myPagination.page]);

    useEffect(() => {
        fetchSharedResources(sharedPagination.page);
    }, [sharedPagination.page]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) {
            showAlert("Action Required", "Please select a file to upload.");
            return;
        }

        setUploadingFile(true);

        try {
            // 1. Upload the physical file
            const fileData = new FormData();
            fileData.append("file", file);

            const uploadRes = await fetch("/api/upload", {
                method: "POST",
                body: fileData
            });
            const { url: uploadedUrl, format: detectedFormat, error: uploadErr } = await uploadRes.json();

            if (!uploadRes.ok) throw new Error(uploadErr || "File upload failed");

            // 2. Submit the resource record with the returned URL
            const res = await fetch("/api/resources", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, description, type: detectedFormat || "OTHER", url: uploadedUrl }),
            });

            if (res.ok) {
                setTitle("");
                setDescription("");
                setFile(null);

                // Reset file input element
                const fileInput = document.getElementById("file-upload") as HTMLInputElement;
                if (fileInput) fileInput.value = "";

                fetchMyResources(1);
                showAlert("Success", "Resource submitted for review!");
            } else {
                const { error } = await res.json();
                showAlert("Error", error || "Submission failed");
            }
        } catch (error: unknown) {
            console.error("Upload process error", error);
            const msg = error instanceof Error ? error.message : "Failed to upload file";
            showAlert("Upload Error", msg);
        } finally {
            setUploadingFile(false);
        }
    };

    const handleDelete = (id: number) => {
        showConfirm("Confirm Deletion", "Are you sure you want to delete this resource?", async () => {
            try {
                const res = await fetch(`/api/resources/${id}`, { method: "DELETE" });
                if (res.ok) {
                    fetchMyResources(myPagination.page);
                } else {
                    const { error } = await res.json();
                    showAlert("Error", error || "Deletion failed");
                }
            } catch (error) {
                console.error("Delete error", error);
                showAlert("Error", "Failed to delete resource");
            }
        });
    };

    const filteredShared = sharedResources.filter(r => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q || r.title.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q) || r.lecturer.name.toLowerCase().includes(q);
        const matchesType = typeFilter === "ALL" || r.type === typeFilter;
        return matchesSearch && matchesType;
    });

    return (
        <div className="max-w-6xl mx-auto animate-in fade-in duration-400">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Resources</h1>
                <p className="text-slate-500 dark:text-white/50 mt-1">Upload course materials or download resources shared by your institution</p>
            </div>

            {/* Tab switch */}
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl mb-8 w-fit border border-slate-200 dark:border-white/10">
                <button onClick={() => setActiveTab("MY_UPLOADS")}
                    className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === "MY_UPLOADS" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25" : "text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white"}`}>
                    📤 My Uploads
                </button>
                <button onClick={() => setActiveTab("SHARED")}
                    className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${activeTab === "SHARED" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/25" : "text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white"}`}>
                    🏫 Shared by Admin
                    {sharedResources.length > 0 && (
                        <span className="text-xs bg-black/10 dark:bg-white/20 rounded-full px-1.5 py-0.5 leading-none">{sharedResources.length}</span>
                    )}
                </button>
            </div>

            {/* ─── MY UPLOADS TAB ─── */}
            {activeTab === "MY_UPLOADS" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Upload form */}
                    <div className="lg:col-span-1">
                        <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6 sticky top-8">
                            <h3 className="text-slate-900 dark:text-white font-bold mb-5 flex items-center gap-2">
                                <span className="text-blue-500">📤</span> Upload Resource
                            </h3>
                            <form onSubmit={handleUpload} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest mb-1.5">Title *</label>
                                    <input value={title} onChange={e => setTitle(e.target.value)} required
                                        placeholder="e.g. CS301 Lecture Notes Week 5"
                                        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest mb-1.5">Description</label>
                                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                                        placeholder="Brief description of this resource..."
                                        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm resize-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest mb-1.5">File *</label>
                                    <input type="file" id="file-upload" onChange={e => setFile(e.target.files?.[0] || null)} required className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 text-slate-500 dark:text-white/50 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-500/10 file:text-blue-500 hover:file:bg-blue-500/20" />
                                </div>
                                <button type="submit" disabled={uploadingFile} className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                    {uploadingFile ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Upload Resource"}
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
                            <div className="px-6 py-5 border-b border-slate-100 dark:border-white/10">
                                <h3 className="text-slate-900 dark:text-white font-bold flex items-center gap-2"><span className="text-blue-500">📚</span> My Uploaded Resources</h3>
                            </div>
                            {myLoading ? (
                                <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div>
                            ) : myResources.length === 0 ? (
                                <div className="text-center py-16 text-slate-400 dark:text-white/20 italic">No resources uploaded yet.</div>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-white/5">
                                    {myResources.map(r => (
                                        <div key={r.id} className="p-5 hover:bg-slate-50 dark:hover:bg-white/3 transition group flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition">
                                                {typeIcon[r.type] || "📎"}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-slate-900 dark:text-white font-semibold text-sm truncate group-hover:text-blue-600 dark:group-hover:text-blue-300 transition">{r.title}</div>
                                                {r.description && <div className="text-slate-500 dark:text-white/30 text-xs mt-0.5 truncate">{r.description}</div>}
                                                <div className="flex items-center gap-3 mt-1.5">
                                                    <span className="text-[10px] text-slate-400 dark:text-white/20 uppercase font-medium tracking-wider">{r.type}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-white/10" />
                                                    <span className="text-[10px] text-slate-400 dark:text-white/20">{new Date(r.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                {r.status === "REJECTED" && (r as any).feedback && (
                                                    <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                                                        <div className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1">Feedback</div>
                                                        <div className="text-xs text-rose-400">{(r as any).feedback}</div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusColors[r.status] || ""}`}>{r.status}</span>
                                                <a href={r.url} target="_blank" rel="noopener noreferrer" download={r.title}
                                                    className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-blue-600/30 text-slate-400 dark:text-white/40 hover:text-blue-600 dark:hover:text-white transition border border-slate-200 dark:border-white/5" title="Download resource">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                </a>
                                                <a href={r.url} target="_blank" rel="noopener noreferrer"
                                                    className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-emerald-600/30 text-slate-400 dark:text-white/40 hover:text-emerald-600 dark:hover:text-white transition border border-slate-200 dark:border-white/5" title="Open in New Tab">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                </a>
                                                <button onClick={() => handleDelete(r.id)}
                                                    className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-rose-600/30 text-slate-400 dark:text-white/40 hover:text-rose-600 dark:hover:text-white transition border border-slate-200 dark:border-white/5" title="Delete resource">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </div>

                                    ))}
                                    <Pagination
                                        currentPage={myPagination.page}
                                        totalPages={myPagination.totalPages}
                                        onPageChange={(p) => setMyPagination(prev => ({ ...prev, page: p }))}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── SHARED BY ADMIN TAB ─── */}
            {activeTab === "SHARED" && (
                <div className="space-y-6">
                    {/* Search + filter */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search resources by title, description or author..."
                                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-sm shadow-sm" />
                        </div>
                        <SearchableSelect
                            value={typeFilter}
                            onChange={val => setTypeFilter(String(val))}
                            placeholder="All Types"
                            options={[
                                { label: "All Types", value: "ALL" },
                                { label: "PDF Document", value: "PDF" },
                                { label: "Presentation Slides", value: "SLIDES" },
                                { label: "Source Code", value: "CODE" },
                                { label: "Video", value: "VIDEO" },
                                { label: "Links", value: "LINK" },
                            ]}
                        />
                    </div>

                    {sharedLoading ? (
                        <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" /></div>
                    ) : filteredShared.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50 dark:bg-white/3 rounded-3xl border border-slate-100 dark:border-white/5">
                            <div className="text-5xl mb-4">🏫</div>
                            <div className="text-slate-900 dark:text-white/50 font-semibold text-lg mb-1">
                                {sharedResources.length === 0 ? "No Shared Resources Yet" : "No results matching your search"}
                            </div>
                            <p className="text-slate-500 dark:text-white/25 text-sm max-w-xs mx-auto">
                                {sharedResources.length === 0
                                    ? "Your department admin hasn't shared any resources yet. Check back later."
                                    : "Try a different keyword or clear the filters."}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {filteredShared.map(r => (
                                    <div key={r.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-5 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all group flex flex-col gap-4 shadow-sm">
                                        <div className="flex items-start gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl flex-shrink-0">
                                                {typeIcon[r.type] || "📎"}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-slate-900 dark:text-white font-bold text-sm leading-tight line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition">{r.title}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] text-slate-400 dark:text-white/30 uppercase font-medium tracking-wider">{r.type}</span>
                                                    {r.department && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-white/10" />
                                                            <span className="text-[10px] text-slate-400 dark:text-white/30">{r.department.name}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {r.description && (
                                            <p className="text-slate-500 dark:text-white/40 text-xs leading-relaxed line-clamp-2">{r.description}</p>
                                        )}

                                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-white/5">
                                            <div>
                                                <div className="text-slate-400 dark:text-white/30 text-[10px]">Shared by</div>
                                                <div className="text-slate-600 dark:text-white/60 text-xs font-medium">{r.lecturer?.name || "Admin"}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <a href={r.url} target="_blank" rel="noopener noreferrer"
                                                    className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white transition border border-slate-200 dark:border-white/10" title="Open in New Tab">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                </a>
                                                <a href={r.url} target="_blank" rel="noopener noreferrer" download={r.title}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                    Download
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Pagination
                                currentPage={sharedPagination.page}
                                totalPages={sharedPagination.totalPages}
                                onPageChange={(p) => setSharedPagination(prev => ({ ...prev, page: p }))}
                            />
                        </div>
                    )}
                </div>
            )}

            <Modal
                isOpen={modal.isOpen}
                onClose={() => setModal(p => ({ ...p, isOpen: false }))}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                onConfirm={modal.onConfirm}
            />
        </div>
    );
}
