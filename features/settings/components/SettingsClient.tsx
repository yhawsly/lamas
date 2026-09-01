"use client";
import { Bell, Palette, Calendar } from "lucide-react";
import { useState } from "react";
import NotificationTab from "@/components/settings/NotificationTab";
import AppearanceTab from "@/components/settings/AppearanceTab";
import AcademicCycleTab from "@/components/settings/AcademicCycleTab";

export default function SettingsClient({ user }: { user: { role: string } }) {
    const [activeTab, setActiveTab] = useState("notifications");

    const tabs = [
        { id: "notifications", label: "Notifications", icon: Bell, show: true },
        { id: "appearance", label: "Appearance & Theme", icon: Palette, show: true },
        { id: "academic", label: "Academic Cycle", icon: Calendar, show: user.role === "ADMIN" || user.role === "SUPER_ADMIN" },
    ].filter(t => t.show);

    return (
        <div className="max-w-5xl mx-auto pb-24">
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Settings Panel</h1>
                <p className="text-slate-500 text-sm mt-1">Configure institutional notification delivery, appearance themes, and academic lifecycles.</p>
            </div>

            <div className="mt-8 flex flex-col lg:flex-row gap-6">
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-56 shrink-0">
                    <nav className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto pb-1 lg:pb-0">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        isActive 
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/25" 
                                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? "opacity-100" : "opacity-60"}`} />
                                    <span className="whitespace-nowrap">{tab.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 min-w-0">
                    {activeTab === "notifications" && <NotificationTab />}
                    {activeTab === "appearance" && <AppearanceTab />}
                    {activeTab === "academic" && <AcademicCycleTab />}
                </div>
            </div>
        </div>
    );
}
