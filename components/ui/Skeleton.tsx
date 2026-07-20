import React from "react";

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
    <div className="divide-y divide-slate-100 dark:divide-slate-800/60 animate-pulse">
        {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="p-4 sm:p-5">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                    <div className="col-span-1 sm:col-span-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                        <div className="space-y-2 flex-1">
                            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                            <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                        </div>
                    </div>
                    <div className="col-span-1 sm:col-span-3">
                        <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                    <div className="col-span-1 sm:col-span-3">
                        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                    <div className="col-span-1 sm:col-span-2 flex justify-end">
                        <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
                    </div>
                </div>
            </div>
        ))}
    </div>
);
