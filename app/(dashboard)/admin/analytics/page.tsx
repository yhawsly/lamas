"use client";
import { useState } from "react";
import AnalyticsTab from "@/components/admin/analytics/AnalyticsTab";
import AuditLogTab from "@/components/admin/analytics/AuditLogTab";

export default function AdminSystemInsightsPage() {
    const [activeTab, setActiveTab] = useState("analytics");

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Custom Tab Header */}
            <div className="pt-4">
                <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
                    System Insights
                </h1>
                <p className="mt-1 text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                    Institution-wide performance metrics, reporting portfolios, and compliance logs.
                </p>
                <div className="flex gap-4 border-b mb-6" style={{ borderColor: "var(--bg-border)" }}>
                    {[
                        { id: "analytics", label: "Live Analytics" },
                        { id: "audit", label: "Audit Log" }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors -mb-[2px] ${
                                activeTab === tab.id
                                    ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500"
                                    : "border-transparent hover:text-blue-500"
                            }`}
                            style={activeTab !== tab.id ? { color: "var(--text-muted)" } : {}}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Premium Header Displayed only for Analytics */}
            {activeTab === "analytics" && (
                <div className="relative mb-8 p-5 sm:p-6 lg:p-8 rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 border border-white/10 shadow-2xl shadow-indigo-500/20">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl mix-blend-screen pointer-events-none" />
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl mix-blend-screen pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-4">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                Live Analytics
                            </div>
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200 tracking-tight">
                                Performance Insights
                            </h1>
                            <p className="mt-2 text-blue-300/80 max-w-xl text-sm sm:text-base lg:text-lg font-light">
                                Deep dive into academic compliance trends, departmental heatmaps, and predictive risk factors across the institution.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab Content */}
            <div className="mt-2">
                {activeTab === "analytics" && <AnalyticsTab />}
                {activeTab === "audit" && <AuditLogTab />}
            </div>
        </div>
    );
}
