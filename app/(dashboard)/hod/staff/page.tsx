"use client";
import { useState } from "react";
import MyLecturersTab from "@/components/hod/reviews/MyLecturersTab";
import ObservationsTab from "@/components/hod/reviews/ObservationsTab";
import ReviewCenterTab from "@/components/hod/reviews/ReviewCenterTab";

export default function HODStaffManagementPage() {
    const [activeTab, setActiveTab] = useState("lecturers");

    return (
        <div suppressHydrationWarning className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Custom Tab Header */}
            <div className="pt-4">
                <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
                    Staff Management
                </h1>
                <p className="mt-1 text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                    Oversee department compliance, classroom observations, and curriculum submissions.
                </p>
                <div className="flex gap-4 border-b mb-6 overflow-x-auto no-scrollbar" style={{ borderColor: "var(--bg-border)" }}>
                    {[
                        { id: "lecturers", label: "My Lecturers" },
                        { id: "observations", label: "Observations" },
                        { id: "reviews", label: "Review Center" }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap -mb-[2px] ${
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
                {activeTab === "lecturers" && <MyLecturersTab />}
                {activeTab === "observations" && <ObservationsTab />}
                {activeTab === "reviews" && <ReviewCenterTab />}
            </div>
        </div>
    );
}
