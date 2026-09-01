"use client";

import { useState, useEffect, useRef } from "react";
import { 
    Megaphone, Users, GraduationCap, Shield, Send, CheckCircle2, 
    Sparkles, Mail, Bell, Clock, RefreshCw, 
    Check, AlertTriangle, Info, ArrowRight, Paperclip, X, FileText, Upload
} from "lucide-react";
import RefreshButton from "@/components/ui/RefreshButton";

interface RecentBroadcast {
    id: number;
    targetRole: string;
    message: string;
    createdAt: string;
    recipientCount: number;
    senderName: string;
}

const TEMPLATES = [
    {
        id: "syllabus_reminder",
        name: "Syllabus Submission Reminder",
        tag: "Academic Cycle",
        targetRole: "LECTURER",
        message: "Dear Faculty Members, please ensure that all course outlines, weekly lesson plans, and reading lists for the active semester are submitted on the portal for HOD review by Friday at 5:00 PM."
    },
    {
        id: "exam_moderation",
        name: "Exam Question Moderation",
        tag: "Examinations",
        targetRole: "",
        message: "Notice to all Course Lecturers and HODs: Draft examination questions along with comprehensive marking schemes must be submitted for departmental peer moderation before the deadline."
    },
    {
        id: "observation_window",
        name: "Teaching Observation Window",
        tag: "Quality Assurance",
        targetRole: "HOD",
        message: "Heads of Department are reminded that the peer teaching observation exercise (Form B) is now in progress. Please review your assigned faculty schedules and submit completed rubrics."
    },
    {
        id: "allocation_matrix_notice",
        name: "Course Allocation Matrix Notice",
        tag: "Academics & Teaching",
        targetRole: "LECTURER",
        message: "The official academic course allocation matrix has been finalized. Please check your assigned courses and teaching sections in your Lecturer Workspace."
    }
];

