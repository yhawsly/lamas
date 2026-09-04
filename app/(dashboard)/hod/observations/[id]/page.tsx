"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AlertTriangle, AlertCircle, Calendar } from "lucide-react";
import { useTerm } from "@/context/TermContext";
import { ReviewDossierViewer } from "@/features/observations";
import { getCourseTitle } from "@/features/curriculum";
import { INSTITUTIONAL_VENUES } from "@/lib/venues";

const DetailWorkspaceSkeleton = () => (
    <div className="max-w-4xl mx-auto space-y-8 animate-pulse pb-20 pt-6 px-4">
        {/* Header Skeleton */}
        <div className="space-y-3">
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700/80 rounded" />
            <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700/80 rounded-lg" />
            <div className="h-4 w-96 bg-slate-200 dark:bg-slate-700/80 rounded-lg" />
        </div>

        {/* Info Card Skeleton */}
        <div className="rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="space-y-2">
                        <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700/80 rounded" />
                        <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700/80 rounded" />
                    </div>
                ))}
            </div>
        </div>

        {/* Form Body Skeleton */}
        <div className="rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700/80 rounded" />
            <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="h-4 w-72 bg-slate-200 dark:bg-slate-700/80 rounded" />
                        <div className="flex gap-2">
                            <div className="h-5 w-12 bg-slate-200 dark:bg-slate-700/80 rounded" />
                            <div className="h-5 w-12 bg-slate-200 dark:bg-slate-700/80 rounded" />
                        </div>
                    </div>
                ))}
            </div>
            <div className="space-y-2">
                <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-700/80 rounded" />
                <div className="h-20 w-full bg-slate-200 dark:bg-slate-700/80 rounded-2xl" />
            </div>
            <div className="flex justify-end gap-3">
                <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700/80 rounded-xl" />
                <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700/80 rounded-xl" />
            </div>
        </div>
    </div>
);

// Define Form A types
type FormAReviewData = {
    materialsReviewed: {
        courseOutline: boolean;
        mainTextbook: boolean;
        lectureNotes: boolean;
        otherTLMs: boolean;
    };
    criteria: {
        courseOutline: {
            formatConforms: number | null;
            descConforms: number | null;
            objSpecific: number | null;
            outcomesAchievable: number | null;
            topicsRelevant: number | null;
            remarks: Record<string, string>;
        };
        mainTextbook: {
            coversContent: number | null;
            isCurrent: number | null;
            isAccessible: number | null;
            remarks: Record<string, string>;
        };
        lectureNotes: {
            linkedToContent: number | null;
            clear: number | null;
            concise: number | null;
            wellOrganized: number | null;
            remarks: Record<string, string>;
        };
        otherTLMs: {
            relevant: number | null;
            suitable: number | null;
            remarks: Record<string, string>;
        };
    };
    strengthsWeaknesses: {
        courseOutline: { strengths: string; weaknesses: string };
        mainTextbook: { strengths: string; weaknesses: string };
        lectureNotes: { strengths: string; weaknesses: string };
        otherTLMs: { strengths: string; weaknesses: string };
    };
    recommendations: string;
    overallRating: "Excellent" | "Very Good" | "Good" | "Fair" | "Poor" | null;
};

const DEFAULT_FORM_A: FormAReviewData = {
    materialsReviewed: { courseOutline: false, mainTextbook: false, lectureNotes: false, otherTLMs: false },
    criteria: {
        courseOutline: { formatConforms: null, descConforms: null, objSpecific: null, outcomesAchievable: null, topicsRelevant: null, remarks: {} },
        mainTextbook: { coversContent: null, isCurrent: null, isAccessible: null, remarks: {} },
        lectureNotes: { linkedToContent: null, clear: null, concise: null, wellOrganized: null, remarks: {} },
        otherTLMs: { relevant: null, suitable: null, remarks: {} },
    },
    strengthsWeaknesses: {
        courseOutline: { strengths: "", weaknesses: "" },
        mainTextbook: { strengths: "", weaknesses: "" },
        lectureNotes: { strengths: "", weaknesses: "" },
        otherTLMs: { strengths: "", weaknesses: "" },
    },
    recommendations: "",
    overallRating: null
};

