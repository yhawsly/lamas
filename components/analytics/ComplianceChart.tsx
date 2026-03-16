"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useEffect, useState } from "react";

const COLORS: Record<string, string> = {
    APPROVED: "#10b981",
    SUBMITTED: "#3b82f6",
    PENDING: "#f59e0b",
    LATE: "#ef4444",
    REJECTED: "#f43f5e",
    DRAFT: "#64748b"
};

export default function ComplianceChart() {
    const [data, setData] = useState<{ name: string; value: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/analytics/compliance")
            .then(res => res.json())
            .then(d => {
                if (Array.isArray(d)) setData(d);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="h-64 flex items-center justify-center animate-pulse rounded-2xl" style={{ backgroundColor: "var(--bg-hover)" }} />;

    if (data.length === 0) return (
        <div className="h-64 flex flex-col items-center justify-center" style={{ color: "var(--text-muted)" }}>
            <span className="text-3xl mb-2">📊</span>
            <p>No compliance data available</p>
        </div>
    );

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[entry.name] || "#8884d8"} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ borderRadius: '12px', border: '1px solid var(--bg-border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                        itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: 'var(--text-primary)' }} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
