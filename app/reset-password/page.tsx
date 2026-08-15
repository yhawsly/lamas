"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { ShieldCheck, ShieldAlert, CheckCircle2 } from "lucide-react";

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
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 font-sans antialiased">
            <div className="relative w-full max-w-md animate-in fade-in zoom-in duration-300">
                <div className="p-8 rounded-3xl border border-slate-200 bg-white shadow-xl">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 text-[#1E3A8A] flex items-center justify-center mx-auto mb-5 shadow-sm">
                            <ShieldCheck className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1.5">Secure Your Account</h1>
                        <p className="text-slate-500 text-sm">You are required to update your password before proceeding to the LAMAS dashboard.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold flex items-start gap-2.5 shadow-sm animate-in slide-in-from-top-2">
                            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {success ? (
                        <div className="text-center py-6 space-y-4 animate-in fade-in duration-300">
                            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
                                <CheckCircle2 className="w-7 h-7" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-900">Password Updated!</h2>
                            <p className="text-slate-600 text-sm">Security protocols verified. Logging you out for a fresh session...</p>
                            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
                                <div className="h-full bg-emerald-500 animate-[progress_2s_ease-in-out]" style={{ width: '100%' }} />
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">New Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="At least 8 characters"
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] transition-all text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm your password"
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] transition-all text-sm"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 rounded-xl bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-bold text-xs uppercase tracking-widest transition-all shadow-md active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Update Credentials"}
                            </button>
                        </form>
                    )}

                    <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
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
