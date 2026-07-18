"use client";
import { User, Shield, Bell, Calendar, Users } from "lucide-react";
import { useState } from "react";
import ProfileSecurityTab, { UserProfile } from "@/components/settings/ProfileSecurityTab";
import NotificationTab from "@/components/settings/NotificationTab";
import AcademicCycleTab from "@/components/settings/AcademicCycleTab";

export default function SettingsClient({ user }: { user: UserProfile }) {
    const [activeTab, setActiveTab] = useState("profile");

    const tabs = [
        { id: "profile", label: "Profile & Security", icon: User, show: true },
        { id: "notifications", label: "Notifications", icon: Bell, show: true },
        { id: "department", label: "Department Config", icon: Users, show: user.role === "HOD" || user.role === "ADMIN" || user.role === "SUPER_ADMIN" },
        { id: "academic", label: "Academic Cycle", icon: Calendar, show: user.role === "ADMIN" || user.role === "SUPER_ADMIN" },
        { id: "roles", label: "Role Management", icon: Shield, show: user.role === "SUPER_ADMIN" },
    ].filter(t => t.show);

    return (
        <div className="max-w-5xl mx-auto pb-24">
            <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Settings</h1>
                <p className="text-gray-500 mt-1">Manage your account preferences and institutional configurations.</p>
            </div>

            <div className="mt-8 flex flex-col lg:flex-row gap-6">
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-56 shrink-0">
                    <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                        isActive 
                                        ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-md" 
                                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? "opacity-100" : "opacity-50"}`} />
                                    <span className="whitespace-nowrap">{tab.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 min-w-0">
                    {activeTab === "profile" && <ProfileSecurityTab user={user} />}
                    {activeTab === "notifications" && <NotificationTab />}
                    {activeTab === "department" && (
                        <div className="p-8 text-center border border-dashed rounded-2xl border-gray-300 dark:border-gray-700">
                            <p className="font-bold text-gray-500 uppercase tracking-widest text-sm">Department Settings Coming Soon</p>
                        </div>
                    )}
                    {activeTab === "academic" && <AcademicCycleTab />}
                    {activeTab === "roles" && (
                        <div className="p-8 text-center border border-dashed rounded-2xl border-gray-300 dark:border-gray-700">
                            <p className="font-bold text-gray-500 uppercase tracking-widest text-sm">Role Management Coming Soon</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
