"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import {
    Lock,
    ArrowRight,
    ShieldAlert,
    ChevronDown,
    ChevronUp,
    FileText,
    Users,
    BarChart3,
    Mail,
    KeyRound,
    Eye,
    EyeOff
} from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showDemoAccounts, setShowDemoAccounts] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        setLoading(false);

        if (result?.error) {
            setError("Invalid email or password. Please verify your credentials.");
        } else {
            window.location.href = "/";
        }
    }

    return (
        <div className="min-h-screen w-full flex flex-col md:flex-row bg-white font-sans antialiased text-slate-900 selection:bg-blue-600 selection:text-white">
            {/* Left Side - University Visual Hero Panel */}
            <div className="relative flex flex-col justify-between p-8 sm:p-12 md:p-14 lg:p-16 text-white w-full md:w-1/2 lg:w-[52%] min-h-[480px] md:min-h-screen overflow-hidden shrink-0 select-none">
                {/* Background Image (HTU Official Image) */}
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
                    style={{
                        backgroundImage: "url('/login-bg.jpg')",
                    }}
                />

                {/* Dark Gradient Overlay for Pristine Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-900/60" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(37,99,235,0.3),transparent_70%)] pointer-events-none" />

                {/* Top Badge: HTU LAMAS Emblem */}
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-3 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-white/40">
                        <div className="w-9 h-9 rounded-xl bg-white p-0.5 flex items-center justify-center shadow-xs">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/htu-logo.png" alt="HTU Official Crest" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="font-black text-blue-950 text-sm tracking-wider">HTU</span>
                            <span className="font-extrabold text-blue-800 text-[11px] tracking-widest uppercase">LAMAS</span>
                        </div>
                    </div>
                </div>

                {/* Middle & Bottom Content Area */}
                <div className="relative z-10 space-y-7 my-auto pt-10 pb-6 max-w-xl">
                    {/* Main Headline */}
                    <div className="space-y-3">
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.12] drop-shadow-sm">
                            Championing <br />
                            Academic Excellence <br />
                            <span className="text-blue-200">&amp; Integrity</span>
                        </h1>
                        <p className="text-sm sm:text-base text-slate-200/90 font-normal leading-relaxed max-w-lg">
                            Ho Technical University&apos;s premier lecture &amp; academic audit portal — empowering faculty,
                            heads of department, and exam officers with real-time quality assurance.
                        </p>
                    </div>

                    {/* 3 Pill Features */}
                    <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-3.5 text-slate-100/95 group">
                            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 group-hover:bg-white/20 transition">
                                <FileText className="w-5 h-5 text-blue-300" />
                            </div>
                            <span className="text-xs sm:text-sm font-medium">
                                Track syllabus submissions & peer reviews end-to-end
                            </span>
                        </div>

                        <div className="flex items-center gap-3.5 text-slate-100/95 group">
                            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 group-hover:bg-white/20 transition">
                                <Users className="w-5 h-5 text-emerald-300" />
                            </div>
                            <span className="text-xs sm:text-sm font-medium">
                                Coordinate teaching observations & invigilation rosters
                            </span>
                        </div>

                        <div className="flex items-center gap-3.5 text-slate-100/95 group">
                            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 group-hover:bg-white/20 transition">
                                <BarChart3 className="w-5 h-5 text-purple-300" />
                            </div>
                            <span className="text-xs sm:text-sm font-medium">
                                Real-time attendance & quality grading insights
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer Copyright */}
                <div className="relative z-10 text-[11px] text-slate-400 font-medium pt-4">
                    © {new Date().getFullYear()} Ho Technical University. All rights reserved.
                </div>
            </div>

            {/* Right Side - Plain, Clean Login Form */}
            <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 md:p-14 lg:p-20 bg-white min-h-[500px]">
                <div className="w-full max-w-[420px] space-y-7">
                    {/* Header */}
                    <div className="space-y-1.5 text-left">
                        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                            Sign in
                        </h2>
                        <p className="text-sm text-slate-500">
                            Enter your university credentials to access your dashboard
                        </p>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2.5">
                            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Direct Plain Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email / User ID Input */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                Email / User ID
                            </label>
                            <div className="relative">
                                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="e.g. slyyhaw@gmail.com"
                                    className="w-full pl-10 pr-4 py-3 text-sm bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-medium text-slate-800 transition"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                    Password
                                </label>
                                <a
                                    href="/reset-password/request"
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                                >
                                    Forgot password?
                                </a>
                            </div>
                            <div className="relative">
                                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full pl-10 pr-10 py-3 text-sm bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-medium text-slate-800 transition"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-600/25 transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <>
                                    <span>Sign in to Dashboard</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-slate-500 font-medium">Or continue with</span>
                        </div>
                    </div>

                    {/* Google Sign In Button */}
                    <button
                        type="button"
                        onClick={() => signIn("google", { callbackUrl: "/" })}
                        className="w-full py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-sm font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-3 cursor-pointer active:scale-[0.99]"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Sign in with Google
                    </button>

                    {/* Quick Demo Switcher */}
                    <div className="border border-slate-200 rounded-2xl bg-slate-50/70 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                            className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-slate-600 hover:bg-slate-100/70 transition"
                        >
                            <span className="flex items-center gap-2">
                                <Lock className="w-3.5 h-3.5 text-blue-600" />
                                1-Click Demo Accounts (Lecturer, HOD, DEO, Admin)
                            </span>
                            {showDemoAccounts ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </button>

                        {showDemoAccounts && (
                            <div className="p-3 border-t border-slate-200 grid grid-cols-2 gap-2 bg-white">
                                {[
                                    { label: "Lecturer", email: "slyyhaw@gmail.com" },
                                    { label: "Head of Dept", email: "ahmad@lamas.edu" },
                                    { label: "Exam Officer", email: "deo@lamas.edu" },
                                    { label: "Super Admin", email: "superadmin@lamas.edu" }
                                ].map(acc => (
                                    <button
                                        key={acc.email}
                                        type="button"
                                        onClick={() => {
                                            setEmail(acc.email);
                                            setPassword("password123");
                                        }}
                                        className="text-left p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition group cursor-pointer"
                                    >
                                        <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600">{acc.label}</div>
                                        <div className="text-[10px] text-slate-500 font-mono truncate mt-0.5">{acc.email}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
