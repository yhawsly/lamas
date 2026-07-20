"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import AuditLogTab from "@/components/admin/analytics/AuditLogTab";

const AnalyticsSkeleton = () => (
    <div className="space-y-8 animate-pulse">
        {/* Row 1: Two charts side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl p-6 h-96 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/60">
                <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded mb-6" />
                <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            </div>
            <div className="rounded-2xl p-6 h-96 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/60">
                <div className="h-6 w-52 bg-slate-200 dark:bg-slate-800 rounded mb-6" />
                <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            </div>
        </div>

        {/* Row 2: Heatmap and Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl p-6 h-80 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/60">
                <div className="h-6 w-36 bg-slate-200 dark:bg-slate-800 rounded mb-6" />
                <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            </div>
            <div className="rounded-2xl p-6 h-80 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/60">
                <div className="h-6 w-44 bg-slate-200 dark:bg-slate-800 rounded mb-6" />
                <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            </div>
        </div>
    </div>
);

const AnalyticsTab = dynamic(() => import("@/components/admin/analytics/AnalyticsTab"), {
    ssr: false,
    loading: () => <AnalyticsSkeleton />
});

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


            {/* Tab Content */}
            <div className="mt-2">
                {activeTab === "analytics" && <AnalyticsTab />}
                {activeTab === "audit" && <AuditLogTab />}
            </div>
        </div>
    );
}
