"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface UserProfile {
    id: number;
    name: string;
    email: string;
    phone: string;
    avatarUrl: string;
    role: string;
    departmentName: string;
}

export default function ProfileClient({ user }: { user: UserProfile }) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>(user.avatarUrl || "");
    const [name, setName] = useState(user.name);
    const [phone, setPhone] = useState(user.phone);
    
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    
    const [profileStatus, setProfileStatus] = useState<{type: 'success' | 'error', msg: string} | null>(null);
    const [passwordStatus, setPasswordStatus] = useState<{type: 'success' | 'error', msg: string} | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

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
            if (avatarFile) {
                formData.append("avatar", avatarFile);
            }

            const res = await fetch("/api/user/profile", {
                method: "POST",
                body: formData
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update profile");
            }
            
            setProfileStatus({ type: 'success', msg: 'Profile updated successfully!' });
            // Optionally reload page to update sidebar state, or wait for next navigation
            setTimeout(() => window.location.reload(), 1500);
        } catch (error: any) {
            setProfileStatus({ type: 'error', msg: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setPasswordStatus({ type: 'error', msg: 'New passwords do not match' });
            return;
        }

        setIsChangingPassword(true);
        setPasswordStatus(null);
        try {
            const res = await fetch("/api/user/password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to update password");
            
            setPasswordStatus({ type: 'success', msg: 'Password updated successfully!' });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            setPasswordStatus({ type: 'error', msg: error.message });
        } finally {
            setIsChangingPassword(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8 pb-24">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
                <p className="text-gray-500 text-sm mt-1">Manage your personal information and security settings.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Left Column: Avatar & Basic Info */}
                <div className="col-span-1 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 text-center">
                        <div className="relative inline-block group">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg mx-auto bg-gray-100 flex items-center justify-center relative">
                                {previewUrl ? (
                                    <Image src={previewUrl} alt="Avatar" fill className="object-cover" />
                                ) : (
                                    <span className="text-4xl">👤</span>
                                )}
                            </div>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 w-10 h-10 bg-indigo-600 rounded-full text-white shadow-lg flex items-center justify-center hover:bg-indigo-700 transition-colors border-2 border-white dark:border-gray-800"
                            >
                                📷
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileChange} 
                                accept="image/*" 
                                className="hidden" 
                            />
                        </div>
                        <h2 className="mt-4 font-bold text-lg text-gray-900 dark:text-white">{user.name}</h2>
                        <p className="text-sm text-gray-500 font-medium">{user.role.replace('_', ' ')}</p>
                        <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                            {user.departmentName}
                        </div>
                    </div>
                </div>

                {/* Right Column: Forms */}
                <div className="col-span-1 md:col-span-2 space-y-6">
                    
                    {/* Personal Details */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Personal Details</h3>
                        
                        {profileStatus && (
                            <div className={`p-3 rounded-xl text-sm mb-4 ${profileStatus.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                {profileStatus.msg}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                                <input 
                                    type="text" 
                                    value={name} 
                                    onChange={e => setName(e.target.value)} 
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
                                    <input 
                                        type="email" 
                                        value={user.email} 
                                        disabled
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 text-gray-500"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Contact IT to change email.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone Number</label>
                                    <input 
                                        type="text" 
                                        value={phone} 
                                        onChange={e => setPhone(e.target.value)} 
                                        placeholder="+233 000 000 0000"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                            <div className="pt-2 flex justify-end">
                                <button 
                                    onClick={handleSaveProfile}
                                    disabled={isSaving}
                                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Security */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Security</h3>
                        
                        {passwordStatus && (
                            <div className={`p-3 rounded-xl text-sm mb-4 ${passwordStatus.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                {passwordStatus.msg}
                            </div>
                        )}

                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Current Password</label>
                                <input 
                                    type="password" 
                                    value={currentPassword} 
                                    onChange={e => setCurrentPassword(e.target.value)} 
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">New Password</label>
                                    <input 
                                        type="password" 
                                        value={newPassword} 
                                        onChange={e => setNewPassword(e.target.value)} 
                                        required
                                        minLength={8}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm New Password</label>
                                    <input 
                                        type="password" 
                                        value={confirmPassword} 
                                        onChange={e => setConfirmPassword(e.target.value)} 
                                        required
                                        minLength={8}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                            <div className="pt-2 flex justify-end">
                                <button 
                                    type="submit"
                                    disabled={isChangingPassword}
                                    className="px-6 py-2.5 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                                >
                                    {isChangingPassword ? "Updating..." : "Update Password"}
                                </button>
                            </div>
                        </form>
                    </div>

                </div>
            </div>
        </div>
    );
}
