"use client";

import { useEffect, useState } from "react";
import Pagination from "@/components/ui/Pagination";
import Modal from "@/components/ui/Modal";
import SearchableSelect from "@/components/ui/SearchableSelect";
import RefreshButton from "@/components/ui/RefreshButton";
import { 
    FileText, 
    BarChart2, 
    Code, 
    Video, 
    Link as LinkIcon, 
    Paperclip, 
    UploadCloud, 
    Building2, 
    CloudUpload, 
    Library,
    Search,
    Trash2,
    Download,
    ExternalLink,
    X,
    FileSpreadsheet,
    CheckSquare,
    Image as ImageIcon,
    Lock
} from "lucide-react";
import { useTerm } from "@/context/TermContext";
import { isBrowserViewable, openInBrowserViewer } from "@/lib/file-preview";

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

const typeConfig: Record<string, { icon: React.ReactNode, bgClass: string, borderClass: string, textClass: string }> = {
    PDF: { icon: <FileText className="w-5 h-5" />, bgClass: "bg-rose-50 dark:bg-rose-500/10", borderClass: "border-rose-100 dark:border-rose-500/20", textClass: "text-rose-500" },
    SLIDES: { icon: <BarChart2 className="w-5 h-5" />, bgClass: "bg-amber-50 dark:bg-amber-500/10", borderClass: "border-amber-100 dark:border-amber-500/20", textClass: "text-amber-500" },
    CODE: { icon: <Code className="w-5 h-5" />, bgClass: "bg-indigo-50 dark:bg-indigo-500/10", borderClass: "border-indigo-100 dark:border-indigo-500/20", textClass: "text-indigo-500" },
    VIDEO: { icon: <Video className="w-5 h-5" />, bgClass: "bg-purple-50 dark:bg-purple-500/10", borderClass: "border-purple-100 dark:border-purple-500/20", textClass: "text-purple-500" },
    LINK: { icon: <LinkIcon className="w-5 h-5" />, bgClass: "bg-sky-50 dark:bg-sky-500/10", borderClass: "border-sky-100 dark:border-sky-500/20", textClass: "text-sky-500" },
    SPREADSHEET: { icon: <FileSpreadsheet className="w-5 h-5" />, bgClass: "bg-emerald-50 dark:bg-emerald-500/10", borderClass: "border-emerald-100 dark:border-emerald-500/20", textClass: "text-emerald-500" },
    DOCUMENT: { icon: <FileText className="w-5 h-5" />, bgClass: "bg-blue-50 dark:bg-blue-500/10", borderClass: "border-blue-100 dark:border-blue-500/20", textClass: "text-blue-500" },
    IMAGE: { icon: <ImageIcon className="w-5 h-5" />, bgClass: "bg-violet-50 dark:bg-violet-500/10", borderClass: "border-violet-100 dark:border-violet-500/20", textClass: "text-violet-500" },
    OTHER: { icon: <Paperclip className="w-5 h-5" />, bgClass: "bg-slate-50 dark:bg-slate-500/10", borderClass: "border-slate-100 dark:border-slate-500/20", textClass: "text-slate-500" },
};

const TableSkeleton = () => (
    <div className="p-6 space-y-4">
        <div className="animate-pulse flex space-x-4 border-b border-slate-100 dark:border-slate-850 pb-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-700/80 rounded w-1/4"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700/80 rounded w-1/6"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700/80 rounded w-1/6"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700/80 rounded w-1/6"></div>
        </div>
        <div className="space-y-4">
            {[1, 2, 3].map((n) => (
                <div key={n} className="animate-pulse flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-850">
                    <div className="flex items-center space-x-3 w-1/3">
                        <div className="rounded-xl bg-slate-200 dark:bg-slate-800 h-10 w-10"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-slate-200 dark:bg-slate-700/80 rounded w-3/4"></div>
                            <div className="h-3 bg-slate-200 dark:bg-slate-700/80 rounded w-1/2"></div>
                        </div>
                    </div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700/80 rounded w-20"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700/80 rounded w-24"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700/80 rounded w-24"></div>
                    <div className="h-8 bg-slate-200 dark:bg-slate-700/80 rounded w-28"></div>
                </div>
            ))}
        </div>
    </div>
);

