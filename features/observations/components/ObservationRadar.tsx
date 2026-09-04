"use client";

import { useEffect, useState } from "react";
import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    ResponsiveContainer,
    Tooltip
} from "recharts";
import { Award, Compass } from "lucide-react";

interface RubricItem {
    subject: string;
    A: number;
    fullMark: number;
}

export default function ObservationRadar() {
    const [data, setData] = useState<RubricItem[]>([]);
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

    if (loading) {
        return (
            <div 
                className="h-72 w-full flex flex-col items-center justify-center animate-pulse rounded-2xl gap-3" 
                style={{ backgroundColor: "var(--bg-hover)" }}
            >
                <div className="w-36 h-36 rounded-full border-4 border-dashed border-emerald-500/20 animate-spin" style={{ animationDuration: "12s" }} />
                <p className="text-xs font-medium text-slate-400">Loading observation rubrics...</p>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="h-72 w-full flex flex-col items-center justify-center gap-2" style={{ color: "var(--text-muted)" }}>
                <Compass className="w-10 h-10 opacity-40 text-emerald-500" />
                <p className="text-xs font-semibold">No observation records available</p>
                <p className="text-[11px] text-center max-w-[240px] opacity-70">
                    Observation data will render as soon as peer reviews are logged.
                </p>
            </div>
        );
    }

    const overallAvg = data.length > 0
        ? (data.reduce((acc, curr) => acc + curr.A, 0) / data.length).toFixed(1)
        : "0.0";
    const overallPct = Math.round((Number(overallAvg) / 5) * 100);

    return (
        <div className="w-full flex flex-col items-center justify-center">
            <div className="w-full h-72 sm:h-80 -my-2">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="68%" data={data}>
                        <PolarGrid stroke="rgba(148, 163, 184, 0.28)" gridType="polygon" />
                        <PolarAngleAxis
                            dataKey="subject"
                            tick={{
                                fill: "var(--text-muted)",
                                fontSize: 11,
                                fontWeight: 600,
                            }}
                        />
                        <PolarRadiusAxis
                            angle={30}
                            domain={[0, 5]}
                            tick={false}
                            axisLine={false}
                        />
                        <Radar
                            name="Observation Score"
                            dataKey="A"
                            stroke="#10b981"
                            strokeWidth={2}
                            fill="#10b981"
                            fillOpacity={0.42}
                            dot={{
                                r: 4.5,
                                fill: "#86efac",
                                stroke: "#059669",
                                strokeWidth: 2,
                            }}
                            activeDot={{
                                r: 6,
                                fill: "#10b981",
                                stroke: "#ffffff",
                                strokeWidth: 2,
                            }}
                        />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const item = payload[0].payload as RubricItem;
                                    const pct = Math.round((item.A / item.fullMark) * 100);
                                    return (
                                        <div 
                                            className="px-3 py-2 rounded-xl text-xs shadow-xl border backdrop-blur-md"
                                            style={{
                                                backgroundColor: "var(--bg-surface)",
                                                borderColor: "var(--bg-border)",
                                                color: "var(--text-primary)"
                                            }}
                                        >
                                            <p className="font-bold text-slate-800 dark:text-slate-100 mb-0.5">{item.subject}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                    {item.A} / {item.fullMark}
                                                </span>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                                                    {pct}%
                                                </span>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            {/* Benchmark Footer pill */}
            <div 
                className="mt-1 flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}
            >
                <Award className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span style={{ color: "var(--text-muted)" }}>Benchmark Avg:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{overallAvg} / 5.0</span>
                <span className="text-[10px] opacity-70">({overallPct}%)</span>
            </div>
        </div>
    );
}
