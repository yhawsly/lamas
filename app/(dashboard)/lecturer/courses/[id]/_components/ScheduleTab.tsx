"use client";

import React, { useState, useMemo } from "react";
import { 
  Clock, CheckCircle, CheckCircle2, AlertTriangle, AlertCircle, 
  X, Check, Layers, BookOpen, Briefcase, GraduationCap, Calendar, CalendarDays 
} from "lucide-react";
import { INSTITUTIONAL_VENUES } from "@/lib/venues";
import { Class } from "./ModulesTab";

interface SectionSchedule {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  venue: string;
}

interface ScheduleTabProps {
  classes: Class[];
  sectionSchedules: Record<string, SectionSchedule>;
  setSectionSchedules: React.Dispatch<React.SetStateAction<Record<string, SectionSchedule>>>;
  handleSaveSchedule: (sectionId: string) => Promise<void>;
  savingScheduleId: string | null;
  scheduleToast: string | null;
}

export default function ScheduleTab({
  classes,
  sectionSchedules,
  setSectionSchedules,
  handleSaveSchedule,
  savingScheduleId,
  scheduleToast
}: ScheduleTabProps) {
  // Schedule Filter Tabs State
  const [scheduleStreamTab, setScheduleStreamTab] = useState<string>("all");
  const [scheduleDayTab, setScheduleDayTab] = useState<string>("all");
  const [scheduleSearchQuery, setScheduleSearchQuery] = useState<string>("");

  const getSectionCategory = (name: string) => {
    const upper = name.toUpperCase();
    if (upper.includes("TOP-UP") || upper.includes("TOP UP")) return "topup_wkd";
    if (upper.includes("BTECH") || upper.includes("B.TECH")) {
      return upper.includes("WEEKEND") ? "btech_wkd" : "btech_reg";
    }
    if (upper.includes("HND")) {
      return upper.includes("WEEKEND") ? "hnd_wkd" : "hnd_reg";
    }
    return upper.includes("WEEKEND") ? "other_wkd" : "other_reg";
  };

  const streamTabs = useMemo(() => [
    { id: "all", label: "All Classes", count: classes.length, icon: Layers },
    { id: "btech_reg", label: "B.Tech Regular", count: classes.filter(c => getSectionCategory(c.name) === "btech_reg").length, icon: BookOpen },
    { id: "btech_wkd", label: "B.Tech Weekend", count: classes.filter(c => getSectionCategory(c.name) === "btech_wkd").length, icon: Briefcase },
    { id: "hnd_reg", label: "HND Regular", count: classes.filter(c => getSectionCategory(c.name) === "hnd_reg").length, icon: BookOpen },
    { id: "hnd_wkd", label: "HND Weekend", count: classes.filter(c => getSectionCategory(c.name) === "hnd_wkd").length, icon: Briefcase },
    { id: "topup_wkd", label: "Top-Up Weekend", count: classes.filter(c => getSectionCategory(c.name) === "topup_wkd").length, icon: GraduationCap },
  ].filter(tab => tab.id === "all" || tab.count > 0), [classes]);

  const filteredScheduleClasses = useMemo(() => {
    return classes.filter(cls => {
      const cat = getSectionCategory(cls.name);
      if (scheduleStreamTab !== "all" && cat !== scheduleStreamTab) return false;

      const form = sectionSchedules[cls.id] || { dayOfWeek: "", startTime: "", endTime: "", venue: "" };
      if (scheduleDayTab === "scheduled" && !form.dayOfWeek) return false;
      if (scheduleDayTab === "unscheduled" && form.dayOfWeek) return false;
      if (scheduleDayTab === "regular" && (form.dayOfWeek === "Saturday" || form.dayOfWeek === "Sunday" || !form.dayOfWeek)) return false;
      if (scheduleDayTab === "saturday" && form.dayOfWeek !== "Saturday") return false;
      if (scheduleDayTab === "sunday" && form.dayOfWeek !== "Sunday") return false;

      if (scheduleSearchQuery.trim()) {
        const q = scheduleSearchQuery.toLowerCase();
        const matchName = cls.name.toLowerCase().includes(q);
        const matchVenue = (form.venue || "").toLowerCase().includes(q);
        const matchDay = (form.dayOfWeek || "").toLowerCase().includes(q);
        if (!matchName && !matchVenue && !matchDay) return false;
      }

      return true;
    });
  }, [classes, scheduleStreamTab, scheduleDayTab, scheduleSearchQuery, sectionSchedules]);

  return (
    <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            My Schedule & Class Allocations
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Configure teaching schedules, days, and venues for each assigned class section.
          </p>
        </div>
        {scheduleToast && (
          <div className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            {scheduleToast}
          </div>
        )}
      </header>

      {classes.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-700 dark:text-slate-300">No sections assigned to you for this course yet.</p>
          <p className="text-xs text-slate-400 mt-1">Contact your HOD to assign class sections to your account.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── Interactive Stream Tabs ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {streamTabs.map(tab => {
                const TabIcon = tab.icon;
                const isActive = scheduleStreamTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setScheduleStreamTab(tab.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-500/20"
                        : "bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    <TabIcon className={`w-3.5 h-3.5 ${isActive ? "opacity-100" : "opacity-60"}`} />
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                      isActive 
                        ? "bg-white/20 text-white" 
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64 shrink-0">
              <input
                type="text"
                value={scheduleSearchQuery}
                onChange={e => setScheduleSearchQuery(e.target.value)}
                placeholder="Search class or venue..."
                className="w-full pl-9 pr-8 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
              />
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {scheduleSearchQuery && (
                <button
                  type="button"
                  onClick={() => setScheduleSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md transition cursor-pointer"
                  aria-label="Clear schedule search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* ── Secondary Day / Status Filter Pills ── */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mr-1">Filter:</span>
            {[
              { id: "all", label: "All Sessions", icon: null },
              { id: "regular", label: "Mon–Fri (Regular)", icon: Calendar },
              { id: "saturday", label: "Saturday Only", icon: CalendarDays },
              { id: "sunday", label: "Sunday Only", icon: CalendarDays },
              { id: "scheduled", label: "Scheduled", icon: CheckCircle2 },
              { id: "unscheduled", label: "Needs Schedule", icon: AlertCircle },
            ].map(pill => {
              const PillIcon = pill.icon;
              const isActive = scheduleDayTab === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setScheduleDayTab(pill.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? "bg-amber-500 text-white shadow-xs shadow-amber-500/25"
                      : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80"
                  }`}
                >
                  {PillIcon && (
                    <PillIcon className={`w-3 h-3 ${isActive ? "text-white" : pill.id === "scheduled" ? "text-emerald-500" : pill.id === "unscheduled" ? "text-amber-500" : "text-slate-400"}`} />
                  )}
                  <span>{pill.label}</span>
                </button>
              );
            })}
          </div>

          {/* ── Filtered Classes List ── */}
          {filteredScheduleClasses.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <p className="font-bold text-slate-700 dark:text-slate-300">No classes match your active filter.</p>
              <p className="text-xs text-slate-400 mt-1">Try selecting &quot;All Classes&quot; or clearing your search keywords.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredScheduleClasses.map(cls => {
                const form = sectionSchedules[cls.id] || { dayOfWeek: "", startTime: "", endTime: "", venue: "" };
                const isSavingThis = savingScheduleId === cls.id;
                const isWeekend = cls.name.toUpperCase().includes("WEEKEND");
                const isTopUp = cls.name.toUpperCase().includes("TOP-UP") || cls.name.toUpperCase().includes("TOP UP");

                return (
                  <div 
                    key={cls.id} 
                    className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden transition-all hover:border-slate-300 dark:hover:border-slate-700"
                  >
                    {/* Card Header with Badges */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/40">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-8 rounded-full ${
                          isTopUp 
                            ? "bg-indigo-600" 
                            : isWeekend 
                            ? "bg-amber-500" 
                            : "bg-blue-600"
                        }`} />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{cls.name}</h3>
                            {isTopUp && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                Top-Up
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                              isWeekend
                                ? "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                : "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                            }`}>
                              {isWeekend ? "Weekend Session" : "Regular Session"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Current Live Status Pill */}
                      <div>
                        {form.dayOfWeek ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {form.dayOfWeek} {form.startTime && `· ${form.startTime}`}{form.endTime && `–${form.endTime}`}{form.venue && ` (${form.venue})`}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-2xs">
                            <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                            <span>Schedule not set</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Day of Week</label>
                        <select
                          value={form.dayOfWeek}
                          onChange={e => setSectionSchedules(prev => ({ ...prev, [cls.id]: { ...form, dayOfWeek: e.target.value } }))}
                          className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-slate-200 transition cursor-pointer"
                        >
                          <option value="">— Select day —</option>
                          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Start Time</label>
                        <input
                          type="text"
                          placeholder="e.g. 08:30 AM"
                          value={form.startTime}
                          onChange={e => setSectionSchedules(prev => ({ ...prev, [cls.id]: { ...form, startTime: e.target.value } }))}
                          className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-slate-200 transition"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">End Time</label>
                        <input
                          type="text"
                          placeholder="e.g. 10:30 AM"
                          value={form.endTime}
                          onChange={e => setSectionSchedules(prev => ({ ...prev, [cls.id]: { ...form, endTime: e.target.value } }))}
                          className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-slate-200 transition"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Venue / Room</label>
                        <input
                          type="text"
                          list={`course-venue-list-${cls.id}`}
                          value={form.venue}
                          onChange={e => setSectionSchedules(prev => ({ ...prev, [cls.id]: { ...form, venue: e.target.value } }))}
                          placeholder="Type or select venue (e.g. AVIC LAB)..."
                          className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 transition"
                        />
                        <datalist id={`course-venue-list-${cls.id}`}>
                          {INSTITUTIONAL_VENUES.map(v => (
                            <option key={v.value} value={v.value}>{v.label}</option>
                          ))}
                        </datalist>
                      </div>
                    </div>

                    <div className="px-6 pb-4 pt-1 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] text-slate-400">Updates sync in real-time with your timetable and dashboard timeline.</span>
                      <button
                        type="button"
                        onClick={() => handleSaveSchedule(cls.id)}
                        disabled={isSavingThis || !form.dayOfWeek}
                        className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 shadow-sm shadow-blue-600/20 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        {isSavingThis ? "Saving..." : "Save Schedule"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
