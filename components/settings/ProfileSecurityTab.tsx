"use client";
import { User, Camera, Mail, Phone, Shield, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Building2, BadgeCheck } from "lucide-react";
import { useState, useRef } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";

export interface UserProfile {
    id: number;
    name: string;
    email: string;
    phone: string;
    avatarUrl: string;
    role: string;
    departmentName: string;
}

const ROLE_COLORS: Record<string, string> = {
    ADMIN: "from-rose-500 to-pink-600",
    SUPER_ADMIN: "from-purple-600 to-violet-700",
    HOD: "from-blue-500 to-indigo-600",
    LECTURER: "from-emerald-500 to-teal-600",
    DEO: "from-amber-500 to-orange-600",
};

const ROLE_LABELS: Record<string, string> = {
    ADMIN: "Administrator",
    SUPER_ADMIN: "Super Admin",
    HOD: "Head of Department",
    LECTURER: "Lecturer",
    DEO: "Data Entry Officer",
};

function StatusBanner({ status }: { status: { type: "success" | "error"; msg: string } | null }) {
    if (!status) return null;
    const isSuccess = status.type === "success";
    return (
        <div className={`flex items-center gap-2.5 p-3.5 rounded-xl text-sm font-medium mb-4 border ${
            isSuccess
                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
        }`}>
            {isSuccess ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {status.msg}
        </div>
    );
}

export default function ProfileSecurityTab({ user }: { user: UserProfile }) {
    const { update } = useSession();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>(user.avatarUrl || "");
    const [name, setName] = useState(user.name);
    const [phone, setPhone] = useState(user.phone);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [profileStatus, setProfileStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
    const [passwordStatus, setPasswordStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const roleColor = ROLE_COLORS[user.role] || "from-indigo-500 to-blue-600";
    const roleLabel = ROLE_LABELS[user.role] || user.role.replace("_", " ");

    const passwordStrength = (() => {
        if (!newPassword) return 0;
        let score = 0;
        if (newPassword.length >= 8) score++;
        if (/[A-Z]/.test(newPassword)) score++;
        if (/[0-9]/.test(newPassword)) score++;
        if (/[^A-Za-z0-9]/.test(newPassword)) score++;
        return score;
    })();

    const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][passwordStrength];
    const strengthColor = ["", "bg-red-500", "bg-amber-500", "bg-blue-500", "bg-emerald-500"][passwordStrength];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        setProfileStatus(null);
        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("phone", phone);
            if (avatarFile) formData.append("avatar", avatarFile);

            const res = await fetch("/api/user/profile", { method: "POST", body: formData });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update profile");
            }
            // Trigger NextAuth session update to refresh token data on client side
            await update();
            setProfileStatus({ type: "success", msg: "Profile updated successfully!" });
            setTimeout(() => window.location.reload(), 1500);
        } catch (error: any) {
            setProfileStatus({ type: "error", msg: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setPasswordStatus({ type: "error", msg: "New passwords do not match." });
            return;
        }
        setIsChangingPassword(true);
        setPasswordStatus(null);
        try {
            const res = await fetch("/api/user/password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to update password");
            setPasswordStatus({ type: "success", msg: "Password updated successfully!" });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            setPasswordStatus({ type: "error", msg: error.message });
        } finally {
            setIsChangingPassword(false);
        }
    };

    const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Profile Banner Card */}
            <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${roleColor} p-6 shadow-lg`}>
                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4 blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-black/10 translate-y-1/2 -translate-x-1/4 blur-xl pointer-events-none" />

                <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5">
                    {/* Avatar */}
                    <div className="relative group shrink-0">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white/20 border-2 border-white/30 shadow-xl flex items-center justify-center">
                            {previewUrl ? (
                                <Image src={previewUrl} alt="Avatar" fill className="object-cover" />
                            ) : (
                                <span className="text-white font-black text-3xl">{initials}</span>
                            )}
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute -bottom-2 -right-2 w-9 h-9 bg-white rounded-xl shadow-lg flex items-center justify-center hover:scale-110 transition-transform border border-gray-100"
                        >
                            <Camera className="w-4 h-4 text-gray-700" />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>

                    {/* Info */}
                    <div className="text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                            <h2 className="text-2xl font-black text-white">{user.name}</h2>
                            <BadgeCheck className="w-5 h-5 text-white/80" />
                        </div>
                        <p className="text-white/70 text-sm font-medium">{user.email}</p>
                        <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/20 text-white text-xs font-bold backdrop-blur-sm">
                                <Shield className="w-3.5 h-3.5" /> {roleLabel}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/20 text-white text-xs font-bold backdrop-blur-sm">
                                <Building2 className="w-3.5 h-3.5" /> {user.departmentName}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Two-column grid on md+ */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left: Personal Info */}
                <div className="lg:col-span-3 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                            <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Personal Details</h3>
                            <p className="text-xs text-gray-400">Update your name and contact info</p>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        <StatusBanner status={profileStatus} />

                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="email"
                                        value={user.email}
                                        disabled
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed text-sm"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1 font-semibold uppercase tracking-widest">Contact IT to change</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+233 000 000 0000"
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <button
                                onClick={handleSaveProfile}
                                disabled={isSaving}
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-xl transition-all disabled:opacity-50 text-sm shadow-sm"
                            >
                                {isSaving ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                        Saving…
                                    </span>
                                ) : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Security */}
                <div className="lg:col-span-2 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center">
                            <Lock className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Change Password</h3>
                            <p className="text-xs text-gray-400">Keep your account secure</p>
                        </div>
                    </div>

                    <div className="p-6">
                        <StatusBanner status={passwordStatus} />
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">
                                    Current Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showCurrent ? "text" : "password"}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        required
                                        className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-400 focus:border-transparent outline-none transition text-sm"
                                    />
                                    <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                                        {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showNew ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        minLength={8}
                                        className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-400 focus:border-transparent outline-none transition text-sm"
                                    />
                                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {newPassword && (
                                    <div className="mt-2 space-y-1">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4].map((i) => (
                                                <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= passwordStrength ? strengthColor : "bg-gray-200 dark:bg-gray-700"}`} />
                                            ))}
                                        </div>
                                        <p className="text-[11px] text-gray-400 font-medium">{strengthLabel} password</p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirm ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        minLength={8}
                                        className={`w-full px-4 py-2.5 pr-10 rounded-xl border bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent outline-none transition text-sm ${
                                            confirmPassword && confirmPassword !== newPassword
                                                ? "border-red-400 focus:ring-red-400"
                                                : "border-gray-200 dark:border-gray-600 focus:ring-rose-400"
                                        }`}
                                    />
                                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {confirmPassword && confirmPassword !== newPassword && (
                                    <p className="text-[11px] text-red-500 mt-1 font-medium">Passwords don&apos;t match</p>
                                )}
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isChangingPassword}
                                    className="w-full px-5 py-2.5 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 active:scale-95 text-white font-bold rounded-xl transition-all disabled:opacity-50 text-sm shadow-sm"
                                >
                                    {isChangingPassword ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                            Updating…
                                        </span>
                                    ) : "Update Password"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
