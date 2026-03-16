"use client";

import { useState } from "react";

export interface WeeklyTopic {
    week: number;
    title: string;
    description?: string;
    status: "PENDING" | "COMPLETED" | "IN_PROGRESS";
}

interface CalendarViewProps {
    topics: WeeklyTopic[];
    onTopicClick?: (topic: WeeklyTopic) => void;
    totalWeeks?: number;
}

const STATUS_CONFIG: Record<string, { label: string; dotColor: string; rowBg: string; rowBorder: string; textColor: string; pillBg: string }> = {
    COMPLETED: {
        label: "Delivered",
        dotColor: "#10b981",
        rowBg: "rgba(16, 185, 129, 0.06)",
        rowBorder: "rgba(16, 185, 129, 0.25)",
        textColor: "#10b981",
        pillBg: "rgba(16, 185, 129, 0.12)",
    },
    IN_PROGRESS: {
        label: "In Progress",
        dotColor: "#f59e0b",
        rowBg: "rgba(245, 158, 11, 0.06)",
        rowBorder: "rgba(245, 158, 11, 0.25)",
        textColor: "#f59e0b",
        pillBg: "rgba(245, 158, 11, 0.12)",
    },
    PENDING: {
        label: "Planned",
        dotColor: "#6366f1",
        rowBg: "rgba(99, 102, 241, 0.06)",
        rowBorder: "rgba(99, 102, 241, 0.25)",
        textColor: "#6366f1",
        pillBg: "rgba(99, 102, 241, 0.1)",
    },
};

export default function CalendarView({ topics, onTopicClick, totalWeeks = 18 }: CalendarViewProps) {
    // Group weeks into blocks of 6 for the visual layout
    const [groupBy] = useState(6);
    const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);

    // Group into rows
    const rows: number[][] = [];
    for (let i = 0; i < weeks.length; i += groupBy) {
        rows.push(weeks.slice(i, i + groupBy));
    }

    const stats = {
        total: totalWeeks,
        filled: topics.filter(t => t.title).length,
        completed: topics.filter(t => t.status === "COMPLETED").length,
        inProgress: topics.filter(t => t.status === "IN_PROGRESS").length,
    };

    return (
        <div className="space-y-6">
            {/* Summary strip */}
            <div className="flex flex-wrap gap-4 p-4 rounded-2xl border" style={{ backgroundColor: "var(--bg-hover)", borderColor: "var(--bg-border)" }}>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-400" />
                    <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                        {stats.filled}<span className="font-normal" style={{ color: "var(--text-muted)" }}>/{stats.total} planned</span>
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                        {stats.completed}<span className="font-normal" style={{ color: "var(--text-muted)" }}> delivered</span>
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                        {stats.inProgress}<span className="font-normal" style={{ color: "var(--text-muted)" }}> in progress</span>
                    </span>
                </div>
                {/* Progress bar */}
                <div className="ml-auto flex items-center gap-2">
                    <div className="w-32 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-border)" }}>
                        <div
                            className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                            style={{ width: `${(stats.filled / stats.total) * 100}%` }}
                        />
                    </div>
                    <span className="text-[11px] font-bold tabular-nums" style={{ color: "var(--text-muted)" }}>
                        {Math.round((stats.filled / stats.total) * 100)}%
                    </span>
                </div>
            </div>

            {/* Week rows grouped by 6 */}
            <div className="space-y-2">
                {rows.map((group, groupIndex) => (
                    <div key={groupIndex}>
                        {/* Block header */}
                        <div className="flex items-center gap-3 mb-2 px-1">
                            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                                Block {groupIndex + 1} — Weeks {group[0]}–{group[group.length - 1]}
                            </span>
                            <div className="flex-1 h-px" style={{ backgroundColor: "var(--bg-border)" }} />
                        </div>

                        {/* Cards grid for this block — fixed 6-col */}
                        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${group.length}, minmax(0, 1fr))` }}>
                            {group.map((weekNum) => {
                                const topic = topics.find(t => t.week === weekNum);
                                const cfg = topic?.title ? STATUS_CONFIG[topic.status] : null;

                                return (
                                    <div
                                        key={weekNum}
                                        onClick={() => topic?.title && onTopicClick?.(topic)}
                                        className={`rounded-xl border p-3 transition-all duration-200 min-h-[90px] flex flex-col ${topic?.title ? "cursor-pointer hover:scale-[1.02] hover:shadow-md" : ""}`}
                                        style={{
                                            backgroundColor: cfg ? cfg.rowBg : "var(--bg-hover)",
                                            borderColor: cfg ? cfg.rowBorder : "var(--bg-border)",
                                        }}
                                    >
                                        {/* Week number */}
                                        <div className="flex items-center justify-between mb-2">
                                            <span
                                                className="text-[9px] font-black uppercase tracking-widest"
                                                style={{ color: cfg ? cfg.textColor : "var(--text-muted)" }}
                                            >
                                                W{weekNum}
                                            </span>
                                            {cfg && (
                                                <div
                                                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: cfg.dotColor }}
                                                />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 flex flex-col justify-between">
                                            {topic?.title ? (
                                                <>
                                                    <p
                                                        className="text-[11px] font-semibold leading-snug line-clamp-2 flex-1"
                                                        style={{ color: "var(--text-primary)" }}
                                                    >
                                                        {topic.title}
                                                    </p>
                                                    {/* Status pill */}
                                                    <div className="mt-2">
                                                        <span
                                                            className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                                                            style={{ backgroundColor: cfg!.pillBg, color: cfg!.textColor }}
                                                        >
                                                            {cfg!.label}
                                                        </span>
                                                    </div>
                                                </>
                                            ) : (
                                                <p
                                                    className="text-[10px] italic"
                                                    style={{ color: "var(--text-muted)", opacity: 0.5 }}
                                                >
                                                    —
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
