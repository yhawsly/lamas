"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useEffect, useState } from "react";

export default function ObservationRadar() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/analytics/observations")
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
            <span className="text-3xl mb-2">🕸️</span>
            <p>No observation records available</p>
        </div>
    );

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid strokeOpacity={0.2} stroke="var(--text-secondary)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-primary)', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                    <Radar name="Average Rubric Score" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                    <Tooltip
                        contentStyle={{ borderRadius: '12px', border: '1px solid var(--bg-border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                        itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
