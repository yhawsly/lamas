"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Calendar } from "lucide-react";
import ReviewDossierViewer from "@/components/workspace/ReviewDossierViewer";

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

// Define Form B types
type FormBReviewData = {
    metadata: {
        programme: string;
        lessonTopic: string;
        modeOfDelivery: string;
        venue: string;
        lessonPeriodFrom: string;
        lessonPeriodTo: string;
        observationPeriodFrom: string;
        observationPeriodTo: string;
        natureOfTeaching: "Theoretical" | "Practical" | null;
    };
    criteria: {
        startOfLesson: {
            suitablyDressed: number | null;
            punctual: number | null;
            rapport: number | null;
            reviewedPrevious: number | null;
            explainedObjectives: number | null;
            remarks: Record<string, string>;
        };
        delivery: {
            audible: number | null;
            modeAppropriate: number | null;
            paceAppropriate: number | null;
            movementEquitable: number | null;
            sustainedAttention: number | null;
            allowedContributions: number | null;
            allowedQuestions: number | null;
            deliveryEthical: number | null;
            remarks: Record<string, string>;
        };
        conclusion: {
            summarizedSatisfactorily: number | null;
            encouragedExploration: number | null;
            gaveAssignment: number | null;
            remarks: Record<string, string>;
        };
        contentKnowledge: {
            knowledgeable: number | null;
            connectedRealLife: number | null;
            deliveredClearly: number | null;
            usedRelevantMaterials: number | null;
            respondedQuestions: number | null;
            remarks: Record<string, string>;
        };
    };
    strengthsWeaknesses: { strengths: string; weaknesses: string };
    recommendations: string;
    overallRating: "Excellent" | "Very Good" | "Good" | "Fair" | "Poor" | null;
    teacherComments: string;
};

const DEFAULT_FORM_B: FormBReviewData = {
    metadata: { programme: "", lessonTopic: "", modeOfDelivery: "", venue: "", lessonPeriodFrom: "", lessonPeriodTo: "", observationPeriodFrom: "", observationPeriodTo: "", natureOfTeaching: null },
    criteria: {
        startOfLesson: { suitablyDressed: null, punctual: null, rapport: null, reviewedPrevious: null, explainedObjectives: null, remarks: {} },
        delivery: { audible: null, modeAppropriate: null, paceAppropriate: null, movementEquitable: null, sustainedAttention: null, allowedContributions: null, allowedQuestions: null, deliveryEthical: null, remarks: {} },
        conclusion: { summarizedSatisfactorily: null, encouragedExploration: null, gaveAssignment: null, remarks: {} },
        contentKnowledge: { knowledgeable: null, connectedRealLife: null, deliveredClearly: null, usedRelevantMaterials: null, respondedQuestions: null, remarks: {} },
    },
    strengthsWeaknesses: { strengths: "", weaknesses: "" },
    recommendations: "",
    overallRating: null,
    teacherComments: "",
};

