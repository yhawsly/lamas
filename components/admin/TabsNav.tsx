"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Tab {
    label: string;
    href: string;
}

export default function TabsNav({ title, description, tabs }: { title: string, description: string, tabs: Tab[] }) {
    const pathname = usePathname();

    return (
        <div className="mb-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{title}</h1>
                <p className="mt-1" style={{ color: "var(--text-muted)" }}>{description}</p>
            </div>

            <div className="flex gap-6 border-b" style={{ borderColor: "var(--bg-border)" }}>
                {tabs.map(tab => {
                    const isActive = pathname === tab.href;
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                                isActive 
                                    ? "border-blue-500 text-blue-500" 
                                    : "border-transparent hover:text-blue-400"
                            }`}
                            style={{ color: isActive ? "" : "var(--text-secondary)" }}
                        >
                            {tab.label}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
