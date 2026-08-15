"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, ShieldAlert, ShieldCheck } from "lucide-react";
import Link from "next/link";

function ResetPasswordWithTokenForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";
    
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!token) {
            setError("Reset token is missing from the URL link. Please request a new link.");
            return;
        }

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
            const res = await fetch("/api/auth/password-reset", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password, confirmPassword }),
            });

            if (res.ok) {
                setSuccess(true);
            } else {
                const data = await res.json().catch(() => ({}));
                setError(data.error || "Failed to reset password.");
            }
        } catch {
            setError("A network error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 rounded-3xl border border-slate-200 bg-white shadow-xl">
            <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 text-[#1E3A8A] flex items-center justify-center mx-auto mb-5 shadow-sm">
                    <ShieldCheck className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1.5">Create New Password</h1>
                <p className="text-slate-500 text-sm">Please choose a strong password that you do not use on other accounts.</p>
            </div>

            {error && (
                <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold flex items-start gap-2.5 shadow-sm animate-in slide-in-from-top-2">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            {success ? (
                <div className="text-center py-4 space-y-6 animate-in fade-in duration-300">
                    <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
                        <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-lg font-bold text-slate-900">Password Updated!</h2>
                        <p className="text-slate-600 text-sm leading-relaxed">
                            Your password has been reset successfully. You can now login with your new password.
                        </p>
                    </div>
                    <div className="pt-2">
                        <Link 
                            href="/login" 
                            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1E3A8A] hover:underline transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Proceed to Login
                        </Link>
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
                        {loading ? (
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            "Reset Password"
                        )}
                    </button>

                    <div className="text-center pt-2">
                        <Link 
                            href="/login" 
                            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Cancel
                        </Link>
                    </div>
                </form>
            )}

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Official Academic Security Protocol
                </p>
            </div>
        </div>
    );
}

export default function TokenResetPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 font-sans antialiased">
            <div className="relative w-full max-w-md animate-in fade-in zoom-in duration-300">
                <Suspense fallback={
                    <div className="p-8 rounded-3xl border border-slate-200 bg-white shadow-xl flex flex-col items-center justify-center py-20 text-slate-800">
                        <div className="animate-spin w-8 h-8 border-2 border-[#1E3A8A] border-t-transparent rounded-full mb-4" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Loading Form...</span>
                    </div>
                }>
                    <ResetPasswordWithTokenForm />
                </Suspense>
            </div>
        </div>
    );
}
