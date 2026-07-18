"use client";
import { useState } from "react";
import AllUsersTab from "@/components/admin/users/AllUsersTab";
import LecturerComplianceTab from "@/components/admin/users/LecturerComplianceTab";
import DepartmentsTab from "@/components/admin/users/DepartmentsTab";

export default function AdminUsersPage() {
    const [activeTab, setActiveTab] = useState("All Users");

    // The TabsNav expects standard links, but to make it an SPA, we will override the behavior
    // by intercepting clicks on the tab links. But TabsNav might not support onClick.
    // Let's create a local custom tab nav that looks exactly the same, or we can use TabsNav
    // if we modify it, but since we don't want to break other pages, let's just build it inline here
    // or modify TabsNav to support `onClick`. Actually, wait. I can just build the tab nav inline
    // to match the exact styling of TabsNav.

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>User Management</h1>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Manage users, roles, view lecturer compliance, and organize departments.</p>
            </div>

            <div className="flex gap-2 border-b" style={{ borderColor: "var(--bg-border)" }}>
                {["All Users", "Lecturer Compliance", "Departments"].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className="px-5 py-3 text-sm font-bold transition-all relative"
                        style={{
                            color: activeTab === tab ? "var(--primary)" : "var(--text-secondary)",
                        }}
                    >
                        {tab}
                        {activeTab === tab && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 rounded-t-full" style={{ backgroundColor: "var(--primary)" }} />
                        )}
                    </button>
                ))}
            </div>

            <div className="mt-6">
                {activeTab === "All Users" && <AllUsersTab />}
                {activeTab === "Lecturer Compliance" && <LecturerComplianceTab />}
                {activeTab === "Departments" && <DepartmentsTab />}
            </div>
        </div>
    );
}
