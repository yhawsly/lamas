"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password, confirmPassword }),
            });

            if (res.ok) {
                setSuccess(true);
                // Wait 2 seconds then sign out to force fresh login
                setTimeout(() => {
                    signOut({ callbackUrl: "/login" });
                }, 2000);
            } else {
                const data = await res.json();
                setError(data.error || "Failed to reset password.");
            }
        } catch {
            setError("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
            {/* Background Decorations */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]" />
                <div className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px]" />
            </div>

            <div className="relative w-full max-w-md animate-in fade-in zoom-in duration-500">
                <div className="p-8 rounded-[2.5rem] border border-white/10 bg-slate-900/50 backdrop-blur-3xl shadow-2xl">
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl mx-auto mb-6 shadow-xl shadow-blue-500/20">
                            🔐
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Secure Your Account</h1>
                        <p className="text-slate-400 text-sm">You are required to update your password before proceeding to the LAMAS dashboard.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold animate-in slide-in-from-top-2">
                            ⚠️ {error}
                        </div>
                    )}

                    {success ? (
                        <div className="text-center py-10 space-y-4 animate-in fade-in duration-500">
                            <div className="text-5xl">✅</div>
                            <h2 className="text-xl font-bold text-white">Password Updated!</h2>
                            <p className="text-slate-400 text-sm">Security protocols verified. Logging you out for a fresh session...</p>
                            <div className="w-12 h-1.5 bg-slate-800 rounded-full mx-auto overflow-hidden">
                                <div className="h-full bg-emerald-500 animate-[progress_2s_ease-in-out]" style={{ width: '100%' }} />
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 ml-1">New Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="At least 8 characters"
                                    required
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-950/50 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 ml-1">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm your password"
                                    required
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-950/50 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full py-4 rounded-2xl bg-white text-black font-black text-sm uppercase tracking-widest hover:bg-blue-50 transition-all active:scale-95 disabled:opacity-50 overflow-hidden shadow-xl"
                            >
                                <div className="relative z-10 flex items-center justify-center gap-2">
                                    {loading ? <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : "Update Credentials"}
                                </div>
                            </button>
                        </form>
                    )}

                    <div className="mt-10 pt-8 border-t border-white/5 text-center">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Official Academic Security Protocol
                        </p>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes progress {
                    from { width: 0%; }
                    to { width: 100%; }
                }
            `}</style>
        </div>
    );
}
