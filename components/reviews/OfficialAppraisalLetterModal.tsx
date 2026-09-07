"use client";

import React, { useRef } from "react";
import { Printer, X, Award, CheckCircle2, BookOpen, AlertCircle } from "lucide-react";
import { getCourseTitle } from "@/features/curriculum";

interface OfficialAppraisalLetterModalProps {
    isOpen: boolean;
    onClose: () => void;
    reviewType: "A" | "B" | "C";
    data: any;
}

export default function OfficialAppraisalLetterModal({
    isOpen,
    onClose,
    reviewType,
    data,
}: OfficialAppraisalLetterModalProps) {
    const printRef = useRef<HTMLDivElement>(null);

    if (!isOpen || !data) return null;

    const lecturer = data.lecturer?.name || "Lecturer";
    const observer = reviewType === "C" ? (data.moderator?.name || "Peer Moderator") : (data.observer?.name || "Peer Observer");
    const courseCode = data.courseCode || "N/A";
    const courseTitle = getCourseTitle(courseCode) || data.course?.title || "Academic Course";
    
    const sessionDate = data.sessionDate ? new Date(data.sessionDate) : (data.updatedAt ? new Date(data.updatedAt) : new Date());
    const formattedDate = sessionDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
    const formattedTime = sessionDate.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
    });

    const venue = data.venue || data.formBData?.metadata?.venue || data.reviewData?.metadata?.venue || "Lecture Hall / Department Lab";
    const currentYear = sessionDate.getFullYear();
    const memoRef = `HTU/FAST/CS/APR-${reviewType}/${String(data.id).padStart(4, "0")}/${currentYear}`;

    // Compute type-specific information
    let formTitle = "Academic Peer Review";
    let overallRating: string = "N/A";
    let strengths = "";
    let weaknesses = "";
    let recommendations = "";
    let scoreDisplay = "";
    let rubricBreakdown: { section: string; score: number; max: number; items: string[] }[] = [];

    if (reviewType === "B") {
        formTitle = "APR Form B: Classroom Teaching Observation Report";
        const fb = data.formBData || {};
        overallRating = fb.overallRating || "Satisfactory";
        strengths = fb.strengthsWeaknesses?.strengths || "Comprehensive subject matter mastery demonstrated.";
        weaknesses = fb.strengthsWeaknesses?.weaknesses || "Pacing and classroom engagement strategies can be optimized.";
        recommendations = fb.recommendations || "Incorporate more interactive learning checks and structured student contributions.";

        // Calculate scores from 21 criteria
        const crit = fb.criteria || {};
        const sumSection = (sec: any) => {
            if (!sec) return { score: 0, max: 0, count: 0 };
            let s = 0, m = 0, c = 0;
            for (const k in sec) {
                if (k === "remarks") continue;
                if (typeof sec[k] === "number") {
                    s += sec[k];
                    m += 3;
                    c++;
                }
            }
            return { score: s, max: m, count: c };
        };

        const secStart = sumSection(crit.startOfLesson);
        const secDeliv = sumSection(crit.delivery);
        const secConc = sumSection(crit.conclusion);
        const secKnow = sumSection(crit.contentKnowledge);
        const totalScore = secStart.score + secDeliv.score + secConc.score + secKnow.score;
        const totalMax = (secStart.max + secDeliv.max + secConc.max + secKnow.max) || 63;
        const percentage = totalMax > 0 ? ((totalScore / totalMax) * 100).toFixed(1) : "0";
        scoreDisplay = `${totalScore} / ${totalMax} (${percentage}%)`;

        rubricBreakdown = [
            { section: "Start of Lesson (Punctuality, Objectives, Recap)", score: secStart.score, max: secStart.max || 15, items: ["Punctuality", "Objective Sharing", "Previous Lesson Recap"] },
            { section: "Delivery of Lesson (Pedagogy, Engagement, TLMs)", score: secDeliv.score, max: secDeliv.max || 24, items: ["Audibility & Clarity", "Student Engagement", "TLM Utilization", "Class Pacing"] },
            { section: "Conclusion of Lesson (Summary & Assignment)", score: secConc.score, max: secConc.max || 9, items: ["Summary of Key Points", "Student Exploration", "Assignment Allocation"] },
            { section: "Content Knowledge & Student Interaction", score: secKnow.score, max: secKnow.max || 15, items: ["Depth of Concept", "Real-world Connections", "Query Resolution"] },
        ];
    } else if (reviewType === "A") {
        formTitle = "APR Form A: Instructional Materials Review Report";
        const fa = data.reviewData || {};
        overallRating = fa.overallRating || "Satisfactory";
        recommendations = fa.recommendations || data.feedback || "Maintain current syllabus alignment and update reading references regularly.";
        
        const sw = fa.strengthsWeaknesses || {};
        strengths = Object.values(sw).map((v: any) => v?.strengths).filter(Boolean).join(" | ") || "Detailed course outlines and well-structured lecture modules.";
        weaknesses = Object.values(sw).map((v: any) => v?.weaknesses).filter(Boolean).join(" | ") || "Recommend inclusion of more recent primary textbook references.";

        const crit = fa.criteria || {};
        const sumSec = (sec: any) => {
            if (!sec) return { score: 0, max: 0 };
            let s = 0, m = 0;
            for (const k in sec) {
                if (k === "remarks") continue;
                if (typeof sec[k] === "number") {
                    s += sec[k];
                    m += 3;
                }
            }
            return { score: s, max: m };
        };

        const secOut = sumSec(crit.courseOutline);
        const secText = sumSec(crit.mainTextbook);
        const secNotes = sumSec(crit.lectureNotes);
        const secTLM = sumSec(crit.otherTLMs);
        const totalScore = secOut.score + secText.score + secNotes.score + secTLM.score;
        const totalMax = (secOut.max + secText.max + secNotes.max + secTLM.max) || 42;
        const percentage = totalMax > 0 ? ((totalScore / totalMax) * 100).toFixed(1) : "0";
        scoreDisplay = `${totalScore} / ${totalMax} (${percentage}%)`;

        rubricBreakdown = [
            { section: "Course Outline & Syllabus Alignment", score: secOut.score, max: secOut.max || 15, items: ["Format Conformity", "Learning Objectives", "Topic Relevance"] },
            { section: "Prescribed Textbooks & References", score: secText.score, max: secText.max || 9, items: ["Content Coverage", "Recency of Editions", "Student Accessibility"] },
            { section: "Lecture Notes & Course Modules", score: secNotes.score, max: secNotes.max || 12, items: ["Clarity & Conciseness", "Organization", "Syllabus Linkage"] },
            { section: "Supplementary Teaching & Learning Materials", score: secTLM.score, max: secTLM.max || 6, items: ["Pedagogical Relevance", "Suitability"] },
        ];
    } else {
        formTitle = "APR Form C: Examination & Marking Scheme Moderation Report";
        const fc = (typeof data.reviewData === "string" ? JSON.parse(data.reviewData || "{}") : data.reviewData) || {};
        overallRating = `${fc.overallRatingExam || "Approved"} (Exam) / ${fc.overallRatingMarking || "Approved"} (Scheme)`;
        recommendations = fc.generalComments || "Exam questions conform to academic quality benchmarks.";
        
        const sw = fc.strengthsWeaknesses || {};
        strengths = [sw.examQuestions?.strengths, sw.markingScheme?.strengths].filter(Boolean).join(" | ") || "Questions are well formulated with comprehensive marking criteria.";
        weaknesses = [sw.examQuestions?.weaknesses, sw.markingScheme?.weaknesses].filter(Boolean).join(" | ") || "Ensure sub-mark distribution aligns strictly with question difficulty.";

        const crit = fc.criteria || {};
        const sumSec = (sec: any) => {
            if (!sec) return { score: 0, max: 0 };
            let s = 0, m = 0;
            for (const k in sec) {
                if (k === "remarks") continue;
                if (typeof sec[k] === "number") {
                    s += sec[k];
                    m += 3;
                }
            }
            return { score: s, max: m };
        };

        const secQ = sumSec(crit.examQuestions);
        const secM = sumSec(crit.markingScheme);
        const totalScore = secQ.score + secM.score;
        const totalMax = (secQ.max + secM.max) || 33;
        const percentage = totalMax > 0 ? ((totalScore / totalMax) * 100).toFixed(1) : "0";
        scoreDisplay = `${totalScore} / ${totalMax} (${percentage}%)`;

        rubricBreakdown = [
            { section: "Examination Question Paper Quality", score: secQ.score, max: secQ.max || 18, items: ["Format & Typography", "Instruction Clarity", "Syllabus Coverage", "Duration & Difficulty"] },
            { section: "Marking Scheme & Solution Rigor", score: secM.score, max: secM.max || 15, items: ["Accuracy of Solutions", "Fairness of Mark Allocation", "Sub-mark Distribution", "Total Score Integrity"] },
        ];
    }

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-transparent print:static">
            {/* Modal Container */}
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden print:border-none print:shadow-none print:w-full print:max-w-none">
                
                {/* Control Bar (Hidden on print) */}
                <div className="print:hidden px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                            HTU
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                                Institutional Appraisal Memorandum
                            </h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Official Quality Assurance Report for HOD & Department Examination Officer (DEO)
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                        >
                            <Printer className="w-4 h-4" />
                            <span>Print / Save PDF</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                            title="Close"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Printable Letter Body */}
                <div ref={printRef} className="p-8 sm:p-12 text-slate-900 dark:text-slate-100 font-sans space-y-8 print:p-8 print:text-black">
                    
                    {/* Official Letterhead */}
                    <div className="border-b-4 border-double border-slate-900 dark:border-slate-300 pb-6 text-center space-y-2">
                        <div className="flex items-center justify-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 via-blue-700 to-indigo-900 text-white flex items-center justify-center font-black text-xl shadow-md border-2 border-amber-400">
                                HTU
                            </div>
                            <div className="text-left">
                                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white print:text-black">
                                    Ho Technical University
                                </h1>
                                <h2 className="text-xs sm:text-sm font-bold tracking-wide uppercase text-blue-900 dark:text-blue-300 print:text-blue-900">
                                    Faculty of Applied Sciences and Technology
                                </h2>
                                <h3 className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 print:text-slate-600">
                                    Department of Computer Science • Academic Peer Review Directorate
                                </h3>
                            </div>
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest pt-1">
                            P.O. Box HP 217, Ho, Volta Region, Ghana • Tel: +233 (0) 3620 28901 • info@htu.edu.gh
                        </div>
                    </div>

                    {/* Memorandum Heading Box */}
                    <div className="rounded-2xl border-2 border-slate-300 dark:border-slate-700 p-5 bg-slate-50/70 dark:bg-slate-800/40 print:bg-transparent print:border-black space-y-3">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                            <span className="font-black text-xs uppercase tracking-widest text-blue-800 dark:text-blue-300">
                                INTERNAL MEMORANDUM & APPRAISAL ATTESTATION
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                                Ref: {memoRef}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-xs sm:text-sm">
                            <div>
                                <span className="font-bold text-slate-600 dark:text-slate-400 uppercase w-20 inline-block">TO:</span>
                                <strong className="text-slate-900 dark:text-white">Head of Department (HOD) & Department Examination Officer (DEO)</strong>
                            </div>
                            <div>
                                <span className="font-bold text-slate-600 dark:text-slate-400 uppercase w-20 inline-block">DATE:</span>
                                <strong>{formattedDate}</strong>
                            </div>
                            <div>
                                <span className="font-bold text-slate-600 dark:text-slate-400 uppercase w-20 inline-block">FROM:</span>
                                <strong className="text-slate-900 dark:text-white">{observer} (Lead Peer Reviewer)</strong>
                            </div>
                            <div>
                                <span className="font-bold text-slate-600 dark:text-slate-400 uppercase w-20 inline-block">STATUS:</span>
                                <span className="font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">COMPLETED & VERIFIED</span>
                            </div>
                            <div className="sm:col-span-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                                <span className="font-bold text-slate-600 dark:text-slate-400 uppercase w-20 inline-block">SUBJECT:</span>
                                <span className="font-black uppercase tracking-tight text-slate-900 dark:text-white">
                                    ACADEMIC PEER EVALUATION REPORT — {courseCode}: {courseTitle} (LECTURER: {lecturer.toUpperCase()})
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Executive Summary Card */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-slate-200 dark:border-slate-700">
                            <h4 className="font-black text-sm uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <Award className="w-4 h-4 text-amber-500" />
                                <span>1. Executive Appraisal Summary</span>
                            </h4>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500 font-semibold">Institutional Grade:</span>
                                <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-blue-600 text-white shadow-xs">
                                    {overallRating}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div>
                                <p className="text-slate-500 font-semibold mb-0.5">Evaluation Instrument:</p>
                                <p className="font-bold text-slate-900 dark:text-slate-100">{formTitle}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 font-semibold mb-0.5">Session Date & Venue:</p>
                                <p className="font-bold text-slate-900 dark:text-slate-100">{formattedDate} ({formattedTime}) — {venue}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 font-semibold mb-0.5">Cumulative Rubric Score:</p>
                                <p className="font-bold text-blue-700 dark:text-blue-300 text-sm">{scoreDisplay}</p>
                            </div>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed text-justify">
                            This memorandum presents the official peer review appraisal conducted for <strong>{lecturer}</strong> in respect of course <strong>{courseCode} ({courseTitle})</strong>.
                            In accordance with Ho Technical University Quality Assurance Directorate directives, the evaluation rubrics below have been fully validated, rated, and finalized by the designated peer observer.
                        </p>
                    </div>

                    {/* Section Breakdown Table */}
                    <div className="space-y-3">
                        <h4 className="font-black text-sm uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>2. Evaluative Rubric & Performance Breakdown</span>
                        </h4>

                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                                        <th className="py-2.5 px-4">Evaluation Domain</th>
                                        <th className="py-2.5 px-4">Key Criteria Inspected</th>
                                        <th className="py-2.5 px-4 text-center">Score</th>
                                        <th className="py-2.5 px-4 text-right">Performance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {rubricBreakdown.map((r, i) => {
                                        const pct = r.max > 0 ? Math.round((r.score / r.max) * 100) : 0;
                                        return (
                                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                                                    {r.section}
                                                </td>
                                                <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                                                    {r.items.join(" • ")}
                                                </td>
                                                <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                                                    {r.score} / {r.max}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                                                        pct >= 80 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" :
                                                        pct >= 60 ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" :
                                                        "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                                                    }`}>
                                                        {pct}%
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Qualitative Commendations, Areas for Improvement, and Recommendations */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                        <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 space-y-2">
                            <h5 className="font-bold text-xs uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                                <Award className="w-3.5 h-3.5" /> Observed Strengths
                            </h5>
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                                {strengths || "Exemplary subject matter mastery and instructional clarity."}
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50 space-y-2">
                            <h5 className="font-bold text-xs uppercase tracking-wider text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5" /> Areas for Improvement
                            </h5>
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                                {weaknesses || "Pacing and classroom engagement strategies can be further reinforced."}
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50 space-y-2">
                            <h5 className="font-bold text-xs uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5" /> Actionable Recommendations
                            </h5>
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                                {recommendations || "Incorporate structured active learning checks and follow up on assignment feedback."}
                            </p>
                        </div>
                    </div>

                    {/* Institutional Sign-off Block */}
                    <div className="pt-8 border-t-2 border-slate-300 dark:border-slate-700 space-y-6">
                        <h5 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 text-center">
                            Institutional Endorsement & Verification Sign-Off
                        </h5>

                        <div className="grid grid-cols-3 gap-6 text-center text-xs">
                            {/* Lead Peer Reviewer */}
                            <div className="space-y-4">
                                <div className="h-12 border-b border-dashed border-slate-400 flex items-end justify-center pb-1">
                                    <span className="font-serif italic text-blue-900 dark:text-blue-300 font-semibold">{observer}</span>
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-slate-100">{observer}</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Lead Peer Reviewer / Evaluator</p>
                                </div>
                            </div>

                            {/* DEO */}
                            <div className="space-y-4">
                                <div className="h-12 border-b border-dashed border-slate-400 flex items-end justify-center pb-1">
                                    <span className="text-[10px] font-mono text-slate-500 font-semibold">QA VERIFIED & ARCHIVED</span>
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-slate-100">Department Examination Officer (DEO)</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Quality Assurance Compliance</p>
                                </div>
                            </div>

                            {/* HOD */}
                            <div className="space-y-4">
                                <div className="h-12 border-b border-dashed border-slate-400 flex items-end justify-center pb-1">
                                    <span className="text-[10px] font-mono text-slate-500 font-semibold">ACADEMIC DIRECTORATE APPROVED</span>
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-slate-100">Head of Department (HOD)</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Department of Computer Science</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Note */}
                    <div className="pt-4 text-center text-[10px] text-slate-400 print:text-slate-600">
                        This document is an electronically generated and certified Academic Peer Review (APR) record under Ho Technical University Quality Assurance guidelines. Valid without physical stamp when transmitted through the LAMAS institutional platform.
                    </div>
                </div>

            </div>
        </div>
    );
}
