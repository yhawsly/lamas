"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { useTerm } from "@/context/TermContext";
import ReviewDossierViewer from "@/components/workspace/ReviewDossierViewer";
import { getCourseTitle } from "@/lib/courses";

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

// Define Form C types
type FormCReviewData = {
    natureOfExam: {
        written: boolean;
        practical: boolean;
        oral: boolean;
    };
    materialsReviewed: {
        courseOutline: boolean;
        examQuestions: boolean;
        markingScheme: boolean;
        specificationTable: boolean;
    };
    examQuestions: {
        objectiveTest: { yes: boolean; no: boolean; numQuestions: string; numToAnswer: string };
        essayTest: { yes: boolean; no: boolean; numQuestions: string; numToAnswer: string };
        practicalTest: { yes: boolean; no: boolean; numQuestions: string; numToAnswer: string };
    };
    criteria: {
        examQuestions: {
            formatConforms: number | null;
            instructionsClear: number | null;
            questionsClear: number | null;
            durationFair: number | null;
            coversOutline: number | null;
            difficultyAppropriate: number | null;
            remarks: Record<string, string>;
        };
        markingScheme: {
            comprehensible: number | null;
            answersCorrect: number | null;
            marksFair: number | null;
            subMarksSum: number | null;
            totalMarksSum: number | null;
            remarks: Record<string, string>;
        };
    };
    changesExamQuestions: string[];
    changesMarkingScheme: string[];
    strengthsWeaknesses: {
        examQuestions: { strengths: string; weaknesses: string };
        markingScheme: { strengths: string; weaknesses: string };
    };
    generalComments: string;
    overallRatingExam: "Excellent" | "Very Good" | "Good" | "Fair" | "Poor" | null;
    overallRatingMarking: "Excellent" | "Very Good" | "Good" | "Fair" | "Poor" | null;
};

const DEFAULT_FORM_C: FormCReviewData = {
    natureOfExam: { written: false, practical: false, oral: false },
    materialsReviewed: { courseOutline: false, examQuestions: false, markingScheme: false, specificationTable: false },
    examQuestions: {
        objectiveTest: { yes: false, no: false, numQuestions: "", numToAnswer: "" },
        essayTest: { yes: false, no: false, numQuestions: "", numToAnswer: "" },
        practicalTest: { yes: false, no: false, numQuestions: "", numToAnswer: "" },
    },
    criteria: {
        examQuestions: { formatConforms: null, instructionsClear: null, questionsClear: null, durationFair: null, coversOutline: null, difficultyAppropriate: null, remarks: {} },
        markingScheme: { comprehensible: null, answersCorrect: null, marksFair: null, subMarksSum: null, totalMarksSum: null, remarks: {} },
    },
    changesExamQuestions: ["", "", "", "", ""],
    changesMarkingScheme: ["", "", "", "", ""],
    strengthsWeaknesses: {
        examQuestions: { strengths: "", weaknesses: "" },
        markingScheme: { strengths: "", weaknesses: "" },
    },
    generalComments: "",
    overallRatingExam: null,
    overallRatingMarking: null,
};

