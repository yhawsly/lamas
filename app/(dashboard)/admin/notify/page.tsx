"use client";
import { useState, useEffect } from "react";
import SearchableSelect from "@/components/ui/SearchableSelect";

export default function AdminNotifyPage() {
    const [form, setForm] = useState({ message: "", targetRole: "" });
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<{ sent: number } | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const saved = localStorage.getItem("lamas_draft_admin_notify");
        if (saved) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            try { setForm(JSON.parse(saved)); } catch {}
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("lamas_draft_admin_notify", JSON.stringify(form));
    }, [form]);

    async function handleSend(e: React.FormEvent) {
        e.preventDefault(); setSending(true); setError("");
        const res = await fetch("/api/notifications", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: form.message, targetRole: form.targetRole || undefined }),
        });
        if (res.ok) { 
            const d = await res.json().catch(() => ({ sent: 0 })); 
            setResult(d); 
            setForm({ message: "", targetRole: "" }); 
            localStorage.removeItem("lamas_draft_admin_notify");
        }
        else {
            const d = await res.json().catch(() => ({ error: "Server error" }));
            setError(d.error || "Failed to send notification. Please try again later.");
        }
        setSending(false);
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Broadcast Notification</h1>
                <p className="mt-1" style={{ color: "var(--text-muted)" }}>Send a message to all lecturers or a specific group</p>
            </div>
            <div className="rounded-2xl p-8" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                {result ? (
                    <div className="text-center py-8">
                        <div className="text-5xl mb-4">📢</div>
                        <h2 className="font-bold text-2xl mb-2" style={{ color: "var(--text-primary)" }}>Notification Sent!</h2>
                        <p style={{ color: "#10b981" }} className="text-lg">Delivered to <span className="font-bold">{result.sent}</span> recipients</p>
                        <button onClick={() => setResult(null)}
                            className="mt-6 px-6 py-2.5 rounded-xl text-sm transition"
                            style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }}>
                            Send Another
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSend} className="space-y-5">
                        {error && <div className="p-3 rounded-xl text-sm" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", borderColor: "rgba(239, 68, 68, 0.3)", color: "#ef4444" }}>{error}</div>}
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Target Audience</label>
                            <SearchableSelect
                                value={form.targetRole}
                                onChange={val => setForm(f => ({ ...f, targetRole: String(val) }))}
                                placeholder="All Lecturers & HoDs"
                                options={[
                                    { label: "All Lecturers & HoDs", value: "" },
                                    { label: "Lecturers Only", value: "LECTURER" },
                                    { label: "Heads of Department Only", value: "HOD" },
                                ]}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Message</label>
                            <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required rows={5}
                                placeholder="Type your broadcast message here..."
                                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 resize-none"
                                style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }} />
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Recipients will see this in their Notifications panel</p>
                            <button type="submit" disabled={sending || !form.message.trim()}
                                className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm transition disabled:opacity-50"
                                style={{ backgroundColor: "var(--primary)" }}>
                                {sending ? "Sending..." : "📢 Broadcast"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
