"use client";
import { useState } from "react";
import CourseDirectoryTab from "@/components/admin/academics/CourseDirectoryTab";
import AssignmentsTab from "@/components/admin/academics/AssignmentsTab";
import AcademicTermsTab from "@/components/admin/academics/AcademicTermsTab";

export default function AdminAcademicsPage() {
    const [activeTab, setActiveTab] = useState("courses");

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Custom Tab Header */}
            <div className="pt-4">
                <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
                    Academics & Curriculum
                </h1>
                <p className="mt-1 text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                    Manage programs, courses, and course assignments without leaving the page.
                </p>
                <div className="flex gap-4 border-b mb-6" style={{ borderColor: "var(--bg-border)" }}>
                    {[
                        { id: "courses", label: "Course Directory" },
                        { id: "assignments", label: "Assignments" },
                        { id: "terms", label: "Academic Terms" }
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
                {activeTab === "courses" && <CourseDirectoryTab />}
                {activeTab === "assignments" && <AssignmentsTab />}
                {activeTab === "terms" && <AcademicTermsTab />}
            </div>
        </div>
    );
}