export default function ConductModerationPage() {
    const { id } = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const { isArchiveMode } = useTerm();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    
    const [reviewData, setReviewData] = useState<FormCReviewData>(DEFAULT_FORM_C);

    useEffect(() => {
        fetch(`/api/moderations/${id}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => {
                if (d) {
                    setData(d);
                    if (d.reviewData) {
                        let parsed = d.reviewData;
                        if (typeof parsed === "string") {
                            try { parsed = JSON.parse(parsed); } catch {}
                        }
                        setReviewData({
                            ...DEFAULT_FORM_C,
                            ...parsed,
                            criteria: {
                                examQuestions: { ...DEFAULT_FORM_C.criteria.examQuestions, ...(parsed?.criteria?.examQuestions || {}) },
                                markingScheme: { ...DEFAULT_FORM_C.criteria.markingScheme, ...(parsed?.criteria?.markingScheme || {}) },
                            },
                            natureOfExam: { ...DEFAULT_FORM_C.natureOfExam, ...(parsed?.natureOfExam || {}) },
                            materialsReviewed: { ...DEFAULT_FORM_C.materialsReviewed, ...(parsed?.materialsReviewed || {}) },
                            examQuestions: {
                                objectiveTest: { ...DEFAULT_FORM_C.examQuestions.objectiveTest, ...(parsed?.examQuestions?.objectiveTest || {}) },
                                essayTest: { ...DEFAULT_FORM_C.examQuestions.essayTest, ...(parsed?.examQuestions?.essayTest || {}) },
                                practicalTest: { ...DEFAULT_FORM_C.examQuestions.practicalTest, ...(parsed?.examQuestions?.practicalTest || {}) },
                            },
                            strengthsWeaknesses: {
                                examQuestions: { ...DEFAULT_FORM_C.strengthsWeaknesses.examQuestions, ...(parsed?.strengthsWeaknesses?.examQuestions || {}) },
                                markingScheme: { ...DEFAULT_FORM_C.strengthsWeaknesses.markingScheme, ...(parsed?.strengthsWeaknesses?.markingScheme || {}) },
                            }
                        });
                    }
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id]);

    const handleSave = async () => {
        if (isArchiveMode) {
            setError("Action Disabled: You are viewing a read-only historical archive.");
            return;
        }
        setError("");
        setSaving(true);
        
        try {
            const res = await fetch(`/api/moderations/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reviewData }),
            });
            if (res.ok) router.push("/lecturer/appraisals");
            else setError("Failed to save. Please try again.");
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading || !data) return <DetailWorkspaceSkeleton />;

    const lecturer = data.lecturer?.name || "Unknown Lecturer";
    const isCompleted = data.status !== "PENDING";
    const isBlocked = data.isObserveeAssigned === false;
    const isObserverUser = parseInt(session?.user?.id || "0") === data.moderatorId;
    const isDisabled = isCompleted || isBlocked || !isObserverUser || isArchiveMode;

    const renderRadioGroup = (section: keyof FormCReviewData["criteria"], field: string, sn: number, text: string) => {
        const sectionCriteria = (reviewData?.criteria?.[section] || DEFAULT_FORM_C.criteria[section]) as any;
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
                            className="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
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

    const renderExamQRow = (field: keyof FormCReviewData["examQuestions"], sn: number, typeLabel: string) => (
        <tr className="border-t hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" style={{ borderColor: "var(--bg-border)" }}>
            <td className="py-3 px-4 text-center w-12 font-medium" style={{ color: "var(--text-muted)" }}>{sn}.</td>
            <td className="py-3 px-4 text-sm" style={{ color: "var(--text-primary)" }}>{typeLabel}</td>
            <td className="py-3 px-4 text-center border-l" style={{ borderColor: "var(--bg-border)" }}>
                <input type="checkbox" disabled={isDisabled} checked={reviewData.examQuestions[field].yes} onChange={e => setReviewData(p => ({ ...p, examQuestions: { ...p.examQuestions, [field]: { ...p.examQuestions[field], yes: e.target.checked } } }))} className="w-4 h-4 text-primary" />
            </td>
            <td className="py-3 px-4 text-center border-l" style={{ borderColor: "var(--bg-border)" }}>
                <input type="checkbox" disabled={isDisabled} checked={reviewData.examQuestions[field].no} onChange={e => setReviewData(p => ({ ...p, examQuestions: { ...p.examQuestions, [field]: { ...p.examQuestions[field], no: e.target.checked } } }))} className="w-4 h-4 text-primary" />
            </td>
            <td className="py-3 px-4 border-l" style={{ borderColor: "var(--bg-border)" }}>
                <input type="number" disabled={isDisabled} value={reviewData.examQuestions[field].numQuestions} onChange={e => setReviewData(p => ({ ...p, examQuestions: { ...p.examQuestions, [field]: { ...p.examQuestions[field], numQuestions: e.target.value } } }))} className="w-full bg-transparent outline-none text-center" />
            </td>
            <td className="py-3 px-4 border-l" style={{ borderColor: "var(--bg-border)" }}>
                <input type="number" disabled={isDisabled} value={reviewData.examQuestions[field].numToAnswer} onChange={e => setReviewData(p => ({ ...p, examQuestions: { ...p.examQuestions, [field]: { ...p.examQuestions[field], numToAnswer: e.target.value } } }))} className="w-full bg-transparent outline-none text-center" />
            </td>
        </tr>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-start pb-6 border-b" style={{ borderColor: "var(--bg-border)" }}>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>
                        Examination Moderation Report
                    </h1>
                    <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--text-secondary)" }}>
                        Academic Peer Review - APR Form C
                    </h2>
                    <div className="text-sm space-y-1" style={{ color: "var(--text-secondary)" }}>
                        <p><strong>Internal Examiner:</strong> {lecturer}</p>
                        <p><strong>Course:</strong> <span className="font-bold text-blue-600 dark:text-blue-400">{data.courseCode}</span>{getCourseTitle(data.courseCode) && <span className="font-medium text-slate-700 dark:text-slate-300"> — {getCourseTitle(data.courseCode)}</span>}</p>
                        <p><strong>Date Assigned:</strong> {new Date(data.createdAt).toLocaleDateString()}</p>
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
                <div className="p-6 rounded-3xl border flex gap-4 items-start shadow-sm mb-6" style={{ backgroundColor: "rgba(239, 68, 68, 0.08)", borderColor: "rgba(239, 68, 68, 0.2)", color: "#ef4444" }}>
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

            {/* Target Lecturer Course Dossier & Exam Materials Viewer */}
            <ReviewDossierViewer
                courseCode={data.courseCode}
                lecturerId={data.lecturerId}
                lecturerName={lecturer}
                reviewType="C"
            />

            {/* Checkboxes Row */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-2xl p-6 shadow-sm border" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                    <h4 className="font-bold mb-4" style={{ color: "var(--text-primary)" }}>Nature of Examination:</h4>
                    <div className="flex gap-6">
                        {[
                            { key: "written", label: "Written Exam" },
                            { key: "practical", label: "Practical Exam" },
                            { key: "oral", label: "Oral Exam" }
                        ].map(m => (
                            <label key={m.key} className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" disabled={isDisabled} checked={reviewData.natureOfExam[m.key as keyof typeof reviewData.natureOfExam]} onChange={e => setReviewData(p => ({ ...p, natureOfExam: { ...p.natureOfExam, [m.key]: e.target.checked } }))} className="w-5 h-5 rounded border-gray-300 text-primary" />
                                <span style={{ color: "var(--text-secondary)" }}>{m.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
                
                <div className="rounded-2xl p-6 shadow-sm border" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
                    <h4 className="font-bold mb-4" style={{ color: "var(--text-primary)" }}>Materials Reviewed:</h4>
                    <div className="flex flex-wrap gap-4">
                        {[
                            { key: "courseOutline", label: "Course Outline" },
                            { key: "examQuestions", label: "Exam Questions" },
                            { key: "markingScheme", label: "Marking Scheme" },
                            { key: "specificationTable", label: "Specification Table" }
                        ].map(m => (
                            <label key={m.key} className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" disabled={isDisabled} checked={reviewData.materialsReviewed[m.key as keyof typeof reviewData.materialsReviewed]} onChange={e => setReviewData(p => ({ ...p, materialsReviewed: { ...p.materialsReviewed, [m.key]: e.target.checked } }))} className="w-5 h-5 rounded border-gray-300 text-primary" />
                                <span style={{ color: "var(--text-secondary)" }}>{m.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* Exam Questions Table */}
            <div className="overflow-x-auto rounded-2xl shadow-sm border" style={{ borderColor: "var(--bg-border)", backgroundColor: "var(--bg-surface)" }}>
                <div className="p-4 border-b font-bold" style={{ borderColor: "var(--bg-border)", color: "var(--text-primary)" }}>Examination Questions</div>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b bg-slate-50/50 dark:bg-slate-800/20" style={{ borderColor: "var(--bg-border)" }}>
                            <th className="py-2 px-4 font-bold text-center" style={{ color: "var(--text-primary)" }}>S/N</th>
                            <th className="py-2 px-4 font-bold" style={{ color: "var(--text-primary)" }}>Nature of Questions</th>
                            <th className="py-2 px-4 font-bold text-center border-l" style={{ color: "var(--text-primary)", borderColor: "var(--bg-border)" }}>YES</th>
                            <th className="py-2 px-4 font-bold text-center border-l" style={{ color: "var(--text-primary)", borderColor: "var(--bg-border)" }}>NO</th>
                            <th className="py-2 px-4 font-bold text-center border-l" style={{ color: "var(--text-primary)", borderColor: "var(--bg-border)" }}>No. of Questions</th>
                            <th className="py-2 px-4 font-bold text-center border-l" style={{ color: "var(--text-primary)", borderColor: "var(--bg-border)" }}>To be Answered</th>
                        </tr>
                    </thead>
                    <tbody>
                        {renderExamQRow("objectiveTest", 1, "Objective Test")}
                        {renderExamQRow("essayTest", 2, "Essay Test")}
                        {renderExamQRow("practicalTest", 3, "Practical Question")}
                    </tbody>
                </table>
            </div>

            {/* Scale Instruction */}
            <p className="text-sm font-medium italic text-center" style={{ color: "var(--text-secondary)" }}>
                Respond to the following statements as fairly as possible...<br/>
                [3=Agree; 2=Quite Agree; 1=Disagree]
            </p>

            {/* Evaluation Table */}
            <div className="overflow-x-auto rounded-2xl shadow-sm border" style={{ borderColor: "var(--bg-border)" }}>
                <table className="w-full text-left border-collapse" style={{ backgroundColor: "var(--bg-surface)" }}>
                    <thead>
                        <tr className="border-b" style={{ borderColor: "var(--bg-border)", backgroundColor: "rgba(0,0,0,0.02)" }}>
                            <th className="py-3 px-4 font-bold text-center w-12" style={{ color: "var(--text-primary)" }}>S/N</th>
                            <th className="py-3 px-4 font-bold" style={{ color: "var(--text-primary)" }}>Examination Questions</th>
                            <th className="py-3 px-4 font-bold text-center w-12" style={{ color: "var(--text-primary)" }}>3</th>
                            <th className="py-3 px-4 font-bold text-center w-12" style={{ color: "var(--text-primary)" }}>2</th>
                            <th className="py-3 px-4 font-bold text-center w-12" style={{ color: "var(--text-primary)" }}>1</th>
                            <th className="py-3 px-4 font-bold w-48" style={{ color: "var(--text-primary)" }}>Remark (if any)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {renderRadioGroup("examQuestions", "formatConforms", 1, "The examination paper conforms to the prescribed format of the University.")}
                        {renderRadioGroup("examQuestions", "instructionsClear", 2, "The examination instructions are clear.")}
                        {renderRadioGroup("examQuestions", "questionsClear", 3, "The examination questions are clear.")}
                        {renderRadioGroup("examQuestions", "durationFair", 4, "The duration of the examination is fair in relation to the tasks involved.")}
                        {renderRadioGroup("examQuestions", "coversOutline", 5, "The examination questions adequately cover the course outline.")}
                        {renderRadioGroup("examQuestions", "difficultyAppropriate", 6, "The levels of difficulty of the questions are appropriate. (Bloom's Taxonomy)")}

                        <tr className="border-b"><td colSpan={6} className="py-2 px-4 font-bold bg-slate-50/50 dark:bg-slate-800/20 text-center" style={{ color: "var(--text-primary)", borderColor: "var(--bg-border)" }}>Marking Scheme</td></tr>
                        {renderRadioGroup("markingScheme", "comprehensible", 7, "The marking scheme is comprehensible.")}
                        {renderRadioGroup("markingScheme", "answersCorrect", 8, "The answers provided in the marking scheme are correct.")}
                        {renderRadioGroup("markingScheme", "marksFair", 9, "The marks allocated to the steps/points are fair.")}
                        {renderRadioGroup("markingScheme", "subMarksSum", 10, "The marks allocated to each sub-question sum up accurately.")}
                        {renderRadioGroup("markingScheme", "totalMarksSum", 11, "The marks allocated to the questions sum up accurately.")}
                    </tbody>
                </table>
            </div>

            {/* Changes Lists */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-2xl shadow-sm border p-6" style={{ borderColor: "var(--bg-border)", backgroundColor: "var(--bg-surface)" }}>
                    <h4 className="font-bold mb-4" style={{ color: "var(--text-primary)" }}>12. List specific changes to be made to examination questions.</h4>
                    <ol className="list-[lower-roman] list-inside space-y-2 text-sm" style={{ color: "var(--text-primary)" }}>
                        {[0,1,2,3,4].map(idx => (
                            <li key={idx}>
                                <input type="text" disabled={isDisabled} value={reviewData.changesExamQuestions[idx]} onChange={e => { const arr = [...reviewData.changesExamQuestions]; arr[idx] = e.target.value; setReviewData(p => ({...p, changesExamQuestions: arr}))}} className="bg-transparent border-b outline-none w-[90%] px-2 py-1 ml-2" style={{ borderColor: "var(--bg-border)" }} />
                            </li>
                        ))}
                    </ol>
                </div>
                <div className="rounded-2xl shadow-sm border p-6" style={{ borderColor: "var(--bg-border)", backgroundColor: "var(--bg-surface)" }}>
                    <h4 className="font-bold mb-4" style={{ color: "var(--text-primary)" }}>13. List specific changes to be made to marking scheme.</h4>
                    <ol className="list-[lower-roman] list-inside space-y-2 text-sm" style={{ color: "var(--text-primary)" }}>
                        {[0,1,2,3,4].map(idx => (
                            <li key={idx}>
                                <input type="text" disabled={isDisabled} value={reviewData.changesMarkingScheme[idx]} onChange={e => { const arr = [...reviewData.changesMarkingScheme]; arr[idx] = e.target.value; setReviewData(p => ({...p, changesMarkingScheme: arr}))}} className="bg-transparent border-b outline-none w-[90%] px-2 py-1 ml-2" style={{ borderColor: "var(--bg-border)" }} />
                            </li>
                        ))}
                    </ol>
                </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: "var(--bg-border)", backgroundColor: "var(--bg-surface)" }}>
                <div className="p-4 border-b" style={{ borderColor: "var(--bg-border)" }}>
                    <h4 className="font-bold" style={{ color: "var(--text-primary)" }}>14. Strengths and Weaknesses</h4>
                </div>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b bg-slate-50/50 dark:bg-slate-800/20" style={{ borderColor: "var(--bg-border)" }}>
                            <th className="py-3 px-4 font-bold w-1/4"></th>
                            <th className="py-3 px-4 font-bold w-3/8 border-l text-center" style={{ color: "var(--text-primary)", borderColor: "var(--bg-border)" }}>Strengths</th>
                            <th className="py-3 px-4 font-bold w-3/8 border-l text-center" style={{ color: "var(--text-primary)", borderColor: "var(--bg-border)" }}>Weaknesses</th>
                        </tr>
                    </thead>
                    <tbody>
                        {["examQuestions", "markingScheme"].map((section) => (
                            <tr key={section} className="border-b" style={{ borderColor: "var(--bg-border)" }}>
                                <td className="py-3 px-4 font-medium text-sm" style={{ color: "var(--text-primary)" }}>{section === "examQuestions" ? "Examination Questions" : "Marking Scheme"}</td>
                                <td className="p-0 border-l" style={{ borderColor: "var(--bg-border)" }}>
                                    <textarea disabled={isDisabled} value={reviewData.strengthsWeaknesses[section as keyof FormCReviewData["strengthsWeaknesses"]].strengths} onChange={e => setReviewData(p => ({...p, strengthsWeaknesses: {...p.strengthsWeaknesses, [section]: {...p.strengthsWeaknesses[section as keyof FormCReviewData["strengthsWeaknesses"]], strengths: e.target.value}}}))} className="w-full h-24 bg-transparent resize-none p-3 outline-none text-sm" style={{ color: "var(--text-primary)" }} />
                                </td>
                                <td className="p-0 border-l" style={{ borderColor: "var(--bg-border)" }}>
                                    <textarea disabled={isDisabled} value={reviewData.strengthsWeaknesses[section as keyof FormCReviewData["strengthsWeaknesses"]].weaknesses} onChange={e => setReviewData(p => ({...p, strengthsWeaknesses: {...p.strengthsWeaknesses, [section]: {...p.strengthsWeaknesses[section as keyof FormCReviewData["strengthsWeaknesses"]], weaknesses: e.target.value}}}))} className="w-full h-24 bg-transparent resize-none p-3 outline-none text-sm" style={{ color: "var(--text-primary)" }} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
 
            {/* General Comments */}
            <div className="rounded-2xl shadow-sm border p-6" style={{ borderColor: "var(--bg-border)", backgroundColor: "var(--bg-surface)" }}>
                <h4 className="font-bold mb-4" style={{ color: "var(--text-primary)" }}>15. General comments/recommendations</h4>
                <textarea disabled={isDisabled} value={reviewData.generalComments} onChange={e => setReviewData(p => ({...p, generalComments: e.target.value}))} className="w-full h-32 bg-transparent border rounded-lg p-4 outline-none resize-none" style={{ borderColor: "var(--bg-border)", color: "var(--text-primary)" }} />
            </div>

            {/* Overall Ratings */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-2xl shadow-sm border p-6" style={{ borderColor: "var(--bg-border)", backgroundColor: "var(--bg-surface)" }}>
                    <h4 className="font-bold mb-6" style={{ color: "var(--text-primary)" }}>16. Rate Examination Questions</h4>
                    <div className="flex flex-wrap gap-4">
                        {["Excellent", "Very Good", "Good", "Fair", "Poor"].map(r => (
                            <label key={r} className="flex items-center gap-2 cursor-pointer border px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50" style={{ borderColor: reviewData.overallRatingExam === r ? "var(--primary)" : "var(--bg-border)" }}>
                                <input type="radio" name="rateExam" disabled={isDisabled} checked={reviewData.overallRatingExam === r} onChange={() => setReviewData(p => ({...p, overallRatingExam: r as any}))} className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{r}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="rounded-2xl shadow-sm border p-6" style={{ borderColor: "var(--bg-border)", backgroundColor: "var(--bg-surface)" }}>
                    <h4 className="font-bold mb-6" style={{ color: "var(--text-primary)" }}>17. Rate Marking Scheme</h4>
                    <div className="flex flex-wrap gap-4">
                        {["Excellent", "Very Good", "Good", "Fair", "Poor"].map(r => (
                            <label key={r} className="flex items-center gap-2 cursor-pointer border px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50" style={{ borderColor: reviewData.overallRatingMarking === r ? "var(--primary)" : "var(--bg-border)" }}>
                                <input type="radio" name="rateMarking" disabled={isDisabled} checked={reviewData.overallRatingMarking === r} onChange={() => setReviewData(p => ({...p, overallRatingMarking: r as any}))} className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{r}</span>
                            </label>
                        ))}
                    </div>
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
                <button onClick={handleSave} disabled={saving} className="w-full py-4 rounded-2xl text-white font-bold text-sm uppercase tracking-widest shadow-xl transition-all disabled:opacity-50 hover:opacity-90 active:scale-[0.99]" style={{ background: "linear-gradient(to right, var(--primary), #10b981)", boxShadow: "0 8px 24px -4px rgba(59,130,246,0.3)" }}>
                    {saving ? "Saving Report..." : "Submit Review Report"}
                </button>
            )}
            
            {isBlocked && (
                <div className="p-4 rounded-2xl border text-center font-bold uppercase tracking-widest text-sm" style={{ backgroundColor: "rgba(239, 68, 68, 0.05)", borderColor: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}>
                    This review is blocked because the lecturer is not assigned to the course
                </div>
            )}
            
            {isCompleted && (
                <p className="text-center text-sm font-bold opacity-50 uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>This report has been finalized</p>
            )}
        </div>
    );
}
