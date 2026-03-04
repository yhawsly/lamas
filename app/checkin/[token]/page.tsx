"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

export default function CheckInPage() {
    const params = useParams();
    const token = params?.token as string;
    const [matric, setMatric] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "expired">("idle");
    const [message, setMessage] = useState("");

    async function handleCheckin(e: React.FormEvent) {
        e.preventDefault();
        setStatus("loading");
        try {
            const res = await fetch(`/api/sessions/${token}/checkin`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentMatric: matric }),
            });
            const data = await res.json();
            if (res.status === 410) { setStatus("expired"); setMessage("This QR code has expired. Please ask your lecturer for a new one."); }
            else if (res.status === 409) { setStatus("error"); setMessage("You have already checked in for this session."); }
            else if (!res.ok) { setStatus("error"); setMessage(data.error || "Check-in failed. Please try again."); }
            else { setStatus("success"); setMessage(`Welcome! You have successfully checked in.`); }
        } catch {
            setStatus("error");
            setMessage("Network error. Please check your connection and try again.");
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 -right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-4 shadow-lg shadow-blue-500/30 text-3xl">
                        📷
                    </div>
                    <h1 className="text-2xl font-bold text-white">Class Check-In</h1>
                    <p className="text-blue-300/70 text-sm mt-1">Enter your matric number to mark attendance</p>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    {status === "success" ? (
                        <div className="text-center">
                            <div className="text-5xl mb-4">✅</div>
                            <h2 className="text-white font-bold text-xl mb-2">Checked In!</h2>
                            <p className="text-green-300 text-sm">{message}</p>
                            <p className="text-white/30 text-xs mt-4">Matric: {matric}</p>
                        </div>
                    ) : status === "expired" ? (
                        <div className="text-center">
                            <div className="text-5xl mb-4">⏰</div>
                            <h2 className="text-white font-bold text-xl mb-2">QR Expired</h2>
                            <p className="text-yellow-300 text-sm">{message}</p>
                        </div>
                    ) : (
                        <form onSubmit={handleCheckin} className="space-y-4">
                            {status === "error" && (
                                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{message}</div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-blue-200 mb-2">Matric Number</label>
                                <input
                                    type="text"
                                    value={matric}
                                    onChange={e => setMatric(e.target.value.toUpperCase())}
                                    required
                                    placeholder="e.g. A12345678"
                                    autoFocus
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-center text-lg font-mono tracking-widest uppercase"
                                />
                            </div>
                            <button type="submit" disabled={status === "loading" || !matric.trim()}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold transition shadow-lg shadow-blue-500/20 disabled:opacity-50">
                                {status === "loading" ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Checking in...
                                    </span>
                                ) : "Check In"}
                            </button>
                        </form>
                    )}
                </div>

                <p className="text-center text-white/20 text-xs mt-6">LAMAS · Academic Management System</p>
            </div>
        </div>
    );
}
