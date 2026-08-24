"use client";

import React, { useState, useEffect } from "react";
import {
    Calendar,
    Clock,
    Building2,
    Users,
    UserCheck,
    Plus,
    Trash2,
    Printer,
    Search,
    CheckCircle2,
    ShieldAlert,
    X,
    Download
} from "lucide-react";
import { useTerm } from "@/context/TermContext";

interface ExamHall {
    id: number;
    name: string;
    code?: string | null;
    capacity: number;
    location?: string | null;
}

interface InvigilationSlot {
    id: number;
    termId: number;
    courseCode: string;
    courseTitle?: string | null;
    examDate: string;
    timeSlot: string;
    sessionType: string;
    hallId: number;
    chiefInvigilatorId?: number | null;
    assistantInvigilatorIds: number[];
    targetClass?: string | null;
    studentCount?: number | null;
    notes?: string | null;
    hall: ExamHall;
    chiefInvigilator?: { id: number; name: string; email: string } | null;
    assistantInvigilators?: { id: number; name: string; email: string }[];
}

export default function InvigilationMatrixTab({
    courses,
    lecturers,
    onOpenHallsModal
}: {
    courses: any[];
    lecturers: any[];
    onOpenHallsModal: () => void;
}) {
    const { selectedTerm, selectedTermId, isArchiveMode } = useTerm();
    const [slots, setSlots] = useState<InvigilationSlot[]>([]);
    const [halls, setHalls] = useState<ExamHall[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateDrawer, setShowCreateDrawer] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [hallFilter, setHallFilter] = useState<string>("ALL");

    // Semester Date Boundary Restriction
    const termMinDate = selectedTerm?.startDate
        ? new Date(selectedTerm.startDate).toISOString().split("T")[0]
        : undefined;
    const termMaxDate = selectedTerm?.endDate
        ? new Date(selectedTerm.endDate).toISOString().split("T")[0]
        : undefined;
    const formattedTermRange = selectedTerm
        ? `${new Date(selectedTerm.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} – ${new Date(selectedTerm.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
        : "";

    // Form State
    const [formData, setFormData] = useState({
        courseCode: "",
        courseTitle: "",
        examDate: "",
        timeSlot: "09:00 - 12:00",
        startTime: "09:00",
        endTime: "12:00",
        sessionType: "MAIN",
        hallId: "",
        chiefInvigilatorId: "",
        assistantInvigilatorIds: [] as number[],
        targetClass: "",
        notes: ""
    });
    const [isSaving, setIsSaving] = useState(false);
    const [formError, setFormError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const termParam = selectedTermId ? `?termId=${selectedTermId}` : "";
            const [slotsRes, hallsRes] = await Promise.all([
                fetch(`/api/deo/invigilation${termParam}`),
                fetch("/api/deo/halls")
            ]);

            if (slotsRes.ok) {
                const d = await slotsRes.json();
                setSlots(d.data || []);
            }
            if (hallsRes.ok) {
                const d = await hallsRes.json();
                setHalls(Array.isArray(d) ? d : []);
            }
        } catch (e) {
            console.error("Failed to load invigilation data:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTermId]);

    // Extract classes/levels currently registered for the selected course
    const getAvailableClasses = (courseCode: string) => {
        if (!courseCode) return [];
        const course = courses.find(c => c.code === courseCode);
        const classes = new Set<string>();

        // 1. From Curriculum Maps (e.g. 100, 200, 300, 400 Level + Program name)
        if (course?.curriculumMaps && course.curriculumMaps.length > 0) {
            course.curriculumMaps.forEach((cm: any) => {
                const progName = cm.program?.name || cm.program?.code || "";
                if (progName) {
                    classes.add(`${cm.level} Level — ${progName}`);
                }
                classes.add(`${cm.level} Level (All Streams)`);
            });
        }

        // 2. From Course Sections (e.g. Section A, Regular, Weekend)
        if (course?.sections && course.sections.length > 0) {
            course.sections.forEach((sec: any) => {
                if (sec.name) {
                    classes.add(`${sec.name} (${sec.session || "REGULAR"})`);
                }
            });
        }

        // 3. Inferred Level from course code digits (e.g. CSC 301 -> 300 Level)
        const match = courseCode.match(/\d+/);
        if (match) {
            const num = parseInt(match[0]);
            if (num >= 100 && num < 1000) {
                const hundred = Math.floor(num / 100) * 100;
                classes.add(`${hundred} Level (Regular Stream)`);
                classes.add(`${hundred} Level (Weekend Stream)`);
                classes.add(`${hundred} Level (Combined)`);
            }
        }

        // Fallback standard levels
        if (classes.size === 0) {
            classes.add("100 Level");
            classes.add("200 Level");
            classes.add("300 Level");
            classes.add("400 Level");
        }

        return Array.from(classes);
    };

    // Auto populate course title and target class when courseCode changes
    const handleCourseSelect = (code: string) => {
        const c = courses.find(item => item.code === code);
        const classes = getAvailableClasses(code);
        const defaultClass = classes.length > 0 ? classes[0] : "";

        setFormData(p => ({
            ...p,
            courseCode: code,
            courseTitle: c ? c.title : "",
            targetClass: defaultClass
        }));
    };

    const handleToggleAssistant = (lecturerId: number) => {
        setFormData(p => {
            const exists = p.assistantInvigilatorIds.includes(lecturerId);
            if (exists) {
                return { ...p, assistantInvigilatorIds: p.assistantInvigilatorIds.filter(id => id !== lecturerId) };
            } else {
                return { ...p, assistantInvigilatorIds: [...p.assistantInvigilatorIds, lecturerId] };
            }
        });
    };

    const handleCreateSlot = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isArchiveMode) {
            setFormError("Action Disabled: You are viewing a read-only historical archive.");
            return;
        }
        if (!formData.courseCode || !formData.examDate || !formData.timeSlot || !formData.hallId) {
            setFormError("Please fill all required fields (Course, Date, Time Slot, and Hall).");
            return;
        }

        if (termMinDate && formData.examDate < termMinDate) {
            setFormError(`Exam Date cannot be earlier than semester start (${termMinDate}).`);
            return;
        }
        if (termMaxDate && formData.examDate > termMaxDate) {
            setFormError(`Exam Date cannot exceed semester conclusion (${termMaxDate}).`);
            return;
        }

        setIsSaving(true);
        setFormError("");

        try {
            const res = await fetch("/api/deo/invigilation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    termId: selectedTermId,
                    courseCode: formData.courseCode,
                    courseTitle: formData.courseTitle,
                    examDate: formData.examDate,
                    timeSlot: formData.timeSlot,
                    sessionType: formData.sessionType,
                    hallId: formData.hallId,
                    chiefInvigilatorId: formData.chiefInvigilatorId || null,
                    assistantInvigilatorIds: formData.assistantInvigilatorIds,
                    targetClass: formData.targetClass,
                    notes: formData.notes
                })
            });

            const data = await res.json();
            if (res.ok) {
                setSuccessMsg(`Exam session for ${data.courseCode} scheduled successfully! Invigilators have been notified.`);
                setTimeout(() => setSuccessMsg(""), 5000);
                setShowCreateDrawer(false);
                setFormData({
                    courseCode: "",
                    courseTitle: "",
                    examDate: "",
                    timeSlot: "09:00 - 12:00",
                    startTime: "09:00",
                    endTime: "12:00",
                    sessionType: "MAIN",
                    hallId: "",
                    chiefInvigilatorId: "",
                    assistantInvigilatorIds: [],
                    targetClass: "",
                    notes: ""
                });
                await fetchData();
            } else {
                setFormError(data.error || "Failed to schedule exam session.");
            }
        } catch {
            setFormError("Network error while creating invigilation slot.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteSlot = async (id: number, courseCode: string) => {
        if (isArchiveMode) {
            alert("Action Disabled: You are viewing a read-only historical archive.");
            return;
        }
        if (!confirm(`Are you sure you want to remove the exam session for ${courseCode}?`)) return;

        try {
            const res = await fetch(`/api/deo/invigilation/${id}`, { method: "DELETE" });
            if (res.ok) {
                setSlots(prev => prev.filter(s => s.id !== id));
            } else {
                const d = await res.json().catch(() => ({}));
                alert(d.error || "Failed to delete slot");
            }
        } catch {
            alert("Network error while deleting slot");
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const exportToExcel = () => {
        if (slots.length === 0) {
            alert("No schedule data available to export.");
            return;
        }

        const headers = [
            "Date", "Time Slot", "Course Code", "Course Title", "Target Class", "Hall/Venue", "Chief Invigilator", "Assistant Invigilators", "Notes"
        ];

        const rows = filteredSlots.map(s => {
            const dateStr = new Date(s.examDate).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
            const assistants = s.assistantInvigilators?.map(a => a.name).join("; ") || "None";
            return [
                `"${dateStr}"`, `"${s.timeSlot}"`, `"${s.courseCode}"`, `"${s.courseTitle || ""}"`,
                `"${s.targetClass || ""}"`, `"${s.hall.name}"`, `"${s.chiefInvigilator?.name || "Unassigned"}"`,
                `"${assistants}"`, `"${(s.notes || "").replace(/"/g, '""')}"`
            ].join(",");
        });

        const csvContent = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `LAMAS_Invigilation_Schedule.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Filter slots
    const filteredSlots = slots.filter(s => {
        const matchesSearch = s.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.courseTitle && s.courseTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (s.targetClass && s.targetClass.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (s.chiefInvigilator && s.chiefInvigilator.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            s.hall.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesHall = hallFilter === "ALL" || String(s.hallId) === hallFilter;
        return matchesSearch && matchesHall;
    });

    // Group by Date
    const groupedByDate: Record<string, InvigilationSlot[]> = {};
    filteredSlots.forEach(s => {
        const dateKey = new Date(s.examDate).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "short",
            day: "numeric"
        });
        if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
        groupedByDate[dateKey].push(s);
    });

    return (
        <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Filter by course, invigilator, or hall..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                        />
                    </div>
                    <select
                        value={hallFilter}
                        onChange={e => setHallFilter(e.target.value)}
                        aria-label="Filter by examination hall"
                        className="px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-700 dark:text-slate-300"
                    >
                        <option value="ALL">All Halls</option>
                        {halls.map(h => (
                            <option key={h.id} value={String(h.id)}>{h.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={onOpenHallsModal}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                    >
                        <Building2 className="w-4 h-4 text-emerald-500" />
                        Manage Halls ({halls.length})
                    </button>

                    <button
                        onClick={exportToExcel}
                        className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
                    >
                        <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Export Excel
                    </button>

                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
                    >
                        <Printer className="w-4 h-4 text-blue-500" />
                        Print Timetable
                    </button>

                    {!isArchiveMode && (
                        <button
                            onClick={() => setShowCreateDrawer(!showCreateDrawer)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5"
                        >
                            <Plus className="w-4 h-4" />
                            Schedule Exam Session
                        </button>
                    )}
                </div>
            </div>

            {/* Success Notification Banner */}
            {successMsg && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>{successMsg}</span>
                </div>
            )}

            {/* Collapsible Session Scheduling Form */}
            {showCreateDrawer && !isArchiveMode && (
                <form
                    onSubmit={handleCreateSlot}
                    className="p-6 rounded-3xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-5 animate-in slide-in-from-top-4 duration-300 shadow-lg shadow-emerald-900/5"
                >
                    <div className="flex items-center justify-between border-b border-emerald-200/60 dark:border-emerald-800/40 pb-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-emerald-600 text-white rounded-lg">
                                <Calendar className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Schedule New Examination & Invigilator Duty</h4>
                                <p className="text-xs text-slate-500">Assign course, exam date, hall, chief invigilator, and proctors with automated clash prevention.</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowCreateDrawer(false)}
                            className="text-slate-400 hover:text-slate-600 p-1"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {formError && (
                        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>{formError}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Course Selection */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                                Course *
                            </label>
                            <select
                                required
                                value={formData.courseCode}
                                onChange={e => handleCourseSelect(e.target.value)}
                                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            >
                                <option value="">Select Course...</option>
                                {courses.map(c => (
                                    <option key={c.id} value={c.code}>
                                        {c.code} — {c.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Exam Date */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                    Exam Date *
                                </label>
                                {formattedTermRange && (
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1" title={formattedTermRange}>
                                        <Calendar className="w-3 h-3 text-emerald-500 shrink-0" />
                                        <span>{formattedTermRange}</span>
                                    </span>
                                )}
                            </div>
                            <input
                                type="date"
                                required
                                min={termMinDate}
                                max={termMaxDate}
                                value={formData.examDate}
                                onChange={e => {
                                    const val = e.target.value;
                                    if (termMinDate && val < termMinDate) {
                                        setFormError(`Exam date must fall within semester timeline (${termMinDate} to ${termMaxDate}).`);
                                    } else if (termMaxDate && val > termMaxDate) {
                                        setFormError(`Exam date cannot exceed semester end date (${termMaxDate}).`);
                                    } else {
                                        setFormError("");
                                    }
                                    setFormData({ ...formData, examDate: val });
                                }}
                                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                            />
                            {selectedTerm && (
                                <p className="text-[10px] text-slate-400 mt-1">
                                    Restricted strictly to the semester duration of {selectedTerm.name}.
                                </p>
                            )}
                        </div>

                        {/* Time Slot (Start Time & End Time) */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                                Time Slot (Start & End) *
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="time"
                                    required
                                    value={formData.startTime}
                                    onChange={e => {
                                        const s = e.target.value;
                                        setFormData({
                                            ...formData,
                                            startTime: s,
                                            timeSlot: `${s} - ${formData.endTime}`
                                        });
                                    }}
                                    className="w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                                />
                                <input
                                    type="time"
                                    required
                                    value={formData.endTime}
                                    onChange={e => {
                                        const end = e.target.value;
                                        setFormData({
                                            ...formData,
                                            endTime: end,
                                            timeSlot: `${formData.startTime} - ${end}`
                                        });
                                    }}
                                    className="w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                                />
                            </div>
                        </div>

                        {/* Exam Hall / Venue */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                                Exam Hall / Venue *
                            </label>
                            <select
                                required
                                value={formData.hallId}
                                onChange={e => setFormData({ ...formData, hallId: e.target.value })}
                                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            >
                                <option value="">Select Examination Hall...</option>
                                {halls.map(h => (
                                    <option key={h.id} value={String(h.id)}>
                                        {h.name} (Cap: {h.capacity})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Chief Invigilator */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                                Chief Invigilator
                            </label>
                            <select
                                value={formData.chiefInvigilatorId}
                                onChange={e => setFormData({ ...formData, chiefInvigilatorId: e.target.value })}
                                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            >
                                <option value="">Select Chief Invigilator...</option>
                                {lecturers.map(l => (
                                    <option key={l.id} value={String(l.id)}>
                                        {l.name} ({l.email})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Target Class / Level Dropdown */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                                Target Class / Level *
                            </label>
                            <select
                                required
                                value={formData.targetClass}
                                onChange={e => setFormData({ ...formData, targetClass: e.target.value })}
                                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                            >
                                <option value="">
                                    {formData.courseCode ? "Select Class currently taking this course..." : "Select Course first..."}
                                </option>
                                {getAvailableClasses(formData.courseCode).map(cls => (
                                    <option key={cls} value={cls}>
                                        {cls}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Assistant Invigilators Multi-Select Chips */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                            Assistant Invigilators / Proctors ({formData.assistantInvigilatorIds.length} selected)
                        </label>
                        <div className="flex flex-wrap gap-2 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-h-36 overflow-y-auto">
                            {lecturers.map(lec => {
                                const isSelected = formData.assistantInvigilatorIds.includes(lec.id);
                                const isChief = String(lec.id) === formData.chiefInvigilatorId;
                                if (isChief) return null; // Don't show chief as assistant
                                return (
                                    <button
                                        key={lec.id}
                                        type="button"
                                        onClick={() => handleToggleAssistant(lec.id)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                                            isSelected
                                                ? "bg-emerald-600 text-white shadow-sm"
                                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                                        }`}
                                    >
                                        <Users className="w-3.5 h-3.5" />
                                        {lec.name}
                                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 ml-1" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setShowCreateDrawer(false)}
                            className="px-5 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 rounded-xl text-xs font-bold transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            {isSaving ? "Validating & Scheduling..." : "Confirm Exam Schedule"}
                        </button>
                    </div>
                </form>
            )}

            {/* Matrix Timetable Display */}
            {loading ? (
                <div className="py-16 text-center text-slate-400 space-y-3">
                    <div className="animate-spin w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full mx-auto" />
                    <p className="text-xs">Loading examination roster and venue assignments...</p>
                </div>
            ) : Object.keys(groupedByDate).length === 0 ? (
                <div className="p-12 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">No Exam Sessions Scheduled Yet</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        {isArchiveMode
                            ? "No examination records found for this archived semester."
                            : "Click 'Schedule Exam Session' above to begin building the departmental invigilation matrix."}
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedByDate).map(([dateLabel, dateSlots]) => (
                        <div
                            key={dateLabel}
                            className="rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
                        >
                            {/* Date Group Header */}
                            <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <Calendar className="w-4 h-4 text-emerald-600" />
                                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                                        {dateLabel}
                                    </span>
                                    <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-full">
                                        {dateSlots.length} Exam Session{dateSlots.length > 1 ? "s" : ""}
                                    </span>
                                </div>
                            </div>

                            {/* Session Cards */}
                            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {dateSlots.map(slot => (
                                    <div
                                        key={slot.id}
                                        className="p-5 lg:p-6 hover:bg-slate-50/70 dark:hover:bg-slate-850/50 transition-colors grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 lg:gap-6 items-center"
                                    >
                                        {/* 1. Course Code, Title & Time (lg:col-span-4) */}
                                        <div className="lg:col-span-4 space-y-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="px-2.5 py-1 text-xs font-black bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-800 shadow-2xs">
                                                    {slot.courseCode}
                                                </span>
                                                {slot.targetClass && (
                                                    <span className="px-2.5 py-1 text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-750 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-800/60 truncate max-w-[220px]">
                                                        {slot.targetClass}
                                                    </span>
                                                )}
                                            </div>

                                            <div>
                                                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                                                    {slot.courseTitle || "Course Examination"}
                                                </h4>
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                                                    <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                                    <span>{slot.timeSlot}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2. Exam Venue & Capacity (lg:col-span-3) */}
                                        <div className="lg:col-span-3 flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
                                                <Building2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Exam Venue</div>
                                                <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">
                                                    {slot.hall.name}
                                                </div>
                                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                                                    <Users className="w-3 h-3 text-slate-400" />
                                                    <span>{slot.hall.capacity} Seat Capacity</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 3. Invigilation Team Roster (lg:col-span-4) */}
                                        <div className="lg:col-span-4 space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                                    <UserCheck className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="text-xs">
                                                    <span className="text-slate-400 font-medium">Chief: </span>
                                                    <strong className="text-slate-900 dark:text-white font-bold">
                                                        {slot.chiefInvigilator?.name || "Unassigned"}
                                                    </strong>
                                                </div>
                                            </div>

                                            {slot.assistantInvigilators && slot.assistantInvigilators.length > 0 ? (
                                                <div className="flex items-center gap-1.5 flex-wrap pl-8">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Proctors:</span>
                                                    {slot.assistantInvigilators.map(ast => (
                                                        <span
                                                            key={ast.id}
                                                            className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700/60 shadow-2xs"
                                                        >
                                                            {ast.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="pl-8 text-[11px] text-slate-400 italic">
                                                    No assistant proctors assigned
                                                </div>
                                            )}
                                        </div>

                                        {/* 4. Delete Action (lg:col-span-1) */}
                                        <div className="lg:col-span-1 flex justify-start md:justify-end">
                                            {!isArchiveMode && (
                                                <button
                                                    onClick={() => handleDeleteSlot(slot.id, slot.courseCode)}
                                                    className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 transition cursor-pointer"
                                                    title="Remove Session"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
