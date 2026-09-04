"use client";

import React, { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";
import { 
  CheckCircle, AlertTriangle, Circle, History 
} from "lucide-react";

import { useTerm } from "@/context/TermContext";
import { useModal } from "@/context/ModalContext";
import RefreshButton from "@/components/ui/RefreshButton";

import { Module } from "./_components/ModuleResourceDropzone";
import TopicsTab from "./_components/TopicsTab";
import ModulesTab, { Class } from "./_components/ModulesTab";
import AssessmentsTab, { AssessmentItem } from "./_components/AssessmentsTab";
import ScheduleTab from "./_components/ScheduleTab";

// Dynamically import historical modal to reduce initial bundle
const DynamicHistoricalImportModal = dynamic(
  () => import("./_components/HistoricalImportModal"),
  { ssr: false }
);

const fetcher = (url: string) => fetch(url).then(res => res.ok ? res.json() : null);

const CourseOutlineSkeleton = () => (
    <div className="max-w-7xl mx-auto space-y-8 animate-pulse pb-20 pt-6 px-4">
        <div className="flex justify-between items-center">
            <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700/80 rounded" />
            <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700/80 rounded" />
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="space-y-3">
                <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700/80 rounded" />
                <div className="h-9 w-48 bg-slate-200 dark:bg-slate-700/80 rounded-lg" />
                <div className="h-5 w-72 bg-slate-200 dark:bg-slate-700/80 rounded" />
            </div>
            <div className="flex gap-3 w-full md:w-auto">
                <div className="h-10 w-28 bg-slate-200 dark:bg-slate-700/80 rounded-xl" />
                <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700/80 rounded-xl" />
            </div>
        </div>
        <div className="flex gap-6 border-b border-slate-200 dark:border-slate-800 pb-3">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-5 w-24 bg-slate-200 dark:bg-slate-700/80 rounded" />
            ))}
        </div>
        <div className="space-y-6">
            <div className="flex justify-between">
                <div className="space-y-2">
                    <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700/80 rounded" />
                    <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700/80 rounded" />
                </div>
                <div className="h-9 w-32 bg-slate-200 dark:bg-slate-700/80 rounded-lg" />
            </div>
            <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 flex flex-col items-center justify-center space-y-4">
                <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700/80 rounded-full" />
                <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700/80 rounded" />
                <div className="h-3 w-64 bg-slate-200 dark:bg-slate-700/80 rounded" />
            </div>
        </div>
    </div>
);