export default function ConductTeachingObservationPage() {
    const { id } = useParams();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [scheduleDate, setScheduleDate] = useState("");
    const [scheduleVenue, setScheduleVenue] = useState("");
    const [reviewData, setReviewData] = useState<FormBReviewData>(DEFAULT_FORM_B);

    useEffect(() => {
        fetch(`/api/teaching-observations/${id}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => {
                if (d) {
                    setData(d);
                    if (d.sessionDate) setScheduleDate(new Date(d.sessionDate).toISOString().split('T')[0]);
                    if (d.venue) setScheduleVenue(d.venue);
                    const defaultMeta = {
                        ...DEFAULT_FORM_B.metadata,
                        venue: d.venue || ""
                    };
                    if (d.formBData) {
                        setReviewData({
                            metadata: { 
                                ...defaultMeta, 
                                ...(d.formBData.metadata || {}),
                                venue: d.formBData.metadata?.venue || d.venue || ""
                            },
                            criteria: {
                                startOfLesson: { ...DEFAULT_FORM_B.criteria.startOfLesson, ...(d.formBData.criteria?.startOfLesson || {}) },
                                delivery: { ...DEFAULT_FORM_B.criteria.delivery, ...(d.formBData.criteria?.delivery || {}) },
                                conclusion: { ...DEFAULT_FORM_B.criteria.conclusion, ...(d.formBData.criteria?.conclusion || {}) },
                                contentKnowledge: { ...DEFAULT_FORM_B.criteria.contentKnowledge, ...(d.formBData.criteria?.contentKnowledge || {}) },
                            },
                            strengthsWeaknesses: { ...DEFAULT_FORM_B.strengthsWeaknesses, ...(d.formBData.strengthsWeaknesses || {}) },
                            recommendations: d.formBData.recommendations || "",
                            overallRating: d.formBData.overallRating || null,
                            teacherComments: d.formBData.teacherComments || "",
                        });
                    } else {
                        setReviewData({
                            ...DEFAULT_FORM_B,
                            metadata: defaultMeta
                        });
                    }
                }
                setLoading(false);
            });
    }, [id]);

    const isCompleted = true; // DEO view is strictly read-only

    if (loading || !data) return <DetailWorkspaceSkeleton />;

    const lecturer = data.lecturer?.name || "Unknown Lecturer";


    const renderRadioGroup = (section: keyof FormBReviewData["criteria"], field: string, sn: number, text: string) => {
        const sectionCriteria = (reviewData?.criteria?.[section] || DEFAULT_FORM_B.criteria[section]) as any;
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
                            disabled={isCompleted}
                            checked={currentVal === val}
                            onChange={() => setReviewData(prev => ({
                                ...prev,
                                criteria: {
                                    ...prev.criteria,
                                    [section]: { ...(prev.criteria?.[section] || {}), [field]: val }
                                }
                            }))}
                            className="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
                        />
                    </td>
                ))}
                <td className="py-3 px-4">
                    <input 
                        type="text" 
                        disabled={isCompleted}
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

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-start pb-6 border-b" style={{ borderColor: "var(--bg-border)" }}>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>
                        Teaching Observation Report
                    </h1>
                    <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--text-secondary)" }}>
                        Academic Peer Review - APR Form B
                    </h2>
                    <div className="text-sm space-y-1" style={{ color: "var(--text-secondary)" }}>
                        <p><strong>Course Lecturer:</strong> {lecturer}</p>
                        <p><strong>Course Code:</strong> {data.courseCode}</p>
                        {data.sessionDate && (
                            <p><strong>Scheduled Session:</strong> {new Date(data.sessionDate).toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                        )}
                        {data.venue && <p><strong>Scheduled Venue/Location:</strong> {data.venue}</p>}
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

            {/* Target Lecturer Course Dossier & Educational Materials Viewer */}
            <ReviewDossierViewer
                courseCode={data.courseCode}
                lecturerId={data.lecturerId}
                lecturerName={lecturer}
                reviewType="B"
            />

            {/* Metadata Section */}
            <div className="rounded-2xl shadow-sm border p-6" style={{ borderColor: "var(--bg-border)", backgroundColor: "var(--bg-surface)" }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>Name of Teacher Observed:</p>
                        <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{lecturer}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>Course Code:</p>
                        <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{data.courseCode}</p>
                    </div>
                    
                    <div>
                        <p className="text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>Programme:</p>
                        <input type="text" disabled={isCompleted} value={reviewData.metadata.programme} onChange={e => setReviewData(p => ({...p, metadata: {...p.metadata, programme: e.target.value}}))} className="w-full bg-transparent border-b outline-none px-2 py-1" style={{ borderColor: "var(--bg-border)", color: "var(--text-primary)" }} />
                    </div>
                    <div>
                        <p className="text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>Lesson Topic:</p>
                        <input type="text" disabled={isCompleted} value={reviewData.metadata.lessonTopic} onChange={e => setReviewData(p => ({...p, metadata: {...p.metadata, lessonTopic: e.target.value}}))} className="w-full bg-transparent border-b outline-none px-2 py-1" style={{ borderColor: "var(--bg-border)", color: "var(--text-primary)" }} />
                    </div>
                    
                    <div>
                        <p className="text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>Mode of Delivery:</p>
                        <input type="text" disabled={isCompleted} value={reviewData.metadata.modeOfDelivery} onChange={e => setReviewData(p => ({...p, metadata: {...p.metadata, modeOfDelivery: e.target.value}}))} className="w-full bg-transparent border-b outline-none px-2 py-1" style={{ borderColor: "var(--bg-border)", color: "var(--text-primary)" }} />
                    </div>
                    <div>
                        <p className="text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>Lesson Venue:</p>
                        <input type="text" disabled={isCompleted} value={reviewData.metadata.venue} onChange={e => setReviewData(p => ({...p, metadata: {...p.metadata, venue: e.target.value}}))} className="w-full bg-transparent border-b outline-none px-2 py-1" style={{ borderColor: "var(--bg-border)", color: "var(--text-primary)" }} />
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <p className="text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>Lesson Period (From):</p>
                            <input type="time" disabled={isCompleted} value={reviewData.metadata.lessonPeriodFrom} onChange={e => setReviewData(p => ({...p, metadata: {...p.metadata, lessonPeriodFrom: e.target.value}}))} className="w-full bg-transparent border-b outline-none px-2 py-1" style={{ borderColor: "var(--bg-border)", color: "var(--text-primary)" }} />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>To:</p>
                            <input type="time" disabled={isCompleted} value={reviewData.metadata.lessonPeriodTo} onChange={e => setReviewData(p => ({...p, metadata: {...p.metadata, lessonPeriodTo: e.target.value}}))} className="w-full bg-transparent border-b outline-none px-2 py-1" style={{ borderColor: "var(--bg-border)", color: "var(--text-primary)" }} />
                        </div>
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <p className="text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>Observation Period (From):</p>
                            <input type="time" disabled={isCompleted} value={reviewData.metadata.observationPeriodFrom} onChange={e => setReviewData(p => ({...p, metadata: {...p.metadata, observationPeriodFrom: e.target.value}}))} className="w-full bg-transparent border-b outline-none px-2 py-1" style={{ borderColor: "var(--bg-border)", color: "var(--text-primary)" }} />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>To:</p>
                            <input type="time" disabled={isCompleted} value={reviewData.metadata.observationPeriodTo} onChange={e => setReviewData(p => ({...p, metadata: {...p.metadata, observationPeriodTo: e.target.value}}))} className="w-full bg-transparent border-b outline-none px-2 py-1" style={{ borderColor: "var(--bg-border)", color: "var(--text-primary)" }} />
                        </div>
                    </div>
                </div>

                <div className="mt-6 border-t pt-6" style={{ borderColor: "var(--bg-border)" }}>
                    <p className="text-sm font-medium mb-3" style={{ color: "var(--text-muted)" }}>Nature of Teaching:</p>
                    <div className="flex gap-6">
                        {["Theoretical", "Practical"].map(t => (
                            <label key={t} className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" disabled={isCompleted} checked={reviewData.metadata.natureOfTeaching === t} onChange={() => setReviewData(p => ({...p, metadata: {...p.metadata, natureOfTeaching: t as any}}))} className="w-5 h-5 text-primary" />
                                <span style={{ color: "var(--text-primary)" }}>{t}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* Scheduling Card */}
            {data.sessionDate && data.venue && (
                <div className="rounded-2xl shadow-sm border p-6 bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
                    <h4 className="font-bold mb-4 text-blue-800 dark:text-blue-300 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>Observation Schedule</span>
                    </h4>
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-xs font-bold mb-1.5 text-blue-700/70 dark:text-blue-400/70 uppercase tracking-widest">Date</label>
                            <div className="w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border-blue-200 dark:border-slate-700">{scheduleDate}</div>
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-bold mb-1.5 text-blue-700/70 dark:text-blue-400/70 uppercase tracking-widest">Venue</label>
                            <div className="w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border-blue-200 dark:border-slate-700">{scheduleVenue}</div>
                        </div>
                    </div>
                </div>
            )}

            <p className="text-sm font-medium italic text-center" style={{ color: "var(--text-secondary)" }}>
                Respond to the following statements as fairly as possible. Your frank and constructive comments would assist to improve course quality.<br/>
                Please indicate a tick in the column that most closely reflects your opinion using the three (3) point scale below:<br/>
                [3=Agree; 2=Quite Agree; 1=Disagree]
            </p>

            {/* Evaluation Table */}
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
                        {/* Start of Lesson */}
                        <tr className="border-b"><td colSpan={6} className="py-2 px-4 font-bold bg-slate-50/50 dark:bg-slate-800/20 text-center uppercase tracking-widest text-xs" style={{ color: "var(--text-primary)", borderColor: "var(--bg-border)" }}>Start of the Lesson</td></tr>
                        {renderRadioGroup("startOfLesson", "suitablyDressed", 1, "The teacher was suitably dressed.")}
                        {renderRadioGroup("startOfLesson", "punctual", 2, "The teacher was punctual to the class.")}
                        {renderRadioGroup("startOfLesson", "rapport", 3, "The teacher established a good rapport with the class e.g. by exchanging greetings with the class, expressing a pleasant body language.")}
                        {renderRadioGroup("startOfLesson", "reviewedPrevious", 4, "The teacher reviewed previous lessons/knowledge.")}
                        {renderRadioGroup("startOfLesson", "explainedObjectives", 5, "The teacher explained the learning objectives.")}

                        {/* Delivery of Lesson */}
                        <tr className="border-b"><td colSpan={6} className="py-2 px-4 font-bold bg-slate-50/50 dark:bg-slate-800/20 text-center uppercase tracking-widest text-xs" style={{ color: "var(--text-primary)", borderColor: "var(--bg-border)" }}>Delivery of the Lesson</td></tr>
                        {renderRadioGroup("delivery", "audible", 6, "The teacher was audible.")}
                        {renderRadioGroup("delivery", "modeAppropriate", 7, "The mode of delivery was appropriate.")}
                        {renderRadioGroup("delivery", "paceAppropriate", 8, "The teacher's pace of delivery was appropriate.")}
                        {renderRadioGroup("delivery", "movementEquitable", 9, "The teacher's movement in class was equitable.")}
                        {renderRadioGroup("delivery", "sustainedAttention", 10, "The teacher sustained the attention of the students.")}
                        {renderRadioGroup("delivery", "allowedContributions", 11, "The teacher allowed students to contribute ideas.")}
                        {renderRadioGroup("delivery", "allowedQuestions", 12, "The teacher allowed students to ask questions.")}
                        {renderRadioGroup("delivery", "deliveryEthical", 13, "The teacher's delivery was ethical.")}

                        {/* Conclusion of Lesson */}
                        <tr className="border-b"><td colSpan={6} className="py-2 px-4 font-bold bg-slate-50/50 dark:bg-slate-800/20 text-center uppercase tracking-widest text-xs" style={{ color: "var(--text-primary)", borderColor: "var(--bg-border)" }}>Conclusion of the Lesson</td></tr>
                        {renderRadioGroup("conclusion", "summarizedSatisfactorily", 14, "The teacher summarized the lesson satisfactorily.")}
                        {renderRadioGroup("conclusion", "encouragedExploration", 15, "The teacher encouraged the students to explore more about the lesson.")}
                        {renderRadioGroup("conclusion", "gaveAssignment", 16, "The teacher gave an assignment to students.")}

                        {/* Content Knowledge */}
                        <tr className="border-b"><td colSpan={6} className="py-2 px-4 font-bold bg-slate-50/50 dark:bg-slate-800/20 text-center uppercase tracking-widest text-xs" style={{ color: "var(--text-primary)", borderColor: "var(--bg-border)" }}>Content Knowledge</td></tr>
                        {renderRadioGroup("contentKnowledge", "knowledgeable", 17, "The teacher is knowledgeable in the area.")}
                        {renderRadioGroup("contentKnowledge", "connectedRealLife", 18, "The teacher connected lesson to real life situation.")}
                        {renderRadioGroup("contentKnowledge", "deliveredClearly", 19, "The teacher delivered the lesson clearly with appropriate illustrations.")}
                        {renderRadioGroup("contentKnowledge", "usedRelevantMaterials", 20, "The teacher used relevant teaching and learning materials.")}
                        {renderRadioGroup("contentKnowledge", "respondedQuestions", 21, "The teacher responded to students' questions satisfactorily.")}
                    </tbody>
                </table>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: "var(--bg-border)", backgroundColor: "var(--bg-surface)" }}>
                <div className="p-4 border-b" style={{ borderColor: "var(--bg-border)" }}>
                    <h4 className="font-bold" style={{ color: "var(--text-primary)" }}>22. Strengths and Weaknesses of the teaching process observed</h4>
                </div>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b bg-slate-50/50 dark:bg-slate-800/20" style={{ borderColor: "var(--bg-border)" }}>
                            <th className="py-3 px-4 font-bold w-1/2 border-r text-center" style={{ color: "var(--text-primary)", borderColor: "var(--bg-border)" }}>Strengths</th>
                            <th className="py-3 px-4 font-bold w-1/2 text-center" style={{ color: "var(--text-primary)" }}>Weaknesses</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="p-0 border-r" style={{ borderColor: "var(--bg-border)" }}>
                                <textarea disabled={isCompleted} value={reviewData.strengthsWeaknesses.strengths} onChange={e => setReviewData(p => ({...p, strengthsWeaknesses: {...p.strengthsWeaknesses, strengths: e.target.value}}))} className="w-full h-32 bg-transparent resize-none p-4 outline-none" style={{ color: "var(--text-primary)" }} />
                            </td>
                            <td className="p-0">
                                <textarea disabled={isCompleted} value={reviewData.strengthsWeaknesses.weaknesses} onChange={e => setReviewData(p => ({...p, strengthsWeaknesses: {...p.strengthsWeaknesses, weaknesses: e.target.value}}))} className="w-full h-32 bg-transparent resize-none p-4 outline-none" style={{ color: "var(--text-primary)" }} />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Recommendations */}
            <div className="rounded-2xl shadow-sm border p-6" style={{ borderColor: "var(--bg-border)", backgroundColor: "var(--bg-surface)" }}>
                <h4 className="font-bold mb-4" style={{ color: "var(--text-primary)" }}>23. What would you recommend to improve the teaching process observed?</h4>
                <textarea disabled={isCompleted} value={reviewData.recommendations} onChange={e => setReviewData(p => ({...p, recommendations: e.target.value}))} className="w-full h-24 bg-transparent border rounded-lg p-4 outline-none resize-none" style={{ borderColor: "var(--bg-border)", color: "var(--text-primary)" }} />
            </div>

            {/* Overall Ratings */}
            <div className="rounded-2xl shadow-sm border p-6" style={{ borderColor: "var(--bg-border)", backgroundColor: "var(--bg-surface)" }}>
                <h4 className="font-bold mb-6" style={{ color: "var(--text-primary)" }}>24. Overall, how would you rate the performance of the teaching process observed in this lesson?</h4>
                <div className="flex flex-wrap gap-4">
                    {["Excellent", "Very Good", "Good", "Fair", "Poor"].map(r => (
                        <label key={r} className="flex items-center gap-2 cursor-pointer border px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50" style={{ borderColor: reviewData.overallRating === r ? "var(--primary)" : "var(--bg-border)" }}>
                            <input type="radio" name="rateExam" disabled={isCompleted} checked={reviewData.overallRating === r} onChange={() => setReviewData(p => ({...p, overallRating: r as any}))} className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{r}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Teacher Comments */}
            <div className="rounded-2xl shadow-sm border p-6" style={{ borderColor: "var(--bg-border)", backgroundColor: "rgba(59, 130, 246, 0.05)" }}>
                <h4 className="font-bold mb-4" style={{ color: "var(--text-primary)" }}>25. Comments by the Teacher Observed on the Teaching Observer&apos;s Assessment:</h4>
                <textarea disabled={isCompleted} value={reviewData.teacherComments} onChange={e => setReviewData(p => ({...p, teacherComments: e.target.value}))} placeholder="Only the observed teacher should fill this out..." className="w-full h-24 bg-transparent border rounded-lg p-4 outline-none resize-none" style={{ borderColor: "var(--bg-border)", color: "var(--text-primary)", backgroundColor: "var(--bg-surface)" }} />
            </div>

            {/* Error */}
            {data.status === "PENDING" && (
                <p className="text-center text-sm font-bold opacity-50 uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>This report is pending completion by the assigned observer.</p>
            )}
            
            {data.status !== "PENDING" && (
                <p className="text-center text-sm font-bold opacity-50 uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>This report has been finalized</p>
            )}
        </div>
    );
}