export default function AdminNotifyPage() {
    const [form, setForm] = useState({ 
        message: "", 
        targetRole: "", 
        priority: "NORMAL",
        sendEmail: true,
        sendInApp: true
    });
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<{ sent: number } | null>(null);
    const [error, setError] = useState("");
    const [recentBroadcasts, setRecentBroadcasts] = useState<RecentBroadcast[]>([]);
    const [loadingRecent, setLoadingRecent] = useState(false);
    const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
    const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
    const [attachmentName, setAttachmentName] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
    const ALLOWED_TYPES = [".pdf", ".pptx", ".ppt", ".doc", ".docx", ".zip", ".jpg", ".jpeg", ".png", ".gif", ".webp", ".csv", ".xlsx", ".xls", ".txt"];

    useEffect(() => {
        const saved = localStorage.getItem("lamas_draft_admin_notify");
        if (saved) {
            try { 
                const parsed = JSON.parse(saved);
                setForm(prev => ({ ...prev, ...parsed }));
            } catch {}
        }
        loadRecentBroadcasts();
    }, []);

    useEffect(() => {
        localStorage.setItem("lamas_draft_admin_notify", JSON.stringify(form));
    }, [form]);

    const loadRecentBroadcasts = async () => {
        setLoadingRecent(true);
        try {
            const res = await fetch("/api/audit?action=DEPARTMENT_BROADCAST&limit=5");
            if (res.ok) {
                const data = await res.json();
                if (data.data && Array.isArray(data.data)) {
                    const formatted: RecentBroadcast[] = data.data.map((item: any) => ({
                        id: item.id,
                        targetRole: item.detail?.targetRole || "All Faculty",
                        message: item.details || (typeof item.detail === "string" ? item.detail : "Institutional Announcement"),
                        createdAt: item.createdAt,
                        recipientCount: typeof item.detail === "object" && item.detail?.recipientCount ? item.detail.recipientCount : null,
                        senderName: item.user?.name || "System Admin",
                    }));
                    setRecentBroadcasts(formatted);
                }
            }
        } catch {
            // Non-blocking fallback
        } finally {
            setLoadingRecent(false);
        }
    };

    const handleApplyTemplate = (tpl: typeof TEMPLATES[0]) => {
        setActiveTemplate(tpl.id);
        setForm(prev => ({
            ...prev,
            message: tpl.message,
            targetRole: tpl.targetRole
        }));
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const ext = "." + file.name.split(".").pop()?.toLowerCase();
        if (!ALLOWED_TYPES.includes(ext)) {
            setError(`File type ${ext} is not supported. Allowed: PDF, Word, PPT, Excel, Images, CSV, ZIP, TXT.`);
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            setError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 20MB.`);
            return;
        }

        setUploading(true);
        setError("");
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            if (res.ok) {
                const data = await res.json();
                setAttachmentUrl(data.url);
                setAttachmentName(file.name);
            } else {
                const data = await res.json().catch(() => ({}));
                setError(data.error || "Failed to upload file.");
            }
        } catch {
            setError("Network error during file upload.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const removeAttachment = () => {
        setAttachmentUrl(null);
        setAttachmentName(null);
    };

    async function handleSend(e: React.FormEvent) {
        e.preventDefault(); 
        if (!form.message.trim()) return;
        setSending(true); 
        setError("");
        
        try {
            const res = await fetch("/api/notifications", {
                method: "POST", 
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    message: form.message, 
                    targetRole: form.targetRole || undefined,
                    priority: form.priority,
                    ...(attachmentUrl ? { attachmentUrl } : {})
                }),
            });
            
            if (res.ok) { 
                const d = await res.json().catch(() => ({ sent: 0 })); 
                setResult(d); 
                setForm({ 
                    message: "", 
                    targetRole: "", 
                    priority: "NORMAL",
                    sendEmail: true,
                    sendInApp: true
                }); 
                setActiveTemplate(null);
                setAttachmentUrl(null);
                setAttachmentName(null);
                localStorage.removeItem("lamas_draft_admin_notify");
                loadRecentBroadcasts();
            } else {
                const d = await res.json().catch(() => ({ error: "Server error" }));
                setError(d.error || "Failed to send broadcast notification. Please try again.");
            }
        } catch {
            setError("Network or server connection failed.");
        } finally {
            setSending(false);
        }
    }

    const audienceOptions = [
        {
            id: "",
            title: "All Faculty Members",
            subtitle: "Lecturers & Heads of Department",
            icon: Users,
            badge: "All Departments",
        },
        {
            id: "LECTURER",
            title: "Lecturers Only",
            subtitle: "Teaching & course-assigned faculty",
            icon: GraduationCap,
            badge: "Lecturers",
        },
        {
            id: "HOD",
            title: "Heads of Department",
            subtitle: "Department chairs & moderators",
            icon: Shield,
            badge: "HODs",
        }
    ];

    return (
        <div className="w-full space-y-8 animate-in fade-in duration-500 pb-12">
            {/* Header with KPI Overview */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-6">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-600/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center shadow-xs">
                            <Megaphone className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                                Broadcast Notification Center
                            </h1>
                            <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                                Multi-channel institutional announcements, urgent academic alerts, and faculty-wide communications.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <div className="text-left">
                            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">System Gateway</div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Email & In-App Ready</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Templates Bar */}
            <div className="rounded-2xl p-5 border" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Quick Academic Templates
                        </h2>
                    </div>
                    <span className="text-[11px] text-slate-400">Click a template to pre-fill standard notice copy</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {TEMPLATES.map(tpl => {
                        const isSelected = activeTemplate === tpl.id;
                        return (
                            <button
                                key={tpl.id}
                                type="button"
                                onClick={() => handleApplyTemplate(tpl)}
                                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between group ${
                                    isSelected 
                                        ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                                        : "bg-slate-50/60 hover:bg-slate-100/80 dark:bg-slate-900/40 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800"
                                }`}
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                            {tpl.tag}
                                        </span>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                                    </div>
                                    <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                                        {tpl.name}
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                        {tpl.message}
                                    </p>
                                </div>
                                <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                    <span>Apply Template</span>
                                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Interactive Grid (2 Columns: Composer + Live Preview) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Broadcast Composer (7 Cols) */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="rounded-2xl p-6 sm:p-7 border shadow-xs" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                        {result ? (
                            <div className="text-center py-10 space-y-4 animate-in zoom-in-95 duration-300">
                                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">Broadcast Dispatched Successfully!</h2>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Your announcement was instantly delivered to{" "}
                                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{result.sent} faculty members</span>.
                                    </p>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 max-w-md mx-auto text-left text-xs space-y-1.5">
                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold">
                                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                        In-App notification alerts posted to recipient feeds
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold">
                                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                        Institutional email notifications queued via SMTP
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold">
                                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                        Compliance activity log permanently recorded
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setResult(null)}
                                        className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm cursor-pointer"
                                    >
                                        Send Another Broadcast
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSend} className="space-y-6">
                                {error && (
                                    <div className="p-4 rounded-xl text-xs font-bold flex items-center gap-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 animate-in fade-in">
                                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {/* 1. Target Audience Selection */}
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-wider mb-2.5" style={{ color: "var(--text-muted)" }}>
                                        1. Select Target Faculty Audience
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {audienceOptions.map(opt => {
                                            const isSelected = form.targetRole === opt.id;
                                            const IconComp = opt.icon;
                                            return (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    onClick={() => setForm(f => ({ ...f, targetRole: opt.id }))}
                                                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                                        isSelected
                                                            ? "bg-blue-50/80 dark:bg-blue-950/50 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                                                            : "bg-slate-50/50 hover:bg-slate-100/80 dark:bg-slate-900/40 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800"
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                            isSelected 
                                                                ? "bg-blue-600 text-white" 
                                                                : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                                        }`}>
                                                            <IconComp className="w-4 h-4" />
                                                        </div>
                                                        {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-xs text-slate-900 dark:text-white">
                                                            {opt.title}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 mt-0.5">
                                                            {opt.subtitle}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* 2. Broadcast Message Body */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-black uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                                            2. Announcement Message Body
                                        </label>
                                        <span className="text-[11px] font-semibold text-slate-400">
                                            {form.message.length} characters
                                        </span>
                                    </div>
                                    <textarea
                                        value={form.message}
                                        onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                                        required
                                        rows={6}
                                        placeholder="Type your official announcement or notification message here..."
                                        className="w-full px-4 py-3.5 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none leading-relaxed border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                        style={{ color: "var(--text-primary)" }}
                                    />
                                </div>

                                {/* 3. File Attachment */}
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-wider mb-2.5" style={{ color: "var(--text-muted)" }}>
                                        3. Attach Document <span className="font-semibold normal-case tracking-normal text-slate-400">(Optional — Max 20MB)</span>
                                    </label>

                                    {attachmentUrl && attachmentName ? (
                                        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
                                            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                                                <FileText className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 truncate">{attachmentName}</div>
                                                <div className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 font-semibold">Uploaded successfully — will be attached to all recipients</div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={removeAttachment}
                                                className="w-7 h-7 rounded-lg bg-emerald-200/60 dark:bg-emerald-800/60 hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center justify-center transition-colors cursor-pointer group"
                                            >
                                                <X className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:text-red-500" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                            className="w-full p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all cursor-pointer flex flex-col items-center gap-2 group"
                                        >
                                            {uploading ? (
                                                <>
                                                    <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Uploading...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                                    <span className="text-xs font-bold text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Click to attach a document</span>
                                                    <span className="text-[10px] text-slate-400">PDF, Word, PPT, Excel, Images, CSV, ZIP, TXT — up to 20MB</span>
                                                </>
                                            )}
                                        </button>
                                    )}

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="hidden"
                                        accept=".pdf,.pptx,.ppt,.doc,.docx,.zip,.jpg,.jpeg,.png,.gif,.webp,.csv,.xlsx,.xls,.txt"
                                        onChange={handleFileSelect}
                                    />
                                </div>

                                {/* 4. Priority & Delivery Channels */}
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                            Priority Level
                                        </label>
                                        <div className="flex items-center gap-2">
                                            {[
                                                { id: "NORMAL", label: "Standard Notice", color: "text-blue-600 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800" },
                                                { id: "URGENT", label: "Urgent Deadline", color: "text-amber-600 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800" },
                                                { id: "CRITICAL", label: "High Priority", color: "text-rose-600 bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800" },
                                            ].map(p => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => setForm(f => ({ ...f, priority: p.id }))}
                                                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                                                        form.priority === p.id 
                                                            ? `${p.color} ring-2 ring-blue-500/20 font-black` 
                                                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800"
                                                    }`}
                                                >
                                                    {p.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                            Active Delivery Channels
                                        </label>
                                        <div className="flex items-center gap-3 pt-1">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                                                <Bell className="w-3.5 h-3.5 text-blue-500" />
                                                <span>In-App Feed</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                                                <Mail className="w-3.5 h-3.5 text-emerald-500" />
                                                <span>Email Alert</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <Info className="w-4 h-4 text-blue-500 shrink-0" />
                                        <span>Delivers instantly to all active accounts in target group</span>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={sending || !form.message.trim()}
                                        className="px-7 py-3 rounded-xl text-white font-extrabold text-xs transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 cursor-pointer"
                                    >
                                        {sending ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                <span>Dispatching Broadcast...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" />
                                                <span>Dispatch Official Broadcast</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* Right Column: Live Recipient Simulation & Channel Stats (5 Cols) */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Live Preview Card */}
                    <div className="rounded-2xl p-6 border shadow-xs" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <Bell className="w-4 h-4 text-blue-500" />
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    Live Recipient Feed Preview
                                </h3>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800">
                                Real-Time Render
                            </span>
                        </div>

                        {/* Simulated Notification Card */}
                        <div className="p-4 rounded-2xl border bg-slate-50/80 dark:bg-slate-900/80 border-slate-200/90 dark:border-slate-700/80 space-y-3 shadow-2xs">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black text-[10px] flex items-center justify-center shadow-xs">
                                        AD
                                    </div>
                                    <div>
                                        <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                                            System Administrator
                                        </div>
                                        <div className="text-[10px] text-slate-400">
                                            Official Institutional Broadcast
                                        </div>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400">
                                    Just now
                                </span>
                            </div>

                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                                {form.message.trim() ? form.message : "Your announcement message will appear here in real-time as you compose it..."}
                            </p>

                            {attachmentUrl && attachmentName && (
                                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/60">
                                    <Paperclip className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                    <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 truncate">{attachmentName}</span>
                                </div>
                            )}

                            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                                <span className="font-bold flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                    <Megaphone className="w-3 h-3" />
                                    {form.targetRole === "LECTURER" ? "Lecturers Feed" : form.targetRole === "HOD" ? "HOD Noticeboard" : "Campus-Wide Notice"}
                                </span>
                                <span>HTU Academic Management</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Broadcast History Table */}
            <div className="rounded-2xl border overflow-hidden shadow-xs" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: "var(--bg-border)" }}>
                    <div className="flex items-center gap-2.5">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <h3 className="text-sm font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                            Recent Institutional Broadcasts & Audit Records
                        </h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 hidden sm:inline">
                            Past 5 Dispatches
                        </span>
                        <RefreshButton
                            onClick={loadRecentBroadcasts}
                            isRefreshing={loadingRecent}
                            label="Refresh"
                            size="sm"
                            variant="outline"
                            title="Reload recent broadcasts"
                        />
                    </div>
                </div>

                {recentBroadcasts.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                        No previous broadcasts recorded in the current active term.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {recentBroadcasts.map(bc => (
                            <div key={bc.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition">
                                <div className="space-y-1 max-w-2xl">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                            {bc.targetRole || "All Faculty"}
                                        </span>
                                        <span className="text-[11px] font-bold text-slate-400">
                                            {new Date(bc.createdAt).toLocaleDateString()} at {new Date(bc.createdAt).toLocaleTimeString()}
                                        </span>
                                        <span className="text-[11px] text-slate-400">
                                            by {bc.senderName}
                                        </span>
                                    </div>
                                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 line-clamp-1">
                                        {bc.message}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                        <Check className="w-3 h-3" />
                                        {bc.recipientCount ? `Dispatched (${bc.recipientCount} recipient${bc.recipientCount > 1 ? 's' : ''})` : "Dispatched"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
