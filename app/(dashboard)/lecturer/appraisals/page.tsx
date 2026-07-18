"use client";
import { ClipboardList } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AppraisalsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const userId = parseInt(session?.user?.id || "0");
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [obsRes, teachRes, modRes] = await Promise.all([
                fetch(`/api/observations?limit=100`).then(r => r.json()),
                fetch(`/api/teaching-observations`).then(r => r.json()),
                fetch(`/api/moderations`).then(r => r.json())
            ]);
            
            const obs = (obsRes.data || (Array.isArray(obsRes) ? obsRes : [])).map((o: any) => ({...o, formType: "A", typeName: "Peer Observation"}));
            const teach = (Array.isArray(teachRes) ? teachRes : []).map((o: any) => ({...o, formType: "B", typeName: "Teaching Observation", observerId: o.observerId, lecturerId: o.lecturerId}));
            const mod = (Array.isArray(modRes) ? modRes : []).map((o: any) => ({...o, formType: "C", typeName: "Exam Moderation", observerId: o.moderatorId, lecturerId: o.lecturerId}));
            
            setAssignments([...obs, ...teach, ...mod].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const statusColors: Record<string, string> = {
        PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300",
        COMPLETED: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300",
        REVIEWED: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
    };

    const getRoute = (formType: string, id: number) => {
        if (formType === "A") return `/lecturer/observations/${id}`;
        if (formType === "B") return `/lecturer/teaching-observations/${id}`;
        if (formType === "C") return `/lecturer/moderations/${id}`;
        return "#";
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="mb-8">
                <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Appraisals & Reviews</h1>
                <p className="mt-1" style={{ color: "var(--text-secondary)" }}>Track all your peer observations, teaching observations, and exam moderations.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl flex flex-col justify-center">
                    <div className="text-emerald-500 text-sm font-bold mb-1 tracking-widest uppercase">Assigned to Observe</div>
                    <div className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{assignments.filter(o => o.observerId === userId).length}</div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-2xl flex flex-col justify-center">
                    <div className="text-blue-500 text-sm font-bold mb-1 tracking-widest uppercase">Being Evaluated</div>
                    <div className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{assignments.filter(o => o.lecturerId === userId).length}</div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl flex flex-col justify-center">
                    <div className="text-amber-500 text-sm font-bold mb-1 tracking-widest uppercase">Pending Action</div>
                    <div className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{assignments.filter(o => o.status === "PENDING" && o.observerId === userId).length}</div>
                </div>
            </div>

            <div className="border rounded-2xl p-6 shadow-xl relative overflow-hidden" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                <h3 className="font-semibold mb-6 flex items-center gap-2 relative z-10" style={{ color: "var(--text-primary)" }}>
                    <ClipboardList className="w-5 h-5 text-blue-500" /> Appraisals Registry
                </h3>
                {loading ? (
                    <div className="space-y-4 mt-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-4 w-full p-4 border rounded-xl border-slate-100 dark:border-slate-800/50">
                                <div className="w-16 h-10 rounded-md bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
                                <div className="flex-1 space-y-2">
                                    <div className="w-1/3 h-4 rounded bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
                                    <div className="w-1/4 h-3 rounded bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
                                </div>
                                <div className="w-24 h-8 rounded-full bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
                            </div>
                        ))}
                    </div>
                ) : assignments.length === 0 ? <p className="text-center py-12" style={{ color: "var(--text-muted)" }}>No assignments found.</p> :
                        <div className="overflow-x-auto relative z-10">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--bg-border)" }}>
                                        <th className="pb-3 px-4">Form</th>
                                        <th className="pb-3 px-4">Course</th>
                                        <th className="pb-3 px-4">Your Role</th>
                                        <th className="pb-3 px-4">Partner</th>
                                        <th className="pb-3 px-4">Schedule</th>
                                        <th className="pb-3 px-4 text-center">Status</th>
                                        <th className="pb-3 px-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody style={{ borderColor: "var(--bg-border)" }} className="divide-y">
                                    {assignments.map(o => {
                                        const isObserver = o.observerId === userId;
                                        return (
                                            <tr key={`${o.formType}-${o.id}`} className="transition group" style={{ color: "var(--text-secondary)" }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                                                <td className="py-4 px-4 whitespace-nowrap">
                                                    <span className="font-black text-xs tracking-widest bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 px-2 py-1 rounded-md">FORM {o.formType}</span>
                                                    <div className="text-[10px] uppercase mt-1 opacity-60 font-bold">{o.typeName}</div>
                                                </td>
                                                <td className="py-4 px-4 font-bold" style={{ color: "var(--text-primary)" }}>{o.courseCode}</td>
                                                <td className="py-4 px-4">
                                                    <span className={`text-[10px] px-2 py-1 rounded-md font-black tracking-widest uppercase ${isObserver ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300'}`}>
                                                        {isObserver ? (o.formType === "C" ? 'MODERATOR' : 'OBSERVER') : 'LECTURER'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 font-medium" style={{ color: "var(--text-primary)" }}>
                                                    {isObserver ? (o.lecturer?.name || "Peer") : (o.formType === "C" ? o.moderator?.name : o.observer?.name) || "Peer"}
                                                </td>
                                                <td className="py-4 px-4 whitespace-nowrap">
                                                    {o.formType === "C" ? <span className="opacity-40 italic text-xs">N/A</span> : (
                                                        o.sessionDate ? (
                                                            <div>
                                                                <div className="font-medium" style={{ color: "var(--text-primary)" }}>{new Date(o.sessionDate).toLocaleDateString()}</div>
                                                                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{o.venue || "Venue TBA"}</div>
                                                            </div>
                                                        ) : <span className="text-amber-500 text-xs font-bold bg-amber-500/10 px-2 py-1 rounded-full">Unscheduled</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <span className={`text-[10px] px-2 py-1 rounded-full font-black tracking-widest uppercase ${statusColors[o.status] || ""}`}>
                                                        {o.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <button
                                                        onClick={() => router.push(getRoute(o.formType, o.id))}
                                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg ${
                                                            isObserver && o.status === "PENDING"
                                                                ? "bg-primary text-white hover:opacity-90 shadow-primary/20"
                                                                : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 shadow-none"
                                                        }`}
                                                    >
                                                        {isObserver && o.status === "PENDING" ? "Conduct →" : "View Artifact →"}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                }
            </div>
        </div>
    );
}
