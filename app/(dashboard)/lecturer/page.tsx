"use client";
import { FileText, Library, Bell, BookOpen, Clock, PartyPopper, ClipboardList, Calendar, Eye, Plus, ArrowUpRight, TrendingUp, CheckCircle2, AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import GreetingHeader from "@/components/ui/GreetingHeader";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Submission { id: number; type: string; title: string; status: string; submittedAt: string | null; deadlineId: number | null; deadline: { label: string; dueDate: string } | null; content?: any; }
interface Deadline { id: number; label: string; dueDate: string; type: string; }
interface Notification { id: number; message: string; read: boolean; createdAt: string; }

const statusColors: Record<string, string> = {
    SUBMITTED: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
    LATE: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
    PENDING: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    DRAFT: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20",
};

const typeIcon: Record<string, ReactNode> = {
    SEMESTER_CALENDAR: <Calendar className="w-5 h-5 text-blue-500" />,
    COURSE_TOPICS: <Library className="w-5 h-5 text-blue-500" />,
    TEACHING_OBSERVATION: <Eye className="w-5 h-5 text-amber-500" />,
    WEEKLY_TOPICS: <Clock className="w-5 h-5 text-violet-500" />,
};

export default function LecturerDashboard() {
    const { data: session } = useSession();

    const { data: subsData } = useSWR("/api/submissions", fetcher);
    const { data: dlsData } = useSWR("/api/deadlines", fetcher);
    const { data: notifsData } = useSWR("/api/notifications", fetcher);
    const { data: resData } = useSWR("/api/resources", fetcher);
    const { data: coursesData } = useSWR("/api/courses", fetcher);

    const submissions = subsData?.data || [];
    const deadlines = Array.isArray(dlsData) ? dlsData : [];
    const notifications = notifsData?.data || [];
    const resources = resData?.data || [];
    const courses = Array.isArray(coursesData) ? coursesData : [];

    const loading = !subsData || !dlsData || !notifsData || !resData || !coursesData;
    const [mounted, setMounted] = useState(false);
    const [now, setNow] = useState<number | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setMounted(true);
            setNow(Date.now());
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    if (!mounted) return null;

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
                <GreetingHeader
                    subtitle="Here's what's happening in your academic portfolio today."
                    action={<div className="w-32 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />}
                />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-800 animate-pulse" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2].map(i => <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-800 animate-pulse" />)}
                </div>
            </div>
        );
    }

    const recentSubmissions = submissions.slice(0, 5);
    const pendingDeadlines = deadlines
        .filter((d: Deadline) => !submissions.find((s: Submission) => s.deadlineId === d.id && s.status === "SUBMITTED"))
        .slice(0, 4);
    const unreadNotifs = notifications.filter((n: Notification) => !n.read);
    const submittedCount = submissions.filter((s: Submission) => s.status === "SUBMITTED").length;
    const compliance = deadlines.length > 0 ? Math.round((submittedCount / deadlines.length) * 100) : 100;

    const currentLecturerId = session?.user?.id;
    const lecturerCourses = currentLecturerId
        ? courses.filter((c: any) => c.sections?.some((s: any) => s.lecturerId === parseInt(currentLecturerId)))
        : [];

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">

            {/* ── Header ── */}
            <GreetingHeader
                subtitle="Plan, prioritize, and oversee your course workspaces with ease."
                action={
                    <Link href="/lecturer/submissions" className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-1.5 animate-bounce-subtle">
                        <Plus className="w-4 h-4" /> New Submission
                    </Link>
                }
            />

            {/* ── KPI Strip ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Compliance */}
                <div className="p-5 rounded-[2rem] border flex flex-col justify-between hover:shadow-lg transition-all duration-300"
                    style={{ backgroundColor: "rgba(59, 130, 246, 0.05)", borderColor: "rgba(59, 130, 246, 0.15)" }}>
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Compliance</span>
                        <div className="p-1.5 rounded-lg bg-blue-500/10"><TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /></div>
                    </div>
                    <div className="mt-4">
                        <div className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-blue-300">{compliance}%</div>
                        <div className="text-[10px] font-semibold mt-1 text-blue-600 dark:text-blue-400">Submission rate</div>
                    </div>
                </div>

                {/* Submissions */}
                <Link href="/lecturer/submissions" className="p-5 rounded-[2rem] border flex flex-col justify-between hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300"
                    style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Submissions</span>
                        <div className="p-1.5 rounded-lg bg-blue-500/10"><FileText className="w-3.5 h-3.5 text-blue-500" /></div>
                    </div>
                    <div className="mt-4">
                        <div className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>{submittedCount}</div>
                        <div className="text-[10px] font-semibold mt-1" style={{ color: "var(--text-muted)" }}>Submitted docs</div>
                    </div>
                </Link>

                {/* Resources */}
                <Link href="/lecturer/resources" className="p-5 rounded-[2rem] border flex flex-col justify-between hover:shadow-lg hover:border-violet-300 dark:hover:border-violet-700 transition-all duration-300"
                    style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Resources</span>
                        <div className="p-1.5 rounded-lg bg-violet-500/10"><Library className="w-3.5 h-3.5 text-violet-500" /></div>
                    </div>
                    <div className="mt-4">
                        <div className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>{resources.length}</div>
                        <div className="text-[10px] font-semibold mt-1" style={{ color: "var(--text-muted)" }}>Shared materials</div>
                    </div>
                </Link>

                {/* Notifications */}
                <Link href="/notifications" className="p-5 rounded-[2rem] border flex flex-col justify-between hover:shadow-lg hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-300"
                    style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Alerts</span>
                        <div className="p-1.5 rounded-lg bg-amber-500/10"><Bell className="w-3.5 h-3.5 text-amber-500" /></div>
                    </div>
                    <div className="mt-4">
                        <div className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>{unreadNotifs.length}</div>
                        <div className="text-[10px] font-semibold mt-1" style={{ color: "var(--text-muted)" }}>Unread notifications</div>
                    </div>
                </Link>
            </div>

            {/* ── My Assigned Courses ── */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                        <BookOpen className="w-5 h-5 text-blue-500" /> My Assigned Courses
                    </h2>
                    <Link href="/lecturer/courses" className="text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors">
                        View All →
                    </Link>
                </div>

                {lecturerCourses.length === 0 ? (
                    <div className="border rounded-[2rem] p-10 text-center shadow-sm" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mx-auto mb-4 border border-blue-500/20">
                            <BookOpen className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>No Courses Assigned</h3>
                        <p className="max-w-sm mx-auto mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
                            You currently do not have any courses assigned to you.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                        {lecturerCourses.map((course: any) => (
                            <Link href={`/lecturer/courses/${course.id}`} key={course.id} className="block group">
                                <div className="p-6 rounded-[2rem] border transition-all duration-300 hover:shadow-xl hover:border-blue-400/40 dark:hover:border-blue-500/30 flex flex-col justify-between h-52"
                                    style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                                    <div className="flex justify-between items-start">
                                        <div className="px-3 py-1.5 rounded-xl text-xs font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                            {course.code}
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                                            {course.credits} Credits
                                        </span>
                                    </div>
                                    <div className="mt-3">
                                        <h3 className="text-base font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight"
                                            style={{ color: "var(--text-primary)" }}>{course.title}</h3>
                                    </div>
                                    <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400 transition-colors"
                                        style={{ borderColor: "var(--bg-border)" }}>
                                        <span>Open Workspace</span>
                                        <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Middle Row: Pending Deadlines + Quick Actions ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* Pending Deadlines */}
                <div className="lg:col-span-3 rounded-[2rem] border overflow-hidden"
                    style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                    <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--bg-border)" }}>
                        <h3 className="font-extrabold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                            <Clock className="w-4 h-4 text-amber-500" /> Pending Deadlines
                        </h3>
                        <Link href="/lecturer/submissions" className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-600 transition-colors">
                            View All →
                        </Link>
                    </div>

                    <div className="p-4 space-y-2">
                        {pendingDeadlines.length === 0 ? (
                            <div className="text-center py-10">
                                <CheckCircle2 className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                                <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>All caught up!</p>
                                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>No pending deadlines right now.</p>
                            </div>
                        ) : pendingDeadlines.map((d: Deadline) => {
                            const diff = new Date(d.dueDate).getTime() - (now || 0);
                            const days = now ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
                            const isUrgent = days <= 3;
                            return (
                                <Link key={d.id} href={`/lecturer/submissions`}
                                    className="flex items-center justify-between p-4 rounded-2xl border transition-all hover:shadow-sm hover:border-blue-300 dark:hover:border-blue-700 group"
                                    style={{ borderColor: "var(--bg-border)", backgroundColor: "var(--bg-base)" }}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full shrink-0 ${isUrgent ? "bg-rose-500 animate-pulse" : "bg-amber-400"}`} />
                                        <div>
                                            <div className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{d.label}</div>
                                            <div className="text-[10px] font-black uppercase mt-0.5 opacity-60" style={{ color: "var(--text-muted)" }}>
                                                {d.type.replace(/_/g, ' ')}
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0 ${days < 0 ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                                            : isUrgent ? "bg-orange-500/15 text-orange-600 dark:text-orange-400"
                                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                        }`}>
                                        {days < 0 ? "Overdue" : `${days}d left`}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Quick Actions Panel */}
                <div className="lg:col-span-2 rounded-[2rem] border p-6 flex flex-col gap-3"
                    style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                    <h3 className="font-extrabold mb-1" style={{ color: "var(--text-primary)" }}>Quick Actions</h3>

                    {[
                        { href: "/lecturer/submissions", label: "Submit Document", desc: "Upload & track submissions", icon: <FileText className="w-4 h-4" />, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
                        { href: "/lecturer/courses", label: "My Courses", desc: "View course workspaces", icon: <BookOpen className="w-4 h-4" />, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
                        { href: "/lecturer/resources", label: "Resources", desc: "Access shared materials", icon: <Library className="w-4 h-4" />, color: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
                        { href: "/lecturer/appraisals", label: "Appraisals", desc: "View your evaluations", icon: <CheckCircle2 className="w-4 h-4" />, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
                        { href: "/lecturer/reports", label: "Reports", desc: "Academic performance data", icon: <AlertCircle className="w-4 h-4" />, color: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
                    ].map(a => (
                        <Link key={a.href} href={a.href}
                            className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-sm hover:scale-[1.01] group"
                            style={{ borderColor: "var(--bg-border)", backgroundColor: "var(--bg-base)" }}>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${a.color}`}>
                                {a.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{a.label}</div>
                                <div className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>{a.desc}</div>
                            </div>
                            <ArrowUpRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity shrink-0" style={{ color: "var(--text-muted)" }} />
                        </Link>
                    ))}
                </div>
            </div>

            {/* ── Recent Submissions List ── */}
            <div className="rounded-[2rem] border overflow-hidden" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: "var(--bg-border)" }}>
                    <h3 className="font-extrabold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                        <ClipboardList className="w-5 h-5 text-blue-500" /> Recent Submissions
                    </h3>
                    <Link href="/lecturer/submissions" className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-600 transition-colors">
                        See All
                    </Link>
                </div>

                <div className="divide-y" style={{ borderColor: "var(--bg-border)" }}>
                    {recentSubmissions.length === 0 ? (
                        <div className="text-center py-14" style={{ color: "var(--text-muted)" }}>
                            <PartyPopper className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm italic">No submissions yet. Start by uploading your first document.</p>
                        </div>
                    ) : recentSubmissions.map((s: Submission) => (
                        <div key={s.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-[var(--bg-hover)]">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 border shrink-0"
                                    style={{ borderColor: "var(--bg-border)" }}>
                                    {typeIcon[s.type] || <FileText className="w-5 h-5 text-slate-500" />}
                                </div>
                                <div>
                                    <div className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{s.title}</div>
                                    <div className="text-[10px] font-semibold mt-0.5 uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                                        {s.type.replace(/_/g, ' ')} · {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : 'Draft saved'}
                                    </div>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 ${statusColors[s.status] || ''}`}>
                                {s.status}
                            </span>
                        </div>
                    ))}
                </div>

                {recentSubmissions.length > 0 && (
                    <div className="px-6 py-3 border-t text-center" style={{ backgroundColor: "var(--bg-hover)", borderColor: "var(--bg-border)" }}>
                        <p className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>Showing last {recentSubmissions.length} activities</p>
                    </div>
                )}
            </div>
        </div>
    );
}
