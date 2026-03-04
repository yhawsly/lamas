"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

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
    const [message, setMessage] = useState("");
    const [targetId, setTargetId] = useState<string>("ALL");
    const [status, setStatus] = useState({ type: "", text: "" });
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetch("/api/department/colleagues")
            .then(r => r.json())
            .then(data => {
                setColleagues(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch colleagues:", err);
                setLoading(false);
            });
    }, []);

    const filteredColleagues = colleagues.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                setStatus({ type: "success", text: "✅ Message sent successfully!" });
                setMessage("");
                setTargetId("ALL");
            } else {
                const err = await res.json();
                setStatus({ type: "error", text: err.error || "Failed to send message." });
            }
        } catch (_) {
            setStatus({ type: "error", text: "Something went wrong. Please try again." });
        } finally {
            setSending(false);
            setTimeout(() => setStatus({ type: "", text: "" }), 5000);
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full" /></div>;

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">My Department</h1>
                <p className="text-white/50 text-sm mt-1">Connect with colleagues and share important updates within your department.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Messaging Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sticky top-8">
                        <h3 className="text-white font-bold mb-5 flex items-center gap-2">
                            <span className="text-blue-400">📤</span> Send Notification
                        </h3>

                        {status.text && (
                            <div className={`p-4 rounded-xl mb-6 text-sm font-medium ${status.type === "success" ? "bg-green-500/10 border border-green-500/30 text-green-300" : "bg-red-500/10 border border-red-500/30 text-red-300"}`}>
                                {status.text}
                            </div>
                        )}

                        <form onSubmit={handleSend} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5">Recipient</label>
                                <select
                                    value={targetId}
                                    onChange={e => setTargetId(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                                >
                                    <option value="ALL">Entire Department (Broadcast)</option>
                                    <optgroup label="Direct Message">
                                        {colleagues.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5">Message</label>
                                <textarea
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    rows={5}
                                    placeholder="Type your message here..."
                                    className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/5 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm resize-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={sending || !message.trim()}
                                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {sending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Send Notification"}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right Column: Colleagues List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden min-h-[400px]">
                        <div className="px-6 py-5 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <span className="text-blue-400">👥</span> Colleagues
                            </h3>
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                <input
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search by name or email..."
                                    className="pl-9 pr-4 py-2 rounded-xl bg-slate-900/50 border border-white/5 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-xs w-full md:w-64"
                                />
                            </div>
                        </div>

                        {filteredColleagues.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                                <div className="text-6xl mb-4">🔍</div>
                                <h4 className="text-white font-semibold">No colleagues found</h4>
                                <p className="text-white/30 text-sm max-w-xs mx-auto mt-1">
                                    {searchQuery ? "Try a different search term." : "Your department doesn't have other active members yet."}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {filteredColleagues.map(c => (
                                    <div key={c.id} className="px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600/20 to-indigo-600/20 flex items-center justify-center text-xl font-bold text-blue-400 border border-blue-500/10">
                                                {c.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-white font-semibold group-hover:text-blue-400 transition-colors uppercase tracking-tight">{c.name}</div>
                                                <div className="text-white/30 text-xs mt-0.5">{c.email}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setTargetId(String(c.id));
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-blue-600/20 border border-white/5 hover:border-blue-500/30 text-white/50 hover:text-blue-300 text-xs font-semibold transition-all flex items-center gap-2"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                            Notify
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="p-4 bg-white/3 border-t border-white/5 text-center">
                            <p className="text-white/20 text-[10px] uppercase tracking-widest font-bold">Department Member Directory</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
