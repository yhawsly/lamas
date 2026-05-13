"use client";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Pagination from "@/components/ui/Pagination";
import Loader from "@/components/ui/Loader";

const LIMIT = 10;

export default function LecturerObservationsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const userId = parseInt(session?.user?.id || "0");
    const [observations, setObservations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);


    const load = useCallback((pageNum = 1) => {
        setLoading(true);
        fetch(`/api/observations?page=${pageNum}&limit=${LIMIT}`)
            .then(r => r.json())
            .then(data => {
                const obs = data.data || (Array.isArray(data) ? data : []);
                setObservations(obs);
                if (data.meta) {
                    setTotalPages(data.meta.totalPages || 1);
                    setPage(pageNum);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load(1);
    }, [load]);

    const statusColors: Record<string, string> = {
        PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300",
        COMPLETED: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300",
        REVIEWED: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Peer Observations</h1>
                <p className="mt-1" style={{ color: "var(--text-secondary)" }}>Track classroom observations where you are either the lecturer or the observer</p>
            </div>



            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl flex flex-col justify-center">
                    <div className="text-emerald-400 text-sm font-medium mb-1">Assigned to Observe</div>
                    <div className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{observations.filter(o => o.observerId === userId).length}</div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-2xl flex flex-col justify-center">
                    <div className="text-blue-400 text-sm font-medium mb-1">To be Observed</div>
                    <div className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{observations.filter(o => o.lecturerId === userId).length}</div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl flex flex-col justify-center">
                    <div className="text-amber-400 text-sm font-medium mb-1">Pending Reports</div>
                    <div className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{observations.filter(o => o.status === "PENDING" && o.observerId === userId).length}</div>
                </div>
            </div>

            <div className="border rounded-2xl p-6 shadow-xl relative overflow-hidden" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                <h3 className="font-semibold mb-6 flex items-center gap-2 relative z-10" style={{ color: "var(--text-primary)" }}>
                    <span>👁️</span> Observation Schedule & History
                </h3>
                {loading ? <Loader message="Synchronizing Observation Registry..." /> :
                    observations.length === 0 ? <p className="text-center py-12" style={{ color: "var(--text-muted)" }}>No observations found.</p> :
                        <div className="overflow-x-auto relative z-10">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left" style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--bg-border)" }}>
                                        <th className="pb-3 pr-4">Course</th>
                                        <th className="pb-3 pr-4">Role</th>
                                        <th className="pb-3 pr-4">Partner</th>
                                        <th className="pb-3 pr-4">Date</th>
                                        <th className="pb-3 pr-4">Status</th>
                                        <th className="pb-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody style={{ borderColor: "var(--bg-border)" }} className="divide-y">
                                    {observations.map(o => {
                                        const isObserver = o.observerId === userId;
                                        return (
                                            <tr key={o.id} className="transition group" style={{ color: "var(--text-secondary)", background: "transparent" }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                                                <td className="py-4 pr-4 font-medium transition" style={{ color: "var(--text-primary)" }}>{o.courseCode}</td>
                                                <td className="py-4 pr-4">
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isObserver ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300'}`}>
                                                        {isObserver ? 'OBSERVER' : 'LECTURER'}
                                                    </span>
                                                </td>
                                                <td className="py-4 pr-4" style={{ color: "var(--text-secondary)" }}>{isObserver ? (o.lecturer?.name || "Peer") : (o.observer?.name || "Peer")}</td>
                                                <td className="py-4 pr-4" style={{ color: "var(--text-muted)" }}>{new Date(o.sessionDate).toLocaleDateString()}</td>
                                                <td className="py-4 pr-4">
                                                    <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${statusColors[o.status] || ""}`}>
                                                        {o.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-right">
                                                    <button
                                                        onClick={() => router.push(`/lecturer/observations/${o.id}`)}
                                                        className="px-3 py-1 bg-primary hover:opacity-90 text-white rounded-lg text-xs font-bold transition shadow-lg shadow-primary/20"
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

            {!loading && observations.length > 0 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={load} />}
        </div>
    );
}
