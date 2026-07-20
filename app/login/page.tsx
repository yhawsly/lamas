"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight, ShieldAlert, ChevronDown, ChevronUp, X } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [showDemoAccounts, setShowDemoAccounts] = useState(false);
    const [showGoogleModal, setShowGoogleModal] = useState(false);

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
            setError("Invalid email or password. Please try again.");
        } else {
            router.refresh();
            router.push("/");
        }
    }

    async function handleGoogleLogin() {
        setShowGoogleModal(true);
    }

    const handleSelectMockGoogleUser = async (selectedEmail: string) => {
        setShowGoogleModal(false);
        setGoogleLoading(true);
        setError("");
        try {
            const result = await signIn("credentials", {
                email: selectedEmail,
                isGoogleMock: "true",
                redirect: false,
            });
            setGoogleLoading(false);
            if (result?.error) {
                setError("Google authentication profile mismatch. Please try again.");
            } else {
                router.refresh();
                router.push("/");
            }
        } catch {
            setError("Google connection timed out.");
            setGoogleLoading(false);
        }
    };

    return (
        <div 
            suppressHydrationWarning 
            className="min-h-screen flex flex-col md:flex-row bg-slate-50 font-sans antialiased text-slate-800"
            style={{
                backgroundColor: "#F8FAFC",
                color: "#0F172A",
                // Override CSS variable tokens in this element sub-tree to light mode values
                "--bg-base": "#F8FAFC",
                "--bg-surface": "#FFFFFF",
                "--bg-border": "#E2E8F0",
                "--bg-hover": "#F1F5F9",
                "--bg-sidebar": "#FFFFFF",
                "--text-primary": "#0F172A",
                "--text-secondary": "#475569",
                "--text-muted": "#94A3B8",
                "--primary": "#2563EB",
                "--primary-hover": "#1D4ED8",
            } as any}
        >
            {/* Left Column - Brand/Watermark Panel (Academic Blue) */}
            <div className="relative flex flex-col justify-between p-8 md:p-12 text-white overflow-hidden bg-[#1E3A8A] w-full md:w-[38%] min-h-[300px] md:min-h-screen md:h-screen shrink-0 select-none">
                {/* Subtle brand gradients */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.25),transparent_60%)] pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(30,58,138,0.5),transparent_70%)] pointer-events-none" />

                {/* Header Logo */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 14l9-5-9-5-9 5 9 5z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        </svg>
                    </div>
                    <div>
                        <span className="font-extrabold tracking-widest text-base">LAMAS</span>
                        <span className="text-[9px] block opacity-60 font-semibold tracking-wider uppercase leading-none">University Portal</span>
                    </div>
                </div>

                {/* Large Watermark Shield Crest */}
                <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none opacity-[0.09]">
                    <svg className="w-full max-w-[280px] aspect-square text-white" viewBox="0 0 100 120" fill="none" stroke="currentColor" strokeWidth="1.2">
                        {/* Outer Shield Outline */}
                        <path d="M10 10 C10 10 35 15 50 15 C65 15 90 10 90 10 C90 10 92 65 90 80 C88 95 65 112 50 115 C35 112 12 95 10 80 C8 65 10 10 10 10 Z" strokeWidth="2" />
                        {/* Division lines */}
                        <path d="M10 40 L90 40" strokeWidth="1.2" />
                        <path d="M50 40 L50 115" strokeWidth="1.2" />
                        {/* Sun in top chief */}
                        <circle cx="50" cy="25" r="5" fill="currentColor" />
                        <path d="M50 13 V16 M50 34 V37 M38 25 H41 M59 25 H62 M41 16 L43 18 M59 34 L57 32 M41 34 L43 32 M59 16 L57 18" strokeWidth="1" />
                        {/* Maple Leaf in bottom-left */}
                        <path d="M25 78 C25 73 27 71 29 68 L31 70 C32 68 34 68 33 71 L36 70 C35 74 33 76 34 79 L31 78 C30 80 28 81 27 83 L27 79 Z" fill="currentColor" />
                        {/* Lion in bottom-right */}
                        <path d="M68 65 C68 63 70 61 72 61 C74 61 74 63 74 65 C74 67 72 68 70 69 H75 L73 73 L75 77 H68 L68 73 Z" fill="currentColor" />
                        {/* Book in center */}
                        <rect x="42" y="33" width="16" height="12" rx="1" fill="#1E3A8A" stroke="currentColor" strokeWidth="1" />
                        <line x1="50" y1="33" x2="50" y2="45" stroke="currentColor" strokeWidth="0.8" />
                    </svg>
                </div>

                {/* Footer Links */}
                <div className="relative z-10 flex gap-6 text-[11px] text-blue-200/50 font-medium">
                    <a href="#" className="hover:text-white transition-colors duration-150">About</a>
                    <a href="#" className="hover:text-white transition-colors duration-150">Privacy</a>
                    <a href="#" className="hover:text-white transition-colors duration-150">Terms of Use</a>
                    <a href="#" className="hover:text-white transition-colors duration-150">FAQ</a>
                </div>
            </div>

            {/* Right Column - Login Form Panel */}
            <div className="flex-1 flex flex-col justify-center p-6 sm:p-12 md:p-20 bg-white min-h-[480px]">
                <div className="w-full max-w-[420px] mx-auto flex flex-col gap-6">
                    {/* Header */}
                    <div>
                        <h2 className="text-3xl font-light text-slate-400 tracking-tight leading-tight">
                            Login to your <br />
                            <span className="text-slate-800 font-normal">academic dashboard</span>
                        </h2>
                    </div>

                    {/* Alert Errors */}
                    {error && (
                        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold flex items-start gap-2.5 shadow-sm">
                            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="flex flex-col">
                            <label htmlFor="login-email" className="sr-only">User ID / Email</label>
                            <input
                                id="login-email"
                                name="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="USER ID"
                                className="w-full px-4 py-3 bg-white border text-slate-800 placeholder-slate-400 text-xs font-bold tracking-widest border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] transition"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="login-password" className="sr-only">Password</label>
                            <input
                                id="login-password"
                                name="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="PASSWORD"
                                className="w-full px-4 py-3 bg-white border text-slate-800 placeholder-slate-400 text-xs font-bold tracking-widest border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] transition"
                            />
                        </div>

                        {/* Submit Row */}
                        <div className="flex items-center gap-4 mt-2">
                            <button
                                type="submit"
                                disabled={loading || googleLoading}
                                className="px-8 py-2.5 bg-[#1E3A8A] hover:bg-[#1e40af] text-white text-xs font-bold tracking-widest rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        <span>SIGNING IN...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>LOGIN</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </>
                                )}
                            </button>

                            <a href="#" className="text-xs font-semibold text-[#1E3A8A] hover:underline transition-colors duration-150">
                                Forgot your User ID or Password?
                            </a>
                        </div>
                    </form>

                    {/* OR Divider */}
                    <div className="relative my-2">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-100"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                            <span className="bg-white px-3 text-slate-500">OR</span>
                        </div>
                    </div>

                    {/* Google OAuth Login Button */}
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading || googleLoading}
                        className="w-full py-3 bg-white border text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-[#1E3A8A]/30 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] text-xs font-bold tracking-widest transition flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
                    >
                        {googleLoading ? (
                            <>
                                <svg className="animate-spin h-3.5 w-3.5 text-slate-600" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                <span>CONNECTING TO GOOGLE...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path
                                        fill="#EA4335"
                                        d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.336 0 3.336 2.682 1.4 6.6L5.266 9.765Z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M16.04 15.69A7.054 7.054 0 0 1 12 17.09c-2.918 0-5.39-1.963-6.273-4.636L1.873 15.6C3.818 19.49 7.827 22.09 12 22.09c2.973 0 5.69-.973 7.736-2.673l-3.696-3.727Z"
                                    />
                                    <path
                                        fill="#4285F4"
                                        d="M23.49 12.27c0-.818-.082-1.609-.218-2.373H12v4.51h6.464a5.536 5.536 0 0 1-2.409 3.636l3.696 3.727c2.155-2 3.736-4.936 3.736-9.5Z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.727 12.454A7.127 7.127 0 0 1 5.727 11.5L1.873 8.355C1.29 9.5 1 10.727 1 12s.29 2.5.873 3.645l3.854-3.19Z"
                                    />
                                </svg>
                                <span>CONTINUE WITH GOOGLE</span>
                            </>
                        )}
                    </button>

                    {/* Collapsible Demo Credentials Panel */}
                    <div className="border border-slate-100 rounded-2xl bg-slate-50/50 overflow-hidden mt-4">
                        <button
                            type="button"
                            onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                            className="w-full px-4 py-3 flex items-center justify-between text-xs font-black tracking-wider text-slate-500 uppercase select-none hover:bg-slate-100/50 transition-colors"
                        >
                            <span className="flex items-center gap-2">
                                <Lock className="w-3.5 h-3.5" />
                                Quick Login Accounts
                            </span>
                            {showDemoAccounts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {showDemoAccounts && (
                            <div className="p-3 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-slate-100 bg-white/50">
                                {[
                                    { label: "Lecturer Workspace", desc: "Assigned Courses & Schedules", email: "slyyhaw@gmail.com" },
                                    { label: "Head of Dept (CS)", desc: "Department Curriculum & Staff", email: "ahmad@lamas.edu" },
                                    { label: "Dept Exam Officer", desc: "Moderation Observ. Auditing", email: "deo@lamas.edu" },
                                    { label: "Super Admin Control", desc: "Full Academic Configuration", email: "superadmin@lamas.edu" }
                                ].map((acc) => (
                                    <button
                                        key={acc.email}
                                        type="button"
                                        onClick={() => { setEmail(acc.email); setPassword("password123"); }}
                                        className="text-left p-3 rounded-xl bg-white hover:bg-[#1E3A8A]/5 hover:border-[#1E3A8A]/30 border border-slate-100 transition cursor-pointer group flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="text-[10px] font-black uppercase text-slate-800 group-hover:text-[#1E3A8A] transition-colors">{acc.label}</div>
                                            <div className="text-[9px] text-slate-400 mt-0.5 leading-snug">{acc.desc}</div>
                                        </div>
                                        <div className="text-[10px] text-slate-500 mt-2 truncate font-mono bg-slate-50 p-1 px-1.5 rounded-lg border border-slate-100 w-fit">{acc.email}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Google Sign-in Mock Accounts Modal */}
                {showGoogleModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-6 relative">
                            {/* Close Trigger */}
                            <button 
                                onClick={() => setShowGoogleModal(false)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Google Branding Header */}
                            <div className="flex flex-col items-center text-center mt-3 mb-6">
                                <svg className="w-8 h-8 mb-3" viewBox="0 0 24 24">
                                    <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.336 0 3.336 2.682 1.4 6.6L5.266 9.765Z" />
                                    <path fill="#34A853" d="M16.04 15.69A7.054 7.054 0 0 1 12 17.09c-2.918 0-5.39-1.963-6.273-4.636L1.873 15.6C3.818 19.49 7.827 22.09 12 22.09c2.973 0 5.69-.973 7.736-2.673l-3.696-3.727Z" />
                                    <path fill="#4285F4" d="M23.49 12.27c0-.818-.082-1.609-.218-2.373H12v4.51h6.464a5.536 5.536 0 0 1-2.409 3.636l3.696 3.727c2.155-2 3.736-4.936 3.736-9.5Z" />
                                    <path fill="#FBBC05" d="M5.727 12.454A7.127 7.127 0 0 1 5.727 11.5L1.873 8.355C1.29 9.5 1 10.727 1 12s.29 2.5.873 3.645l3.854-3.19Z" />
                                </svg>
                                <h3 className="text-lg font-bold text-slate-900">Sign in with Google</h3>
                                <p className="text-xs text-slate-500 mt-1">Choose an account to continue to LAMAS</p>
                            </div>

                            {/* Account List Grid */}
                            <div className="space-y-2">
                                {[
                                    { name: "Super Admin Control", email: "superadmin@lamas.edu", initials: "SA", desc: "Full Academic Configuration" },
                                    { name: "Head of Dept (CS)", email: "ahmad@lamas.edu", initials: "AR", desc: "Department Curriculum & Staff" },
                                    { name: "Dept Exam Officer", email: "deo@lamas.edu", initials: "EO", desc: "Moderation & Audits" },
                                    { name: "Lecturer Workspace", email: "slyyhaw@gmail.com", initials: "LH", desc: "Assigned Courses & Schedules" }
                                ].map((profile) => (
                                    <button
                                        key={profile.email}
                                        onClick={() => handleSelectMockGoogleUser(profile.email)}
                                        className="w-full text-left p-3.5 rounded-2xl hover:bg-slate-50 border border-slate-100 hover:border-blue-600/30 transition flex items-center gap-3 cursor-pointer group"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center text-xs font-bold shrink-0">
                                            {profile.initials}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-tight">{profile.name}</div>
                                            <div className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">{profile.email}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