const statusColors: Record<string, string> = {
    PENDING: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    APPROVED: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    REJECTED: "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
};

export default function LecturerResourcesPage() {
    const { isArchiveMode } = useTerm();
    const [activeTab, setActiveTab] = useState<"MY_UPLOADS" | "SHARED">("MY_UPLOADS");
    const [myResources, setMyResources] = useState<Resource[]>([]);
    const [sharedResources, setSharedResources] = useState<Resource[]>([]);
    const [myPagination, setMyPagination] = useState({ page: 1, totalPages: 1 });
    const [sharedPagination, setSharedPagination] = useState({ page: 1, totalPages: 1 });
    const [myLoading, setMyLoading] = useState(true);
    const [sharedLoading, setSharedLoading] = useState(true);
    
    // Drag & Drop / Form States
    const [isDragging, setIsDragging] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);

    // Search & Filter state
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [courses, setCourses] = useState<any[]>([]);
    const [selectedCourseFilter, setSelectedCourseFilter] = useState("ALL");
    const [selectedCourseUpload, setSelectedCourseUpload] = useState("NONE");

    const fetchCourses = async () => {
        try {
            const res = await fetch("/api/courses/my-sections");
            const json = res.ok ? await res.json().catch(() => ({})) : {};
            setCourses(json.courses || []);
        } catch (error) {
            console.error("Failed to fetch courses:", error);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        if (selectedCourseFilter !== "ALL") {
            setSelectedCourseUpload(selectedCourseFilter);
        } else {
            setSelectedCourseUpload("NONE");
        }
    }, [selectedCourseFilter]);

    const [modal, setModal] = useState<{ isOpen: boolean; type: "alert" | "confirm"; title: string; message: string; onConfirm?: () => void }>({ isOpen: false, type: "alert", title: "", message: "" });
    const showAlert = (title: string, message: string) => setModal({ isOpen: true, type: "alert", title, message });
    const showConfirm = (title: string, message: string, onConfirm: () => void) => setModal({ isOpen: true, type: "confirm", title, message, onConfirm });

    const fetchMyResources = async (page: number) => {
        setMyLoading(true);
        try {
            const res = await fetch(`/api/resources?page=${page}&limit=10`);
            const json = res.ok ? await res.json().catch(() => ({})) : {};
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
            const json = res.ok ? await res.json().catch(() => ({})) : {};
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

    // Handle file drop & selection
    const handleFileSelection = (selectedFile: File) => {
        setFile(selectedFile);
        // Default title to filename without extension
        const nameWithoutExt = selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.')) || selectedFile.name;
        setTitle(nameWithoutExt);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelection(e.target.files[0]);
        }
    };

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setFile(null);
        setUploadProgress(null);
        const fileInput = document.getElementById("file-upload") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isArchiveMode) {
            showAlert("Archive Mode", "File uploads are disabled in Read-Only Archive Mode.");
            return;
        }

        if (!file) {
            showAlert("Action Required", "Please select a file to upload.");
            return;
        }

        setUploadingFile(true);
        setUploadProgress(0);

        // Simulate progress bar increments
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev === null) return 0;
                if (prev >= 90) return prev;
                return prev + Math.floor(Math.random() * 15) + 5;
            });
        }, 150);

        try {
            // 1. Upload the physical file
            const fileData = new FormData();
            fileData.append("file", file);

            const uploadRes = await fetch("/api/upload", {
                method: "POST",
                body: fileData
            });
            const { url: uploadedUrl, format: detectedFormat, error: uploadErr } = await uploadRes.json().catch(() => ({}));

            if (!uploadRes.ok) throw new Error(uploadErr || "File upload failed");

            const finalTitle = selectedCourseUpload !== "NONE" && !title.startsWith(`[${selectedCourseUpload}]`)
                ? `[${selectedCourseUpload}] ${title}`
                : title;

            // 2. Submit the resource record with the returned URL
            const res = await fetch("/api/resources", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: finalTitle, description, type: detectedFormat || "OTHER", url: uploadedUrl }),
            });

            if (res.ok) {
                clearInterval(progressInterval);
                setUploadProgress(100);
                setTimeout(() => {
                    resetForm();
                    fetchMyResources(1);
                    showAlert("Success", "Resource submitted for review!");
                }, 300);
            } else {
                clearInterval(progressInterval);
                const { error } = await res.json().catch(() => ({ error: "Submission failed" }));
                showAlert("Error", error || "Submission failed");
                setUploadProgress(null);
            }
        } catch (error: unknown) {
            clearInterval(progressInterval);
            console.error("Upload process error", error);
            const msg = error instanceof Error ? error.message : "Failed to upload file";
            showAlert("Upload Error", msg);
            setUploadProgress(null);
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
                    const { error } = await res.json().catch(() => ({ error: "Deletion failed" }));
                    showAlert("Error", error || "Deletion failed");
                }
            } catch (error) {
                console.error("Delete error", error);
                showAlert("Error", "Failed to delete resource");
            }
        });
    };

    const handleDownloadClick = async (e: React.MouseEvent, url: string, filename: string) => {
        e.preventDefault();
        try {
            if (url.includes("vercel-storage.com")) {
                const downloadUrl = url.includes("?") ? `${url}&download=1` : `${url}?download=1`;
                window.location.href = downloadUrl;
                return;
            }
            const res = await fetch(url);
            if (!res.ok) throw new Error("Fetch failed");
            const blob = await res.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = filename || "resource";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error("Download fallback", err);
            window.open(url, "_blank");
        }
    };

    const handleViewClick = (e: React.MouseEvent, url: string, type?: string, title?: string, id?: number) => {
        e.preventDefault();
        openInBrowserViewer(url, title, id);
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const dm = 1;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
    };

    const getMockSize = (id: number) => {
        const sizes = ["2.4 MB", "720 KB", "1.5 MB", "12.8 MB", "310 KB", "4.1 MB", "950 KB"];
        return sizes[id % sizes.length];
    };

    const filteredMy = myResources.filter(r => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q || r.title.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q);
        const matchesType = typeFilter === "ALL" || r.type === typeFilter;
        
        let matchesCourse = true;
        if (selectedCourseFilter !== "ALL") {
            matchesCourse = r.title.startsWith(`[${selectedCourseFilter}]`) || r.description?.includes(selectedCourseFilter) || false;
        }
        
        return matchesSearch && matchesType && matchesCourse;
    });

    const filteredShared = sharedResources.filter(r => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q || r.title.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q) || r.lecturer.name.toLowerCase().includes(q);
        const matchesType = typeFilter === "ALL" || r.type === typeFilter;
        return matchesSearch && matchesType;
    });

    return (
        <div className="w-full space-y-6 sm:space-y-8 animate-in fade-in duration-400">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">Resources</h1>
                <p className="text-slate-600 dark:text-slate-350 mt-1 max-w-3xl">
                    Upload course materials, templates, and syllabus assets to share with your department. Access resources shared by academic administrators below.
                </p>
            </div>

            {/* TAB INTERFACE & GLOBAL FILTERS */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-8 pb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex gap-2 rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200/50 dark:border-slate-800/85 shadow-inner">
                    <button 
                        onClick={() => { setActiveTab("MY_UPLOADS"); setSearchQuery(""); setTypeFilter("ALL"); }}
                        className={`flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150 ${activeTab === "MY_UPLOADS" ? "bg-white dark:bg-slate-850 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
                    >
                        <UploadCloud className="w-4 h-4 mr-2" /> My Uploads
                    </button>
                    <button 
                        onClick={() => { setActiveTab("SHARED"); setSearchQuery(""); setTypeFilter("ALL"); }}
                        className={`flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150 ${activeTab === "SHARED" ? "bg-white dark:bg-slate-850 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
                    >
                        <Building2 className="w-4 h-4 mr-2" /> Shared by Admin
                        {sharedResources.length > 0 && (
                            <span className="text-xs bg-slate-200 dark:bg-slate-750 rounded-full px-2 py-0.5 ml-2 font-bold text-slate-700 dark:text-slate-200">{sharedResources.length}</span>
                        )}
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <label htmlFor="resource-search" className="sr-only">Search files</label>
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/30" />
                        <input 
                            id="resource-search"
                            name="search"
                            value={searchQuery} 
                            onChange={e => setSearchQuery(e.target.value)} 
                            placeholder="Search files..." 
                            className="w-full md:w-64 pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500/25" 
                        />
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
                            { label: "Video Tutorial", value: "VIDEO" },
                            { label: "External Link", value: "LINK" },
                        ]} 
                    />
                    <RefreshButton
                        onClick={async () => {
                            await Promise.all([
                                fetchMyResources(myPagination.page),
                                fetchSharedResources(sharedPagination.page)
                            ]);
                        }}
                        isRefreshing={myLoading || sharedLoading}
                        label="Refresh"
                        size="sm"
                        variant="outline"
                        title="Reload resources"
                    />
                </div>
            </div>

            {/* ─── TAB Content: MY UPLOADS ─── */}
            {activeTab === "MY_UPLOADS" && (
                <div className="space-y-8 animate-in fade-in duration-300">
                    {/* DRAG AND DROP ZONE / ARCHIVE NOTICE */}
                    {isArchiveMode ? (
                        <div className="rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 text-center bg-slate-50/50 dark:bg-slate-900/30">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-3">
                                <Lock className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Read-Only Archive Mode</h3>
                            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                                You are reviewing an archived academic term. File uploads and deletions are disabled.
                            </p>
                        </div>
                    ) : (
                    <div 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`relative rounded-3xl border-2 border-dashed p-8 text-center transition-all ${
                            isDragging 
                                ? "border-blue-500 bg-blue-50/20 dark:bg-blue-900/10 scale-[1.01]" 
                                : "border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/20"
                        }`}
                    >
                        {!file && !uploadingFile && (
                            <div className="flex flex-col items-center py-4">
                                <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 mb-4">
                                    <CloudUpload className="w-10 h-10" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-base font-semibold text-slate-900 dark:text-white">
                                        Drag and drop your file here, or{" "}
                                        <label className="text-blue-600 hover:text-blue-500 cursor-pointer underline font-semibold transition">
                                            browse
                                            <input 
                                                type="file" 
                                                id="file-upload" 
                                                onChange={handleFileInputChange} 
                                                className="hidden" 
                                            />
                                        </label>
                                    </p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500">
                                        Supports PDFs, PPTX, Docx, Code, Sheets, images and Text files (Max 20MB)
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* File selected and waiting for upload parameters */}
                        {file && (
                            <div className="max-w-2xl mx-auto text-left py-2">
                                <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl mb-6 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{file.name}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">{formatBytes(file.size)}</p>
                                        </div>
                                    </div>
                                    {!uploadingFile && (
                                        <button 
                                            onClick={resetForm} 
                                            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
                                            type="button"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>

                                {/* Active upload Progress bar tracker */}
                                {uploadingFile && uploadProgress !== null && (
                                    <div className="mb-6 bg-slate-100 dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-750">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Uploading to secure storage</span>
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">{uploadProgress}%</span>
                                        </div>
                                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                                            <div 
                                                className="bg-blue-600 h-2.5 rounded-full transition-all duration-150 ease-out" 
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Metadata fields */}
                                {!uploadingFile && (
                                    <form onSubmit={handleUpload} className="space-y-4">
                                        {courses.length > 0 && (
                                            <div>
                                                <label htmlFor="resource-course" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Associate with Course</label>
                                                <SearchableSelect 
                                                    value={selectedCourseUpload}
                                                    onChange={val => setSelectedCourseUpload(String(val))}
                                                    placeholder="General / Select Course..."
                                                    options={[
                                                        { label: "None (General Upload)", value: "NONE" },
                                                        ...courses.map((c: any) => ({
                                                            label: `${c.course?.code} - ${c.course?.title}`,
                                                            value: c.course?.code
                                                        }))
                                                    ]}
                                                />
                                            </div>
                                        )}
                                        <div>
                                            <label htmlFor="resource-title" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Document Title *</label>
                                            <input 
                                                id="resource-title"
                                                name="title"
                                                value={title} 
                                                onChange={e => setTitle(e.target.value)} 
                                                required 
                                                placeholder="Give this file a clear title"
                                                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 text-sm" 
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="resource-description" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Description / Course Topic Notes</label>
                                            <textarea 
                                                id="resource-description"
                                                name="description"
                                                value={description} 
                                                onChange={e => setDescription(e.target.value)} 
                                                rows={2} 
                                                placeholder="Describe the resource content or target course code"
                                                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 text-sm resize-none" 
                                            />
                                        </div>
                                        <div className="flex items-center gap-3 pt-2">
                                            <button 
                                                type="submit" 
                                                disabled={uploadingFile} 
                                                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-md hover:shadow-lg disabled:opacity-50 text-sm"
                                            >
                                                Publish File & Submit Review
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={resetForm} 
                                                className="py-3 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition text-sm"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>
                    )}

                    {/* ATTACHED FILES TABLE GRID */}
                    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-3xl overflow-hidden shadow-sm">
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-850 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex items-center justify-between w-full lg:w-auto gap-4">
                                <h3 className="text-slate-900 dark:text-white font-bold flex items-center gap-2 text-base">
                                    <Library className="w-5 h-5 text-slate-500" /> Attached Course Materials
                                </h3>
                                <span className="text-xs bg-slate-100 dark:bg-slate-700/80 rounded-full px-3 py-1 font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                                    {myResources.length} Total Uploads
                                </span>
                            </div>

                            {/* Quick Course Filters */}
                            {courses.length > 0 && (
                                <div className="flex flex-wrap gap-1 p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 w-fit shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedCourseFilter("ALL")}
                                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                            selectedCourseFilter === "ALL"
                                                ? "bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white"
                                                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                                        }`}
                                    >
                                        All Courses
                                    </button>
                                    {courses.map((c: any) => {
                                        const code = c.course?.code;
                                        if (!code) return null;
                                        const isActive = selectedCourseFilter === code;
                                        // Count files for this course in the list
                                        const fileCount = myResources.filter(r => 
                                            r.title.startsWith(`[${code}]`) || 
                                            r.description?.includes(code)
                                        ).length;
                                        return (
                                            <button
                                                key={code}
                                                type="button"
                                                onClick={() => setSelectedCourseFilter(code)}
                                                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                                                    isActive
                                                        ? "bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400 font-extrabold"
                                                        : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                                                }`}
                                            >
                                                <span>{code}</span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                                                    isActive 
                                                        ? "bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400" 
                                                        : "bg-slate-200/80 dark:bg-slate-800 text-slate-500"
                                                }`}>{fileCount}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {myLoading ? (
                            <TableSkeleton />
                        ) : filteredMy.length === 0 ? (
                            <div className="text-center py-20 text-slate-400 dark:text-white/20 italic text-sm">
                                No matching resources found.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-855 text-slate-400 dark:text-white/30 text-xs font-bold uppercase tracking-wider">
                                            <th className="px-6 py-4 w-10">
                                                <div className="flex items-center justify-center">
                                                    <CheckSquare className="w-4 h-4 text-slate-300" />
                                                </div>
                                            </th>
                                            <th className="px-6 py-4">File Name</th>
                                            <th className="px-6 py-4">File Size</th>
                                            <th className="px-6 py-4">Uploaded Date</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-855">
                                        {filteredMy.map(r => {
                                            const config = typeConfig[r.type] || typeConfig.OTHER;
                                            return (
                                                <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition group">
                                                    <td className="px-6 py-4 w-10">
                                                        <div className="flex items-center justify-center">
                                                            <div className="w-4 h-4 rounded border border-slate-200 dark:border-slate-800" />
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${config.bgClass} ${config.borderClass} ${config.textClass} flex-shrink-0`}>
                                                                {config.icon}
                                                            </div>
                                                            <div className="min-w-0 max-w-md">
                                                                <div className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition truncate">{r.title}</div>
                                                                {r.description && <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{r.description}</div>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap font-medium">
                                                        {getMockSize(r.id)}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                        {new Date(r.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColors[r.status] || "border-slate-250 bg-slate-50 text-slate-700"}`}>
                                                            {r.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right whitespace-nowrap text-sm font-medium">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <a 
                                                                href={r.url} 
                                                                onClick={(e) => handleDownloadClick(e, r.url, r.title)} 
                                                                download={r.title}
                                                                className="inline-flex items-center justify-center p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition"
                                                                title="Download"
                                                            >
                                                                <Download className="w-4 h-4" />
                                                            </a>
                                                            {isBrowserViewable(r.url, r.type) && (
                                                                <a 
                                                                    href={r.url} 
                                                                    onClick={(e) => handleViewClick(e, r.url, r.type, r.title, r.id)}
                                                                    className="inline-flex items-center justify-center p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                                                                    title="Open"
                                                                >
                                                                    <ExternalLink className="w-4 h-4" />
                                                                </a>
                                                            )}
                                                            {!isArchiveMode && (
                                                                <button 
                                                                    onClick={() => handleDelete(r.id)}
                                                                    className="inline-flex items-center justify-center p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-rose-600 hover:bg-rose-600 hover:text-white transition"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <div className="border-t border-slate-100 dark:border-slate-850 py-4">
                            <Pagination
                                currentPage={myPagination.page}
                                totalPages={myPagination.totalPages}
                                onPageChange={(p) => setMyPagination(prev => ({ ...prev, page: p }))}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* ─── TAB Content: SHARED BY ADMIN ─── */}
            {activeTab === "SHARED" && (
                <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-3xl overflow-hidden shadow-sm animate-in fade-in duration-300">
                    <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
                        <h3 className="text-slate-900 dark:text-white font-bold flex items-center gap-2 text-base">
                            <Building2 className="w-5 h-5 text-slate-500" /> Institution Syllabus Resources
                        </h3>
                    </div>

                    {sharedLoading ? (
                        <TableSkeleton />
                    ) : filteredShared.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl mx-6 my-6 border border-slate-100 dark:border-slate-850">
                            <Library className="w-12 h-12 text-slate-300 dark:text-white/10 mx-auto mb-4" />
                            <div className="text-slate-900 dark:text-white/50 font-semibold text-base mb-1">
                                No Shared Resources
                            </div>
                            <p className="text-slate-500 dark:text-white/30 text-xs max-w-sm mx-auto">
                                The department academic administrator has not shared any verified materials for this context.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-850 text-slate-400 dark:text-white/30 text-xs font-bold uppercase tracking-wider">
                                        <th className="px-6 py-4 w-10">
                                            <div className="flex items-center justify-center">
                                                <CheckSquare className="w-4 h-4 text-slate-300" />
                                            </div>
                                        </th>
                                        <th className="px-6 py-4">File Name</th>
                                        <th className="px-6 py-4">File Size</th>
                                        <th className="px-6 py-4">Uploaded Date</th>
                                        <th className="px-6 py-4">Uploaded By</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                                    {filteredShared.map(r => {
                                        const config = typeConfig[r.type] || typeConfig.OTHER;
                                        const initials = (r.lecturer?.name || "AD").split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
                                        return (
                                            <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition group">
                                                <td className="px-6 py-4 w-10">
                                                    <div className="flex items-center justify-center">
                                                        <div className="w-4 h-4 rounded border border-slate-200 dark:border-slate-800" />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${config.bgClass} ${config.borderClass} ${config.textClass} flex-shrink-0`}>
                                                            {config.icon}
                                                        </div>
                                                        <div className="min-w-0 max-w-sm">
                                                            <div className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition truncate">{r.title}</div>
                                                            {r.description && <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{r.description}</div>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap font-medium">
                                                    {getMockSize(r.id)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                    {new Date(r.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-bold border border-slate-200 dark:border-slate-750 flex-shrink-0">
                                                            {initials}
                                                        </div>
                                                        <div className="text-xs">
                                                            <div className="font-semibold text-slate-900 dark:text-white">{r.lecturer?.name || "Academic Admin"}</div>
                                                            <div className="text-slate-400 mt-0.5">{r.lecturer?.email || "admin@lamas.edu"}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right whitespace-nowrap text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <a 
                                                            href={r.url} 
                                                            onClick={(e) => handleDownloadClick(e, r.url, r.title)} 
                                                            download={r.title}
                                                            className="inline-flex items-center justify-center p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition"
                                                            title="Download"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </a>
                                                        {isBrowserViewable(r.url, r.type) && (
                                                            <a 
                                                                href={r.url} 
                                                                onClick={(e) => handleViewClick(e, r.url, r.type, r.title, r.id)}
                                                                className="inline-flex items-center justify-center p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                                                                title="View file"
                                                            >
                                                                <ExternalLink className="w-4 h-4" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <div className="border-t border-slate-100 dark:border-slate-850 py-4">
                        <Pagination
                            currentPage={sharedPagination.page}
                            totalPages={sharedPagination.totalPages}
                            onPageChange={(p) => setSharedPagination(prev => ({ ...prev, page: p }))}
                        />
                    </div>
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
