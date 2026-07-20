"use client";

import React, { useState } from "react";
import { 
    ClipboardList, 
    Check, 
    ArrowRight, 
    User, 
    BookOpen, 
    Award, 
    Plus, 
    Smile, 
    Activity,
    Video,
    ShieldCheck
} from "lucide-react";

export default function DeoFormsPage() {
    // Review type selection: 'A' | 'B' | 'C'
    const [reviewType, setReviewType] = useState<"A" | "B" | "C">("A");
    
    // Interactive demo states
    const [currentStep, setCurrentStep] = useState<number>(3); // 1 = Stage 1, 2 = Stage 2, 3 = Stage 3, 4 = Complete
    const [auditFields, setAuditFields] = useState({
        lecturerName: "Mr. Hafiz Rahman",
        courseCode: "ENG101 - Introduction to Rhetoric",
        department: "English Language Studies",
        sessionDate: "2026-07-18",
        observerName: "Department Exam Officer"
    });

    const [submitted, setSubmitted] = useState(false);

    const handleStepClick = (stepNum: number) => {
        setCurrentStep(stepNum);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        setCurrentStep(4);
        setTimeout(() => {
            setSubmitted(false);
        }, 4000);
    };

    const selectReviewType = (type: "A" | "B" | "C") => {
        setReviewType(type);
        setSubmitted(false);
        setCurrentStep(3);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24 font-sans antialiased text-slate-800 dark:text-slate-100">
            {/* Custom Header Bar (Reference Styling) */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-orange-500/5 dark:from-amber-500/10 dark:to-orange-500/5 border border-amber-200/50 dark:border-amber-900/30 rounded-3xl gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner shrink-0">
                        <ClipboardList className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Course Quality Assurance & Review</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Multi-Form Academic Evaluation Portal</p>
                    </div>
                </div>
                <button 
                    onClick={() => {
                        setAuditFields({
                            lecturerName: "Mr. Hafiz Rahman",
                            courseCode: "ENG101 - Introduction to Rhetoric",
                            department: "English Language Studies",
                            sessionDate: "2026-07-18",
                            observerName: "Department Exam Officer"
                        });
                        setSubmitted(false);
                        setCurrentStep(1);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-xs shadow-md shadow-amber-500/20 border border-amber-400 hover:border-amber-500 transition-all select-none"
                >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Reset Fields</span>
                </button>
            </div>

            {/* 3 Clickable Horizontal Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Card 1: Form A */}
                <button
                    type="button"
                    onClick={() => selectReviewType("A")}
                    className={`text-left p-5 rounded-[24px] border-2 transition-all duration-200 cursor-pointer flex gap-4 items-center group relative overflow-hidden ${
                        reviewType === "A"
                            ? "bg-amber-500/5 dark:bg-amber-500/10 border-amber-500 shadow-md"
                            : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 hover:border-amber-500/40"
                    }`}
                >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        reviewType === "A"
                            ? "bg-amber-500 text-white"
                            : "bg-slate-100 dark:bg-slate-900 text-slate-450 dark:text-slate-400 group-hover:bg-amber-500/10 group-hover:text-amber-500"
                    }`}>
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-amber-550 dark:text-amber-400">Form A Audit</div>
                        <h4 className="text-sm font-extrabold mt-1 text-slate-900 dark:text-white">Instructional Materials</h4>
                        <p className="text-[11px] text-slate-450 dark:text-slate-400 mt-1 leading-snug font-medium">Syllabus outlines, textbook relevance, notes audit.</p>
                    </div>
                </button>

                {/* Card 2: Form B */}
                <button
                    type="button"
                    onClick={() => selectReviewType("B")}
                    className={`text-left p-5 rounded-[24px] border-2 transition-all duration-200 cursor-pointer flex gap-4 items-center group relative overflow-hidden ${
                        reviewType === "B"
                            ? "bg-blue-500/5 dark:bg-blue-500/10 border-blue-500 shadow-md"
                            : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 hover:border-blue-500/40"
                    }`}
                >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        reviewType === "B"
                            ? "bg-blue-500 text-white"
                            : "bg-slate-100 dark:bg-slate-900 text-slate-455 dark:text-slate-400 group-hover:bg-blue-500/10 group-hover:text-blue-500"
                    }`}>
                        <Video className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-blue-550 dark:text-blue-400">Form B Review</div>
                        <h4 className="text-sm font-extrabold mt-1 text-slate-900 dark:text-white">Teaching Observation</h4>
                        <p className="text-[11px] text-slate-450 dark:text-slate-400 mt-1 leading-snug font-medium">Classroom pacing, slides structure, student dialogue.</p>
                    </div>
                </button>

                {/* Card 3: Form C */}
                <button
                    type="button"
                    onClick={() => selectReviewType("C")}
                    className={`text-left p-5 rounded-[24px] border-2 transition-all duration-200 cursor-pointer flex gap-4 items-center group relative overflow-hidden ${
                        reviewType === "C"
                            ? "bg-purple-500/5 dark:bg-purple-500/10 border-purple-500 shadow-md"
                            : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 hover:border-purple-500/40"
                    }`}
                >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        reviewType === "C"
                            ? "bg-purple-500 text-white"
                            : "bg-slate-100 dark:bg-slate-900 text-slate-450 dark:text-slate-400 group-hover:bg-purple-500/10 group-hover:text-purple-500"
                    }`}>
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-purple-550 dark:text-purple-400">Form C Moderation</div>
                        <h4 className="text-sm font-extrabold mt-1 text-slate-900 dark:text-white">Exam Moderation</h4>
                        <p className="text-[11px] text-slate-455 dark:text-slate-400 mt-1 leading-snug font-medium">Marking rubrics, Bloom taxonomy, question feasibility.</p>
                    </div>
                </button>
            </div>

            {/* Main Multi-Column Split Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* ─── LEFT COLUMN: FLOW TRACKER STEPPER (Inspiration Styling) ─── */}
                <div className="lg:col-span-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-[32px] p-6 shadow-sm sticky top-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-455 dark:text-slate-500 mb-6 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-amber-500" /> Review Process Flow
                    </h3>

                    <div className="relative pl-10 space-y-10">
                        {/* Vertical Connection Line */}
                        <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-slate-100 dark:bg-slate-850" />

                        {/* Step 1 */}
                        <div 
                            onClick={() => handleStepClick(1)}
                            className={`relative cursor-pointer group transition-all duration-200 ${currentStep >= 1 ? "opacity-100" : "opacity-50"}`}
                        >
                            {/* Marker circle */}
                            <div className={`absolute -left-[30px] w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center transition-all ${
                                currentStep > 1 
                                    ? "bg-emerald-500 border-emerald-500 text-white" 
                                    : currentStep === 1 
                                        ? "bg-white dark:bg-slate-900 border-amber-500 text-amber-500" 
                                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                            }`}>
                                {currentStep > 1 ? <Check className="w-3 h-3 stroke-[3]" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                            </div>

                            {/* Info Card */}
                            <div className={`p-4 rounded-2xl border transition-all ${
                                currentStep === 1 
                                    ? "bg-slate-50/50 dark:bg-slate-900/30 border-amber-500/40 shadow-sm" 
                                    : "bg-transparent border-slate-100 dark:border-slate-850 hover:border-slate-200"
                            }`}>
                                <div className="text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider">
                                    {reviewType === "A" && "Stage 1 — Submissions"}
                                    {reviewType === "B" && "Stage 1 — Schedules"}
                                    {reviewType === "C" && "Stage 1 — Paper Draft"}
                                </div>
                                <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                                    {reviewType === "A" && "Lecturer Submission"}
                                    {reviewType === "B" && "Observation Setup"}
                                    {reviewType === "C" && "Exam Paper Draft"}
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium leading-relaxed">
                                    {reviewType === "A" && `${auditFields.lecturerName} uploaded syllabus course files.`}
                                    {reviewType === "B" && `Scheduled classroom lecture observation timing.`}
                                    {reviewType === "C" && `Uploaded exam script files & marking guidelines.`}
                                </p>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div 
                            onClick={() => handleStepClick(2)}
                            className={`relative cursor-pointer group transition-all duration-200 ${currentStep >= 2 ? "opacity-100" : "opacity-50"}`}
                        >
                            <div className={`absolute -left-[30px] w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center transition-all ${
                                currentStep > 2 
                                    ? "bg-emerald-500 border-emerald-500 text-white" 
                                    : currentStep === 2 
                                        ? "bg-white dark:bg-slate-900 border-amber-500 text-amber-500" 
                                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                            }`}>
                                {currentStep > 2 ? <Check className="w-3 h-3 stroke-[3]" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                            </div>

                            <div className={`p-4 rounded-2xl border transition-all ${
                                currentStep === 2 
                                    ? "bg-slate-50/50 dark:bg-slate-900/30 border-amber-500/40 shadow-sm" 
                                    : "bg-transparent border-slate-100 dark:border-slate-850 hover:border-slate-200"
                            }`}>
                                <div className="text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider">
                                    {reviewType === "A" && "Stage 2 — Assignment"}
                                    {reviewType === "B" && "Stage 2 — Lecturer Input"}
                                    {reviewType === "C" && "Stage 2 — Moderation"}
                                </div>
                                <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                                    {reviewType === "A" && "HOD Reviewer Allocation"}
                                    {reviewType === "B" && "Lecturer Self-Appraisal"}
                                    {reviewType === "C" && "Internal Moderation Panel"}
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium leading-relaxed">
                                    {reviewType === "A" && `Assigned course files to ${auditFields.observerName}.`}
                                    {reviewType === "B" && `Lecturer submitted pre-lecture outline questionnaire.`}
                                    {reviewType === "C" && `Assigned review panel to compile moderation rubrics.`}
                                </p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div 
                            onClick={() => handleStepClick(3)}
                            className={`relative cursor-pointer group transition-all duration-200 ${currentStep >= 3 ? "opacity-100" : "opacity-50"}`}
                        >
                            <div className={`absolute -left-[30px] w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center transition-all ${
                                currentStep > 3 
                                    ? "bg-emerald-500 border-emerald-500 text-white" 
                                    : currentStep === 3 
                                        ? "bg-white dark:bg-slate-900 border-amber-500 text-amber-500" 
                                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                            }`}>
                                {currentStep > 3 ? <Check className="w-3 h-3 stroke-[3]" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                            </div>

                            <div className={`p-4 rounded-2xl border transition-all ${
                                currentStep === 3 
                                    ? "bg-slate-50/50 dark:bg-slate-900/30 border-amber-500/40 shadow-sm" 
                                    : "bg-transparent border-slate-100 dark:border-slate-850 hover:border-slate-200"
                            }`}>
                                <div className="text-[10px] font-black uppercase text-slate-455 dark:text-slate-500 tracking-wider">Stage 3 — Evaluation</div>
                                <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                                    {reviewType === "A" && "Materials Audit Review"}
                                    {reviewType === "B" && "Classroom Observation"}
                                    {reviewType === "C" && "Board Compliance Moderation"}
                                </div>
                                <p className="text-[11px] text-slate-550 dark:text-slate-400 mt-1.5 font-medium leading-relaxed">
                                    {reviewType === "A" && `Audit checklists are actively evaluated.`}
                                    {reviewType === "B" && `Active grading of pacing and delivery structured.`}
                                    {reviewType === "C" && `Evaluating structural layout of questions.`}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Step 4: Capsule Completed Status */}
                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-850 flex justify-center">
                        <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all select-none ${
                            currentStep === 4 
                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-250 dark:border-emerald-900/50" 
                                : "bg-slate-50 dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800"
                        }`}>
                            <Award className="w-4 h-4" />
                            <span>Completed Review</span>
                        </div>
                    </div>
                </div>

                {/* ─── RIGHT COLUMN: AUDIT FORM CARDS (Inspiration Layout) ─── */}
                <form onSubmit={handleSubmit} className="lg:col-span-8 space-y-6">
                    
                    {/* CARD 1: Request Details */}
                    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-[32px] p-6 sm:p-8 shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <span className="w-1.5 h-6 bg-purple-500 rounded-full" />
                            <h3 className="text-base font-bold text-purple-650 dark:text-purple-400">Request & Review Details</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Lecturer Name</label>
                                <div className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-850 text-slate-900 dark:text-white font-semibold text-xs flex items-center gap-2">
                                    <User className="w-4 h-4 text-slate-400" />
                                    <span>{auditFields.lecturerName}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Course Code & Name</label>
                                <div className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-850 text-slate-900 dark:text-white font-semibold text-xs flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-slate-400" />
                                    <span>{auditFields.courseCode}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Academic Department</label>
                                <input 
                                    type="text" 
                                    value={auditFields.department} 
                                    onChange={(e) => setAuditFields(prev => ({ ...prev, department: e.target.value }))}
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-250 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-xs font-semibold"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Session Audit Date</label>
                                <input 
                                    type="date" 
                                    value={auditFields.sessionDate} 
                                    onChange={(e) => setAuditFields(prev => ({ ...prev, sessionDate: e.target.value }))}
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-250 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-xs font-semibold"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Alert Toast Feedback */}
                    {submitted && (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <Smile className="w-5 h-5" />
                            <span>Audit review request updated successfully! Flow updated.</span>
                        </div>
                    )}

                    {/* Form Submit Button */}
                    <button
                        type="submit"
                        className="w-full py-4 rounded-3xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-md shadow-amber-500/10 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-500/25 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer border border-amber-400"
                    >
                        <span>Update Review Flow Status</span>
                        <ArrowRight className="w-4 h-4 stroke-[3]" />
                    </button>
                </form>
            </div>
        </div>
    );
}
