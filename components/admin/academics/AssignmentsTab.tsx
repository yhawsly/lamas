"use client";

import React, { useEffect, useState, useRef } from "react";
import {
    BookOpen,
    AlertCircle,
    CheckCircle,
    Search,
    User,
    UserCheck,
    UserPlus,
    UserMinus,
    BarChart,
    X,
    Plus,
    Layers,
    Filter,
    Sun,
    Moon,
    Check,
    ChevronDown,
    GraduationCap,
    Building,
    Edit3
} from "lucide-react";
import KPICard from "@/components/ui/KPICard";
import { useTerm } from "@/context/TermContext";

const AssignmentsSkeleton = () => (
    <div className="w-full space-y-8 animate-pulse">
        {/* Title skeleton */}
        <div className="space-y-2">
            <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700/80 rounded-lg" />
            <div className="h-4 w-[420px] bg-slate-200 dark:bg-slate-700/80 rounded" />
        </div>

        {/* KPI Cards Skeletons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700/80 rounded-2xl" />
            ))}
        </div>

        {/* Program Filter Skeletons */}
        <div className="flex gap-2 flex-wrap mb-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-9 w-28 bg-slate-200 dark:bg-slate-700/80 rounded-xl" />
            ))}
        </div>

        {/* List of Courses Skeletons */}
        <div className="space-y-6">
            {[1, 2, 3].map(i => (
                <div key={i} className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900 space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="space-y-2">
                            <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700/80 rounded" />
                            <div className="h-3.5 w-32 bg-slate-200 dark:bg-slate-700/80 rounded" />
                        </div>
                        <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700/80 rounded-xl" />
                    </div>
                    <div className="h-20 bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
                </div>
            ))}
        </div>
    </div>
);

const ALL_UNIVERSITY_CLASSES = [
    {
        group: "B.Tech Computer Science",
        options: [
            { name: "B.Tech Computer Science LVL 100 (Regular)", session: "REGULAR" as const },
            { name: "B.Tech Computer Science LVL 100 (Weekend)", session: "WEEKEND" as const },
            { name: "B.Tech Computer Science LVL 200 (Regular)", session: "REGULAR" as const },
            { name: "B.Tech Computer Science LVL 200 (Weekend)", session: "WEEKEND" as const },
            { name: "B.Tech Computer Science LVL 300 (Regular)", session: "REGULAR" as const },
            { name: "B.Tech Computer Science LVL 300 (Weekend)", session: "WEEKEND" as const },
            { name: "B.Tech Computer Science LVL 400 (Regular)", session: "REGULAR" as const },
            { name: "B.Tech Computer Science LVL 400 (Weekend)", session: "WEEKEND" as const },
        ]
    },
    {
        group: "B.Tech Information and Communication Tech (ICT)",
        options: [
            { name: "B.Tech ICT LVL 100 (Regular)", session: "REGULAR" as const },
            { name: "B.Tech ICT LVL 100 (Weekend)", session: "WEEKEND" as const },
            { name: "B.Tech ICT LVL 200 (Regular)", session: "REGULAR" as const },
            { name: "B.Tech ICT LVL 200 (Weekend)", session: "WEEKEND" as const },
            { name: "B.Tech ICT LVL 300 (Regular)", session: "REGULAR" as const },
            { name: "B.Tech ICT LVL 300 (Weekend)", session: "WEEKEND" as const },
            { name: "B.Tech ICT LVL 400 (Regular)", session: "REGULAR" as const },
            { name: "B.Tech ICT LVL 400 (Weekend)", session: "WEEKEND" as const },
        ]
    },
    {
        group: "HND Computer Science (LVL 100 - 300)",
        options: [
            { name: "HND Computer Science LVL 100 (Regular)", session: "REGULAR" as const },
            { name: "HND Computer Science LVL 100 (Weekend)", session: "WEEKEND" as const },
            { name: "HND Computer Science LVL 200 (Regular)", session: "REGULAR" as const },
            { name: "HND Computer Science LVL 200 (Weekend)", session: "WEEKEND" as const },
            { name: "HND Computer Science LVL 300 (Regular)", session: "REGULAR" as const },
            { name: "HND Computer Science LVL 300 (Weekend)", session: "WEEKEND" as const },
        ]
    },
    {
        group: "HND Information & Communication Tech (ICT)",
        options: [
            { name: "HND ICT LVL 100 (Regular)", session: "REGULAR" as const },
            { name: "HND ICT LVL 100 (Weekend)", session: "WEEKEND" as const },
            { name: "HND ICT LVL 200 (Regular)", session: "REGULAR" as const },
            { name: "HND ICT LVL 200 (Weekend)", session: "WEEKEND" as const },
            { name: "HND ICT LVL 300 (Regular)", session: "REGULAR" as const },
            { name: "HND ICT LVL 300 (Weekend)", session: "WEEKEND" as const },
        ]
    },
    {
        group: "B.Tech Top-Up (Weekend ONLY, LVL 300 - 400)",
        options: [
            { name: "B.Tech Computer Science Top-Up LVL 300 (Weekend)", session: "WEEKEND" as const },
            { name: "B.Tech Computer Science Top-Up LVL 400 (Weekend)", session: "WEEKEND" as const },
            { name: "B.Tech ICT Top-Up LVL 300 (Weekend)", session: "WEEKEND" as const },
            { name: "B.Tech ICT Top-Up LVL 400 (Weekend)", session: "WEEKEND" as const },
        ]
    }
];

interface CohortPresetSelectorProps {
    value: string;
    onChange: (presetName: string, session: "REGULAR" | "WEEKEND") => void;
    onSelectCustom: () => void;
}

