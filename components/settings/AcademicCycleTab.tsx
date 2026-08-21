"use client";

import { useState } from "react";
import { 
    Calendar, Clock, Lock, Archive, CheckCircle2, 
    AlertCircle, Download, FileText, Sparkles, Save, ShieldCheck 
} from "lucide-react";
import { useTerm } from "@/context/TermContext";

export default function AcademicCycleTab() {
    const { activeTerm, selectedTerm } = useTerm();
    
    const [policy, setPolicy] = useState({
        allowLateSubmissions: true,
        lateGraceHours: 48,
        autoArchivePreviousTerm: true,
        enforceWeeklyTopicLocks: false,
    });

    const [isSaving, setIsSaving] = useState(false);
    const [savedMsg, setSavedMsg] = useState<string | null>(null);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            setSavedMsg("Academic cycle policies saved successfully.");
            setTimeout(() => setSavedMsg(null), 3500);
        }, 600);
    };

    const formatDate = (dateInput: string | Date | undefined) => {
        if (!dateInput) return "—";
        return new Date(dateInput).toLocaleDateString("en-GB", { 
            day: "numeric", 
            month: "short", 
            year: "numeric" 
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    Academic Cycle & Deadline Governance
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                    Manage institutional semester lifecycles, submission grace periods, and audit snapshot policies.
                </p>
            </div>

            {savedMsg && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold text-sm flex items-center gap-2 shadow-xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    {savedMsg}
                </div>
            )}

            {/* Active Semester Overview Banner */}
            <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                                    Current Live Semester
                                </span>
                            </div>
                            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                                {activeTerm?.name || "Semester 1 2025/2026"}
                            </h3>
                            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex flex-wrap items-center gap-3">
                                <span>📅 <strong>Date of Commencement:</strong> {formatDate(activeTerm?.startDate || "2026-05-12")}</span>
                                <span>•</span>
                                <span>🏁 <strong>Conclusion:</strong> {formatDate(activeTerm?.endDate || "2026-09-12")}</span>
                            </div>
                        </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                        <span className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-emerald-500/30 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 shadow-xs">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Active & Audited
                        </span>
                    </div>
                </div>
            </div>

            {/* Standard Submission Windows Schedule */}
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-6 shadow-xs space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">Standard Submission Milestones</h3>
                        <p className="text-xs text-slate-500">Quality assurance roadmap mapped across the active semester</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Week 2 Milestone</span>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">Form A: Topic & Calendar</h4>
                            <p className="text-[11px] text-slate-500 mt-1">Course syllabus, 14-week topic distribution, and learning outcomes.</p>
                        </div>
                        <div className="mt-3 text-[10px] font-semibold text-slate-400">Due within 14 days of commencement</div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Weeks 6–9 Milestone</span>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">Form B: Class Observation</h4>
                            <p className="text-[11px] text-slate-500 mt-1">Peer review and HOD classroom teaching observation appraisal.</p>
                        </div>
                        <div className="mt-3 text-[10px] font-semibold text-slate-400">Scheduled mid-semester</div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">Week 12 Milestone</span>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">Form C: Exam Moderation</h4>
                            <p className="text-[11px] text-slate-500 mt-1">Internal examiner and peer moderation of semester examination papers.</p>
                        </div>
                        <div className="mt-3 text-[10px] font-semibold text-slate-400">Pre-exam dispatch check</div>
                    </div>
                </div>
            </div>

            {/* Cutoff & Grace Period Controls */}
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-6 shadow-xs space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <Lock className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">Submission Cutoff & Grace Periods</h3>
                        <p className="text-xs text-slate-500">Determine how the platform handles deadlines and late submissions</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                        <div>
                            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">Allow Late Submissions</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">Flag submissions after deadline with a red LATE badge instead of hard-locking.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setPolicy({ ...policy, allowLateSubmissions: !policy.allowLateSubmissions })}
                            className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ml-4 ${
                                policy.allowLateSubmissions ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-600"
                            }`}
                        >
                            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                                policy.allowLateSubmissions ? "left-7" : "left-1"
                            }`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                        <div>
                            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">Auto-Freeze Past Semesters</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">Automatically mark prior terms as read-only archives upon activating a new term.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setPolicy({ ...policy, autoArchivePreviousTerm: !policy.autoArchivePreviousTerm })}
                            className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ml-4 ${
                                policy.autoArchivePreviousTerm ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-600"
                            }`}
                        >
                            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                                policy.autoArchivePreviousTerm ? "left-7" : "left-1"
                            }`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Save Policy Button */}
            <div className="flex justify-end pt-2">
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                    <Save className="w-4 h-4" />
                    {isSaving ? "Updating Policies..." : "Save Academic Policies"}
                </button>
            </div>
        </div>
    );
}
