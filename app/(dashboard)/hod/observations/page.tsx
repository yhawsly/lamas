"use client";
import { useEffect, useState } from "react";
import SearchableSelect from "@/components/ui/SearchableSelect";
import Loader from "@/components/ui/Loader";

export default function HoDObservationsPage() {
    const [observations, setObservations] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [lecturers, setLecturers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/observations").then(r => r.json()).then(d => { setObservations(Array.isArray(d) ? d : []); setLoading(false); });
        fetch("/api/courses").then(r => r.json()).then(d => setCourses(Array.isArray(d) ? d : []));
        fetch("/api/lecturers").then(r => r.json()).then(d => setLecturers(Array.isArray(d) ? d : []));
    }, []);


    const statusColors: Record<string, string> = { PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300", COMPLETED: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300", REVIEWED: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300" };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8"><h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Observations</h1><p className="mt-1" style={{ color: "var(--text-muted)" }}>View classroom observations</p></div>
            <div className="grid grid-cols-1 gap-6">
                <div className="rounded-2xl p-6" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                    <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>📋 Observation List</h3>
                    {loading ? <Loader message="Synchronizing Observation Registry..." /> :
                        observations.length === 0 ? <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>No observations yet.</p> :
                            <div className="space-y-3">
                                {observations.map(o => (
                                    <div key={o.id} className="p-4 rounded-xl" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)" }}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-medium" style={{ color: "var(--text-primary)" }}>{o.courseCode}</div>
                                                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Observed: {o.lecturer?.name} · Observer: {o.observer?.name}</div>
                                                <div className="text-xs" style={{ color: "var(--text-muted)" }}>{new Date(o.sessionDate).toLocaleDateString()}</div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter" style={statusColors[o.status] ? { backgroundColor: statusColors[o.status].split(" ")[0].replace("bg-", "").replace("text-", ""), color: statusColors[o.status].split(" ")[1].replace("text-", "") } : {}}>{o.status}</span>
                                                <button 
                                                    onClick={() => window.location.href = `/hod/observations/${o.id}`}
                                                    className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                                                >
                                                    {o.status === "PENDING" ? "Conduct →" : "View Artifact →"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                    }
                </div>
            </div>
        </div>
    );
}
