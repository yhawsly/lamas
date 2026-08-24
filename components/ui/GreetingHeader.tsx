"use client";

import { useSession } from "next-auth/react";

interface GreetingHeaderProps {
    subtitle?: string;
    action?: React.ReactNode;
}

export default function GreetingHeader({ subtitle, action }: GreetingHeaderProps) {
    const { data: session } = useSession();

    const fullName = session?.user?.name || "";
    const nameTokens = fullName.trim().split(/\s+/);
    const titles = ["dr.", "dr", "prof.", "prof", "mr.", "mr", "ms.", "ms", "mrs.", "mrs"];
    let firstName = nameTokens[0] || "";
    if (firstName && titles.includes(firstName.toLowerCase()) && nameTokens.length > 1) {
        firstName = nameTokens[1];
    }

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                    {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
                </h1>
                {subtitle && (
                    <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                        {subtitle}
                    </p>
                )}
            </div>
            {action && (
                <div className="flex items-center gap-3">
                    {action}
                </div>
            )}
        </div>
    );
}
