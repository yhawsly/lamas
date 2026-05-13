"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Loader from "@/components/ui/Loader";

export default function ConductObservationPage() {
    const { id } = useParams();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState("");

    useEffect(() => {
        fetch(`/api/observations/${id}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => {
                if (d) {
                    setData(d);
                    setFeedback(d.feedback || "");
                }
                setLoading(false);
            });
    }, [id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/observations/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ feedback })
            });
            if (res.ok) {
                router.push("/hod/observations");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    if (loading || !data) return <Loader message="Synchronizing Observation Artifact..." />;

    const lecturer = data.lecturer?.name || "Unknown Lecturer";

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex justify-between items-end pb-8 border-b border-white/10">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Observation Report</h1>
                    <p className="mt-1" style={{ color: "var(--text-muted)" }}>{lecturer} • {data.courseCode} • {new Date(data.sessionDate).toLocaleDateString()}</p>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${data.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                    {data.status}
                </div>
            </div>

            <div className="rounded-3xl p-8 space-y-6" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                <div>
                    <h2 className="text-xl font-bold">Observation Feedback</h2>
                    <p className="text-xs opacity-60 mt-1 uppercase tracking-widest font-bold">Registry Entry</p>
                </div>
                <textarea 
                    value={feedback} 
                    onChange={e => setFeedback(e.target.value)} 
                    rows={12} 
                    placeholder="Enter observation notes, strengths, and areas for improvement here..."
                    className="w-full p-6 rounded-3xl bg-white/5 border border-white/10 focus:border-primary transition-all outline-none text-sm leading-relaxed"
                />
            </div>

            <button 
                onClick={handleSave} 
                disabled={saving}
                className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50"
            >
                {saving ? "SAVING..." : "SAVE OBSERVATION"}
            </button>
        </div>
    );
}
