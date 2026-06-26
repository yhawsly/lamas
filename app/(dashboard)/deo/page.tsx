"use client";
import { useEffect, useState } from "react";
import SearchableSelect from "@/components/ui/SearchableSelect";
import Loader from "@/components/ui/Loader";
import GreetingHeader from "@/components/ui/GreetingHeader";
import { useRouter } from "next/navigation";

export default function DeoDashboard() {
    const router = useRouter();
    const [assignments, setAssignments] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [lecturers, setLecturers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Form State
    const [reviewType, setReviewType] = useState<"A" | "B" | "C">("A");
    const [form, setForm] = useState({ lecturerId: "", observerId: "", courseCode: "" });
    const [msg, setMsg] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [obsRes, teachRes, modRes, coursesData, lecturersData] = await Promise.all([
                fetch("/api/observations?limit=100").then(r => r.json()),
                fetch("/api/teaching-observations").then(r => r.json()),
                fetch("/api/moderations").then(r => r.json()),
                fetch("/api/courses").then(r => r.json()),
                fetch("/api/lecturers").then(r => r.json())
            ]);

            setCourses(Array.isArray(coursesData) ? coursesData : []);
            setLecturers(Array.isArray(lecturersData) ? lecturersData : []);

            const obs = (obsRes.data || (Array.isArray(obsRes) ? obsRes : [])).map((o: any) => ({ ...o, formType: "A", typeName: "Instructional Materials" }));
            const teach = (Array.isArray(teachRes) ? teachRes : []).map((o: any) => ({ ...o, formType: "B", typeName: "Teaching Observation" }));
            const mod = (Array.isArray(modRes) ? modRes : []).map((o: any) => ({ ...o, formType: "C", typeName: "Exam Moderation", observerId: o.moderatorId }));

            setAssignments([...obs, ...teach, ...mod].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch (err) {
            console.error("Failed to load data:", err);
        } finally {
            setLoading(false);
        }
    };

    async function assign(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);
        
        let endpoint = "";
        const body: any = { courseCode: form.courseCode, lecturerId: parseInt(form.lecturerId) };

        if (reviewType === "A") {
            endpoint = "/api/observations";
            body.observerId = parseInt(form.observerId);
        } else if (reviewType === "B") {
            endpoint = "/api/teaching-observations";
            body.observerId = parseInt(form.observerId);
        } else if (reviewType === "C") {
            endpoint = "/api/moderations";
            body.moderatorId = parseInt(form.observerId);
        }

        try {
            const res = await fetch(endpoint, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (res.ok) { 
                setMsg("✅ Review assigned successfully!"); 
                setForm({ lecturerId: "", observerId: "", courseCode: "" }); 
                loadData();
            } else { 
                const errData = await res.json().catch(() => ({}));
                setMsg(`❌ ${errData.error || "Failed to assign."}`); 
            }
        } catch (err) {
            setMsg("❌ Network error.");
        } finally {
            setIsSubmitting(false);
            setTimeout(() => setMsg(""), 3000);
        }
    }

    const statusColors: Record<string, string> = { 
        PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300", 
        COMPLETED: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300", 
        REVIEWED: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300" 
    };

    const getRoute = (formType: string, id: number) => {
        if (formType === "A") return `/deo/observations/${id}`;
        if (formType === "B") return `/deo/teaching-observations/${id}`;
        if (formType === "C") return `/deo/moderations/${id}`;
        return "#";
    };

    const partnerLabel = reviewType === "C" ? "Assigned Moderator" : "Assigned Observer";

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="mb-8">
                <GreetingHeader subtitle="Centralized dispatch for peer reviews, teaching observations, and moderations." />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Creation Column */}
                <div className="lg:col-span-1 rounded-3xl p-6 shadow-sm border h-fit sticky top-24" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                    <h3 className="font-semibold mb-6 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                        <span>➕</span> Dispatch Review
                    </h3>
                    
                    {msg && (
                        <div className={`mb-6 p-3 rounded-xl text-sm border`} style={{ 
                            backgroundColor: msg.startsWith("✅") ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", 
                            borderColor: msg.startsWith("✅") ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)", 
                            color: msg.startsWith("✅") ? "#10b981" : "#ef4444" 
                        }}>
                            {msg}
                        </div>
                    )}
                    
                    <form onSubmit={assign} className="space-y-5">
                        <div>
                            <label className="block text-sm mb-1.5 font-bold" style={{ color: "var(--text-secondary)" }}>Review Type</label>
                            <select
                                value={reviewType}
                                onChange={(e) => setReviewType(e.target.value as "A" | "B" | "C")}
                                className="w-full bg-white dark:bg-slate-850 border rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/30 transition shadow-sm"
                                style={{ borderColor: "var(--bg-border)", color: "var(--text-primary)" }}
                            >
                                <option value="A">Form A - Instructional Materials</option>
                                <option value="B">Form B - Teaching Observation</option>
                                <option value="C">Form C - Examination Moderation</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm mb-1.5" style={{ color: "var(--text-muted)" }}>Course Code</label>
                            <SearchableSelect
                                value={form.courseCode}
                                onChange={(val) => setForm(p => ({ ...p, courseCode: String(val) }))}
                                options={courses.map(c => ({ label: `${c.code} - ${c.title}`, value: c.code }))}
                                placeholder="Search Course..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm mb-1.5" style={{ color: "var(--text-muted)" }}>{reviewType === "C" ? "Internal Examiner" : "Lecturer to Observe"}</label>
                            <SearchableSelect
                                value={form.lecturerId}
                                onChange={(val) => setForm(p => ({ ...p, lecturerId: String(val) }))}
                                options={lecturers.map(l => ({ label: `${l.name} (${l.email})`, value: String(l.id) }))}
                                placeholder="Select target..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm mb-1.5" style={{ color: "var(--text-muted)" }}>{partnerLabel}</label>
                            <SearchableSelect
                                value={form.observerId}
                                onChange={(val) => setForm(p => ({ ...p, observerId: String(val) }))}
                                options={lecturers.map(l => ({ label: `${l.name} (${l.email})`, value: String(l.id) }))}
                                placeholder={`Select ${reviewType === "C" ? "Moderator" : "Observer"}...`}
                                disabledValues={form.lecturerId ? [form.lecturerId] : []}
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSubmitting || !form.courseCode || !form.lecturerId || !form.observerId} 
                            className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex justify-center items-center gap-2" 
                            style={{ backgroundColor: "var(--primary)", boxShadow: "0 8px 16px -4px var(--primary-muted)" }}
                        >
                            {isSubmitting ? <span className="animate-pulse">Dispatching...</span> : <span>Assign {reviewType === "A" ? "Form A" : reviewType === "B" ? "Form B" : "Form C"}</span>}
                        </button>
                    </form>
                </div>

                {/* Registry Column */}
                <div className="lg:col-span-2 rounded-3xl p-6 shadow-sm border" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                    <h3 className="font-semibold mb-6 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                        <span>📋</span> Assignments Registry
                    </h3>
                    
                    {loading ? (
                        <div className="py-20"><Loader message="Synchronizing Registry..." /></div>
                    ) : assignments.length === 0 ? (
                        <div className="text-center py-20" style={{ color: "var(--text-muted)" }}>
                            <div className="text-4xl mb-4">📭</div>
                            <p>No reviews assigned yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {assignments.map(o => (
                                <div key={`${o.formType}-${o.id}`} className="group p-4 rounded-2xl transition-all hover:shadow-md border" style={{ backgroundColor: "var(--bg-hover)", borderColor: "var(--bg-border)" }}>
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl shrink-0 border" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                                                <span className="text-[10px] font-black uppercase text-slate-400">FORM</span>
                                                <span className="text-lg font-black" style={{ color: "var(--text-primary)" }}>{o.formType}</span>
                                            </div>
                                            <div>
                                                <div className="font-bold text-base flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                                                    {o.courseCode}
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${statusColors[o.status]}`}>
                                                        {o.status}
                                                    </span>
                                                </div>
                                                <div className="text-xs mt-1 font-medium" style={{ color: "var(--text-secondary)" }}>
                                                    Target: <span className="font-bold" style={{ color: "var(--text-primary)" }}>{o.lecturer?.name}</span>
                                                </div>
                                                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                                                    Assigned to: {o.formType === "C" ? o.moderator?.name : o.observer?.name}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                                            <div className="text-right hidden sm:block mr-2">
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Dispatched</div>
                                                <div className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{new Date(o.createdAt).toLocaleDateString()}</div>
                                            </div>
                                            <button 
                                                onClick={() => router.push(getRoute(o.formType, o.id))}
                                                className="px-4 py-2 rounded-xl text-xs font-bold transition-all border opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)", color: "var(--text-primary)" }}
                                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--primary)"; e.currentTarget.style.color = "white"; e.currentTarget.style.borderColor = "var(--primary)"; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-surface)"; e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.borderColor = "var(--bg-border)"; }}
                                            >
                                                View Details →
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
