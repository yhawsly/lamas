"use client";

export interface WeeklyTopic {
    week: number;
    title: string;
    description?: string;
    status: "PENDING" | "COMPLETED" | "IN_PROGRESS";
}

interface CalendarViewProps {
    topics: WeeklyTopic[];
    onTopicClick?: (topic: WeeklyTopic) => void;
}

export default function CalendarView({ topics, onTopicClick }: CalendarViewProps) {
    const statusColors: Record<string, string> = {
        COMPLETED: "bg-green-500/20 text-green-300 border-green-500/30",
        PENDING: "bg-blue-500/10 text-blue-300 border-blue-500/20",
        IN_PROGRESS: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 p-1">
            {Array.from({ length: 18 }, (_, i) => i + 1).map((weekNum) => {
                const topic = topics.find(t => t.week === weekNum);

                return (
                    <div
                        key={weekNum}
                        onClick={() => topic && onTopicClick?.(topic)}
                        className={`
                            relative h-40 rounded-2xl border p-4 transition-all cursor-pointer group
                            ${topic?.title ? statusColors[topic.status] : "bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10"}
                        `}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Week {weekNum}</span>
                            {topic?.title && (
                                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                            )}
                        </div>

                        {topic?.title ? (
                            <div className="space-y-1.5">
                                <div className="text-xs font-bold leading-snug line-clamp-2">
                                    {topic.title}
                                </div>
                                <div className="text-[10px] opacity-40 line-clamp-2 group-hover:line-clamp-none transition-all">
                                    {topic.description}
                                </div>
                            </div>
                        ) : (
                            <div className="text-[10px] italic opacity-20">No data planned</div>
                        )}

                        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
