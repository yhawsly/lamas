"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import OnboardingCard from "@/components/ui/OnboardingCard";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Submission { id: number; type: string; title: string; status: string; submittedAt: string | null; deadlineId: number | null; deadline: { label: string; dueDate: string } | null; }
interface Deadline { id: number; label: string; dueDate: string; type: string; }
interface Notification { id: number; message: string; read: boolean; createdAt: string; }

const statusColors: Record<string, string> = {
    SUBMITTED: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300",
    LATE: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
    PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300",
    DRAFT: "bg-slate-100 text-slate-800 dark:bg-slate-500/20 dark:text-slate-300",
};

export default function LecturerDashboard() {
    const { data: session } = useSession();

    // Use SWR for client-side caching of all dashboard datasets
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
    const [now, setNow] = useState<number | null>(null);

    useEffect(() => {
        // Safe hydration-friendly timestamp
        const t = setTimeout(() => setNow(Date.now()), 0);
        return () => clearTimeout(t);
    }, []);

    if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full" /></div>;

    const recentSubmissions = submissions.slice(0, 5);
    const pendingDeadlines = deadlines.filter((d: Deadline) => !submissions.find((s: Submission) => s.deadlineId === d.id && s.status === "SUBMITTED")).slice(0, 3);
    const unreadNotifs = notifications.filter((n: Notification) => !n.read);
    const compliance = deadlines.length > 0 ? Math.round((submissions.filter((s: Submission) => s.status === "SUBMITTED").length / deadlines.length) * 100) : 100;
    
    // Dynamic Weekly Goal Logic
    const weeklySubmissions = submissions.filter((s: Submission) => s.type === 'WEEKLY_TOPICS');
    const currentWeekTarget = 15; // Standard semester week count
    const weeklyProgress = Math.min(100, Math.round((weeklySubmissions.length / currentWeekTarget) * 100));

    const currentLecturerId = session?.user?.id;
    const lecturerCourses = currentLecturerId ? courses.filter((c: any) => c.sections?.some((s: any) => s.lecturerId === parseInt(currentLecturerId))) : [];

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Welcome back, {session?.user?.name?.split(' ')[0]} 👋</h1>
                    <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Here&apos;s what&apos;s happening in your academic portfolio today.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/lecturer/submissions" className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-500/20">
                        New Submission
                    </Link>
                </div>
            </div>

            {/* Role-Aware Onboarding */}
            {(submissions.length < 3 || compliance < 50 || resources.length === 0) && (
                <div className="animate-in slide-in-from-top-4 duration-700 delay-100">
                    <OnboardingCard
                        role="Lecturer"
                        steps={[
                            { title: "Course Outline", description: "Submit your semester course outline for departmental review.", actionLabel: "Submit Outline", href: "/lecturer/submissions", completed: submissions.some((s: Submission) => s.type === 'SEMESTER_CALENDAR') },
                            { title: "Weekly Topics", description: "Plan your weekly teaching topics using the registry view.", actionLabel: "Add Topics", href: "/lecturer/submissions?type=WEEKLY_TOPICS", completed: weeklySubmissions.length > 0 },
                            { title: "Upload Resources", description: "Share lecture notes or slides with your students.", actionLabel: "Upload File", href: "/lecturer/resources", completed: resources.length > 0 },
                            { title: "Department Sync", description: "Connect with colleagues and stay updated on department news.", actionLabel: "Go to Department", href: "/lecturer/department", completed: true }
                        ]}
                    />
                </div>
            )}

            {/* Assigned Courses Grid */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>My Assigned Courses</h2>
                {lecturerCourses.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 mx-auto mb-3 border border-slate-100">📚</div>
                        <h3 className="text-lg font-bold text-slate-800">No Courses Assigned</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mt-2 text-sm">
                            You currently do not have any courses assigned to you by the HOD.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {lecturerCourses.map(course => (
                            <Link href={`/lecturer/courses/${course.id}`} key={course.id} className="block group">
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between h-full">
                                    <div>
                                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-bold mb-4 border border-blue-100">
                                            {course.code}
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition">{course.title}</h3>
                                        <p className="mt-2 text-sm text-slate-500">{course.credits} Credits</p>
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-semibold group-hover:text-blue-700">
                                        <span>Manage Syllabus Workspace</span>
                                        <svg className="w-4 h-4 transform group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Overall Compliance", value: `${compliance}%`, sub: "Target: 100%", icon: "🎯", color: compliance >= 80 ? "text-green-400" : compliance >= 60 ? "text-yellow-400" : "text-red-400", bg: "from-blue-600/10 to-transparent" },
                    { label: "Total Submissions", value: submissions.filter((s: Submission) => s.status !== "DRAFT").length, sub: "This semester", icon: "📄", color: "text-blue-400", bg: "from-blue-600/10 to-transparent" },
                    { label: "Uploaded Resources", value: resources.length, sub: "Shared documents", icon: "📚", color: "text-amber-400", bg: "from-amber-600/10 to-transparent" },
                    { label: "Unread Alerts", value: unreadNotifs.length, sub: "In your inbox", icon: "🔔", color: "text-purple-400", bg: "from-purple-600/10 to-transparent" },
                ].map((stat, i) => (
                    <div key={i} className={`bg-gradient-to-br ${stat.bg} rounded-3xl p-6 relative overflow-hidden group transition-all`}>
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-2xl">{stat.icon}</span>
                            <div className="p-1 rounded-lg" style={{ background: "var(--bg-surface)" }}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--text-muted)" }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                            </div>
                        </div>
                        <h3 className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{stat.label}</h3>
                        <p className={`text-4xl font-bold my-1 ${stat.color}`}>{stat.value}</p>
                        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{stat.sub}</p>
                        <div className="absolute -right-4 -bottom-4 text-8xl opacity-5 group-hover:scale-110 transition-transform pointer-events-none">{stat.icon}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Deadlines & Quick Submit */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="rounded-3xl p-6" style={{ background: "var(--bg-surface)" }}>
                        <h3 className="font-bold mb-5 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                            <span className="text-amber-400">⏰</span> Upcoming Deadlines
                        </h3>
                        {pendingDeadlines.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="text-4xl mb-2">🎉</div>
                                <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>No pending deadlines!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pendingDeadlines.map(d => {
                                    const diff = new Date(d.dueDate).getTime() - (now || 0);
                                    const days = now ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
                                    return (
                                        <Link key={d.id} href={`/lecturer/submissions?type=${d.type}`} className="block p-4 rounded-2xl transition-all" style={{ background: "var(--bg-hover)" }}>
                                            <div className="flex justify-between items-start">
                                                <div className="max-w-[150px]">
                                                    <div className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>{d.label}</div>
                                                    <div className="text-[10px] uppercase mt-0.5" style={{ color: "var(--text-muted)" }}>{d.type.replace(/_/g, ' ')}</div>
                                                </div>
                                                <div className={`px-2 py-1 rounded-lg text-[10px] font-bold ${days <= 3 ? 'bg-red-500/20 text-red-100' : 'bg-amber-500/20 text-amber-100'}`}>
                                                    {days > 0 ? `${days} DAYS LEFT` : 'OVERDUE'}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                        <Link href="/admin/deadlines" className="block text-center mt-6 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">
                            View Academic Calendar →
                        </Link>
                    </div>

                    <div className="rounded-3xl p-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(79,70,229,0.08) 100%)" }}>
                        <h3 className="font-bold mb-2" style={{ color: "var(--text-primary)" }}>Weekly Goal</h3>
                        <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>Maintain consistent teaching records. Aim for 15 weeks of topics.</p>
                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-border)" }}>
                            <div className="h-full bg-blue-500 transition-all" style={{ width: `${weeklyProgress}%` }} />
                        </div>
                        <div className="flex justify-between mt-2 font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
                            <span>PROGRESS</span>
                            <span>{weeklyProgress}%</span>
                        </div>
                        <div className="absolute -right-2 -bottom-2 opacity-10 pointer-events-none">
                            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V7h2v9zm4 0h-2V7h2v9z" /></svg>
                        </div>
                    </div>

                    {/* Department Quick Link */}
                    <div className="rounded-3xl p-6" style={{ background: "var(--bg-surface)" }}>
                        <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                            <span className="text-blue-400">📢</span> My Department
                        </h3>
                        <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>Notify colleagues or search for departmental resources.</p>
                        <Link href="/lecturer/department" className="block w-full py-2.5 rounded-xl text-xs font-bold text-center transition" style={{ background: "var(--bg-hover)", color: "var(--text-primary)" }}>
                            Go to Department →
                        </Link>
                    </div>
                </div>

                {/* Right Column: Recent Activity & Submissions */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-3xl overflow-hidden shadow-xl" style={{ background: "var(--bg-surface)" }}>
                        <div className="px-6 py-5 flex items-center justify-between">
                            <h3 className="font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                                <span className="text-blue-400">📋</span> Recent Submissions
                            </h3>
                            <Link href="/lecturer/submissions" className="text-xs text-blue-400 hover:text-blue-300 font-medium tracking-wide">
                                SEE ALL
                            </Link>
                        </div>
                        <div className="p-0">
                            {recentSubmissions.length === 0 ? (
                                <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
                                    <p className="text-sm italic">You haven&apos;t submitted any documents yet.</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {recentSubmissions.map((s: Submission) => (
                                        <div key={s.id} className="px-6 py-4 flex items-center justify-between transition-colors" style={{ background: "transparent" }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: "var(--bg-hover)" }}>
                                                    {s.type === 'SEMESTER_CALENDAR' ? '📅' : s.type === 'COURSE_TOPICS' ? '📚' : '👁️'}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{s.title}</div>
                                                    <div className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : 'Draft saved'}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-tight ${statusColors[s.status] || ''}`}>
                                                    {s.status}
                                                </span>
                                                <button className="transition" style={{ color: "var(--text-muted)", cursor: "pointer" }} onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"} onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}>
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-4 text-center" style={{ background: "var(--bg-hover)" }}>
                            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Showing last 5 activities</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