export default function ConductObservationPage() {
    const { id } = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const { isArchiveMode } = useTerm();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    
    const [reviewData, setReviewData] = useState<FormAReviewData>(DEFAULT_FORM_A);
    const [feedback, setFeedback] = useState("");
    const [scheduleDate, setScheduleDate] = useState("");
    const [scheduleTime, setScheduleTime] = useState("");
    const [scheduleVenue, setScheduleVenue] = useState("");
    const [scheduling, setScheduling] = useState(false);

    useEffect(() => {
        fetch(`/api/observations/${id}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => {
                if (d) {
                    setData(d);
                    setFeedback(d.feedback || "");
                    if (d.sessionDate) {
                        const dt = new Date(d.sessionDate);
                        const yyyy = dt.getFullYear();
                        const mm = String(dt.getMonth() + 1).padStart(2, '0');
                        const dd = String(dt.getDate()).padStart(2, '0');
                        setScheduleDate(`${yyyy}-${mm}-${dd}`);
                        const hh = String(dt.getHours()).padStart(2, '0');
                        const min = String(dt.getMinutes()).padStart(2, '0');
                        setScheduleTime(`${hh}:${min}`);
                    }
                    if (d.venue) setScheduleVenue(d.venue);
                    if (d.reviewData) {
                        setReviewData({
                            materialsReviewed: { ...DEFAULT_FORM_A.materialsReviewed, ...d.reviewData.materialsReviewed },
                            criteria: {
                                courseOutline: { ...DEFAULT_FORM_A.criteria.courseOutline, ...(d.reviewData.criteria?.courseOutline || {}) },
                                mainTextbook: { ...DEFAULT_FORM_A.criteria.mainTextbook, ...(d.reviewData.criteria?.mainTextbook || {}) },
                                lectureNotes: { ...DEFAULT_FORM_A.criteria.lectureNotes, ...(d.reviewData.criteria?.lectureNotes || {}) },
                                otherTLMs: { ...DEFAULT_FORM_A.criteria.otherTLMs, ...(d.reviewData.criteria?.otherTLMs || {}) },
                            },
                            strengthsWeaknesses: {
                                courseOutline: { ...DEFAULT_FORM_A.strengthsWeaknesses.courseOutline, ...(d.reviewData.strengthsWeaknesses?.courseOutline || {}) },
                                mainTextbook: { ...DEFAULT_FORM_A.strengthsWeaknesses.mainTextbook, ...(d.reviewData.strengthsWeaknesses?.mainTextbook || {}) },
                                lectureNotes: { ...DEFAULT_FORM_A.strengthsWeaknesses.lectureNotes, ...(d.reviewData.strengthsWeaknesses?.lectureNotes || {}) },
                                otherTLMs: { ...DEFAULT_FORM_A.strengthsWeaknesses.otherTLMs, ...(d.reviewData.strengthsWeaknesses?.otherTLMs || {}) },
                            },
                            recommendations: d.reviewData.recommendations || "",
                            overallRating: d.reviewData.overallRating || null,
                        });
                    }
                }
                setLoading(false);
            });
    }, [id]);

    const handleSave = async () => {
        if (isArchiveMode) {
            setError("Action Disabled: You are viewing a read-only historical archive.");
            return;
        }
        setError("");
        setSaving(true);
        // Map recommendation and feedback together for backward compatibility
        const finalFeedback = reviewData.recommendations || feedback;
        
        try {
            const res = await fetch(`/api/observations/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ feedback: finalFeedback, reviewData }),
            });
            if (res.ok) {
                const role = (session?.user as any)?.role;
                if (role === "LECTURER") router.push("/lecturer/appraisals");
                else router.push("/hod/observations");
            }
            else setError("Failed to save. Please try again.");
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleSchedule = async () => {
        if (isArchiveMode) {
            setError("Action Disabled: You are viewing a read-only historical archive.");
            return;
        }
        if (!scheduleDate || !scheduleTime) return setError("Please select both a date and a time.");
        setError("");
        setScheduling(true);
        try {
            const dateObj = new Date(scheduleDate);
            const [hrs, mins] = scheduleTime.split(":");
            dateObj.setHours(parseInt(hrs), parseInt(mins));
            const combinedDateTime = dateObj.toISOString();

            const res = await fetch(`/api/observations/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionDate: combinedDateTime, venue: scheduleVenue }),
            });
            if (res.ok) {
                const d = await res.json();
                setData(d);
            }
            else setError("Failed to update schedule.");
        } catch {
            setError("Network error.");
        } finally {
            setScheduling(false);
        }
    };

    if (loading || !data) return <DetailWorkspaceSkeleton />;

    const lecturer = data.lecturer?.name || "Unknown Lecturer";
    const isCompleted = data.status !== "PENDING";
    const isBlocked = data.isObserveeAssigned === false;
    const isObserverUser = parseInt(session?.user?.id || "0") === data.observerId;
    const isDisabled = isCompleted || isBlocked || !isObserverUser || isArchiveMode;

    const renderRadioGroup = (section: keyof FormAReviewData["criteria"], field: string, sn: number, text: string) => {
        const sectionCriteria = (reviewData?.criteria?.[section] || DEFAULT_FORM_A.criteria[section]) as any;
        const currentVal = sectionCriteria?.[field];
        const currentRemark = sectionCriteria?.remarks?.[field] || "";

        return (
            <tr className="border-t hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" style={{ borderColor: "var(--bg-border)" }}>
                <td className="py-3 px-4 text-center w-12 font-medium" style={{ color: "var(--text-muted)" }}>{sn}.</td>
                <td className="py-3 px-4 text-sm" style={{ color: "var(--text-primary)" }}>{text}</td>
                {[3, 2, 1].map(val => (
                    <td key={val} className="py-3 px-4 text-center">
                        <input 
                            type="radio" 
                            name={`${section}-${field}`} 
                            disabled={isDisabled}
                            checked={currentVal === val}
                            onChange={() => setReviewData(prev => ({
                                ...prev,
                                criteria: {
                                    ...prev.criteria,
                                    [section]: { ...(prev.criteria?.[section] || {}), [field]: val }
                                }
                            }))}
                            className="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                        />
                    </td>
                ))}
                <td className="py-3 px-4">
                    <input 
                        type="text" 
                        disabled={isDisabled}
                        value={currentRemark}
                        onChange={(e) => {
                            const val = e.target.value;
                            setReviewData(prev => ({
                                ...prev,
                                criteria: {
                                    ...prev.criteria,
                                    [section]: {
                                        ...(prev.criteria?.[section] || {}),
                                        remarks: { ...((prev.criteria?.[section] as any)?.remarks || {}), [field]: val }
                                    }
                                }
                            }));
                        }}
                        className="w-full bg-transparent border-b outline-none text-sm px-2 py-1 focus:border-primary transition-colors" 
                        style={{ borderColor: "var(--bg-border)", color: "var(--text-primary)" }}
                    />
                </td>
            </tr>
        );
    };

    const renderStrengthsWeaknesses = (section: keyof FormAReviewData["strengthsWeaknesses"], label: string) => {
        return (
            <tr className="border-t" style={{ borderColor: "var(--bg-border)" }}>
                <td className="py-3 px-4 font-medium text-sm w-1/4" style={{ color: "var(--text-primary)" }}>{label}</td>
                <td className="py-3 px-4 w-3/8 border-l" style={{ borderColor: "var(--bg-border)" }}>
                    <textarea 
                        disabled={isDisabled}
                        value={reviewData.strengthsWeaknesses[section].strengths}
                        onChange={(e) => setReviewData(prev => ({
                            ...prev,
                            strengthsWeaknesses: {
                                ...prev.strengthsWeaknesses,
                                [section]: { ...prev.strengthsWeaknesses[section], strengths: e.target.value }
                            }
                        }))}
                        className="w-full bg-transparent outline-none text-sm p-2 resize-none h-20"
                        style={{ color: "var(--text-primary)" }}
                    />
                </td>
                <td className="py-3 px-4 w-3/8 border-l" style={{ borderColor: "var(--bg-border)" }}>
                    <textarea 
                        disabled={isDisabled}
                        value={reviewData.strengthsWeaknesses[section].weaknesses}
                        onChange={(e) => setReviewData(prev => ({
                            ...prev,
                            strengthsWeaknesses: {
                                ...prev.strengthsWeaknesses,
                                [section]: { ...prev.strengthsWeaknesses[section], weaknesses: e.target.value }
                            }
                        }))}
                        className="w-full bg-transparent outline-none text-sm p-2 resize-none h-20"
                        style={{ color: "var(--text-primary)" }}
                    />
                </td>
            </tr>
        );
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-start pb-6 border-b" style={{ borderColor: "var(--bg-border)" }}>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>
                        Instructional Materials Review Report
                    </h1>
                    <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--text-secondary)" }}>
                        Academic Peer Review - APR Form A
                    </h2>
                    <div className="text-sm space-y-1" style={{ color: "var(--text-secondary)" }}>
                        <p><strong>Course Lecturer:</strong> {lecturer}</p>
                        <p><strong>Course:</strong> <span className="font-bold text-blue-600 dark:text-blue-400">{data.courseCode}</span>{getCourseTitle(data.courseCode) && <span className="font-medium text-slate-700 dark:text-slate-300"> — {getCourseTitle(data.courseCode)}</span>}</p>
                        {data.sessionDate && <p><strong>Scheduled Session:</strong> {new Date(data.sessionDate).toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>}
                        {data.venue && <p><strong>Venue/Location:</strong> {data.venue}</p>}
                    </div>
                </div>
                <div className="flex flex-col items-end gap-3 mt-4 md:mt-0">
                    <button onClick={() => router.back()} className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors font-bold flex items-center gap-2 shadow-sm text-sm border border-slate-200 dark:border-slate-700">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Go Back
                    </button>
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${
                        data.status === "PENDING"
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    }`}>
                        {data.status}
                    </div>
                </div>
            </div>

            {/* Warning Banner */}
            {isBlocked && (
                <div className="p-6 rounded-3xl border flex gap-4 items-start shadow-sm" style={{ backgroundColor: "rgba(239, 68, 68, 0.08)", borderColor: "rgba(239, 68, 68, 0.2)", color: "#ef4444" }}>
                    <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-white shadow-sm mt-0.5 bg-red-500">
                        <AlertTriangle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-[15px] mb-1.5">Review Blocked</h3>
                        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                            The observed lecturer ({lecturer}) is not assigned to course {data.courseCode}. The DEO has been notified, and you are not allowed to conduct this review.
                        </p>
                    </div>
                </div>
            )}

            {/* Scheduling Card */}
            {(!data.sessionDate || !data.venue) && !isCompleted && !isBlocked && (
                <div className="rounded-2xl shadow-sm border p-6 bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
                    <h4 className="font-bold mb-4 text-blue-800 dark:text-blue-300 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>Schedule Observation</span>
                    </h4>
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-xs font-bold mb-1.5 text-blue-700/70 dark:text-blue-400/70 uppercase tracking-widest">Date</label>
                            <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 border-blue-200 dark:border-slate-700" />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-bold mb-1.5 text-blue-700/70 dark:text-blue-400/70 uppercase tracking-widest">Time</label>
                            <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 border-blue-200 dark:border-slate-700" />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-bold mb-1.5 text-blue-700/70 dark:text-blue-400/70 uppercase tracking-widest">Venue/Location</label>
                            <select
                                value={scheduleVenue}
                                onChange={e => setScheduleVenue(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 border-blue-200 dark:border-slate-700 font-semibold cursor-pointer text-slate-800 dark:text-slate-100"
                            >
                                <option value="" disabled>Select Venue...</option>
                                {INSTITUTIONAL_VENUES.map(v => (
                                    <option key={v.value} value={v.value}>{v.label}</option>
                                ))}
                                {scheduleVenue && !INSTITUTIONAL_VENUES.some(v => v.value === scheduleVenue) && (
                                    <option value={scheduleVenue}>{scheduleVenue}</option>
                                )}
                            </select>
                        </div>
                        <button onClick={handleSchedule} disabled={scheduling} className="w-full md:w-auto px-6 py-2.5 rounded-xl text-white font-bold text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm cursor-pointer">
                            {scheduling ? "Saving..." : "Lock Schedule"}
                        </button>
                    </div>

                    {/* Quick Pick Venues */}
                    <div className="mt-3 pt-3 border-t border-blue-200/60 dark:border-blue-800/60 flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-blue-700/70 dark:text-blue-400/70 uppercase tracking-wider">Quick Pick:</span>
                        {INSTITUTIONAL_VENUES.map(v => (
                            <button
                                key={v.value}
                                type="button"
                                onClick={() => setScheduleVenue(v.value)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                                    scheduleVenue === v.value
                                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-blue-200 dark:border-slate-700 hover:border-blue-400 hover:text-blue-600"
                                }`}
                            >
                                {v.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Target Lecturer Course Dossier & Educational Materials Viewer */}
            <ReviewDossierViewer
                courseCode={data.courseCode}
                lecturerId={data.lecturerId}
                lecturerName={lecturer}
                reviewType="A"
            />

            {/* Materials Reviewed Checkboxes */}
            <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                <h4 className="font-bold mb-4" style={{ color: "var(--text-primary)" }}>Instructional Materials Reviewed:</h4>
                <div className="flex flex-wrap gap-8">
                    {[
                        { key: "courseOutline", label: "Course Outline" },
                        { key: "mainTextbook", label: "Main Textbook" },
                        { key: "lectureNotes", label: "Lecture Notes" },
                        { key: "otherTLMs", label: "Other TLMs" }
                    ].map(mat => (
                        <label key={mat.key} className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox"
                                disabled={isDisabled}
                                checked={reviewData.materialsReviewed[mat.key as keyof typeof reviewData.materialsReviewed]}
                                onChange={(e) => setReviewData(prev => ({
                                    ...prev,
                                    materialsReviewed: { ...prev.materialsReviewed, [mat.key]: e.target.checked }
                                }))}
                                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span style={{ color: "var(--text-secondary)" }}>{mat.label}</span>
                        </label>
                    ))}
                </div>
                <p className="text-xs mt-3 italic" style={{ color: "var(--text-muted)" }}>(e.g. Supplementary Texts, Videos, Slides, Journal Articles, etc.)</p>
            </div>

            {/* Scale Instruction */}
            <p className="text-sm font-medium italic text-center" style={{ color: "var(--text-secondary)" }}>
                Please indicate a tick in the column that most closely reflects your opinion using the three (3) point scale below:
                <br/>[3=Agree; 2=Quite Agree; 1=Disagree]
            </p>

            {/* Criteria Evaluation Table */}
            <div className="overflow-x-auto rounded-2xl shadow-sm border" style={{ borderColor: "var(--bg-border)" }}>
                <table className="w-full text-left border-collapse" style={{ backgroundColor: "var(--bg-surface)" }}>
                    <thead>
                        <tr className="border-b" style={{ borderColor: "var(--bg-border)", backgroundColor: "rgba(0,0,0,0.02)" }}>
                            <th className="py-3 px-4 font-bold text-center w-12" style={{ color: "var(--text-primary)" }}>S/N</th>
                            <th className="py-3 px-4 font-bold" style={{ color: "var(--text-primary)" }}>Criteria</th>
                            <th className="py-3 px-4 font-bold text-center w-12" style={{ color: "var(--text-primary)" }}>3</th>
                            <th className="py-3 px-4 font-bold text-center w-12" style={{ color: "var(--text-primary)" }}>2</th>
                            <th className="py-3 px-4 font-bold text-center w-12" style={{ color: "var(--text-primary)" }}>1</th>
                            <th className="py-3 px-4 font-bold w-48" style={{ color: "var(--text-primary)" }}>Remark (if any)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Course Outline */}
                        <tr className="border-b"><td colSpan={6} className="py-2 px-4 font-bold bg-slate-50/50 dark:bg-slate-800/20 text-center" style={{ color: "var(--text-primary)", borderColor: "var(--bg-border)" }}>Course Outline</td></tr>
                        {renderRadioGroup("courseOutline", "formatConforms", 1, "The course outline conforms to the prescribed format of the University.")}
                        {renderRadioGroup("courseOutline", "descConforms", 2, "The course description conforms with the approved curriculum.")}
                        {renderRadioGroup("courseOutline", "objSpecific", 3, "The course objectives are specific.")}
                        {renderRadioGroup("courseOutline", "outcomesAchievable", 4, "The learning outcomes are achievable.")}
                        {renderRadioGroup("courseOutline", "topicsRelevant", 5, "The topics are relevant to the course.")}
                        
                        {/* Main Textbook */}
                        <tr className="border-b"><td colSpan={6} className="py-2 px-4 font-bold bg-slate-50/50 dark:bg-slate-800/20 text-center" style={{ color: "var(--text-primary)", borderColor: "var(--bg-border)" }}>Main Textbook</td></tr>
                        {renderRadioGroup("mainTextbook", "coversContent", 6, "The textbook covers the course content.")}
                        {renderRadioGroup("mainTextbook", "isCurrent", 7, "The textbook is current. [1-5 years = 3, 6-10 years = 2, and Above 10 years = 1]")}
                        {renderRadioGroup("mainTextbook", "isAccessible", 8, "The textbook is accessible.")}

                        {/* Lecture Notes */}
                        <tr className="border-b"><td colSpan={6} className="py-2 px-4 font-bold bg-slate-50/50 dark:bg-slate-800/20 text-center" style={{ color: "var(--text-primary)", borderColor: "var(--bg-border)" }}>Lecture Notes</td></tr>
                        {renderRadioGroup("lectureNotes", "linkedToContent", 9, "The lecture notes are linked to the course content.")}
                        {renderRadioGroup("lectureNotes", "clear", 10, "The lecture notes are clear.")}
                        {renderRadioGroup("lectureNotes", "concise", 11, "The lecture notes are concise.")}
                        {renderRadioGroup("lectureNotes", "wellOrganized", 12, "The lecture notes are well organized.")}

                        {/* Other TLMs */}
                        <tr className="border-b"><td colSpan={6} className="py-2 px-4 font-bold bg-slate-50/50 dark:bg-slate-800/20 text-center" style={{ color: "var(--text-primary)", borderColor: "var(--bg-border)" }}>Other TLMs (if applicable)</td></tr>
                        {renderRadioGroup("otherTLMs", "relevant", 13, "The TLMs are relevant to the course.")}
                        {renderRadioGroup("otherTLMs", "suitable", 14, "The TLMs are suitable for the students.")}
                    </tbody>
                </table>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: "var(--bg-border)", backgroundColor: "var(--bg-surface)" }}>
                <div className="p-4 border-b" style={{ borderColor: "var(--bg-border)" }}>
                    <h4 className="font-bold" style={{ color: "var(--text-primary)" }}>15. Strengths and Weaknesses of Instructional Materials</h4>
                </div>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b bg-slate-50/50 dark:bg-slate-800/20" style={{ borderColor: "var(--bg-border)" }}>
                            <th className="py-3 px-4 font-bold w-1/4" style={{ color: "var(--text-primary)" }}>Instructional Materials</th>
                            <th className="py-3 px-4 font-bold w-3/8 border-l text-center" style={{ color: "var(--text-primary)", borderColor: "var(--bg-border)" }}>Strengths</th>
                            <th className="py-3 px-4 font-bold w-3/8 border-l text-center" style={{ color: "var(--text-primary)", borderColor: "var(--bg-border)" }}>Weaknesses</th>
                        </tr>
                    </thead>
                    <tbody>
                        {renderStrengthsWeaknesses("courseOutline", "Course Outline")}
                        {renderStrengthsWeaknesses("mainTextbook", "Main Textbook")}
                        {renderStrengthsWeaknesses("lectureNotes", "Lecture Notes")}
                        {renderStrengthsWeaknesses("otherTLMs", "Other TLMs")}
                    </tbody>
                </table>
            </div>

            {/* Recommendations */}
            <div className="rounded-2xl shadow-sm border p-6" style={{ borderColor: "var(--bg-border)", backgroundColor: "var(--bg-surface)" }}>
                <h4 className="font-bold mb-4" style={{ color: "var(--text-primary)" }}>16. What would you recommend to improve the instructional materials?</h4>
                <textarea 
                    disabled={isDisabled}
                    value={reviewData.recommendations}
                    onChange={(e) => setReviewData(prev => ({ ...prev, recommendations: e.target.value }))}
                    className="w-full bg-transparent border rounded-lg p-4 outline-none transition-colors h-32 resize-none"
                    style={{ borderColor: "var(--bg-border)", color: "var(--text-primary)" }}
                    placeholder="Enter recommendations here..."
                />
            </div>

            {/* Overall Rating */}
            <div className="rounded-2xl shadow-sm border p-6" style={{ borderColor: "var(--bg-border)", backgroundColor: "var(--bg-surface)" }}>
                <h4 className="font-bold mb-6" style={{ color: "var(--text-primary)" }}>17. Overall, how would you rate the instructional materials?</h4>
                <div className="flex flex-wrap gap-6 items-center justify-between max-w-2xl">
                    {["Excellent", "Very Good", "Good", "Fair", "Poor"].map(rating => (
                        <label key={rating} className="flex items-center gap-2 cursor-pointer p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border" style={{ borderColor: reviewData.overallRating === rating ? "var(--primary)" : "transparent" }}>
                            <input 
                                type="radio"
                                name="overallRating"
                                disabled={isDisabled}
                                checked={reviewData.overallRating === rating}
                                onChange={() => setReviewData(prev => ({ ...prev, overallRating: rating as any }))}
                                className="w-5 h-5 text-primary bg-gray-100 border-gray-300 focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
                            />
                            <span className="font-medium" style={{ color: "var(--text-primary)" }}>{rating}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 rounded-2xl border text-sm font-medium flex items-center gap-2" style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.25)", color: "#f87171" }}>
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Save Button */}
            {!isCompleted && !isBlocked && isObserverUser && (
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-4 rounded-2xl text-white font-bold text-sm uppercase tracking-widest shadow-xl transition-all disabled:opacity-50 hover:opacity-90 active:scale-[0.99]"
                    style={{ background: "linear-gradient(to right, var(--primary), #10b981)", boxShadow: "0 8px 24px -4px rgba(59,130,246,0.3)" }}
                >
                    {saving ? "Saving Report..." : "Submit Review Report"}
                </button>
            )}
            
            {isBlocked && (
                <div className="p-4 rounded-2xl border text-center font-bold uppercase tracking-widest text-sm" style={{ backgroundColor: "rgba(239, 68, 68, 0.05)", borderColor: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}>
                    This review is blocked because the lecturer is not assigned to the course
                </div>
            )}
            
            {isCompleted && (
                <p className="text-center text-sm font-bold opacity-50 uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                    This report has been finalized
                </p>
            )}
        </div>
    );
}
