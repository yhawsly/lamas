"use client";
import { Bell, Mail, Smartphone, AlertCircle } from "lucide-react";
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
        // Simulate API call for prototype
        setTimeout(() => {
            setIsSaving(false);
            setStatus("Preferences saved successfully.");
            setTimeout(() => setStatus(null), 3000);
        }, 800);
    };

    const togglePref = (key: keyof typeof preferences) => {
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Notification Preferences</h2>
                <p className="text-gray-500 text-sm">Control when and how you receive alerts from the LAMAS platform.</p>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-sm font-bold text-blue-900">Prototype Mode</h4>
                    <p className="text-xs text-blue-700 mt-1">
                        These settings are currently a visual prototype. A future update will persist these choices to your database profile.
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    
                    {/* Item 1 */}
                    <div className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <Bell className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-gray-900 dark:text-white">Course Outline Approvals</h4>
                                <p className="text-xs text-gray-500 mt-0.5">Get notified when the HOD approves or rejects your submitted syllabus.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => togglePref('courseApprovals')}
                            className={`w-12 h-6 rounded-full transition-colors relative ${preferences.courseApprovals ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'}`}
                        >
                            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${preferences.courseApprovals ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    {/* Item 2 */}
                    <div className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-gray-900 dark:text-white">Observation Schedules</h4>
                                <p className="text-xs text-gray-500 mt-0.5">Receive email alerts when a peer or teaching observation is scheduled for your class.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => togglePref('observationSchedules')}
                            className={`w-12 h-6 rounded-full transition-colors relative ${preferences.observationSchedules ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'}`}
                        >
                            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${preferences.observationSchedules ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    {/* Item 3 */}
                    <div className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                                <Smartphone className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-gray-900 dark:text-white">Appraisal Reminders</h4>
                                <p className="text-xs text-gray-500 mt-0.5">Get urgent reminders when a critical submission deadline is approaching.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => togglePref('appraisalReminders')}
                            className={`w-12 h-6 rounded-full transition-colors relative ${preferences.appraisalReminders ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'}`}
                        >
                            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${preferences.appraisalReminders ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                </div>

                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <p className="text-xs font-bold text-emerald-600">{status}</p>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl transition-all disabled:opacity-50 text-sm hover:scale-95"
                    >
                        {isSaving ? "Saving..." : "Save Preferences"}
                    </button>
                </div>
            </div>
        </div>
    );
}
