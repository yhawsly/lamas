"use client";
import { FileText, Library, Bell, BookOpen, Clock, PartyPopper, ClipboardList, Calendar as CalendarIcon, Eye, Plus, ArrowUpRight, TrendingUp, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import type { ReactNode } from "react";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import KPICard from "@/components/ui/KPICard";
import useSWR from "swr";
import { useTerm } from "@/context/TermContext";

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Submission { id: number; type: string; title: string; status: string; submittedAt: string | null; deadlineId: number | null; deadline: { label: string; dueDate: string } | null; content?: any; }
interface Notification { id: number; message: string; read: boolean; createdAt: string; }

const statusColors: Record<string, string> = {
    SUBMITTED: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
    LATE: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
    PENDING: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    DRAFT: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20",
};

const typeIcon: Record<string, ReactNode> = {
    SEMESTER_CALENDAR: <CalendarIcon className="w-5 h-5 text-blue-500" />,
    COURSE_TOPICS: <Library className="w-5 h-5 text-blue-500" />,
    TEACHING_OBSERVATION: <Eye className="w-5 h-5 text-amber-500" />,
    WEEKLY_TOPICS: <Clock className="w-5 h-5 text-violet-500" />,
};

export default function LecturerDashboard() {
    const { selectedTermId } = useTerm();
    const termQuery = selectedTermId ? `?termId=${selectedTermId}` : "";

    // SWR Data Fetching with global cache
    const { data: subsData } = useSWR(`/api/submissions${termQuery}`, fetcher);
    const { data: dlsData } = useSWR(`/api/deadlines${termQuery}`, fetcher);
    const { data: notifsData } = useSWR("/api/notifications", fetcher);
    const { data: resData } = useSWR("/api/resources", fetcher);
    const { data: mySectionsData } = useSWR(`/api/courses/my-sections${termQuery}`, fetcher);
    const { data: invigilationData } = useSWR(`/api/lecturer/invigilation${termQuery}`, fetcher);

    const submissions = useMemo(() => subsData?.data || [], [subsData]);
    const deadlines = useMemo(() => Array.isArray(dlsData) ? dlsData : [], [dlsData]);
    const notifications = useMemo(() => notifsData?.data || [], [notifsData]);
    const resources = useMemo(() => resData?.data || [], [resData]);
    const lecturerSections = useMemo(() => mySectionsData?.sections || [], [mySectionsData]);
    const lecturerCourses = useMemo(() => mySectionsData?.courses || [], [mySectionsData]);
    const invigilationDuties = useMemo(() => invigilationData?.data || [], [invigilationData]);

    const loading = !subsData || !dlsData || !notifsData || !resData || !mySectionsData;
    const [mounted, setMounted] = useState(false);

    // Submission filtering tab state
    const [activeSubTab, setActiveSubTab] = useState<"all" | "submitted" | "pending" | "draft">("all");

    // Today Class weekly strip calendar state
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

    useEffect(() => {
        const timer = setTimeout(() => {
            setMounted(true);
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    const unreadNotifs = useMemo(() => notifications.filter((n: Notification) => !n.read), [notifications]);
    const submittedCount = useMemo(() => submissions.filter((s: Submission) => s.status === "SUBMITTED").length, [submissions]);
    const compliance = useMemo(() => deadlines.length > 0 ? Math.round((submittedCount / deadlines.length) * 100) : 100, [deadlines, submittedCount]);

    // Calculate weekly date strip centered around currentDate
    const weeklyDays = useMemo(() => {
        const start = new Date(currentDate);
        const day = start.getDay();
        const diff = start.getDate() - day; // Adjust to Sunday
        start.setDate(diff);

        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push(d);
        }
        return days;
    }, [currentDate]);

    const handlePrevWeek = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7));
    };

    const handleNextWeek = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7));
    };

    // Filter class sections for the selected day of the week
    const selectedDaySections = useMemo(() => {
        if (!selectedDate) return [];
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const selectedDayName = dayNames[selectedDate.getDay()];
        
        return lecturerSections.filter((sec: any) => sec.dayOfWeek === selectedDayName);
    }, [selectedDate, lecturerSections]);

    // Filter submissions list based on active sub tab
    const filteredSubmissions = useMemo(() => {
        if (activeSubTab === "all") return submissions;
        if (activeSubTab === "submitted") return submissions.filter((s: Submission) => s.status === "SUBMITTED" || s.status === "LATE");
        if (activeSubTab === "pending") return submissions.filter((s: Submission) => s.status === "PENDING");
        if (activeSubTab === "draft") return submissions.filter((s: Submission) => s.status === "DRAFT");
        return submissions;
    }, [submissions, activeSubTab]);

    if (!mounted) return null;

    if (loading) {
        return (
            <div className="w-full space-y-6 sm:space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                        <div className="h-4 w-72 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mt-2" />
                    </div>
                    <div className="w-32 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0" />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-28 sm:h-32 bg-slate-100 dark:bg-slate-800/50 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 animate-pulse" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2].map(i => <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-800 animate-pulse" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6 sm:space-y-8 animate-in fade-in duration-500">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Lecturer Dashboard</h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Plan, prioritize, and oversee your course workspaces with ease.</p>
                </div>
                <Link href="/lecturer/courses" className="px-4 sm:px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 shrink-0 w-full sm:w-fit cursor-pointer">
                    <BookOpen className="w-4 h-4" /> Go to Courses
                </Link>
            </div>

            {/* ── Mobile-Only Quick Action Hub ── */}
            <div className="grid grid-cols-2 gap-2.5 sm:hidden">
                <Link 
                    href="/lecturer/courses"
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center gap-3 active:scale-[0.98] transition"
                >
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-xs font-black text-slate-900 dark:text-white leading-tight">My Courses</div>
                        <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{lecturerCourses.length} Assigned</div>
                    </div>
                </Link>

                <Link 
                    href="/lecturer/appraisals"
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center gap-3 active:scale-[0.98] transition"
                >
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <Eye className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-xs font-black text-slate-900 dark:text-white leading-tight">Peer Reviews</div>
                        <div className="text-[10px] text-slate-400 font-semibold mt-0.5">APR Form A</div>
                    </div>
                </Link>

                <Link 
                    href="/lecturer/resources"
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center gap-3 active:scale-[0.98] transition"
                >
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <Library className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-xs font-black text-slate-900 dark:text-white leading-tight">Resources</div>
                        <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{resources.length} Files</div>
                    </div>
                </Link>

                <Link 
                    href="/notifications"
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center gap-3 active:scale-[0.98] transition"
                >
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Bell className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-xs font-black text-slate-900 dark:text-white leading-tight">Alerts</div>
                        <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{unreadNotifs.length} Unread</div>
                    </div>
                </Link>
            </div>

            {/* ── KPI Strip ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                <KPICard
                    label="Compliance Rate"
                    value={`${compliance}%`}
                    icon={<TrendingUp className="w-6 h-6" />}
                    color="#3b82f6"
                />
                <Link href="/lecturer/courses" className="block group">
                    <KPICard
                        label="Total Submissions"
                        value={submittedCount}
                        icon={<FileText className="w-6 h-6" />}
                        color="#6366f1"
                    />
                </Link>
                <Link href="/lecturer/resources" className="block group">
                    <KPICard
                        label="Shared Resources"
                        value={resources.length}
                        icon={<Library className="w-6 h-6" />}
                        color="#8b5cf6"
                    />
                </Link>
                <Link href="/notifications" className="block group">
                    <KPICard
                        label="Unread Alerts"
                        value={unreadNotifs.length}
                        icon={<Bell className="w-6 h-6" />}
                        color="#f59e0b"
                        trend={unreadNotifs.length > 0 ? { value: `${unreadNotifs.length} new`, isPositive: false } : undefined}
                    />
                </Link>
            </div>

            {/* ── Reorganized Split Grid Layout ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Side (2/3 width) - Workspaces & Submissions Planner */}
                <div className="lg:col-span-2 space-y-8">

                    {/* My Assigned Courses Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-950 dark:text-white">
                                <BookOpen className="w-5 h-5 text-blue-500" /> My Assigned Courses
                            </h2>
                            <Link href="/lecturer/courses" className="text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors">
                                View All →
                            </Link>
                        </div>

                        {lecturerCourses.length === 0 ? (
                            <div className="border rounded-[2rem] p-10 text-center shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mx-auto mb-4 border border-blue-500/20">
                                    <BookOpen className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-950 dark:text-white">No Courses Assigned</h3>
                                <p className="max-w-sm mx-auto mt-2 text-sm text-slate-500 dark:text-slate-400">
                                    You currently do not have any courses assigned to you.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {lecturerCourses.map((item: any) => {
                                    const course = item.course;
                                    if (!course) return null;
                                    return (
                                        <Link href={`/lecturer/courses/${course.id}`} key={course.id} className="block group">
                                            <div className="p-6 rounded-[2rem] border transition-all duration-300 hover:shadow-xl hover:border-blue-400/40 dark:hover:border-blue-500/30 flex flex-col justify-between h-48 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                                <div className="flex justify-between items-start">
                                                    <div className="px-3 py-1.5 rounded-xl text-xs font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                                        {course.code}
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                        {course.credits} Credits
                                                    </span>
                                                </div>
                                                <div className="mt-2">
                                                    <h3 className="text-base font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight text-slate-950 dark:text-white line-clamp-2">{course.title}</h3>
                                                </div>
                                                <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400 transition-colors border-slate-100 dark:border-slate-800">
                                                    <span>Open Workspace</span>
                                                    <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Submissions Hub list */}
                    <div className="rounded-[2rem] border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                    <ClipboardList className="w-5 h-5 text-blue-500" /> Submissions Hub
                                </h3>
                            </div>

                            <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 w-fit shrink-0">
                                {(["all", "submitted", "pending", "draft"] as const).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveSubTab(tab)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                                            activeSubTab === tab
                                                ? "bg-white dark:bg-slate-955 text-blue-600 dark:text-blue-400 shadow-sm"
                                                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredSubmissions.length === 0 ? (
                                <div className="text-center py-16 text-slate-400">
                                    <PartyPopper className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                                    <p className="text-sm font-semibold">No submissions found</p>
                                    <p className="text-xs mt-1">Try switching tabs or upload a new syllabus to get started.</p>
                                </div>
                            ) : (
                                filteredSubmissions.slice(0, 5).map((s: Submission) => (
                                    <div key={s.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                                                {typeIcon[s.type] || <FileText className="w-5 h-5 text-slate-500" />}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm text-slate-950 dark:text-white">{s.title}</div>
                                                <div className="text-[10px] font-semibold mt-0.5 uppercase tracking-widest text-slate-400">
                                                    {s.type.replace(/_/g, ' ')} · {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : 'Draft saved'}
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 ${statusColors[s.status] || ''}`}>
                                            {s.status}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>

                        {filteredSubmissions.length > 0 && (
                            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-900/50">
                                <p className="text-[10px] font-semibold text-slate-400">Showing last {Math.min(5, filteredSubmissions.length)} submissions</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side (1/3 width) - Today Class Calendar & Shortcuts */}
                <div className="space-y-6">

                    {/* Today Class Weekly Timeline Widget (New Image Style) */}
                    <div className="rounded-[2rem] border p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-base text-slate-900 dark:text-white">Today Class</h3>
                            <div className="flex gap-2">
                                <button onClick={handlePrevWeek} className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                                    <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                </button>
                                <button onClick={handleNextWeek} className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                                    <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                </button>
                            </div>
                        </div>

                        {/* Weekly Days Strip */}
                        <div className="grid grid-cols-7 gap-2 p-3 rounded-2xl bg-slate-50/60 dark:bg-slate-950/60 text-center mb-6">
                            {weeklyDays.map((day, index) => {
                                const isSelected = selectedDate && day.getDate() === selectedDate.getDate() && day.getMonth() === selectedDate.getMonth();
                                const isTodayDate = day.getDate() === new Date().getDate() && day.getMonth() === new Date().getMonth() && day.getFullYear() === new Date().getFullYear();
                                const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];
                                
                                return (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedDate(day)}
                                        className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 transition-all ${
                                            isSelected 
                                                ? "bg-blue-600 text-white font-extrabold shadow-md shadow-blue-500/25"
                                                : isTodayDate
                                                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-extrabold"
                                                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                        }`}
                                    >
                                        <span className="text-[10px] opacity-75 font-semibold">
                                            {dayLabels[day.getDay()]}
                                        </span>
                                        <span className="text-xs font-black">
                                            {day.getDate()}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Timeline list header */}
                        <div className="flex justify-between items-center mb-5">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                {selectedDate?.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
                            </span>
                                <Link
                                    href="/lecturer/courses/2?tab=schedule"
                                    className="text-[10px] font-black text-blue-500 cursor-pointer hover:underline hover:text-blue-600 transition-colors"
                                >
                                    See All
                                </Link>
                        </div>

                        {/* Dotted Timeline tracks (Image 3 Style) */}
                        {selectedDaySections.length === 0 ? (
                            <div className="text-center py-10">
                                <CheckCircle2 className="w-10 h-10 text-blue-500/30 mx-auto mb-2" />
                                <p className="text-xs text-slate-400 italic">No classes scheduled on this day.</p>
                            </div>
                        ) : (
                            <div className="relative pl-4 space-y-6 before:absolute before:left-14 before:top-2 before:bottom-2 before:w-[2px] before:bg-dotted before:border-l-2 before:border-dashed before:border-slate-200 dark:before:border-slate-800">
                                {selectedDaySections.map((sec: any, idx: number) => {
                                    // Extract simple Hour display e.g. "08:30 AM" -> "08 AM"
                                    const hourDisplay = sec.startTime ? sec.startTime.replace(/:[0-9]{2}/, '') : "10 AM";
                                    const isFirst = idx === 0;

                                    return (
                                        <div key={sec.id} className="relative flex items-start gap-4">
                                            {/* Time Column */}
                                            <div className="w-12 text-right shrink-0 text-xs font-extrabold text-slate-900 dark:text-white py-1">
                                                {hourDisplay}
                                            </div>

                                            {/* Dotted Node indicator */}
                                            <div className="absolute left-[3.25rem] z-10 flex items-center justify-center w-5 h-5 bg-white dark:bg-slate-900 rounded-full py-1">
                                                <div className={`w-3.5 h-3.5 rounded-full border-2 bg-white dark:bg-slate-900 flex items-center justify-center ${
                                                    isFirst ? "border-emerald-500" : "border-blue-600"
                                                }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${isFirst ? "bg-emerald-500" : "bg-blue-600"}`} />
                                                </div>
                                            </div>

                                            {/* Avatars & Class details */}
                                            <div className="flex-1 pl-6">
                                                <div className="flex items-center gap-3">
                                                    {/* Overlapping Avatars (Physics/Book Club style) */}
                                                    <div className="flex -space-x-2 shrink-0">
                                                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-black text-slate-600 dark:text-slate-400 uppercase">
                                                            {sec.course?.code?.slice(0, 2) || "CS"}
                                                        </div>
                                                        <div className="w-6 h-6 rounded-full bg-blue-500/10 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                                                            <Plus className="w-3.5 h-3.5 text-blue-600" />
                                                        </div>
                                                    </div>

                                                    {/* Class Title */}
                                                    <div className="min-w-0">
                                                        <div className={`text-xs font-black truncate leading-tight ${isFirst ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"}`}>
                                                            {sec.course?.title || sec.name}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
                                                            <MapPin className="w-3 h-3 shrink-0 text-slate-400" /> {sec.venue || "TBD"} · {sec.session}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Invigilation Duties Widget */}
                    {invigilationDuties.length > 0 && (
                        <div className="rounded-[2rem] border p-6 bg-gradient-to-br from-emerald-500/5 to-teal-500/10 border-emerald-500/20 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-sm">
                                        <CalendarIcon className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Exam Invigilation Duties</h3>
                                </div>
                                <span className="px-2 py-0.5 text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full">
                                    {invigilationDuties.length} Assigned
                                </span>
                            </div>

                            <div className="space-y-2.5">
                                {invigilationDuties.map((duty: any) => (
                                    <div
                                        key={duty.id}
                                        className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200/60 dark:border-emerald-800/40 shadow-xs space-y-1"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-black text-xs text-slate-900 dark:text-white">
                                                {duty.courseCode}
                                            </span>
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                                                duty.roleInExam === "Chief Invigilator"
                                                    ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                                                    : "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300"
                                            }`}>
                                                {duty.roleInExam}
                                            </span>
                                        </div>

                                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                                            <span>📅 {new Date(duty.examDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                                            <span>•</span>
                                            <span>🕒 {duty.timeSlot}</span>
                                        </div>

                                        <div className="text-[10px] text-slate-400 font-medium">
                                            📍 Venue: <strong className="text-slate-700 dark:text-slate-300">{duty.hall?.name || "TBD"}</strong>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Shortcuts Panel */}
                    <div className="rounded-[2rem] border p-6 flex flex-col gap-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="font-extrabold mb-1 text-slate-950 dark:text-white text-sm">Shortcuts & Tools</h3>

                        {[
                            { href: "/lecturer/courses", label: "Upload Syllabus", desc: "Submit syllabus from course workspaces", icon: <FileText className="w-4 h-4" />, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
                            { href: "/lecturer/courses", label: "Course Outcomes", desc: "Define weekly subject topics", icon: <BookOpen className="w-4 h-4" />, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
                            { href: "/lecturer/resources", label: "Lecture Materials", desc: "Share lecture handouts/slides", icon: <Library className="w-4 h-4" />, color: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
                            { href: "/lecturer/appraisals", label: "Peer Appraisals", desc: "View teaching observation scoring", icon: <CheckCircle2 className="w-4 h-4" />, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
                            { href: "/lecturer/reports", label: "Performance Reports", desc: "View academic audit compliance", icon: <AlertCircle className="w-4 h-4" />, color: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
                        ].map(a => (
                            <Link key={a.label} href={a.href}
                                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 transition-all hover:shadow-sm hover:scale-[1.01] hover:border-slate-300 dark:hover:border-slate-700 group">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${a.color}`}>
                                    {a.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-sm text-slate-950 dark:text-white">{a.label}</div>
                                    <div className="text-[10px] truncate text-slate-500 dark:text-slate-400">{a.desc}</div>
                                </div>
                                <ArrowUpRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity shrink-0 text-slate-400" />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
