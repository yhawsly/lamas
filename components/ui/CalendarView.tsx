import React from 'react';

export interface WeeklyTopic {
    week: number;
    title: string;
    description: string;
    status: string; // PENDING | IN_PROGRESS | COMPLETED
}

interface CalendarViewProps {
    topics: WeeklyTopic[];
    onTopicClick?: (topic: WeeklyTopic) => void;
}

const statusColors: Record<string, string> = {
    PENDING: "bg-slate-800/50 border-white/5 text-white/40",
    IN_PROGRESS: "bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]",
    COMPLETED: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
};

const statusIcons: Record<string, string> = {
    PENDING: "⏳",
    IN_PROGRESS: "🚀",
    COMPLETED: "✅",
};

export default function CalendarView({ topics, onTopicClick }: CalendarViewProps) {
    // Academic calendar is usually 18 weeks long
    const totalWeeks = 18;
    const calendarGrid = Array.from({ length: totalWeeks }, (_, i) => {
        const weekNum = i + 1;
        return topics.find(t => t.week === weekNum) || {
            week: weekNum,
            title: "No Topic Scheduled",
            description: "",
            status: "PENDING"
        };
    });

    return (
        <div className="w-full">
            <div className="mb-6 flex items-center justify-between">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <span className="text-blue-400">📅</span> Academic Calendar View
                </h3>
                <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span> <span className="text-white/50">Pending</span></div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> <span className="text-white/50">In Progress</span></div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> <span className="text-white/50">Completed</span></div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {calendarGrid.map((topic, index) => {
                    const isEmpty = topic.title === "No Topic Scheduled";

                    return (
                        <div
                            key={index}
                            onClick={() => !isEmpty && onTopicClick?.(topic as WeeklyTopic)}
                            className={`
                                relative p-4 rounded-2xl border transition-all duration-300
                                ${statusColors[topic.status]}
                                ${!isEmpty ? "hover:-translate-y-1 hover:border-white/20 cursor-pointer group" : "opacity-40"}
                            `}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ${!isEmpty ? 'bg-white/10 text-white/70' : 'bg-white/5 text-white/30'}`}>
                                    Week {topic.week}
                                </span>
                                {!isEmpty && (
                                    <span className="text-sm" title={topic.status.replace("_", " ")}>
                                        {statusIcons[topic.status]}
                                    </span>
                                )}
                            </div>

                            <h4 className={`font-semibold text-sm leading-tight mb-1.5 line-clamp-2 ${!isEmpty ? 'text-white group-hover:text-blue-300 transition-colors' : ''}`}>
                                {topic.title}
                            </h4>

                            {!isEmpty && topic.description && (
                                <p className="text-xs text-white/40 line-clamp-2 leading-relaxed">
                                    {topic.description}
                                </p>
                            )}

                            {isEmpty && (
                                <div className="h-4 w-1/2 bg-white/5 rounded mt-2"></div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
