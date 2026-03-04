"use client";
import { useState } from "react";

export default function AdminNotifyPage() {
    const [form, setForm] = useState({ message: "", targetRole: "" });
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<{ sent: number } | null>(null);
    const [error, setError] = useState("");

    async function handleSend(e: React.FormEvent) {
        e.preventDefault(); setSending(true); setError("");
        const res = await fetch("/api/notifications", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: form.message, targetRole: form.targetRole || undefined }),
        });
        if (res.ok) { const d = await res.json(); setResult(d); setForm({ message: "", targetRole: "" }); }
        else setError("Failed to send notification.");
        setSending(false);
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Broadcast Notification</h1>
                <p className="text-white/50 mt-1">Send a message to all lecturers or a specific group</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                {result ? (
                    <div className="text-center py-8">
                        <div className="text-5xl mb-4">📢</div>
                        <h2 className="text-white font-bold text-2xl mb-2">Notification Sent!</h2>
                        <p className="text-green-300 text-lg">Delivered to <span className="font-bold">{result.sent}</span> recipients</p>
                        <button onClick={() => setResult(null)}
                            className="mt-6 px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm transition">
                            Send Another
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSend} className="space-y-5">
                        {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{error}</div>}
                        <div>
                            <label className="block text-sm font-medium text-white/60 mb-1.5">Target Audience</label>
                            <select value={form.targetRole} onChange={e => setForm(f => ({ ...f, targetRole: e.target.value }))}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                                <option value="">All Lecturers & HoDs</option>
                                <option value="LECTURER">Lecturers Only</option>
                                <option value="HOD">Heads of Department Only</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-white/60 mb-1.5">Message</label>
                            <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required rows={5}
                                placeholder="Type your broadcast message here..."
                                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none text-sm" />
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <p className="text-white/30 text-xs">Recipients will see this in their Notifications panel</p>
                            <button type="submit" disabled={sending || !form.message.trim()}
                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm transition disabled:opacity-50">
                                {sending ? "Sending..." : "📢 Broadcast"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
