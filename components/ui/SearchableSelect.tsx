"use client";

import { useState, useRef, useEffect } from "react";

interface Option {
    label: string;
    value: string | number;
}

interface SearchableSelectProps {
    options: Option[];
    value: string | number;
    onChange: (value: string | number) => void;
    placeholder?: string;
    className?: string;
    disabledValues?: (string | number)[];
    searchable?: boolean;
    disabled?: boolean;
}

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Select...",
    className = "",
    disabledValues = [],
    searchable = true,
    disabled = false
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    );

    const selectedOption = options.find(opt => String(opt.value) === String(value));

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            {/* Toggle Button */}
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between transition-all duration-200 border gap-2 shadow-sm ${
                    disabled
                        ? "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800"
                        : isOpen
                            ? "bg-white dark:bg-slate-900 border-indigo-500 ring-2 ring-indigo-500/20 cursor-pointer shadow-md"
                            : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:border-indigo-500/70 dark:hover:border-indigo-400/70 hover:shadow cursor-pointer"
                }`}
                style={{
                    color: selectedOption ? "var(--text-primary)" : "var(--text-muted)",
                }}
            >
                <span className="whitespace-normal break-words text-left flex-1 truncate font-bold">{selectedOption ? selectedOption.label : placeholder}</span>
                <div className={`p-1 rounded-lg transition-colors ${isOpen ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`}>
                    <svg className={`w-3.5 h-3.5 transition-transform duration-200 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    className="absolute z-[999] w-full mt-2 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-200"
                    style={{
                        boxShadow: "0 20px 60px -10px rgba(0, 0, 0, 0.3), 0 8px 20px -6px rgba(0, 0, 0, 0.2)",
                    }}
                >
                    {searchable && (
                        <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Search..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl focus:outline-none border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>
                        </div>
                    )}
                    <div className="max-h-60 overflow-y-auto p-1 space-y-0.5">
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-4 text-center text-sm" style={{ color: "var(--text-muted)" }}>No results found</div>
                        ) : (
                            filteredOptions.map((opt) => {
                                const isSelected = String(opt.value) === String(value);
                                const isDisabled = disabledValues.some(v => String(v) === String(opt.value));

                                return (
                                    <div
                                        key={opt.value}
                                        onClick={() => {
                                            if (isDisabled) return;
                                            onChange(opt.value);
                                            setIsOpen(false);
                                            setSearch("");
                                        }}
                                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                                        style={{ color: isSelected ? "var(--primary)" : "var(--text-primary)", fontWeight: isSelected ? "600" : "400" }}
                                        onMouseEnter={e => { if (!isDisabled && !isSelected) e.currentTarget.style.backgroundColor = "var(--bg-surface)" }}
                                        onMouseLeave={e => { if (!isDisabled) e.currentTarget.style.backgroundColor = isSelected ? "rgba(99, 102, 241, 0.12)" : "transparent" }}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="whitespace-normal break-words text-left flex-1">{opt.label}</span>
                                            {isSelected && (
                                                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                            {isDisabled && !isSelected && (
                                                <svg className="w-4 h-4 flex-shrink-0 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