export default function CourseOutlinePrototype() {
  const params = useParams();
  const router = useRouter();
  const { showWarning, showError, showSuccess } = useModal();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [selectedCourseId] = useState<string | null>((params?.id as string) || "c1");
  const [topics, setTopics] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("topics");
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const tabVal = sp.get("tab");
      if (tabVal) setActiveTab(tabVal);
    }
  }, []);
  
  const [basicInfo, setBasicInfo] = useState({
    courseCode: "",
    title: "Loading...",
    description: "",
    credits: "3",
  });

  const [assessments, setAssessments] = useState<AssessmentItem[]>([
    { id: 1, name: "Continuous Assessment / Quizzes", weight: 20 },
    { id: 2, name: "Mid-Semester Examination & Labs", weight: 20 },
    { id: 3, name: "End of Semester Examination", weight: 60 },
  ]);

  // Classes State
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState("DRAFT");

  // Schedule per-section state (keyed by section id)
  const [sectionSchedules, setSectionSchedules] = useState<Record<string, { dayOfWeek: string; startTime: string; endTime: string; venue: string }>>({});
  const [savingScheduleId, setSavingScheduleId] = useState<string | null>(null);
  const [scheduleToast, setScheduleToast] = useState<string | null>(null);

  // Historical Syllabus Import & Reuse State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historicalList, setHistoricalList] = useState<any[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any | null>(null);

  // Auto-save & Status states
  const [saveIndicator, setSaveIndicator] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [isDirty, setIsDirty] = useState(false);
  const isInitialLoadRef = useRef(true);

  // SWR Caching for instant page loads
  const { selectedTermId, isArchiveMode } = useTerm();
  const courseId = params?.id ? Number(params.id) : null;
  const { data: courseData } = useSWR(courseId ? `/api/courses/${courseId}` : null, fetcher);
  const { data: sectionsData } = useSWR(selectedTermId ? `/api/courses/my-sections?termId=${selectedTermId}` : "/api/courses/my-sections", fetcher);
  const { data: syllabusData } = useSWR(courseId ? `/api/courses/${courseId}/syllabus${selectedTermId ? '?termId=' + selectedTermId : ''}` : null, fetcher);
  const { mutate } = useSWRConfig();

  const [loadedCourseId, setLoadedCourseId] = useState<number | null>(null);

  // Reset load state when courseId changes
  useEffect(() => {
    isInitialLoadRef.current = true;
    setLoadedCourseId(null);
  }, [courseId]);

  // Synchronize fetched data with local form states on load
  useEffect(() => {
    if (!courseId) return;
    if (loadedCourseId === courseId) return;
    if (!courseData || !sectionsData || syllabusData === undefined) return;

    // 1. Basic Course Info
    if (courseData && courseData.code) {
      setBasicInfo(prev => ({
        ...prev,
        courseCode: courseData.code,
        title: courseData.title,
        description: courseData.description || "",
        credits: String(courseData.credits ?? 3),
      }));
    }

    // 2. Syllabus Data
    let savedClasses: any = null;
    let resolvedTopics: any[] = [];

    if (syllabusData) {
      if (syllabusData.lecturer) {
        const lec = syllabusData.lecturer;
        if (lec.topics && Array.isArray(lec.topics) && lec.topics.length > 0) {
          setTopics(lec.topics);
          resolvedTopics = lec.topics;
        }
        if (lec.assessments) setAssessments(lec.assessments);
        if (lec.classes) savedClasses = lec.classes;
        if (lec.basicInfo) {
           setBasicInfo(prev => ({
             courseCode: courseData?.code || lec.basicInfo.courseCode || prev.courseCode,
             title: courseData?.title || lec.basicInfo.title || prev.title,
             description: lec.basicInfo.description || prev.description,
             credits: lec.basicInfo.credits || prev.credits,
           }));
        }
        setSubmissionStatus(syllabusData.status || "DRAFT");
      }
      
      // Fallback to master syllabus topics if no lecturer topics exist yet
      if (resolvedTopics.length === 0 && syllabusData.master) {
        const master = syllabusData.master;
        if (master.mandatoryTopics) {
          const parsedTopics = typeof master.mandatoryTopics === "string" 
            ? JSON.parse(master.mandatoryTopics) 
            : master.mandatoryTopics;
          
          if (Array.isArray(parsedTopics)) {
            const mapped = parsedTopics.map((t: any, index: number) => ({
              id: t.id ? Number(t.id) : (index + 1),
              title: t.title || t.name || `Week ${index + 1} Module`,
              description: t.description || ""
            }));
            setTopics(mapped);
            resolvedTopics = mapped;
          }
        }
      }
    }

    const generateWeeklyModules = (topicList: any[]): Module[] => {
      if (!topicList || topicList.length === 0) return [];
      return topicList.map((t: any, idx: number) => ({
        id: t.id ? Number(t.id) : (idx + 1),
        week: idx + 1,
        title: t.title || `Week ${idx + 1}: Fundamental Principles`,
        description: t.description || `Comprehensive exploration of ${t.title || 'course topic'}, interactive demonstrations, and laboratory work.`,
        lesson_plan: `1. Interactive lecture presentation on ${t.title || 'the core topic'}\n2. Practical lab / case study application\n3. Review quiz and formative student Q&A`,
        completed: idx < 2,
        resources: []
      }));
    };

    // 3. Classes
    const mySections = (sectionsData.sections || []).filter((sec: any) => sec.courseId === courseId);
    if (mySections.length > 0) {
      setClasses(mySections.map((sec: any) => {
        const savedClass = savedClasses?.find((c: any) => c.id === sec.id.toString());
        let classModules = savedClass?.modules;
        if (!classModules || !Array.isArray(classModules) || classModules.length === 0) {
          classModules = generateWeeklyModules(resolvedTopics);
        }
        return {
          id: sec.id.toString(),
          name: sec.name,
          modules: classModules,
        };
      }));

      setSectionSchedules(prev => {
        const next = { ...prev };
        mySections.forEach((sec: any) => {
          if (!next[sec.id.toString()]) {
            next[sec.id.toString()] = {
              dayOfWeek: sec.dayOfWeek || "",
              startTime: sec.startTime || "",
              endTime: sec.endTime || "",
              venue: sec.venue || "",
            };
          }
        });
        return next;
      });
    } else {
      if (savedClasses && savedClasses.length > 0) {
        setClasses(savedClasses);
      } else if (resolvedTopics.length > 0) {
        setClasses([
          {
            id: "default_section",
            name: `${courseData?.code || 'Course'} - Section 1`,
            modules: generateWeeklyModules(resolvedTopics)
          }
        ]);
      } else {
        setClasses([]);
      }
    }

    setLoadedCourseId(courseId);

    setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 100);
  }, [courseId, courseData, sectionsData, syllabusData, loadedCourseId]);

  // Auto-save effect
  useEffect(() => {
    if (isInitialLoadRef.current || isArchiveMode) return;

    setIsDirty(true);
    setSaveIndicator("idle");

    const delayDebounceFn = setTimeout(() => {
      const autoSave = async () => {
        if (!params?.id || isArchiveMode) return;
        setSaveIndicator("saving");
        try {
          const res = await fetch(`/api/courses/${params.id}/syllabus`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              basicInfo,
              topics,
              classes,
              assessments,
              submit: false,
              termId: selectedTermId
            })
          });
          if (res.ok) {
            mutate(`/api/courses/${params.id}/syllabus${selectedTermId ? '?termId=' + selectedTermId : ''}`);
            setSaveIndicator("saved");
            setIsDirty(false);
            setTimeout(() => setSaveIndicator("idle"), 2000);
          } else {
            setSaveIndicator("error");
          }
        } catch (e) {
          console.error("Auto-save error:", e);
          setSaveIndicator("error");
        }
      };
      autoSave();
    }, 3000);

    return () => clearTimeout(delayDebounceFn);
  }, [basicInfo, topics, classes, assessments, params?.id, mutate, isArchiveMode, selectedTermId]);

  // Warn about unsaved changes on tab close/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleSaveToDB = async (submit = false) => {
    if (!params?.id) return;
    if (isArchiveMode) {
      setToastMessage("Action Disabled: You are currently viewing a read-only historical archive.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    setIsSaving(true);
    if (!submit) {
      setSaveIndicator("saving");
    }
    try {
      const res = await fetch(`/api/courses/${params.id}/syllabus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          basicInfo,
          topics,
          classes,
          assessments,
          submit,
          termId: selectedTermId
        })
      });
      if (res.ok) {
        mutate(`/api/courses/${params.id}/syllabus${selectedTermId ? '?termId=' + selectedTermId : ''}`);
        if (submit) {
          setToastMessage("Syllabus submitted for HOD review!");
          setSubmissionStatus("SUBMITTED");
          setTimeout(() => setToastMessage(null), 3000);
        } else {
          setSaveIndicator("saved");
          setIsDirty(false);
          setTimeout(() => setSaveIndicator("idle"), 2000);
        }
      } else {
        if (submit) {
          showError("Submission Failed", "Failed to submit course syllabus. Please verify all sections and try again.");
        } else {
          setSaveIndicator("error");
        }
      }
    } catch (e) {
      console.error(e);
      if (submit) {
        showError("Save Error", "Error saving data. Please check your network connection.");
      } else {
        setSaveIndicator("error");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const [isExporting, setIsExporting] = useState(false);
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/export-syllabus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topics, classes }),
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${basicInfo.courseCode.replace(/[^a-zA-Z0-9]/g, "_")}_Syllabus.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error(err);
      showError("Export Failed", "Failed to export Excel file.");
    } finally {
      setIsExporting(false);
    }
  };

  const [isExtracting, setIsExtracting] = useState(false);
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (isArchiveMode) {
      showWarning("Action Disabled", "File uploads are disabled in Read-Only Archive Mode.");
      return;
    }
    setIsExtracting(true);

    const formData = new FormData();
    formData.append("syllabus", file);

    try {
      const response = await fetch("/api/extract-syllabus", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to extract");
      }

      const data = await response.json();
      setTopics(data.topics);
      setClasses(prev => prev.map(c => ({
        ...c,
        modules: data.modules.map((m: any) => ({ 
          ...m, 
          completed: false, 
          id: Date.now() + Math.random()
        }))
      })));

      setActiveTab("topics");
    } catch (error: any) {
      console.error(error);
      showError("Extraction Failed", error.message || "Failed to extract syllabus. Please try again.");
    } finally {
      setIsExtracting(false);
    }
  };

  const updateModule = (classId: string, moduleId: number, updates: Partial<Module>) => {
    setClasses(prev => prev.map(c => {
      if (c.id !== classId) return c;
      return {
        ...c,
        modules: c.modules.map(m => m.id === moduleId ? { ...m, ...updates } : m)
      };
    }));
  };

  const handleAddWeek = (classId: string) => {
    const newId = Date.now();
    setClasses(prev => prev.map(c => {
      if (c.id !== classId) return c;
      const nextWeek = c.modules.length > 0 ? Math.max(...c.modules.map(m => m.week)) + 1 : 1;
      const newModule: Module = {
        id: newId,
        week: nextWeek,
        title: "New Week Topic",
        description: "",
        lesson_plan: "",
        completed: false
      };
      return { ...c, modules: [...c.modules, newModule] };
    }));
  };

  const handleSyncClassWithTopics = (classId: string) => {
    if (isArchiveMode) return;
    if (topics.length === 0) {
      showWarning("No Topics Found", "No topics found in Course Topics tab to sync from.");
      return;
    }
    const freshModules: Module[] = topics.map((t, idx) => ({
      id: Number(t.id) || (idx + 1),
      week: idx + 1,
      title: t.title || `Week ${idx + 1} Module`,
      description: t.description || `Comprehensive overview of ${t.title || 'course topic'}, interactive demonstrations, and laboratory work.`,
      lesson_plan: `1. Interactive lecture presentation on ${t.title || 'the core topic'}\n2. Practical lab / case study application\n3. Review quiz and formative student Q&A`,
      completed: idx < 2,
      resources: []
    }));
    setClasses(prev => prev.map(c => c.id === classId ? { ...c, modules: freshModules } : c));
    showSuccess("Synchronized", "Weekly schedule successfully synchronized with Course Topics!");
  };

  const showScheduleToast = (msg: string) => {
    setScheduleToast(msg);
    setTimeout(() => setScheduleToast(null), 2500);
  };

  const handleSaveSchedule = async (sectionId: string) => {
    const form = sectionSchedules[sectionId];
    if (!form?.dayOfWeek) return;
    setSavingScheduleId(sectionId);
    try {
      const res = await fetch(`/api/courses/sections/${sectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        showScheduleToast("Schedule saved! Your dashboard will now show this class.");
      } else {
        const d = await res.json().catch(() => ({}));
        showScheduleToast(d.error || "Failed to save schedule.");
      }
    } catch {
      showScheduleToast("An error occurred.");
    } finally {
      setSavingScheduleId(null);
    }
  };

  const openHistoryModal = async () => {
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/syllabus/history`);
      if (res.ok) {
        const data = await res.json();
        setHistoricalList(data.history || []);
        if (data.history && data.history.length > 0) {
          setSelectedHistoryItem(data.history[0]);
        }
      }
    } catch (e) {
      console.error("Failed to load historical syllabi:", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleApplyHistoricalOutline = (item: any) => {
    if (!item || !item.content) return;
    const parsed = item.content;
    if (Array.isArray(parsed.topics) && parsed.topics.length > 0) {
      setTopics(parsed.topics);
    }
    if (Array.isArray(parsed.classes) && parsed.classes.length > 0) {
      setClasses(prevClasses => {
        if (prevClasses.length === 0) return parsed.classes;
        const sampleModules = parsed.classes[0]?.modules || [];
        return prevClasses.map((cls, idx) => ({
          ...cls,
          modules: parsed.classes[idx]?.modules || sampleModules
        }));
      });
    }
    if (Array.isArray(parsed.assessments) && parsed.assessments.length > 0) {
      setAssessments(parsed.assessments);
    }
    setIsDirty(true);
    setIsHistoryModalOpen(false);
    setToastMessage(`Imported outline from ${item.term?.name || 'past semester'}! You can now modify and save.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  if (!courseData || !sectionsData || (syllabusData === undefined)) {
    return <CourseOutlineSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500 font-sans pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-800 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-300 z-50">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {selectedCourseId ? (
        <main className="w-full">
          <header className="mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 relative z-10">
              <button 
                onClick={() => router.push("/lecturer/courses")} 
                className="text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1.5 py-1 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back to Courses
              </button>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 px-2 py-1">
                  {saveIndicator === "saving" && (
                    <span className="text-indigo-600 flex items-center gap-1.5 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
                      Saving...
                    </span>
                  )}
                  {saveIndicator === "saved" && (
                    <span className="text-emerald-600 flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" /> Saved
                    </span>
                  )}
                  {saveIndicator === "error" && (
                    <span className="text-rose-600 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Error
                    </span>
                  )}
                  {saveIndicator === "idle" && isDirty && (
                    <span className="text-amber-600 flex items-center gap-1.5">
                      <Circle className="w-3.5 h-3.5 fill-current" /> Unsaved
                    </span>
                  )}
                  {saveIndicator === "idle" && !isDirty && (
                    <span className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" /> Synced
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 sm:gap-6 mb-6 sm:mb-8 relative z-10">
              <div>
                <div className="flex items-center gap-3 mb-1.5 sm:mb-2">
                  <span className="text-blue-600 dark:text-blue-400 text-xs font-black tracking-widest uppercase">
                    Course Workspace
                  </span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{basicInfo.courseCode}</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-lg mt-0.5 sm:mt-1">{basicInfo.title}</p>
              </div>

              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
                <RefreshButton
                  onClick={async () => {
                    if (!courseId) return;
                    await Promise.all([
                      mutate(`/api/courses/${courseId}`),
                      mutate(selectedTermId ? `/api/courses/my-sections?termId=${selectedTermId}` : "/api/courses/my-sections"),
                      mutate(`/api/courses/${courseId}/syllabus${selectedTermId ? '?termId=' + selectedTermId : ''}`)
                    ]);
                  }}
                  label="Refresh"
                  size="md"
                  variant="outline"
                  title="Reload course syllabus and sections"
                />
                <button 
                  type="button"
                  onClick={openHistoryModal} 
                  disabled={isArchiveMode} 
                  className="px-3 sm:px-4 py-2.5 rounded-xl bg-blue-50/80 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 dark:text-blue-300 transition-all font-bold flex items-center justify-center gap-1.5 sm:gap-2 shadow-xs text-xs sm:text-sm border border-blue-200 dark:border-blue-800/80 disabled:opacity-50 cursor-pointer min-h-[42px]"
                  title="Import approved topics and weekly outline from previous semesters"
                >
                  <History className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="truncate">History</span>
                </button>
                <button 
                  onClick={() => handleSaveToDB(false)} 
                  disabled={isSaving || isArchiveMode} 
                  className="px-3.5 sm:px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all font-bold flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm text-xs sm:text-sm border border-slate-200 dark:border-slate-700 disabled:opacity-50 cursor-pointer min-h-[42px]"
                >
                  {isSaving ? "Saving..." : "Save Draft"}
                </button>
                <button 
                  onClick={() => handleSaveToDB(true)} 
                  disabled={isSaving || submissionStatus === "SUBMITTED" || isArchiveMode} 
                  className={`px-3.5 sm:px-5 py-2.5 rounded-xl ${
                    submissionStatus === "SUBMITTED" 
                      ? "bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400 border-green-200 cursor-not-allowed" 
                      : isArchiveMode 
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 cursor-not-allowed" 
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20 hover:shadow-blue-600/30 cursor-pointer"
                  } transition-all font-bold flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm border border-transparent min-h-[42px]`}
                >
                  {isArchiveMode ? "Read-Only" : submissionStatus === "SUBMITTED" ? "Submitted" : "Submit"}
                </button>
              </div>
            </div>
          
            {/* ── Compact & Refined Responsive Tab Navigation ── */}
            <nav className="flex items-center gap-4 sm:gap-8 border-b border-slate-200 dark:border-slate-800 overflow-x-auto relative z-10 scrollbar-none -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
              {[
                { id: "topics", label: "Course Topics" },
                { id: "classes", label: "My Classes" },
                { id: "assessments", label: "Assessments" },
                { id: "schedule", label: "My Schedule" },
              ].map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button 
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (tab.id !== "classes") setSelectedClassId(null);
                    }}
                    className={`whitespace-nowrap py-2.5 sm:py-3 px-1 text-xs sm:text-sm transition-all shrink-0 cursor-pointer border-b-2 -mb-px flex items-center gap-1.5 ${
                      isActive 
                        ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 font-extrabold" 
                        : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold"
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </header>

          {activeTab === "topics" && (
            <TopicsTab 
              topics={topics}
              setTopics={setTopics}
              isArchiveMode={isArchiveMode}
              handleExport={handleExport}
              isExporting={isExporting}
              handleFileUpload={handleFileUpload}
              isExtracting={isExtracting}
            />
          )}

          {activeTab === "classes" && (
            <ModulesTab 
              classes={classes}
              selectedClassId={selectedClassId}
              setSelectedClassId={setSelectedClassId}
              updateModule={updateModule}
              handleAddWeek={handleAddWeek}
              handleSyncClassWithTopics={handleSyncClassWithTopics}
              isArchiveMode={isArchiveMode}
              basicInfo={basicInfo}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === "assessments" && (
            <AssessmentsTab 
              assessments={assessments}
              setAssessments={setAssessments}
              isArchiveMode={isArchiveMode}
            />
          )}

          {activeTab === "schedule" && (
            <ScheduleTab 
              classes={classes}
              sectionSchedules={sectionSchedules}
              setSectionSchedules={setSectionSchedules}
              handleSaveSchedule={handleSaveSchedule}
              savingScheduleId={savingScheduleId}
              scheduleToast={scheduleToast}
            />
          )}
        </main>
      ) : (
        <main className="w-full">
          <div className="flex items-center justify-center h-[50vh] text-slate-500">
            No course selected. Please return to the dashboard and select a course.
          </div>
        </main>
      )}

      {/* Historical Syllabus Import & Reuse Modal */}
      <DynamicHistoricalImportModal 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        historyLoading={historyLoading}
        historicalList={historicalList}
        selectedHistoryItem={selectedHistoryItem}
        setSelectedHistoryItem={setSelectedHistoryItem}
        handleApplyHistoricalOutline={handleApplyHistoricalOutline}
        courseCode={basicInfo.courseCode}
      />
    </div>
  );
}
