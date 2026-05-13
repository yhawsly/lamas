"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Loader from "@/components/ui/Loader";

const RATINGS = [
    { key: "ratingEngagement",    label: "Student Engagement",     desc: "How effectively the lecturer engaged students" },
    { key: "ratingKnowledge",     label: "Subject Knowledge",       desc: "Depth and accuracy of content delivery" },
    { key: "ratingOrganization",  label: "Lesson Organisation",     desc: "Structure, pacing, and clarity of the session" },
    { key: "ratingActivities",    label: "Learning Activities",     desc: "Quality of in-class tasks and interactions" },
    { key: "ratingTech",          label: "Use of Technology",       desc: "Effective use of tools, slides, and resources" },
    { key: "ratingCommunication", label: "Communication Skills",    desc: "Clarity, tone, and responsiveness to students" },
] as const;

type RatingKey = typeof RATINGS[number]["key"];
type Scores = Record<RatingKey, number>;

const EMPTY_SCORES: Scores = {
    ratingEngagement:    0,
    ratingKnowledge:     0,
    ratingOrganization:  0,
    ratingActivities:    0,
    ratingTech:          0,
    ratingCommunication: 0,
};

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    const [hovered, setHovered] = useState(0);
    return (
        <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map(n => (
                <button
                    key={n}
                    type="button"
                    onMouseEnter={() => setHovered(n)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => onChange(n)}
                    className="text-2xl transition-transform duration-100 hover:scale-110 active:scale-95"
                    aria-label={`Rate ${n} out of 5`}
                >
                    <span style={{
                        color: n <= (hovered || value) ? "#f59e0b" : "var(--bg-border)",
                        filter: n <= (hovered || value) ? "drop-shadow(0 0 4px rgba(245,158,11,0.5))" : "none",
                        transition: "color 0.15s, filter 0.15s",
                    }}>★</span>
                </button>
            ))}
            {value > 0 && (
                <span className="ml-2 text-xs font-bold self-center" style={{ color: "var(--text-muted)" }}>
                    {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][value]}
                </span>
            )}
        </div>
    );
}

export default function ConductObservationPage() {
    const { id } = useParams();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [scores, setScores] = useState<Scores>(EMPTY_SCORES);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch(`/api/observations/${id}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => {
                if (d) {
                    setData(d);
                    setFeedback(d.feedback || "");
                    // Pre-fill saved ratings if they exist
                    setScores({
                        ratingEngagement:    d.ratingEngagement    ?? 0,
                        ratingKnowledge:     d.ratingKnowledge     ?? 0,
                        ratingOrganization:  d.ratingOrganization  ?? 0,
                        ratingActivities:    d.ratingActivities    ?? 0,
                        ratingTech:          d.ratingTech          ?? 0,
                        ratingCommunication: d.ratingCommunication ?? 0,
                    });
                }
                setLoading(false);
            });
    }, [id]);

    const allRated = RATINGS.every(r => scores[r.key] > 0);
    const avgScore = allRated
        ? Math.round((Object.values(scores).reduce((a, b) => a + b, 0) / RATINGS.length) * 20)
        : null;

    const handleSave = async () => {
        if (!feedback.trim()) { setError("Please enter written feedback before saving."); return; }
        if (!allRated)        { setError("Please rate all 6 categories before saving.");  return; }
        setError("");
        setSaving(true);
        try {
            const res = await fetch(`/api/observations/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ feedback, ...scores }),
            });
            if (res.ok) router.push("/hod/observations");
            else setError("Failed to save. Please try again.");
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading || !data) return <Loader message="Synchronizing Observation Artifact..." />;

    const lecturer = data.lecturer?.name || "Unknown Lecturer";
    const isCompleted = data.status !== "PENDING";

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">

            {/* Header */}
            <div className="flex justify-between items-end pb-6 border-b" style={{ borderColor: "var(--bg-border)" }}>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                        Observation Report
                    </h1>
                    <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                        {lecturer} · {data.courseCode} · {new Date(data.sessionDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${
                    data.status === "PENDING"
                        ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                }`}>
                    {data.status}
                </div>
            </div>

            {/* Overall score banner — only shows when all rated */}
            {avgScore !== null && (
                <div className="flex items-center gap-4 p-5 rounded-2xl border" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                    <div className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl"
                        style={{ background: "linear-gradient(135deg,#3b82f6,#10b981)", color: "white" }}>
                        {avgScore}%
                    </div>
                    <div>
                        <p className="font-bold" style={{ color: "var(--text-primary)" }}>Overall Performance Score</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>Average across all 6 rating dimensions · Feeds into the Pedagogical Radar chart</p>
                    </div>
                </div>
            )}

            {/* Rating Categories */}
            <div className="rounded-3xl p-8 space-y-7" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                <div>
                    <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Performance Ratings</h2>
                    <p className="text-xs mt-1 uppercase tracking-widest font-bold" style={{ color: "var(--text-muted)" }}>Rate each dimension 1–5 stars</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {RATINGS.map(r => (
                        <div key={r.key} className="p-5 rounded-2xl space-y-3 transition-all" style={{ background: "var(--bg-hover)", border: "1px solid var(--bg-border)" }}>
                            <div>
                                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{r.label}</p>
                                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{r.desc}</p>
                            </div>
                            <StarRating
                                value={scores[r.key]}
                                onChange={v => setScores(prev => ({ ...prev, [r.key]: v }))}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Written Feedback */}
            <div className="rounded-3xl p-8 space-y-4" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                <div>
                    <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Written Feedback</h2>
                    <p className="text-xs mt-1 uppercase tracking-widest font-bold" style={{ color: "var(--text-muted)" }}>Qualitative notes · Registry Entry</p>
                </div>
                <textarea
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    rows={10}
                    disabled={isCompleted}
                    placeholder="Enter observation notes, strengths observed, and areas recommended for improvement..."
                    className="w-full p-5 rounded-2xl text-sm leading-relaxed outline-none transition-all resize-none"
                    style={{
                        background: "var(--bg-hover)",
                        border: "1px solid var(--bg-border)",
                        color: "var(--text-primary)",
                        opacity: isCompleted ? 0.7 : 1,
                    }}
                />
                {isCompleted && (
                    <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                        ℹ️ This observation is already completed. Shown in read-only mode.
                    </p>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 rounded-2xl border text-sm font-medium" style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.25)", color: "#f87171" }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Save Button */}
            {!isCompleted && (
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-4 rounded-2xl text-white font-bold text-sm uppercase tracking-widest shadow-xl transition-all disabled:opacity-50 hover:opacity-90 active:scale-[0.99]"
                    style={{ background: "linear-gradient(to right, var(--primary), #10b981)", boxShadow: "0 8px 24px -4px rgba(59,130,246,0.3)" }}
                >
                    {saving ? "Saving Observation..." : "Save & Complete Observation"}
                </button>
            )}
        </div>
    );
}
