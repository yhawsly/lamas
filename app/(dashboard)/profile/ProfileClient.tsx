"use client";

import { useState, useRef } from "react";
import { 
    User, Camera, Mail, Phone, Shield, Lock, Eye, EyeOff, 
    CheckCircle2, AlertCircle, Building2, BadgeCheck, FileSignature, 
    Sparkles, KeyRound, Save 
} from "lucide-react";
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
    ADMIN: "System Administrator",
    SUPER_ADMIN: "Super Administrator",
    HOD: "Head of Department",
    LECTURER: "Lecturer / Faculty",
    DEO: "Department Exam Officer",
};

export default function ProfileClient({ user }: { user: UserProfile }) {
    const { update } = useSession();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const signatureInputRef = useRef<HTMLInputElement>(null);

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>(user.avatarUrl || "");
    const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

    const [name, setName] = useState(user.name);
    const [phone, setPhone] = useState(user.phone || "");
    const [academicTitle, setAcademicTitle] = useState(
        user.name.startsWith("Dr.") ? "Dr." : 
        user.name.startsWith("Prof.") ? "Prof." : 
        user.name.startsWith("Ing.") ? "Ing." : "Mr."
    );

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

    const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSignaturePreview(URL.createObjectURL(file));
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

            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to update profile");
            }

            await update({ name });
            setProfileStatus({ type: "success", msg: "Profile updated successfully." });
        } catch (err: any) {
            setProfileStatus({ type: "error", msg: err.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword) {
            setPasswordStatus({ type: "error", msg: "Please fill in all password fields." });
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordStatus({ type: "error", msg: "New passwords do not match." });
            return;
        }
        if (newPassword.length < 8) {
            setPasswordStatus({ type: "error", msg: "Password must be at least 8 characters long." });
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
            if (!res.ok) throw new Error(data.error || "Failed to change password");

            setPasswordStatus({ type: "success", msg: "Password updated successfully." });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: any) {
            setPasswordStatus({ type: "error", msg: err.message });
        } finally {
            setIsChangingPassword(false);
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-500">
            {/* Page Title */}
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                    <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    My Faculty Profile
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                    Manage your personal faculty credentials, digital signature, and security credentials.
                </p>
            </div>

            {/* Profile Identity Card */}
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    {/* Avatar with Camera Overlay */}
                    <div className="relative group shrink-0">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-3xl shadow-lg border-2 border-white dark:border-slate-700">
                            {previewUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={previewUrl} alt={name} className="w-full h-full object-cover" />
                            ) : (
                                <span>{name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}</span>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-md transition cursor-pointer"
                            title="Change photo"
                        >
                            <Camera className="w-4 h-4" />
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>

                    {/* Meta Details */}
                    <div className="flex-1 text-center sm:text-left">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">{name}</h2>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                                {roleLabel}
                            </span>
                        </div>

                        <div className="mt-2 text-xs text-slate-500 space-y-1">
                            <div className="flex items-center justify-center sm:justify-start gap-1.5 font-medium">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                <span>{user.email}</span>
                            </div>
                            <div className="flex items-center justify-center sm:justify-start gap-1.5 font-medium">
                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                <span>{user.departmentName || "Computer Science Department"}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Info Form */}
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-6 shadow-xs space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <BadgeCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">Personal & Contact Details</h3>
                        <p className="text-xs text-slate-500">Official information shown on syllabus and review documents</p>
                    </div>
                </div>

                {profileStatus && (
                    <div className={`p-4 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                        profileStatus.type === "success" 
                            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-300"
                            : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-800 dark:text-rose-300"
                    }`}>
                        {profileStatus.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                        {profileStatus.msg}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Full Display Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none"
                            placeholder="e.g. Dr. Redeemer"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Official Email Address
                        </label>
                        <input
                            type="email"
                            value={user.email}
                            disabled
                            className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 text-slate-500 cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none"
                            placeholder="+233 24 123 4567"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Department
                        </label>
                        <input
                            type="text"
                            value={user.departmentName || "Computer Science"}
                            disabled
                            className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 text-slate-500 cursor-not-allowed"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        type="button"
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {isSaving ? "Saving..." : "Save Profile Details"}
                    </button>
                </div>
            </div>

            {/* Digital Signature Card */}
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                        <FileSignature className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">Official Digital Signature</h3>
                        <p className="text-xs text-slate-500">Used for signing Form A syllabus reviews, classroom observations, and moderation dossiers</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-48 h-24 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 overflow-hidden">
                        {signaturePreview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={signaturePreview} alt="Signature" className="max-h-full object-contain p-2" />
                        ) : (
                            <span className="text-[11px] text-slate-400 font-medium italic">No signature uploaded</span>
                        )}
                    </div>

                    <div>
                        <button
                            type="button"
                            onClick={() => signatureInputRef.current?.click()}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition cursor-pointer"
                        >
                            Upload Transparent PNG Signature
                        </button>
                        <input
                            ref={signatureInputRef}
                            type="file"
                            accept="image/png"
                            onChange={handleSignatureChange}
                            className="hidden"
                        />
                        <p className="text-[11px] text-slate-400 mt-1.5">Recommended format: PNG with transparent background, max 2MB.</p>
                    </div>
                </div>
            </div>

            {/* Password & Security Card */}
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-6 shadow-xs space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">Account Security & Password</h3>
                        <p className="text-xs text-slate-500">Update your account login password</p>
                    </div>
                </div>

                {passwordStatus && (
                    <div className={`p-4 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                        passwordStatus.type === "success" 
                            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-300"
                            : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-800 dark:text-rose-300"
                    }`}>
                        {passwordStatus.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                        {passwordStatus.msg}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Current Password
                        </label>
                        <div className="relative">
                            <input
                                type={showCurrent ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none pr-9"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrent(!showCurrent)}
                                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                            >
                                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showNew ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none pr-9"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(!showNew)}
                                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                            >
                                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirm ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none pr-9"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                            >
                                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>

                {newPassword && (
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
                            <div className={`h-full ${strengthColor} transition-all`} style={{ width: `${(passwordStrength / 4) * 100}%` }} />
                        </div>
                        <span className="text-[11px] font-bold text-slate-500">{strengthLabel}</span>
                    </div>
                )}

                <div className="flex justify-end pt-2">
                    <button
                        type="button"
                        onClick={handleChangePassword}
                        disabled={isChangingPassword}
                        className="px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        <Lock className="w-4 h-4" />
                        {isChangingPassword ? "Updating..." : "Change Password"}
                    </button>
                </div>
            </div>
        </div>
    );
}
