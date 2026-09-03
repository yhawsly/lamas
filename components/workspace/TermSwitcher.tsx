"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTerm } from "@/context/TermContext";
import {
    Calendar,
    Lock,
    ChevronDown,
    Check,
    Archive,
    Sparkles,
    Search,
    RefreshCw,
    ShieldAlert,
} from "lucide-react";

export default function TermSwitcher() {
    const {
        activeTerm,
        allTerms,
        selectedTerm,
        selectedTermId,
        isArchiveMode,
        setSelectedTermId,
        isLoading,
    } = useTerm();

    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (isLoading && !selectedTerm) {
        return (
            <div className="h-9 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center gap-2 border border-slate-200 dark:border-slate-700">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                <div className="h-3 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
        );
    }

    // Strictly 1 single live active semester
    const liveTerm = activeTerm || allTerms.find((t) => t.isActive) || (allTerms.length > 0 ? allTerms[0] : null);
    
    // All other terms are strictly archived (read-only snapshots)
    const archiveTerms = allTerms.filter((t) => t.id !== liveTerm?.id);

    const filteredArchive = archiveTerms.filter((t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (dateInput: string | Date) => {
        if (!dateInput) return "";
        const d = new Date(dateInput);
        return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    };

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border backdrop-blur-md shadow-sm hover:shadow ${
                    isArchiveMode
                        ? "bg-amber-500/10 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                        : "bg-emerald-500/10 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                }`}
                title={
                    isArchiveMode
                        ? `Viewing Read-Only Archive: ${selectedTerm?.name} (Commenced: ${formatDate(selectedTerm?.startDate || "")})`
                        : `Viewing Active Workspace: ${selectedTerm?.name} (Commenced: ${formatDate(selectedTerm?.startDate || "")})`
                }
            >
                {/* Indicator Icon */}
                {isArchiveMode ? (
                    <span className="flex items-center gap-1 bg-amber-500/20 text-amber-600 dark:text-amber-400 p-1 rounded-md">
                        <Lock className="w-3.5 h-3.5" />
                    </span>
                ) : (
                    <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                )}

                {/* Term Name Label & Date of Commencement */}
                <div className="flex flex-col text-left max-w-[190px] sm:max-w-[270px] truncate">
                    <div className="flex items-center gap-1.5 truncate">
                        <span className="text-[10px] uppercase tracking-wider font-extrabold opacity-70">
                            {isArchiveMode ? "ARCHIVE:" : "ACTIVE:"}
                        </span>
                        <span className="truncate font-bold">{selectedTerm?.name || liveTerm?.name || "Select Workspace"}</span>
                    </div>
                    {(selectedTerm?.startDate || liveTerm?.startDate) && (
                        <div className="text-[10px] opacity-90 truncate font-semibold flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                            <span>Commenced: {formatDate((selectedTerm?.startDate || liveTerm?.startDate)!)}</span>
                        </div>
                    )}
                </div>

                <ChevronDown
                    className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                    }`}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-2xl z-50 overflow-hidden transform transition-all duration-200 animate-in fade-in zoom-in-95">
                    {/* Header */}
                    <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                Term Workspaces
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                Switch workspace context or review past archives
                            </p>
                        </div>
                    </div>

                    {/* Content Scroll Area */}
                    <div className="max-h-[360px] overflow-y-auto p-2 space-y-3">
                        {/* Live Workspace Section (Strictly 1 Live Term) */}
                        <div>
                            <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> ACTIVE
                            </div>
                            <div className="mt-1 space-y-1">
                                {!liveTerm ? (
                                    <div className="p-2 text-xs text-slate-400 italic">No active term configured</div>
                                ) : (
                                    (() => {
                                        const isSelected = selectedTermId === liveTerm.id || (!selectedTermId && !isArchiveMode);
                                        return (
                                            <button
                                                key={liveTerm.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedTermId(liveTerm.id);
                                                    setIsOpen(false);
                                                }}
                                                className={`w-full text-left p-2.5 rounded-xl transition-all duration-150 flex items-center justify-between border ${
                                                    isSelected
                                                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-100 shadow-sm"
                                                        : "bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                    </span>
                                                    <div>
                                                        <div className="text-xs font-bold flex items-center gap-1.5">
                                                            {liveTerm.name}
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold">
                                                                Active
                                                            </span>
                                                        </div>
                                                        <div className="text-[10px] text-slate-600 dark:text-slate-300 mt-1 flex flex-col gap-0.5">
                                                            <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                                                <Calendar className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                                <span>Date of Commencement: {formatDate(liveTerm.startDate)}</span>
                                                            </span>
                                                            <span className="text-slate-400 dark:text-slate-500 pl-4">
                                                                Semester Conclusion: {formatDate(liveTerm.endDate)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                                            </button>
                                        );
                                    })()
                                )}
                            </div>
                        </div>

                        {/* Archives Section */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                    <Archive className="w-3 h-3" /> Archived Snapshots (Read-Only)
                                </span>
                                <span className="text-[10px] text-slate-400 font-normal">
                                    {archiveTerms.length} past
                                </span>
                            </div>

                            {/* Search filter if more than 3 terms */}
                            {archiveTerms.length > 3 && (
                                <div className="mt-1 px-2">
                                    <div className="relative">
                                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search past terms..."
                                            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="mt-1 space-y-1">
                                {archiveTerms.length === 0 ? (
                                    <div className="p-2.5 text-xs text-slate-400 italic text-center">
                                        No archived terms available
                                    </div>
                                ) : filteredArchive.length === 0 ? (
                                    <div className="p-2 text-xs text-slate-400 italic text-center">
                                        No matching archives found
                                    </div>
                                ) : (
                                    filteredArchive.map((term) => {
                                        const isSelected = selectedTermId === term.id;
                                        return (
                                            <button
                                                key={term.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedTermId(term.id);
                                                    setIsOpen(false);
                                                }}
                                                className={`w-full text-left p-2.5 rounded-xl transition-all duration-150 flex items-center justify-between border ${
                                                    isSelected
                                                        ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-100 shadow-sm"
                                                        : "bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                                    <div>
                                                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                            {term.name}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex flex-col gap-0.5">
                                                            <span>
                                                                Commenced: {formatDate(term.startDate)}
                                                            </span>
                                                            <span>
                                                                Concluded: {formatDate(term.endDate)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {isSelected && <Check className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer helper */}
                    <div className="px-4 py-2 bg-slate-50/90 dark:bg-slate-800/80 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3 text-amber-500" /> Archive mode disables edits
                        </span>
                        {isArchiveMode && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (activeTerm) setSelectedTermId(activeTerm.id);
                                    setIsOpen(false);
                                }}
                                className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                            >
                                <RefreshCw className="w-3 h-3" /> Active Mode
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
