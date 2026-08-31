import React from "react";

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
    <div className="divide-y divide-slate-100 dark:divide-slate-800/60 animate-pulse">
        {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="p-4 sm:p-5">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                    <div className="col-span-1 sm:col-span-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                        <div className="space-y-2 flex-1">
                            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
                            <div className="h-3 w-44 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
                        </div>
                    </div>
                    <div className="col-span-1 sm:col-span-3">
                        <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
                    </div>
                    <div className="col-span-1 sm:col-span-3">
                        <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" />
                    </div>
                    <div className="col-span-1 sm:col-span-2 flex sm:justify-end gap-2">
                        <div className="h-7 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

export const CardGridSkeleton = ({ count = 4, cols = 4 }: { count?: number; cols?: number }) => (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${cols} gap-4 animate-pulse`}>
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
                    <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded-full" />
                </div>
                <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="h-3 w-28 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
            </div>
        ))}
    </div>
);

export const ChartSkeleton = ({ height = 260 }: { height?: number }) => (
    <div 
        className="w-full rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-5 flex flex-col justify-between animate-pulse"
        style={{ height }}
    >
        <div className="flex items-center justify-between">
            <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
        </div>
        <div className="flex items-end justify-between gap-3 h-36 px-4">
            {Array.from({ length: 6 }).map((_, i) => (
                <div 
                    key={i} 
                    className="w-full bg-slate-200 dark:bg-slate-800 rounded-t-lg"
                    style={{ height: `${25 + (i * 12) % 65}%` }}
                />
            ))}
        </div>
        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800/40 rounded-full" />
    </div>
);
