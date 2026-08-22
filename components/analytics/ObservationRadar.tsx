"use client";
import { useEffect, useState } from "react";
import { BarChart2 } from "lucide-react";

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
            <BarChart2 className="w-8 h-8 mb-2 opacity-40 text-blue-500" />
            <p className="text-xs font-semibold">No observation records available</p>
        </div>
    );

    return (
        <div className="space-y-4 py-1">
            {data.map((item) => {
                const percentage = Math.round((item.A / item.fullMark) * 100);
                return (
                    <div key={item.subject} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                            <span>{item.subject}</span>
                            <span className="font-bold" style={{ color: "var(--primary)" }}>{item.A} / {item.fullMark} ({percentage}%)</span>
                        </div>
                        <div className="h-2 rounded-full w-full overflow-hidden" style={{ backgroundColor: "var(--bg-border)" }}>
                            <div 
                                className="h-full rounded-full transition-all duration-1000 bg-blue-500 dark:bg-blue-400" 
                                style={{ width: `${percentage}%` }} 
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