function CohortPresetSelector({ value, onChange, onSelectCustom }: CohortPresetSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [sessionFilter, setSessionFilter] = useState<"ALL" | "REGULAR" | "WEEKEND">("ALL");
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredGroups = ALL_UNIVERSITY_CLASSES.map(grp => {
        const matchingOptions = grp.options.filter(opt => {
            const matchesSearch = !search.trim() || 
                opt.name.toLowerCase().includes(search.toLowerCase()) || 
                grp.group.toLowerCase().includes(search.toLowerCase());
            const matchesSession = sessionFilter === "ALL" || opt.session === sessionFilter;
            return matchesSearch && matchesSession;
        });
        return {
            group: grp.group,
            options: matchingOptions
        };
    }).filter(grp => grp.options.length > 0);

    const isCustom = value === "CUSTOM";
    const selectedSession = value.toLowerCase().includes("weekend") ? "WEEKEND" : "REGULAR";

    return (
        <div ref={containerRef} className="relative">
            {/* Trigger Button */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-xs ${
                    isOpen
                        ? "border-blue-500 ring-4 ring-blue-500/10 bg-white dark:bg-slate-900 shadow-md"
                        : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm"
                }`}
            >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`p-2 rounded-xl shrink-0 ${value ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-600/30" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
                        <GraduationCap className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className={`text-xs font-black truncate ${value ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>
                            {isCustom ? "Custom Class Cohort" : (value || "-- Choose standard cohort preset --")}
                        </div>
                        {value && !isCustom && (
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                                    selectedSession === "WEEKEND" 
                                        ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700" 
                                        : "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                                }`}>
                                    {selectedSession === "WEEKEND" ? "🌙 Weekend Session" : "☀️ Regular Session"}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    {value && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange("", "REGULAR");
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <div className={`p-1.5 rounded-lg text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-blue-600 dark:text-blue-400" : ""}`}>
                        <ChevronDown className="w-4 h-4" />
                    </div>
                </div>
            </div>

            {/* Floating Dropdown Popover */}
            {isOpen && (
                <div className="absolute z-[650] top-full left-0 right-0 mt-2 rounded-2xl border-2 border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-80">
                    {/* Search & Filter Header */}
                    <div className="p-3 border-b-2 border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 space-y-2 shrink-0">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search cohorts (e.g. CS 300, Top-Up, HND)..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-7 py-2 text-xs font-semibold rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>

                        {/* Session filter pills */}
                        <div className="flex items-center gap-1.5">
                            {[
                                { id: "ALL", label: "All Sessions", icon: Layers },
                                { id: "REGULAR", label: "Regular", icon: Sun },
                                { id: "WEEKEND", label: "Weekend", icon: Moon }
                            ].map(filter => {
                                const Icon = filter.icon;
                                return (
                                    <button
                                        key={filter.id}
                                        type="button"
                                        onClick={() => setSessionFilter(filter.id as any)}
                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all border flex items-center gap-1.5 ${
                                            sessionFilter === filter.id
                                                ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300"
                                        }`}
                                    >
                                        <Icon className="w-3 h-3" />
                                        <span>{filter.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="overflow-y-auto p-2 space-y-3 flex-1 scrollbar-thin">
                        {filteredGroups.length > 0 ? (
                            filteredGroups.map(grp => (
                                <div key={grp.group} className="space-y-1">
                                    <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                            <span>{grp.group}</span>
                                        </div>
                                        <span className="text-[9px] font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                                            {grp.options.length}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        {grp.options.map(opt => {
                                            const isSelected = value === opt.name;
                                            return (
                                                <button
                                                    key={opt.name}
                                                    type="button"
                                                    onClick={() => {
                                                        onChange(opt.name, opt.session);
                                                        setIsOpen(false);
                                                    }}
                                                    className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between gap-2 border ${
                                                        isSelected
                                                            ? "bg-blue-50 dark:bg-blue-950/50 border-blue-400 text-blue-900 dark:text-blue-200 font-extrabold shadow-xs"
                                                            : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                                                            opt.session === "WEEKEND"
                                                                ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                                                                : "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                                                        }`}>
                                                            {opt.session === "WEEKEND" ? (
                                                                <Moon className="w-3.5 h-3.5" />
                                                            ) : (
                                                                <Sun className="w-3.5 h-3.5" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="text-xs font-bold truncate text-slate-900 dark:text-slate-100">{opt.name}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border flex items-center gap-1 ${
                                                            opt.session === "WEEKEND"
                                                                ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                                                                : "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800"
                                                        }`}>
                                                            {opt.session === "WEEKEND" ? (
                                                                <>
                                                                    <Moon className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                                                                    <span>Weekend</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Sun className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                                                                    <span>Regular</span>
                                                                </>
                                                            )}
                                                        </span>
                                                        {isSelected && (
                                                            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                                                                <Check className="w-3 h-3 stroke-[3]" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center text-slate-400">
                                <GraduationCap className="w-6 h-6 mx-auto mb-1 opacity-50" />
                                <p className="text-xs font-bold">No matching cohorts found</p>
                            </div>
                        )}
                    </div>

                    {/* Custom Option Action */}
                    <div className="p-2 border-t-2 border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 shrink-0">
                        <button
                            type="button"
                            onClick={() => {
                                onSelectCustom();
                                setIsOpen(false);
                            }}
                            className={`w-full p-2.5 rounded-xl border-2 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                isCustom
                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                                    : "bg-white dark:bg-slate-800 border-dashed border-slate-300 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                            }`}
                        >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Enter Custom Cohort Name Below</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

interface FacultySelectorProps {
    lecturers: any[];
    selectedLecturerId: number | null;
    onChange: (lecturerId: number | null) => void;
}

function FacultySelector({ lecturers, selectedLecturerId, onChange }: FacultySelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedLecturer = lecturers.find(l => l.id === selectedLecturerId);

    const filteredLecturers = lecturers.filter(l => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return l.name.toLowerCase().includes(q) ||
            l.email.toLowerCase().includes(q) ||
            (l.department?.name || "").toLowerCase().includes(q);
    });

    return (
        <div ref={containerRef} className="relative">
            {/* Trigger Button */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-xs ${
                    isOpen
                        ? "border-blue-500 ring-4 ring-blue-500/10 bg-white dark:bg-slate-900 shadow-md"
                        : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm"
                }`}
            >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    {selectedLecturer ? (
                        <>
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm shadow-blue-600/30">
                                {selectedLecturer.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                                    {selectedLecturer.name}
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate">
                                    {selectedLecturer.department?.name?.replace('Department of ', '') || "Faculty"}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 shrink-0">
                                <User className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-xs font-black text-slate-400 truncate">
                                    -- Leave Unassigned (Assign Later) --
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    {selectedLecturerId && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(null);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <div className={`p-1.5 rounded-lg text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-blue-600 dark:text-blue-400" : ""}`}>
                        <ChevronDown className="w-4 h-4" />
                    </div>
                </div>
            </div>

            {/* Floating Dropdown Popover */}
            {isOpen && (
                <div className="absolute z-[650] top-full left-0 right-0 mt-2 rounded-2xl border-2 border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-72">
                    {/* Search Bar */}
                    <div className="p-3 border-b-2 border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 shrink-0">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search faculty by name or department..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-7 py-2 text-xs font-semibold rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Faculty Options List */}
                    <div className="overflow-y-auto p-2 space-y-1 flex-1 scrollbar-thin">
                        {/* Unassigned Option */}
                        <button
                            type="button"
                            onClick={() => {
                                onChange(null);
                                setIsOpen(false);
                            }}
                            className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between gap-2 border ${
                                selectedLecturerId === null
                                    ? "bg-blue-50 dark:bg-blue-950/50 border-blue-400 text-blue-900 dark:text-blue-200 font-extrabold shadow-xs"
                                    : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold"
                            }`}
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">
                                    <User className="w-4 h-4" />
                                </div>
                                <span className="text-xs">Unassigned (Assign Later)</span>
                            </div>
                            {selectedLecturerId === null && (
                                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                            )}
                        </button>

                        {filteredLecturers.length > 0 ? (
                            filteredLecturers.map(lecturer => {
                                const isSelected = selectedLecturerId === lecturer.id;
                                return (
                                    <button
                                        key={lecturer.id}
                                        type="button"
                                        onClick={() => {
                                            onChange(lecturer.id);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between gap-2 border ${
                                            isSelected
                                                ? "bg-blue-50 dark:bg-blue-950/50 border-blue-400 text-blue-900 dark:text-blue-200 font-extrabold shadow-xs"
                                                : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                                                {lecturer.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-xs font-bold truncate">{lecturer.name}</div>
                                                <div className="text-[10px] text-slate-400 font-medium truncate flex items-center gap-1 mt-0.5">
                                                    <Building className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                                    <span className="truncate">{lecturer.department?.name?.replace('Department of ', '') || "Faculty"}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                                                <Check className="w-3 h-3 stroke-[3]" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })
                        ) : (
                            <div className="py-6 text-center text-slate-400">
                                <p className="text-xs font-bold">No faculty found</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function isSectionMatchingProgram(sectionName: string, program: { name: string; code?: string }): boolean {
    const s = sectionName.toLowerCase();
    const pCode = (program.code || "").toUpperCase();
    const pName = program.name.toLowerCase();

    const isTopUpSection = s.includes("top-up") || s.includes("top up") || s.includes("topup");
    const isTopUpProgram = pCode.includes("TOPUP") || pCode.includes("TOP_UP") || pName.includes("top-up") || pName.includes("top up");

    if (isTopUpProgram) {
        if (!isTopUpSection) return false;
        if (pCode.includes("CS") || pName.includes("computer science")) {
            return (s.includes("computer science") || s.includes("cs")) && !s.includes("ict");
        }
        if (pCode.includes("ICT") || pName.includes("ict") || pName.includes("information")) {
            return s.includes("ict") || s.includes("information");
        }
        return true;
    } else if (isTopUpSection) {
        return false;
    }

    const isHNDSection = s.includes("hnd");
    const isHNDProgram = pCode.startsWith("HND") || pName.includes("hnd") || pName.includes("higher national diploma");

    if (isHNDProgram) {
        if (!isHNDSection) return false;
        if (pCode.includes("CS") || pName.includes("computer science")) {
            return (s.includes("computer science") || s.includes("cs")) && !s.includes("ict");
        }
        if (pCode.includes("ICT") || pName.includes("ict") || pName.includes("information")) {
            return s.includes("ict") || s.includes("information");
        }
        return true;
    } else if (isHNDSection) {
        return false;
    }

    const isBTechProgram = pCode.startsWith("BTECH") || pName.includes("b.tech") || pName.includes("btech");
    if (isBTechProgram) {
        if (pCode.includes("CS") || pName.includes("computer science")) {
            return (s.includes("computer science") || s.includes("cs")) && !s.includes("ict");
        }
        if (pCode.includes("ICT") || pName.includes("ict") || pName.includes("information")) {
            return s.includes("ict") || s.includes("information");
        }
        return s.includes("b.tech") || s.includes("btech");
    }

    return true;
}

function isSectionMatchingLevel(sectionName: string, levelStr: string): boolean {
    if (levelStr === "All") return true;
    const s = sectionName.toUpperCase();
    const l = levelStr.toUpperCase();
    return s.includes(`LVL ${l}`) || s.includes(`LEVEL ${l}`) || s.includes(` ${l} `) || s.endsWith(` ${l}`);
}

export default function AssignmentsTab() {
    const { selectedTermId, isArchiveMode } = useTerm();
    const [courses, setCourses] = useState<any[]>([]);
    const [lecturers, setLecturers] = useState<any[]>([]);
    const [allDbPrograms, setAllDbPrograms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [programFilter, setProgramFilter] = useState<number | "All">("All");
    const [levelFilter, setLevelFilter] = useState<string>("All");
    const [courseSearch, setCourseSearch] = useState<string>("");

    // Modals State
    const [assignStaffModal, setAssignStaffModal] = useState<{ isOpen: boolean; course: any; section: any } | null>(null);
    const [staffSearchQuery, setStaffSearchQuery] = useState("");
    const [staffDeptFilter, setStaffDeptFilter] = useState("ALL");
    const [isAssigning, setIsAssigning] = useState(false);

    const [addSectionModal, setAddSectionModal] = useState<{ isOpen: boolean; course: any } | null>(null);
    const [modalClassName, setModalClassName] = useState("");
    const [modalClassPreset, setModalClassPreset] = useState("");
    const [modalSession, setModalSession] = useState<"REGULAR" | "WEEKEND">("REGULAR");
    const [modalLecturerId, setModalLecturerId] = useState<number | null>(null);
    const [isCreatingSection, setIsCreatingSection] = useState(false);

    // Custom Alert Modal State
    const [customModal, setCustomModal] = useState<{ isOpen: boolean; type: "alert"; title: string; message: string } | null>(null);
    const showAlert = (title: string, message: string) => setCustomModal({ isOpen: true, type: "alert", title, message });

    const fetchData = () => {
        setLoading(true);
        const coursesUrl = selectedTermId ? `/api/courses?termId=${selectedTermId}` : "/api/courses";
        Promise.all([
            fetch(coursesUrl, { cache: "no-store" }).then(r => r.ok ? r.json() : []),
            fetch("/api/lecturers", { cache: "no-store" }).then(r => r.ok ? r.json() : []),
            fetch("/api/admin/curriculum", { cache: "no-store" }).then(r => r.ok ? r.json() : null)
        ]).then(([coursesData, lecturersData, curriculumData]) => {
            const safeCourses = Array.isArray(coursesData) ? coursesData : (coursesData?.data || coursesData?.courses || []);
            const safeLecturers = Array.isArray(lecturersData) ? lecturersData : (lecturersData?.data || lecturersData?.lecturers || []);
            const safePrograms = curriculumData?.programs || [];
            setCourses(safeCourses);
            setLecturers(safeLecturers);
            setAllDbPrograms(safePrograms);
            setLoading(false);
        }).catch((err) => {
            console.error("Failed to load assignments data:", err);
            setLoading(false);
        });
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTermId]);

    const handleAssignLecturer = async (courseId: number, sectionId: number, lecturerId: number | null) => {
        if (isArchiveMode) {
            showAlert("Action Disabled", "You are viewing a read-only historical archive.");
            return;
        }
        setIsAssigning(true);
        try {
            const res = await fetch("/api/courses/assignments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sectionId, lecturerId })
            });
            
            if (res.ok) {
                setCourses(prev => prev.map(c => {
                    if (c.id !== courseId) return c;
                    return {
                        ...c,
                        sections: (c.sections || []).map((s: any) => 
                            s.id === sectionId ? { ...s, lecturerId } : s
                        )
                    };
                }));
                setAssignStaffModal(null);
            } else {
                const data = await res.json().catch(() => ({}));
                showAlert("Error", data.error || "Failed to assign lecturer.");
            }
        } catch (err) {
            console.error("Staff assignment failed:", err);
            showAlert("Error", "An unexpected error occurred while assigning faculty.");
        } finally {
            setIsAssigning(false);
        }
    };

    const handleCreateSectionFromModal = async () => {
        if (isArchiveMode) {
            showAlert("Action Disabled", "You are viewing a read-only historical archive.");
            return;
        }
        if (!addSectionModal?.course) return;
        const nameToSave = modalClassName.trim() || modalClassPreset.trim();
        if (!nameToSave) {
            showAlert("Missing Section Name", "Please select a preset class cohort or enter a custom section name.");
            return;
        }

        setIsCreatingSection(true);
        try {
            const res = await fetch("/api/courses/sections", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    courseId: addSectionModal.course.id,
                    name: nameToSave,
                    session: modalSession,
                    termId: selectedTermId
                })
            });

            if (res.ok) {
                const createdSection = await res.json();
                
                // If initial lecturer was selected in modal, assign them too
                if (modalLecturerId && createdSection?.id) {
                    await fetch("/api/courses/assignments", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ sectionId: createdSection.id, lecturerId: modalLecturerId })
                    });
                    createdSection.lecturerId = modalLecturerId;
                }

                setCourses(prev => prev.map(c => {
                    if (c.id !== addSectionModal.course.id) return c;
                    return {
                        ...c,
                        sections: [...(c.sections || []), createdSection]
                    };
                }));

                setAddSectionModal(null);
                setModalClassName("");
                setModalClassPreset("");
                setModalSession("REGULAR");
                setModalLecturerId(null);
            } else {
                const data = await res.json().catch(() => ({}));
                showAlert("Error", data.error || "Failed to create section.");
            }
        } catch (err) {
            console.error("Failed to create section:", err);
            showAlert("Error", "An error occurred while creating the section.");
        } finally {
            setIsCreatingSection(false);
        }
    };

    if (loading) {
        return <AssignmentsSkeleton />;
    }

    const availablePrograms = allDbPrograms.length > 0
        ? allDbPrograms
        : Array.from(new Map(
            courses.flatMap(c => c.curriculumMaps?.map((m: any) => m.program) || [])
            .filter(p => p)
            .map(p => [p.id, p])
        ).values());

    const selectedProgram = programFilter !== "All"
        ? availablePrograms.find((p: any) => Number(p.id) === Number(programFilter))
        : null;

    const filterSections = (sectionsList: any[]) => {
        if (!sectionsList || sectionsList.length === 0) return [];
        return sectionsList.filter(section => {
            if (selectedProgram && !isSectionMatchingProgram(section.name, selectedProgram)) {
                return false;
            }
            if (levelFilter !== "All" && !isSectionMatchingLevel(section.name, levelFilter)) {
                return false;
            }
            return true;
        });
    };

    const allFilteredSections = courses.flatMap(c => filterSections(c.sections));
    const totalSectionsCount = allFilteredSections.length;
    const assignedSectionsCount = allFilteredSections.filter(s => s.lecturerId !== null).length;
    const unassignedSectionsCount = totalSectionsCount - assignedSectionsCount;
    const completionRate = totalSectionsCount > 0 ? Math.round((assignedSectionsCount / totalSectionsCount) * 100) : 0;

    const filteredCourses = courses.filter(c => {
        const matchesSearch = !courseSearch.trim() || 
            c.code.toLowerCase().includes(courseSearch.toLowerCase()) || 
            c.title.toLowerCase().includes(courseSearch.toLowerCase()) ||
            (c.domain || "").toLowerCase().includes(courseSearch.toLowerCase());

        if (!matchesSearch) return false;

        if (programFilter !== "All" || levelFilter !== "All") {
            const hasMatchingSection = filterSections(c.sections).length > 0;
            const hasMatchingCurriculum = c.curriculumMaps?.some((m: any) => {
                const pMatch = programFilter === "All" || Number(m.programId) === Number(programFilter);
                const lMatch = levelFilter === "All" || String(m.level) === String(levelFilter);
                return pMatch && lMatch;
            });
            return hasMatchingSection || hasMatchingCurriculum;
        }
        return true;
    });

    // Staff filtering for Assign Staff Modal
    const filteredLecturersForModal = lecturers.filter(l => {
        if (staffDeptFilter !== "ALL" && String(l.departmentId) !== staffDeptFilter) {
            return false;
        }
        if (staffSearchQuery.trim()) {
            const q = staffSearchQuery.toLowerCase();
            const nameMatch = l.name.toLowerCase().includes(q);
            const emailMatch = (l.email || "").toLowerCase().includes(q);
            const deptMatch = (l.department?.name || "").toLowerCase().includes(q);
            const specs = Array.isArray(l.specializations) ? l.specializations.join(" ") : (l.specializations || "");
            const specMatch = specs.toLowerCase().includes(q);
            return nameMatch || emailMatch || deptMatch || specMatch;
        }
        return true;
    });

    const uniqueDepartments = Array.from(
        new Map(lecturers.filter(l => l.department).map(l => [l.department.id, l.department])).values()
    );

    return (
        <div className="w-full space-y-8 animate-in fade-in duration-300 pb-16">
            {/* Header & KPI Metrics */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5" style={{ color: "var(--text-primary)" }}>
                            <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            Academic Teaching Allocations
                        </h2>
                        <p className="text-xs sm:text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                            Assign teaching faculty to course sections and configure academic class cohorts.
                        </p>
                    </div>
                </div>

                {/* KPI Cards Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard
                        label="Total Sections"
                        value={totalSectionsCount}
                        icon={<Layers className="w-5 h-5" />}
                        color="blue"
                    />
                    <KPICard
                        label="Assigned Staff"
                        value={assignedSectionsCount}
                        icon={<CheckCircle className="w-5 h-5" />}
                        color="emerald"
                    />
                    <KPICard
                        label="Unassigned"
                        value={unassignedSectionsCount}
                        icon={<AlertCircle className="w-5 h-5" />}
                        color="rose"
                    />
                    <KPICard
                        label="Staffing Progress"
                        value={`${completionRate}%`}
                        icon={<BarChart className="w-5 h-5" />}
                        color="amber"
                    />
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="p-4 sm:p-5 rounded-3xl border-2 shadow-sm space-y-4" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by course code, title, or domain (e.g. CS301, Database, Cloud)..."
                            value={courseSearch}
                            onChange={(e) => setCourseSearch(e.target.value)}
                            className="w-full pl-10 pr-8 py-2.5 rounded-2xl text-xs font-semibold border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 shadow-xs"
                            style={{ color: "var(--text-primary)" }}
                        />
                        {courseSearch && (
                            <button
                                type="button"
                                onClick={() => setCourseSearch("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Level Filter Pills */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-black text-slate-500 dark:text-slate-400 mr-1 hidden sm:inline">Level:</span>
                        {["All", "100", "200", "300", "400"].map(lvl => (
                            <button
                                key={lvl}
                                type="button"
                                onClick={() => setLevelFilter(lvl)}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all border-2 cursor-pointer ${
                                    levelFilter === lvl
                                        ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/25 scale-105"
                                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30"
                                }`}
                            >
                                {lvl === "All" ? "All Levels" : `LVL ${lvl}`}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Program Filter Pills */}
                {availablePrograms.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black text-slate-500 dark:text-slate-400 shrink-0 flex items-center gap-1.5 mr-1">
                            <Filter className="w-3.5 h-3.5 text-blue-500" /> Program:
                        </span>
                        <button
                            type="button"
                            onClick={() => setProgramFilter("All")}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all border-2 cursor-pointer ${
                                programFilter === "All"
                                    ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/25 scale-105"
                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30"
                            }`}
                        >
                            All Programs
                        </button>
                        {availablePrograms.map((p: any) => {
                            const isSelected = Number(programFilter) === Number(p.id);
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => setProgramFilter(p.id)}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all border-2 cursor-pointer flex items-center gap-1.5 ${
                                        isSelected
                                            ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/25 scale-105"
                                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30"
                                    }`}
                                >
                                    <GraduationCap className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-blue-600 dark:text-blue-400"}`} />
                                    <span>{p.name}</span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Courses & Sections List */}
            <div className="space-y-6">
                {filteredCourses.length > 0 ? (
                    filteredCourses.map((course: any) => {
                        const displayedSections = filterSections(course.sections || []);
                        const unassignedCount = displayedSections.filter(s => s.lecturerId === null).length;

                        return (
                            <div
                                key={course.id}
                                className="rounded-3xl border shadow-sm transition-all hover:shadow-md overflow-hidden"
                                style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}
                            >
                                {/* Course Header */}
                                <div className="p-5 sm:p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ borderColor: "var(--bg-border)", backgroundColor: "var(--bg-surface-elevated, var(--bg-hover))" }}>
                                    <div className="flex items-start sm:items-center gap-3.5">
                                        <div className="px-3 py-1.5 rounded-2xl bg-blue-600 text-white font-black text-xs shrink-0 shadow-sm shadow-blue-600/30">
                                            {course.code}
                                        </div>
                                        <div>
                                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                                                <span>{course.title}</span>
                                                {course.domain && (
                                                    <span className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[10px] font-bold border border-blue-200 dark:border-blue-800">
                                                        {course.domain}
                                                    </span>
                                                )}
                                            </h3>
                                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
                                                <span>{course.credits ?? 3} Credits</span>
                                                <span>•</span>
                                                <span>Level {course.code.match(/\d+/)?.[0]?.charAt(0) || "3"}00</span>
                                                <span>•</span>
                                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                    {displayedSections.length} {displayedSections.length === 1 ? "Section" : "Sections"}
                                                </span>
                                                {unassignedCount > 0 && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                                                            <AlertCircle className="w-3 h-3" />
                                                            {unassignedCount} unassigned
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 self-end sm:self-center">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setAddSectionModal({ isOpen: true, course });
                                                setModalClassName("");
                                                setModalClassPreset("");
                                                setModalSession("REGULAR");
                                                setModalLecturerId(null);
                                            }}
                                            disabled={isArchiveMode}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl border-2 border-blue-500/40 dark:border-blue-400/40 bg-blue-50/90 dark:bg-blue-950/50 hover:bg-blue-600 hover:text-white hover:border-blue-600 text-blue-700 dark:text-blue-300 text-xs font-black transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50 active:scale-95"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span>Add Section</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Sections Body */}
                                <div className="p-5 sm:p-6 space-y-3">
                                    {displayedSections.length > 0 ? (
                                        displayedSections.map((section: any) => {
                                            const currentLecturer = lecturers.find(l => l.id === section.lecturerId);

                                            return (
                                                <div
                                                    key={section.id}
                                                    className="rounded-2xl border-2 p-4 transition-all hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                                    style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}
                                                >
                                                    {/* Section Info */}
                                                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                                        <div className={`w-2.5 h-10 rounded-full shrink-0 ${section.session === 'WEEKEND' ? 'bg-amber-500 shadow-sm shadow-amber-500/30' : 'bg-blue-600 shadow-sm shadow-blue-600/30'}`} />
                                                        <div className="min-w-0 flex-1">
                                                            <div className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                                                                {section.name}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                                                                    section.session === 'WEEKEND'
                                                                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                                                                        : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                                                                }`}>
                                                                    {section.session} Session
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Assigned Lecturer / Assign Staff Modal Trigger */}
                                                    <div className="flex items-center gap-2 sm:self-center shrink-0">
                                                        {currentLecturer ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => setAssignStaffModal({ isOpen: true, course, section })}
                                                                disabled={isArchiveMode}
                                                                className="group flex items-center gap-3 px-4 py-2 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all text-left cursor-pointer"
                                                            >
                                                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm shadow-blue-600/30">
                                                                    {currentLecturer.name.substring(0, 2).toUpperCase()}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate max-w-[150px]">
                                                                        {currentLecturer.name}
                                                                    </div>
                                                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate max-w-[150px]">
                                                                        {currentLecturer.department?.name?.replace('Department of ', '') || "Faculty"}
                                                                    </div>
                                                                </div>
                                                                <span className="text-[11px] font-black text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-xl bg-blue-50/90 dark:bg-blue-950/50 border-2 border-blue-500/40 dark:border-blue-400/40 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all ml-1">
                                                                    Change →
                                                                </span>
                                                            </button>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-2 border-amber-300 dark:border-amber-700/80 shadow-xs flex items-center gap-1.5">
                                                                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Unassigned
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setAssignStaffModal({ isOpen: true, course, section })}
                                                                    disabled={isArchiveMode}
                                                                    className="flex items-center gap-1.5 px-4 py-2 rounded-2xl border-2 border-blue-500/40 dark:border-blue-400/40 bg-blue-50/90 dark:bg-blue-950/50 hover:bg-blue-600 hover:text-white hover:border-blue-600 text-blue-700 dark:text-blue-300 text-xs font-black transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50 active:scale-95"
                                                                >
                                                                    <UserPlus className="w-4 h-4" />
                                                                    <span>Assign Staff</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs font-semibold text-slate-400">
                                            <BookOpen className="w-4 h-4 text-slate-400" />
                                            <span>No sections configured for this course yet. Click &quot;Add Section&quot; to create one.</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="p-16 text-center rounded-3xl border border-dashed flex flex-col items-center justify-center" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                        <BookOpen className="w-10 h-10 text-slate-400 mb-3 opacity-60" />
                        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Courses Found</h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm">
                            {courses.length === 0 ? "No courses registered in this term." : "No courses match your active search or filters."}
                        </p>
                    </div>
                )}
            </div>

            {/* ========================================================================= */}
            {/* 1. ASSIGN STAFF MODAL                                                     */}
            {/* ========================================================================= */}
            {assignStaffModal && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div
                        className="w-full max-w-2xl rounded-3xl shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
                        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}
                    >
                        {/* Modal Header */}
                        <div className="p-5 sm:p-6 border-b flex items-start justify-between gap-4" style={{ borderColor: "var(--bg-border)", backgroundColor: "var(--bg-surface-elevated, var(--bg-hover))" }}>
                            <div>
                                <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                    <UserCheck className="w-4 h-4" /> Faculty Teaching Assignment
                                </div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                                    {assignStaffModal.course.code} — {assignStaffModal.course.title}
                                </h3>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <span className="px-2.5 py-1 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                                        Section: {assignStaffModal.section.name}
                                    </span>
                                    <span className="px-2.5 py-1 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-black">
                                        {assignStaffModal.section.session}
                                    </span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setAssignStaffModal(null)}
                                className="p-2 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Search & Department Filter */}
                        <div className="p-5 border-b space-y-3" style={{ borderColor: "var(--bg-border)" }}>
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search staff by name, email, or domain expertise..."
                                    value={staffSearchQuery}
                                    onChange={(e) => setStaffSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-8 py-2.5 rounded-2xl text-xs font-semibold border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                                    style={{ color: "var(--text-primary)" }}
                                    autoFocus
                                />
                                {staffSearchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setStaffSearchQuery("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Department Filter Chips */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                                <button
                                    type="button"
                                    onClick={() => setStaffDeptFilter("ALL")}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 border-2 ${
                                        staffDeptFilter === "ALL"
                                            ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20"
                                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50"
                                    }`}
                                >
                                    All Departments ({lecturers.length})
                                </button>
                                {uniqueDepartments.map((dept: any) => (
                                    <button
                                        key={dept.id}
                                        type="button"
                                        onClick={() => setStaffDeptFilter(String(dept.id))}
                                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 border-2 ${
                                            staffDeptFilter === String(dept.id)
                                                ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20"
                                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50"
                                        }`}
                                    >
                                        {dept.name.replace('Department of ', '')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Staff Cards List (Scrollable) */}
                        <div className="p-5 overflow-y-auto space-y-3 flex-1">
                            {filteredLecturersForModal.length > 0 ? (
                                filteredLecturersForModal.map((lecturer: any) => {
                                    const isAssignedToThisSection = assignStaffModal.section.lecturerId === lecturer.id;
                                    const specs = Array.isArray(lecturer.specializations)
                                        ? lecturer.specializations
                                        : (typeof lecturer.specializations === "string" ? lecturer.specializations.split(",") : []);

                                    return (
                                        <div
                                            key={lecturer.id}
                                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                                isAssignedToThisSection
                                                    ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 shadow-md shadow-blue-500/10"
                                                    : "border-slate-200 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md"
                                            }`}
                                            style={{ backgroundColor: isAssignedToThisSection ? undefined : "var(--bg-surface-elevated, var(--bg-hover))" }}
                                        >
                                            <div className="flex items-center gap-3.5 min-w-0">
                                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md shadow-blue-600/30">
                                                    {lecturer.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                                                        <span>{lecturer.name}</span>
                                                        {isAssignedToThisSection && (
                                                            <span className="px-2.5 py-0.5 rounded-lg bg-blue-600 text-white text-[10px] font-black shadow-xs">
                                                                ✓ Currently Assigned
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap font-medium">
                                                        <span>{lecturer.email}</span>
                                                        <span>•</span>
                                                        <span className="font-bold text-slate-700 dark:text-slate-300">
                                                            {lecturer.department?.name || "General Faculty"}
                                                        </span>
                                                    </div>
                                                    {specs.length > 0 && (
                                                        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                                            {specs.slice(0, 3).map((spec: string, i: number) => (
                                                                <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                                    {spec.trim()}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                                {isAssignedToThisSection ? (
                                                    <button
                                                        type="button"
                                                        disabled={isAssigning}
                                                        onClick={() => handleAssignLecturer(assignStaffModal.course.id, assignStaffModal.section.id, null)}
                                                        className="px-4 py-2 rounded-xl text-xs font-black border-2 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 bg-rose-50/80 dark:bg-rose-950/50 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                                                    >
                                                        <UserMinus className="w-3.5 h-3.5" />
                                                        <span>Unassign Staff</span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        disabled={isAssigning}
                                                        onClick={() => handleAssignLecturer(assignStaffModal.course.id, assignStaffModal.section.id, lecturer.id)}
                                                        className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition flex items-center gap-1.5 shadow-md shadow-blue-500/25 border border-blue-400/40 cursor-pointer active:scale-95"
                                                    >
                                                        <UserCheck className="w-3.5 h-3.5" />
                                                        <span>Assign to Section</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="py-12 text-center text-slate-400">
                                    <User className="w-8 h-8 mx-auto mb-2 opacity-50 text-slate-400" />
                                    <p className="text-xs font-bold">No faculty members found matching your search.</p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "var(--bg-border)", backgroundColor: "var(--bg-surface-elevated, var(--bg-hover))" }}>
                            <div className="text-xs font-bold text-slate-500">
                                {filteredLecturersForModal.length} faculty available
                            </div>
                            <button
                                type="button"
                                onClick={() => setAssignStaffModal(null)}
                                className="px-5 py-2 rounded-xl text-xs font-black border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* 2. ADD SECTION / SESSION MODAL                                            */}
            {/* ========================================================================= */}
            {addSectionModal && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div
                        className="w-full max-w-xl rounded-3xl shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
                        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}
                    >
                        {/* Header */}
                        <div className="p-5 sm:p-6 border-b flex items-start justify-between gap-4" style={{ borderColor: "var(--bg-border)", backgroundColor: "var(--bg-surface-elevated, var(--bg-hover))" }}>
                            <div>
                                <div className="text-[11px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                    <Plus className="w-4 h-4" /> New Class Cohort
                                </div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                                    Add Section for {addSectionModal.course.code}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                                    {addSectionModal.course.title}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setAddSectionModal(null)}
                                className="p-2 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
                            {/* Session Type Picker */}
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                                    <Sun className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                    <span>1. Select Academic Session:</span>
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setModalSession("REGULAR")}
                                        className={`p-3.5 rounded-2xl border-2 transition-all text-left flex items-center gap-3 ${
                                            modalSession === "REGULAR"
                                                ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 shadow-md shadow-blue-500/10"
                                                : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                                        }`}
                                    >
                                        <div className={`p-2 rounded-xl ${modalSession === "REGULAR" ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                                            <Sun className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-black">Regular Session</div>
                                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">Daytime / Full-time</div>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setModalSession("WEEKEND")}
                                        className={`p-3.5 rounded-2xl border-2 transition-all text-left flex items-center gap-3 ${
                                            modalSession === "WEEKEND"
                                                ? "border-amber-600 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 shadow-md shadow-amber-500/10"
                                                : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                                        }`}
                                    >
                                        <div className={`p-2 rounded-xl ${modalSession === "WEEKEND" ? "bg-amber-500 text-white shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                                            <Moon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-black">Weekend Session</div>
                                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">Top-Up / Part-time</div>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Class Preset Dropdown */}
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                                    <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                    <span>2. Choose Standard Cohort Preset:</span>
                                </label>
                                <CohortPresetSelector
                                    value={modalClassPreset}
                                    onChange={(presetName, session) => {
                                        setModalClassPreset(presetName);
                                        setModalClassName(presetName);
                                        setModalSession(session);
                                    }}
                                    onSelectCustom={() => {
                                        setModalClassPreset("CUSTOM");
                                        setModalClassName("");
                                    }}
                                />
                            </div>

                            {/* Custom Section Name Input */}
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                                    <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                    <span>3. Section Display Name:</span>
                                </label>
                                <div className="relative">
                                    <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="e.g. B.Tech Computer Science LVL 300 (Regular)"
                                        value={modalClassName}
                                        onChange={(e) => setModalClassName(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3.5 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-xs"
                                    />
                                </div>
                            </div>

                            {/* Optional Initial Staff Assignment */}
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                                    <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                    <span>4. Assign Faculty (Optional):</span>
                                </label>
                                <FacultySelector
                                    lecturers={lecturers}
                                    selectedLecturerId={modalLecturerId}
                                    onChange={(lecturerId) => setModalLecturerId(lecturerId)}
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 sm:p-5 border-t flex items-center justify-end gap-3" style={{ borderColor: "var(--bg-border)", backgroundColor: "var(--bg-surface-elevated, var(--bg-hover))" }}>
                            <button
                                type="button"
                                onClick={() => setAddSectionModal(null)}
                                className="px-5 py-2.5 rounded-xl text-xs font-black border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600 transition flex items-center gap-1.5 cursor-pointer"
                            >
                                <X className="w-3.5 h-3.5" />
                                <span>Cancel</span>
                            </button>
                            <button
                                type="button"
                                disabled={isCreatingSection || (!modalClassName.trim() && !modalClassPreset.trim())}
                                onClick={handleCreateSectionFromModal}
                                className="px-6 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition flex items-center gap-2 shadow-md shadow-blue-600/30 border border-blue-400/40 disabled:opacity-50 cursor-pointer active:scale-95"
                            >
                                <Plus className="w-4 h-4" />
                                <span>{isCreatingSection ? "Creating Section..." : "Create Section"}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Alert Modal */}
            {customModal && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)", border: "1px solid var(--bg-border)" }}>
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-red-500/10 text-red-500">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <h2 className="text-lg font-bold mb-1.5" style={{ color: "var(--text-primary)" }}>{customModal.title}</h2>
                        <p className="text-xs mb-6 leading-relaxed" style={{ color: "var(--text-muted)" }}>{customModal.message}</p>
                        
                        <button
                            type="button"
                            onClick={() => setCustomModal(null)}
                            className="w-full py-2.5 rounded-xl text-xs font-bold transition text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
