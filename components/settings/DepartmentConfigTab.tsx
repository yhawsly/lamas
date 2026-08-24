"use client";

import { useState } from "react";
import { 
    ShieldCheck, Mail, Sliders, CheckCircle2, 
    Building2, Save 
} from "lucide-react";

export default function DepartmentConfigTab() {
    const [config, setConfig] = useState({
        minSyllabusCoverage: 85,
        peerObservationPolicy: "SENIOR_OR_HOD",
        autoReminderDays: 3,
        escalateToDeanAfterDays: 5,
        regularSlotDuration: 2,
        weekendSlotDuration: 3,
        officeHoursPerWeek: 4,
        allowLateSubmissions: true,
    });

    const [isSaving, setIsSaving] = useState(false);
    const [savedMsg, setSavedMsg] = useState<string | null>(null);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            setSavedMsg("Department configurations updated successfully.");
            setTimeout(() => setSavedMsg(null), 3500);
        }, 600);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    Department Governance & QA Standards
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                    Configure institutional quality assurance rules, submission thresholds, and escalation protocols for the Computer Science department.
                </p>
            </div>

            {savedMsg && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold text-sm flex items-center gap-2 shadow-xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    {savedMsg}
                </div>
            )}

            {/* QA & Submission Compliance Rules */}
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-6 shadow-xs space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">Academic Appraisal & Quality Assurance</h3>
                        <p className="text-xs text-slate-500">Criteria for signing off faculty syllabus coverage and peer appraisals</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Minimum Syllabus Coverage Threshold ({config.minSyllabusCoverage}%)
                        </label>
                        <input 
                            type="range" 
                            min="60" 
                            max="100" 
                            value={config.minSyllabusCoverage} 
                            onChange={(e) => setConfig({ ...config, minSyllabusCoverage: Number(e.target.value) })}
                            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                            <span>60% (Minimum)</span>
                            <span>85% (Recommended)</span>
                            <span>100% (Strict)</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Peer Observation Eligibility Rule
                        </label>
                        <select 
                            value={config.peerObservationPolicy}
                            onChange={(e) => setConfig({ ...config, peerObservationPolicy: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        >
                            <option value="SENIOR_OR_HOD">Senior Lecturer or HOD Only (Standard)</option>
                            <option value="PEER_TO_PEER">Any Full-Time CS Faculty (Peer-to-Peer)</option>
                            <option value="HOD_DEO_ONLY">HOD & Exam Officer Only</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Automation & Escalation Settings */}
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-6 shadow-xs space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <Mail className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">Automated Reminders & Escalation Policy</h3>
                        <p className="text-xs text-slate-500">Automated notification dispatches for pending Form A/B/C reviews</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Auto-Reminder Countdown
                        </label>
                        <select 
                            value={config.autoReminderDays}
                            onChange={(e) => setConfig({ ...config, autoReminderDays: Number(e.target.value) })}
                            className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        >
                            <option value={1}>1 Day before submission deadline</option>
                            <option value={3}>3 Days before submission deadline (Default)</option>
                            <option value={7}>7 Days before submission deadline</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Dean & Faculty Board Escalation
                        </label>
                        <select 
                            value={config.escalateToDeanAfterDays}
                            onChange={(e) => setConfig({ ...config, escalateToDeanAfterDays: Number(e.target.value) })}
                            className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        >
                            <option value={3}>Escalate after 3 overdue days</option>
                            <option value={5}>Escalate after 5 overdue days (Default)</option>
                            <option value={10}>Escalate after 10 overdue days</option>
                            <option value={0}>Disabled (HOD internal resolution only)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Timetable Slot Defaults */}
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-6 shadow-xs space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                        <Sliders className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">Department Teaching & Timetable Standards</h3>
                        <p className="text-xs text-slate-500">Default duration allocations for regular & weekend class slots</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/60">
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Regular Stream Slots</div>
                        <div className="text-lg font-black text-slate-900 dark:text-white mt-1">2.0 Hours</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">e.g. 08:30 AM – 10:30 AM</div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/60">
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Weekend Stream Slots</div>
                        <div className="text-lg font-black text-slate-900 dark:text-white mt-1">3.0 Hours</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">e.g. 09:00 AM – 12:00 PM</div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/60">
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Faculty Office Hours</div>
                        <div className="text-lg font-black text-slate-900 dark:text-white mt-1">4.0 Hours / Wk</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Student Consultation</div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                    <Save className="w-4 h-4" />
                    {isSaving ? "Saving Standards..." : "Save Department Standards"}
                </button>
            </div>
        </div>
    );
}
