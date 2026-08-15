"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Pagination from "@/components/ui/Pagination";
import { Search, Send, Users, Megaphone, X, CheckCircle2, AlertCircle } from "lucide-react";

interface Colleague {
    id: number;
    name: string;
    email: string;
}

export default function LecturerDepartmentPage() {
    useSession();
    const [colleagues, setColleagues] = useState<Colleague[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const LIMIT = 12; // Adjusted for better grid layout

    // Modal & Messaging State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [targetId, setTargetId] = useState<string>("ALL");
    const [targetName, setTargetName] = useState<string>("Entire Department");
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error" | ""; text: string }>({ type: "", text: "" });

    const loadColleagues = (pageNum = 1) => {
        setLoading(true);
        fetch(`/api/department/colleagues?page=${pageNum}&limit=${LIMIT}`)
            .then(r => r.ok ? r.json().catch(() => ({})) : {})
            .then((data: any) => {
                if (data.data) {
                    setColleagues(Array.isArray(data.data) ? data.data : []);
                    setTotalPages(data.meta?.totalPages || 1);
                    setPage(pageNum);
                } else {
                    setColleagues(Array.isArray(data) ? data : []);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch colleagues:", err);
                setLoading(false);
            });
    };

    useEffect(() => {
        loadColleagues(1);
        const savedMsg = localStorage.getItem("lamas_draft_lecturer_dept_msg");
        if (savedMsg) setMessage(savedMsg);
    }, []);

    useEffect(() => {
        localStorage.setItem("lamas_draft_lecturer_dept_msg", message);
    }, [message]);

    const filteredColleagues = colleagues.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const openModal = (id: string, name: string) => {
        setTargetId(id);
        setTargetName(name);
        setStatus({ type: "", text: "" });
        setIsModalOpen(true);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setSending(true);
        setStatus({ type: "", text: "" });

        try {
            const res = await fetch("/api/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: message.trim(),
                    userId: targetId === "ALL" ? undefined : targetId
                }),
            });

            if (res.ok) {
                setStatus({ type: "success", text: "Message delivered successfully." });
                setMessage("");
                localStorage.removeItem("lamas_draft_lecturer_dept_msg");
                setTimeout(() => {
                    setIsModalOpen(false);
                    setStatus({ type: "", text: "" });
                }, 1500);
            } else {
                const err = await res.json().catch(() => ({ error: "Failed to send message." }));
                setStatus({ type: "error", text: err.error || "Failed to send message." });
            }
        } catch (error) {
            console.error("Failed to send notification:", error);
            setStatus({ type: "error", text: "Network error. Please try again." });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-24 animate-in fade-in duration-500">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Colleagues</h1>
                    <p className="text-gray-500 mt-1 text-sm">Connect with your academic colleagues and send direct updates.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search colleagues..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full md:w-64 pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-sm text-gray-900 dark:text-white transition-all shadow-sm"
                        />
                    </div>
                    <button 
                        onClick={() => openModal("ALL", "Entire Department")}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-500/20 text-sm shrink-0"
                    >
                        <Megaphone className="w-4 h-4" />
                        <span className="hidden sm:inline">Broadcast Message</span>
                        <span className="sm:hidden">Broadcast</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 lg:p-8 min-h-[500px] flex flex-col">
                
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 animate-pulse flex flex-col items-center h-fit">
                                <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700 mb-3" />
                                <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                                <div className="w-1/2 h-3 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                                <div className="w-full h-8 bg-gray-200 dark:bg-gray-700/30 rounded-xl" />
                            </div>
                        ))}
                    </div>
                ) : filteredColleagues.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No colleagues found</h3>
                        <p className="text-gray-500 text-sm max-w-sm">
                            {searchQuery ? "We couldn't find anyone matching your search." : "Your department directory is currently empty."}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 flex-1">
                            {filteredColleagues.map(colleague => (
                                <div 
                                    key={colleague.id} 
                                    className="group p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden h-fit"
                                >
                                    {/* Decorative top bar */}
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-base font-black mb-3 border border-indigo-100 dark:border-indigo-800">
                                        {colleague.name.charAt(0).toUpperCase()}
                                    </div>
                                    
                                    <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate w-full">{colleague.name}</h4>
                                    <p className="text-[11px] text-gray-500 truncate w-full mt-0.5 mb-3">{colleague.email}</p>
                                    
                                    <a 
                                        href={`mailto:${colleague.email}?subject=${encodeURIComponent("LAMAS Academic Update")}`}
                                        className="mt-auto w-full py-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800"
                                    >
                                        <Send className="w-3 h-3" />
                                        Message
                                    </a>
                                </div>
                            ))}
                        </div>
                        
                        {colleagues.length > 0 && (
                            <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-700">
                                <Pagination currentPage={page} totalPages={totalPages} onPageChange={loadColleagues} />
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Messaging Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-200">
                        
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Send className="w-4 h-4 text-indigo-500" />
                                Send Notification
                            </h3>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="mb-6">
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">To</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-black">
                                        {targetId === "ALL" ? <Megaphone className="w-3.5 h-3.5" /> : targetName.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-bold text-gray-900 dark:text-white text-sm">{targetName}</span>
                                </div>
                            </div>

                            {status.text && (
                                <div className={`p-4 rounded-xl mb-6 text-sm font-medium flex items-start gap-3 ${
                                    status.type === "success" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" 
                                    : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                                }`}>
                                    {status.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                                    <p className="mt-0.5">{status.text}</p>
                                </div>
                            )}

                            <form onSubmit={handleSend}>
                                <div className="mb-6">
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Message Content</label>
                                    <textarea
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        rows={5}
                                        placeholder="Type your message here..."
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-5 py-2.5 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={sending || !message.trim()}
                                        className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors shadow-md shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {sending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Send Message"}
                                    </button>
                                </div>
                            </form>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
