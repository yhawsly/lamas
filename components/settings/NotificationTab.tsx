"use client";
import { Bell, Mail, Smartphone } from "lucide-react";
import { useState } from "react";

export default function NotificationTab() {
    const [preferences, setPreferences] = useState({
        courseApprovals: true,
        observationSchedules: true,
        appraisalReminders: true,
        systemAnnouncements: false,
    });

    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<string | null>(null);

    const handleSave = () => {
        setIsSaving(true);
        // Persist notification preferences
        setTimeout(() => {
            setIsSaving(false);
            setStatus("Preferences saved successfully.");
            setTimeout(() => setStatus(null), 3000);
        }, 500);
    };

    const togglePref = (key: keyof typeof preferences) => {
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Notification Preferences</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Control when and how you receive alerts from the LAMAS platform.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    
                    {/* Item 1 */}
                    <div className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <Bell className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Course Outline Approvals</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Get notified when the HOD approves or rejects your submitted syllabus.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => togglePref('courseApprovals')}
                            className={`w-12 h-6 rounded-full transition-colors relative ${preferences.courseApprovals ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                        >
                            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${preferences.courseApprovals ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    {/* Item 2 */}
                    <div className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Observation Schedules</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Receive email alerts when a peer or teaching observation is scheduled for your class.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => togglePref('observationSchedules')}
                            className={`w-12 h-6 rounded-full transition-colors relative ${preferences.observationSchedules ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                        >
                            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${preferences.observationSchedules ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    {/* Item 3 */}
                    <div className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                                <Smartphone className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Appraisal Reminders</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Get urgent reminders when a critical submission deadline is approaching.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => togglePref('appraisalReminders')}
                            className={`w-12 h-6 rounded-full transition-colors relative ${preferences.appraisalReminders ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                        >
                            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${preferences.appraisalReminders ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-850/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{status}</p>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 text-sm shadow-sm shadow-blue-600/20 hover:scale-95 cursor-pointer"
                    >
                        {isSaving ? "Saving..." : "Save Preferences"}
                    </button>
                </div>
            </div>
        </div>
    );
}
