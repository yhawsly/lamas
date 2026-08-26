"use client";
import { 
  GraduationCap, CheckCircle, CheckCircle2, AlertTriangle, AlertCircle, 
  Circle, Clock, Check, FileText, UploadCloud, Trash2, Layers, 
  BookOpen, Briefcase, Calendar, CalendarDays, X, Paperclip,
  History, Sparkles, Download, ArrowRight
} from "lucide-react";

import React, { useState, useRef, useEffect } from "react";
import useSWR, { useSWRConfig } from "swr";

type ResourceFile = { id: string; name: string; url: string; size?: number; type?: string };
type Module = { id: number, week: number, title: string, description: string, lesson_plan: string, completed?: boolean, resources?: ResourceFile[] };
type Class = { id: string, name: string, modules: Module[] };

import { useParams, useRouter } from "next/navigation";
import { useTerm } from "@/context/TermContext";

const fetcher = (url: string) => fetch(url).then(res => res.ok ? res.json() : null);

function ModuleResourceDropzone({
    module,
    courseCode,
    courseTitle,
    onUpdateResources,
    disabled = false
}: {
    module: Module;
    courseCode?: string;
    courseTitle?: string;
    onUpdateResources: (resources: ResourceFile[]) => void;
    disabled?: boolean;
}) {
    const { mutate } = useSWRConfig();
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFiles = async (files: FileList | File[]) => {
        if (!files || files.length === 0 || disabled) return;
        setIsUploading(true);
        setUploadError(null);

        const newResources: ResourceFile[] = [...(module.resources || [])];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const formData = new FormData();
            formData.append("file", file);

            try {
                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                if (res.ok) {
                    const data = await res.json();
                    const fileUrl = data.url || data.path || "#";

                    newResources.push({
                        id: Math.random().toString(36).substring(2, 9),
                        name: file.name,
                        url: fileUrl,
                        size: file.size,
                        type: file.type
                    });

                    // Auto-sync into institutional Resource page (/api/resources)
                    try {
                        const extension = file.name.split('.').pop()?.toLowerCase() || '';
                        let resourceType = "OTHER";
                        if (["pdf"].includes(extension)) resourceType = "PDF";
                        else if (["ppt", "pptx", "key"].includes(extension)) resourceType = "SLIDES";
                        else if (["doc", "docx", "txt", "rtf"].includes(extension)) resourceType = "DOCUMENT";
                        else if (["xls", "xlsx", "csv"].includes(extension)) resourceType = "SPREADSHEET";
                        else if (["png", "jpg", "jpeg", "webp", "svg"].includes(extension)) resourceType = "IMAGE";
                        else if (["mp4", "webm", "mov"].includes(extension)) resourceType = "VIDEO";
                        else if (["js", "ts", "py", "java", "cpp", "c", "html", "css", "zip"].includes(extension)) resourceType = "CODE";

                        const resourceTitle = courseCode 
                            ? `${courseCode} - Week ${module.week}: ${file.name}`
                            : `Week ${module.week}: ${file.name}`;

                        const resourceDesc = `Lecture material for ${courseCode || "Course"} (${courseTitle || ""}) - Week ${module.week}: ${module.title}`;

                        const resPost = await fetch("/api/resources", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                title: resourceTitle,
                                description: resourceDesc,
                                type: resourceType,
                                url: fileUrl
                            })
                        });

                        if (resPost.ok) {
                            mutate("/api/resources");
                            mutate("/api/resources?shared=true");
                        }
                    } catch (syncErr) {
                        console.error("Failed to auto-register resource in repository:", syncErr);
                    }
                } else {
                    const err = await res.json().catch(() => ({}));
                    setUploadError(err.error || `Failed to upload ${file.name}`);
                }
            } catch {
                setUploadError(`Network error uploading ${file.name}`);
            }
        }

        onUpdateResources(newResources);
        setIsUploading(false);
    };

    const removeResource = (id: string) => {
        const updated = (module.resources || []).filter(r => r.id !== id);
        onUpdateResources(updated);
    };

    return (
        <div className="space-y-3">
            {/* Hidden file input — triggered by Browse button */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg,.zip"
                onChange={(e) => {
                    if (e.target.files) handleFiles(e.target.files);
                    // Reset so same file can be re-selected
                    e.target.value = "";
                }}
                disabled={disabled}
            />

            {/* Drop Zone + Browse button */}
            <div
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (!disabled) setIsDragging(true); }}
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); if (!disabled) setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(false);
                    if (!disabled && e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
                }}
                className={`border-2 border-dashed rounded-xl p-5 transition-all flex flex-col items-center justify-center gap-3 ${
                    disabled
                        ? "bg-slate-100 border-slate-300 opacity-60"
                        : isDragging
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                        : "border-slate-300 bg-slate-50/50 hover:border-blue-400"
                }`}
            >
                {isUploading ? (
                    <div className="flex items-center gap-2.5 text-blue-600 font-medium text-sm py-2">
                        <svg className="animate-spin w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Uploading files, please wait...
                    </div>
                ) : (
                    <>
                        <div className={`p-2.5 rounded-full ${isDragging ? "bg-blue-500 text-white" : "bg-blue-100 text-blue-600"}`}>
                            <UploadCloud className="w-5 h-5" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                {isDragging ? "Release to upload" : "Drag files here, or"}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">PDF, PPT, DOC, PNG, ZIP — up to 20MB each</p>
                        </div>
                        {/* Primary action: visible Browse button */}
                        <button
                            type="button"
                            disabled={disabled || isUploading}
                            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                            className="mt-1 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition"
                        >
                            <UploadCloud className="w-4 h-4" />
                            Browse Files
                        </button>
                    </>
                )}
            </div>

            {uploadError && (
                <p className="text-xs font-semibold text-red-500 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{uploadError}</span>
                </p>
            )}

            {/* Uploaded Resources List */}
            {module.resources && module.resources.length > 0 && (
                <div className="space-y-2 pt-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Attached ({module.resources.length})
                    </p>
                    <div className="flex flex-col gap-1.5">
                        {module.resources.map(res => (
                            <div key={res.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-xs">
                                <div className="flex items-center gap-2 overflow-hidden mr-2">
                                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                                    <a
                                        href={res.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 truncate underline-offset-2 hover:underline"
                                    >
                                        {res.name}
                                    </a>
                                    {res.size && (
                                        <span className="text-slate-400 shrink-0">
                                            ({(res.size / 1024).toFixed(0)} KB)
                                        </span>
                                    )}
                                </div>
                                {!disabled && (
                                    <button
                                        type="button"
                                        onClick={() => removeResource(res.id)}
                                        className="text-slate-400 hover:text-red-500 transition p-1 rounded hover:bg-red-50 shrink-0"
                                        title="Remove file"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

const CourseOutlineSkeleton = () => (
    <div className="max-w-7xl mx-auto space-y-8 animate-pulse pb-20 pt-6 px-4">
        {/* Header navigation skeleton */}
        <div className="flex justify-between items-center">
            <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700/80 rounded" />
            <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700/80 rounded" />
        </div>

        {/* Title area skeleton */}
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

        {/* Tabs navigation skeleton */}
        <div className="flex gap-6 border-b border-slate-200 dark:border-slate-800 pb-3">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-5 w-24 bg-slate-200 dark:bg-slate-700/80 rounded" />
            ))}
        </div>

        {/* Main section content skeleton */}
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

  const [assessments, setAssessments] = useState([
    { id: 1, name: "Midterm Exam", weight: 20 },
    { id: 2, name: "Final Exam", weight: 60 },
    { id: 3, name: "Assignments", weight: 20 },
  ]);

  // Classes State — starts empty; populated from /api/courses/my-sections
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState("DRAFT");

  // Schedule per-section state (keyed by section id)
  const [sectionSchedules, setSectionSchedules] = useState<Record<string, { dayOfWeek: string; startTime: string; endTime: string; venue: string }>>({});
  const [savingScheduleId, setSavingScheduleId] = useState<string | null>(null);
  const [scheduleToast, setScheduleToast] = useState<string | null>(null);

  // Schedule Filter Tabs State
  const [scheduleStreamTab, setScheduleStreamTab] = useState<string>("all");
  const [scheduleDayTab, setScheduleDayTab] = useState<string>("all");
  const [scheduleSearchQuery, setScheduleSearchQuery] = useState<string>("");

  // Historical Syllabus Import & Reuse State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historicalList, setHistoricalList] = useState<any[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any | null>(null);

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

  const streamTabs = [
    { id: "all", label: "All Classes", count: classes.length, icon: Layers },
    { id: "btech_reg", label: "B.Tech Regular", count: classes.filter(c => getSectionCategory(c.name) === "btech_reg").length, icon: BookOpen },
    { id: "btech_wkd", label: "B.Tech Weekend", count: classes.filter(c => getSectionCategory(c.name) === "btech_wkd").length, icon: Briefcase },
    { id: "hnd_reg", label: "HND Regular", count: classes.filter(c => getSectionCategory(c.name) === "hnd_reg").length, icon: BookOpen },
    { id: "hnd_wkd", label: "HND Weekend", count: classes.filter(c => getSectionCategory(c.name) === "hnd_wkd").length, icon: Briefcase },
    { id: "topup_wkd", label: "Top-Up Weekend", count: classes.filter(c => getSectionCategory(c.name) === "topup_wkd").length, icon: GraduationCap },
  ].filter(tab => tab.id === "all" || tab.count > 0);

  const filteredScheduleClasses = classes.filter(cls => {
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

  // Auto-save states
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

    // 2. Syllabus Data (Saved State & Topic Resolution)
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

    // Helper to generate full weekly modules from topics
    const generateWeeklyModules = (topicList: any[]): Module[] => {
      if (!topicList || topicList.length === 0) return [];
      return topicList.map((t: any, idx: number) => ({
        id: t.id ? Number(t.id) : (idx + 1),
        week: idx + 1,
        title: t.title || `Week ${idx + 1}: Fundamental Principles`,
        description: t.description || `Comprehensive exploration of ${t.title || 'course topic'}, interactive demonstrations, and laboratory work.`,
        lesson_plan: `1. Interactive lecture presentation on ${t.title || 'the core topic'}\n2. Practical lab / case study application\n3. Review quiz and formative student Q&A`,
        completed: idx < 2, // First 2 weeks marked completed for realistic semester progression
        resources: []
      }));
    };

    // 3. Classes (Merge saved classes with assigned sections & auto-fill weekly modules)
    const mySections = (sectionsData.sections || []).filter((sec: any) => sec.courseId === courseId);
    if (mySections.length > 0) {
      setClasses(mySections.map((sec: any) => {
        const savedClass = savedClasses?.find((c: any) => c.id === sec.id.toString());
        let classModules = savedClass?.modules;
        // If no saved modules or empty array, auto-populate all weeks from resolvedTopics!
        if (!classModules || !Array.isArray(classModules) || classModules.length === 0) {
          classModules = generateWeeklyModules(resolvedTopics);
        }
        return {
          id: sec.id.toString(),
          name: sec.name,
          modules: classModules,
        };
      }));
      // Pre-populate schedule forms from existing DB data
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

    // Mark initial load complete in the next tick to prevent triggering auto-save on initial set
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
    }, 3000); // 3 seconds of inactivity

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
          alert("Failed to submit. Please try again.");
        } else {
          setSaveIndicator("error");
        }
      }
    } catch (e) {
      console.error(e);
      if (submit) {
        alert("Error saving data.");
      } else {
        setSaveIndicator("error");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicDesc, setNewTopicDesc] = useState("");
  
  // Module Editing State
  const [editingModuleId, setEditingModuleId] = useState<number | null>(null);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Editing state for topics
  const [editingTopicId, setEditingTopicId] = useState<any>(null);
  const [editingTopicData, setEditingTopicData] = useState({ title: "", description: "" });
  const startEditTopic = (t: any) => {
    if (isArchiveMode) return;
    setEditingTopicId(t.id);
    setEditingTopicData({ title: t.title, description: t.description || "" });
  };
  const saveEditTopic = () => {
    if (isArchiveMode) return;
    setTopics(topics.map(t => t.id === editingTopicId ? { ...t, ...editingTopicData } : t));
    setEditingTopicId(null);
  };
  const deleteTopic = (id: any) => {
    if (isArchiveMode) return;
    setTopics(topics.filter(t => t.id !== id));
  };

  // Editing state for assessments
  const [editingAssessmentId, setEditingAssessmentId] = useState<any>(null);
  const [editingAssessmentData, setEditingAssessmentData] = useState({ name: "", weight: 0 });
  const startEditAssessment = (a: any) => {
    if (isArchiveMode) return;
    setEditingAssessmentId(a.id);
    setEditingAssessmentData({ name: a.name, weight: a.weight });
  };
  const saveEditAssessment = () => {
    if (isArchiveMode) return;
    setAssessments(assessments.map(a => a.id === editingAssessmentId ? { ...a, ...editingAssessmentData } : a));
    setEditingAssessmentId(null);
  };
  const deleteAssessment = (id: any) => {
    if (isArchiveMode) return;
    setAssessments(assessments.filter(a => a.id !== id));
  };

  const handleAddAssessment = () => {
    if (isArchiveMode) return;
    const newId = Date.now();
    setAssessments([...assessments, { id: newId, name: "", weight: 0 }]);
    setEditingAssessmentId(newId);
    setEditingAssessmentData({ name: "", weight: 0 });
  };

  const handleSyncClassWithTopics = (classId: string) => {
    if (isArchiveMode) return;
    if (topics.length === 0) {
      alert("No topics found in Course Topics tab to sync from.");
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
    setToastMessage("Weekly schedule successfully synchronized with Course Topics!");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (isArchiveMode) return;
    if (newTopicTitle) {
      const newTopicId = Date.now();
      const newTopic = { id: newTopicId, title: newTopicTitle, description: newTopicDesc };
      setTopics(prev => [...prev, newTopic]);
      setIsAddingTopic(false);
      setNewTopicTitle("");
      setNewTopicDesc("");
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (isArchiveMode) {
      alert("Action Disabled: File uploads are disabled in Read-Only Archive Mode.");
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
      
      // Update UI with extracted data
      setTopics(data.topics);
      
      // Auto-fill modules for all classes independently
      setClasses(prev => prev.map(c => ({
        ...c,
        modules: data.modules.map((m: any) => ({ 
          ...m, 
          completed: false, 
          id: Date.now() + Math.random() // Ensure unique IDs across classes
        }))
      })));

      setActiveTab("topics"); // Switch to topics after a successful upload
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to extract syllabus. Please try again.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
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
      alert("Failed to export Excel file.");
    } finally {
      setIsExporting(false);
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
    setEditingModuleId(newId);
  };

  const activeClass = classes.find(c => c.id === selectedClassId);

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

      {/* Main Content Area */}
        {selectedCourseId ? (
          /* Course Workspace View (Sidebar + Main Canvas) */
          <>
            {/* Main Canvas Area */}
            <main className="w-full">              {/* Horizontal Top Navigation */}
              <header className="mb-8">
                  {/* Top Row: Back link & Auto-save Status */}
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6 relative z-10">
                      <button 
                          onClick={() => router.push("/lecturer/courses")} 
                          className="text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1.5 py-1"
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

                  {/* Middle Row: Title and Main Actions */}
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 relative z-10">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-blue-600 text-xs font-black tracking-widest uppercase">
                          Course Workspace
                        </span>
                      </div>
                      <h1 className="text-4xl font-black text-slate-800 tracking-tight">{basicInfo.courseCode}</h1>
                      <p className="text-slate-500 text-lg mt-1">{basicInfo.title}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <button 
                            type="button"
                            onClick={openHistoryModal} 
                            disabled={isArchiveMode} 
                            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-blue-50/80 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 dark:text-blue-300 transition-all font-bold flex items-center justify-center gap-2 shadow-xs text-sm border border-blue-200 dark:border-blue-800/80 disabled:opacity-50 cursor-pointer"
                            title="Import approved topics and weekly outline from previous semesters"
                        >
                            <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            Import Past Outline
                        </button>
                        <button 
                            onClick={() => handleSaveToDB(false)} 
                            disabled={isSaving || isArchiveMode} 
                            className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 transition-all font-bold flex items-center justify-center gap-2 shadow-sm text-sm border border-slate-200 hover:border-slate-300 disabled:opacity-50"
                        >
                            {isSaving ? "Saving..." : "Save Draft"}
                        </button>
                        <button 
                            onClick={() => handleSaveToDB(true)} 
                            disabled={isSaving || submissionStatus === "SUBMITTED" || isArchiveMode} 
                            className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl ${submissionStatus === "SUBMITTED" ? "bg-green-100 text-green-700 border-green-200 cursor-not-allowed" : isArchiveMode ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20 hover:shadow-blue-600/30"} transition-all font-bold flex items-center justify-center gap-2 text-sm border border-transparent`}
                        >
                            {isArchiveMode ? "Archive (Read Only)" : submissionStatus === "SUBMITTED" ? "Submitted" : "Submit"}
                        </button>
                    </div>
                  </div>
                
                <nav className="flex items-center gap-6 border-b border-slate-200 overflow-x-auto relative z-10">
                  {[
                    { id: "topics", label: "Course Topics" },
                    { id: "classes", label: "My Classes" },
                    { id: "assessments", label: "Assessments" },
                    { id: "schedule", label: "My Schedule" },
                  ].map(tab => (
                    <button 
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        if (tab.id !== "classes") setSelectedClassId(null);
                      }}
                      className={`whitespace-nowrap py-3 px-1 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                        activeTab === tab.id 
                          ? "border-blue-600 text-blue-600" 
                          : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </header>

              {/* Toast for schedule save feedback */}
              {scheduleToast && (
                <div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-800 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-300 z-50">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-semibold">{scheduleToast}</span>
                </div>
              )}


              {activeTab === "topics" && (
                <section id="topics" className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <header className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800">Course Topics</h2>
                      <p className="text-slate-500">Define the main subjects covered in this course.</p>
                    </div>
                    <button 
                      onClick={handleExport}
                      disabled={isExporting}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition shadow-sm flex items-center gap-2 disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      {isExporting ? "Exporting..." : "Export to Excel"}
                    </button>
                  </header>

                  {topics.length === 0 && !isAddingTopic ? (
                    isArchiveMode ? (
                      <div className="p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
                        <p className="font-bold text-slate-600">No course topics recorded for this archived term.</p>
                        <p className="text-xs text-slate-400 mt-1">This semester is archived and in read-only mode.</p>
                      </div>
                    ) : (
                    <div 
                      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => !isExtracting && fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-10 text-center transition duration-200 cursor-pointer ${
                        isDragOver ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/50"
                      }`}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".xlsx,.xls,.csv"
                        onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                      />

                      {isExtracting ? (
                        <div className="space-y-4 animate-in fade-in duration-500">
                          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-slate-800 animate-pulse">Importing Spreadsheet...</h3>
                            <p className="text-blue-500 text-sm mt-1">Reading your Excel file and extracting course structure. Please wait.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-slate-800">Import from Spreadsheet or PDF</h3>
                            <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
                              Drag and drop your Course Outline spreadsheet or PDF (.xlsx, .csv, .pdf) here, or click to upload. We&apos;ll automatically extract the topics and modules for you.
                            </p>
                            <a href="/sample_syllabus.xlsx" download onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition">
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                               Download sample format
                             </a>
                          </div>
                          <div className="flex items-center justify-center gap-4 pt-4">
                            <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm shadow-blue-600/20 transition pointer-events-none">
                              Upload Spreadsheet
                            </button>
                            <span className="text-slate-400 text-sm">or</span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setIsAddingTopic(true); }}
                              className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg shadow-sm transition"
                            >
                              Add Manually
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    )
                  ) : (
                    <div className="space-y-4">
                      {topics.map((t, index) => (
                        <div key={t.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs group animate-in fade-in slide-in-from-bottom-2">
                          {editingTopicId === t.id && !isArchiveMode ? (
                            <div className="space-y-3">
                              <input
                                type="text"
                                value={editingTopicData.title}
                                onChange={e => setEditingTopicData({...editingTopicData, title: e.target.value})}
                                className="w-full px-3 py-1.5 font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none"
                              />
                              <textarea
                                value={editingTopicData.description}
                                onChange={e => setEditingTopicData({...editingTopicData, description: e.target.value})}
                                className="w-full px-3 py-1.5 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none"
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <button onClick={saveEditTopic} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md cursor-pointer">Save</button>
                                <button onClick={() => setEditingTopicId(null)} className="px-3 py-1 text-slate-600 hover:bg-slate-100 text-xs font-medium rounded-md cursor-pointer">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-start">
                              <div className="flex items-start gap-3">
                                <div className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-extrabold text-[11px] shrink-0 mt-0.5 flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-blue-500" />
                                  <span>Week {index + 1}</span>
                                </div>
                                <div>
                                  <h4 className="font-bold text-slate-800 dark:text-slate-200">{t.title}</h4>
                                  {t.description && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t.description}</p>}
                                </div>
                              </div>
                              {!isArchiveMode && (
                                <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                                  <button onClick={() => startEditTopic(t)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition cursor-pointer" title="Edit">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                  </button>
                                  <button onClick={() => deleteTopic(t.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer" title="Delete">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}

                      {isAddingTopic && !isArchiveMode ? (
                        <div className="p-6 bg-white border border-blue-200 rounded-xl shadow-lg shadow-blue-900/5 ring-1 ring-blue-500/20 animate-in slide-in-from-top-4 duration-300">
                          <form onSubmit={handleAddTopic} className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Topic Title</label>
                              <input 
                                type="text" 
                                value={newTopicTitle}
                                onChange={e => setNewTopicTitle(e.target.value)}
                                placeholder="e.g. Relational Databases"
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none transition"
                                autoFocus
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                              <textarea 
                                value={newTopicDesc}
                                onChange={e => setNewTopicDesc(e.target.value)}
                                placeholder="Briefly describe what this topic covers..."
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none transition"
                                rows={3}
                              />
                            </div>
                            <div className="flex gap-3 pt-2">
                              <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition shadow-sm cursor-pointer">
                                Save Topic
                              </button>
                              <button 
                                type="button" 
                                onClick={() => setIsAddingTopic(false)}
                                className="px-5 py-2 text-slate-600 hover:bg-slate-100 font-medium rounded-lg transition cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setIsAddingTopic(true)}
                          className="w-full py-4 border-2 border-dashed border-slate-200 text-slate-500 font-medium rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                          Add Another Topic
                        </button>
                      )}
                    </div>
                  )}
                </section>
              )}

              {activeTab === "classes" && (
                <section id="classes" className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  {!selectedClassId ? (
                    <>
                      <header>
                        <h2 className="text-2xl font-bold text-slate-800">My Classes</h2>
                        <p className="text-slate-500">
                          {classes.length > 0
                            ? `You are assigned to ${classes.length} class${classes.length !== 1 ? "es" : ""} for this course.`
                            : "No class sections have been assigned to you for this course yet."}
                        </p>
                      </header>
                      {classes.length === 0 && (
                        <div className="p-12 border-2 border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/50">
                          <div className="flex justify-center mb-3"><GraduationCap className="w-10 h-10 text-gray-400" /></div>
                          <h3 className="font-bold text-slate-700 mb-1">No Sections Assigned</h3>
                          <p className="text-sm text-slate-500 max-w-sm mx-auto">
                            Your HOD hasn&apos;t assigned any class sections to you for this course. Please contact your Head of Department to get assigned.
                          </p>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {classes.map(c => {
                          const completedCount = c.modules.filter(m => m.completed).length;
                          const total = c.modules.length;
                          const progress = total === 0 ? 0 : Math.round((completedCount / total) * 100);
                          
                          return (
                            <div 
                              key={c.id} 
                              onClick={() => setSelectedClassId(c.id)}
                              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
                            >
                               <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition">{c.name}</h3>
                               
                               <div className="mt-8">
                                 <div className="flex justify-between text-sm mb-2">
                                   <span className="font-medium text-slate-700">Progress</span>
                                   <span className="text-slate-500 font-medium">{completedCount} of {total} Weeks</span>
                                 </div>
                                 <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                   <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                 </div>
                               </div>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                      <button 
                        onClick={() => setSelectedClassId(null)}
                        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Back to Classes
                      </button>

                      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                        <div>
                          <h2 className="text-2xl font-bold text-slate-800">{activeClass?.name}</h2>
                          <p className="text-slate-500 text-sm">Weekly Syllabus Modules & Teaching Schedule</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!isArchiveMode && (
                            <button 
                              onClick={() => activeClass && handleSyncClassWithTopics(activeClass.id)}
                              className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition border border-blue-200 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              title="Regenerate/sync weeks directly from Course Topics"
                            >
                              <Layers className="w-3.5 h-3.5" />
                              <span>Sync with Course Topics</span>
                            </button>
                          )}
                          {!isArchiveMode && (
                            <button 
                              onClick={() => activeClass && handleAddWeek(activeClass.id)}
                              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                              <span>Add Week</span>
                            </button>
                          )}
                        </div>
                      </header>

                      <div className="space-y-4">
                        {activeClass?.modules.map((m) => (
                          <div 
                            key={m.id} 
                            className={`group relative bg-white border rounded-xl transition-all duration-300 ${
                              editingModuleId === m.id 
                                ? "border-blue-400 shadow-xl shadow-blue-900/5 ring-1 ring-blue-400/20" 
                                : m.completed 
                                  ? "border-green-200 bg-green-50/30"
                                  : "border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md"
                            }`}
                          >
                            {editingModuleId !== m.id && (
                              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 shadow-sm rounded-lg flex items-center overflow-hidden z-10">
                                 <button 
                                  onClick={() => updateModule(activeClass.id, m.id, { completed: !m.completed })} 
                                  className={`p-2 transition ${m.completed ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:text-green-600 hover:bg-green-50'}`} 
                                  title={m.completed ? "Mark incomplete" : "Mark complete"}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </button>
                                <div className="w-px h-4 bg-slate-200" />
                                <button onClick={() => setEditingModuleId(m.id)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition" title="Edit">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                              </div>
                            )}

                            {editingModuleId === m.id ? (
                              <div className="p-6 space-y-5 animate-in fade-in duration-300">
                                <div className="flex items-center gap-3">
                                  <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-md">WEEK {m.week}</span>
                                  <input 
                                    type="text" 
                                    value={m.title}
                                    onChange={(e) => updateModule(activeClass.id, m.id, { title: e.target.value })}
                                    className="flex-1 px-3 py-1.5 text-lg font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none"
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Module Overview</label>
                                  <textarea 
                                    value={m.description}
                                    onChange={(e) => updateModule(activeClass.id, m.id, { description: e.target.value })}
                                    className="w-full px-4 py-2 text-slate-600 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none"
                                    rows={2}
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Structured Lesson Plan</label>
                                  <textarea 
                                    value={m.lesson_plan}
                                    onChange={(e) => updateModule(activeClass.id, m.id, { lesson_plan: e.target.value })}
                                    className="w-full px-4 py-2 text-xs font-mono text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none"
                                    rows={3}
                                    placeholder="1. Lecture... &#10;2. Lab... &#10;3. Q&A..."
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-2">Lecture Resources</label>
                                  <ModuleResourceDropzone
                                    module={m}
                                    courseCode={basicInfo.courseCode}
                                    courseTitle={basicInfo.title}
                                    onUpdateResources={(resources) => updateModule(activeClass.id, m.id, { resources })}
                                    disabled={isArchiveMode}
                                  />
                                </div>

                                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                                  <button onClick={() => setEditingModuleId(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-medium rounded-lg transition cursor-pointer">Cancel</button>
                                  <button onClick={() => setEditingModuleId(null)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition shadow-sm cursor-pointer">Save Changes</button>
                                </div>
                              </div>
                            ) : (
                              <div className={`p-6 flex items-start gap-4 transition-opacity ${m.completed ? 'opacity-85' : 'opacity-100'}`}>
                                <div className={`flex-shrink-0 w-12 h-12 border rounded-xl flex items-center justify-center flex-col transition-colors ${
                                  m.completed ? 'bg-green-100 border-green-200' : 'bg-blue-50 border-blue-100'
                                }`}>
                                  <span className={`text-[10px] font-bold uppercase tracking-wider ${m.completed ? 'text-green-700' : 'text-blue-600'}`}>Week</span>
                                  <span className={`text-lg font-bold leading-none ${m.completed ? 'text-green-800' : 'text-blue-700'}`}>{m.week}</span>
                                </div>
                                <div className="flex-1 pt-1">
                                  <h3 className={`text-lg font-bold ${m.completed ? 'text-slate-600 line-through decoration-slate-300' : 'text-slate-800'}`}>
                                    {m.title}
                                  </h3>
                                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">{m.description}</p>
                                  {m.lesson_plan && (
                                    <div className="mt-2.5 text-[11px] text-slate-600 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800 font-mono whitespace-pre-line leading-relaxed">
                                      {m.lesson_plan}
                                    </div>
                                  )}

                                  {/* Attached Lecture Materials */}
                                  {m.resources && m.resources.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-blue-500" />
                                        <span>Lecture Materials ({m.resources.length})</span>
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        {m.resources.map(res => (
                                          <a
                                            key={res.id}
                                            href={res.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50/70 hover:bg-blue-100/80 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 border border-blue-200/60 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold transition shadow-2xs"
                                          >
                                            <Paperclip className="w-3 h-3 text-blue-500" />
                                            <span className="truncate max-w-[220px]">{res.name}</span>
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                {m.completed && (
                                  <div className="flex-shrink-0">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                      Completed
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                        {activeClass?.modules.length === 0 && (
                          <div className="p-10 border-2 border-dashed border-slate-200 rounded-xl text-center">
                            <p className="text-slate-500 mb-4">No schedule created for this class yet.</p>
                            <button onClick={() => setActiveTab("topics")} className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg shadow-sm">Import from Excel via Topics Tab</button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {activeTab === "assessments" && (
                <section id="assessments" className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <header className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800">Assessments & Grading</h2>
                      <p className="text-slate-500">Define how the final grade is calculated.</p>
                    </div>
                    {!isArchiveMode && (
                      <button onClick={handleAddAssessment} className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-sm font-semibold rounded-lg transition shadow-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Add Component
                      </button>
                    )}
                  </header>
                  
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="space-y-4">
                      {assessments.map(a => (
                        <div key={a.id} className="p-4 border border-slate-100 bg-slate-50/50 rounded-lg group">
                          {editingAssessmentId === a.id && !isArchiveMode ? (
                            <div className="flex items-center gap-3">
                              <input 
                                type="text" 
                                value={editingAssessmentData.name} 
                                onChange={e => setEditingAssessmentData({...editingAssessmentData, name: e.target.value})} 
                                className="flex-1 px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500/50 outline-none"
                              />
                              <div className="flex items-center gap-1">
                                <input 
                                  type="number" 
                                  value={editingAssessmentData.weight} 
                                  onChange={e => setEditingAssessmentData({...editingAssessmentData, weight: parseInt(e.target.value) || 0})} 
                                  className="w-16 px-3 py-1.5 text-sm text-center bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500/50 outline-none"
                                />
                                <span className="text-sm font-semibold text-slate-500">%</span>
                              </div>
                              <button onClick={saveEditAssessment} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md">Save</button>
                              <button onClick={() => setEditingAssessmentId(null)} className="px-3 py-1.5 text-slate-600 bg-slate-200 text-xs font-medium rounded-md">Cancel</button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
                                  {a.weight}%
                                </div>
                                <span className="font-medium text-slate-800">{a.name}</span>
                              </div>
                              {!isArchiveMode && (
                                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition">
                                  <button onClick={() => startEditAssessment(a)} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition p-1.5 rounded-md" title="Edit">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                  </button>
                                  <button onClick={() => deleteAssessment(a.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 transition p-1.5 rounded-md" title="Delete">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                      <span className="font-semibold text-slate-600">Total Weight</span>
                      <span className={`text-lg font-bold ${assessments.reduce((a, b) => a + b.weight, 0) === 100 ? "text-green-600" : "text-amber-500"}`}>
                        {assessments.reduce((a, b) => a + b.weight, 0)}%
                      </span>
                    </div>
                  </div>
                </section>
              )}

              {activeTab === "schedule" && (
                <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        My Schedule & Class Allocations
                      </h2>
                      <p className="text-slate-500 text-sm mt-1">
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
                                      placeholder="e.g. Computer Lab 1, LT 2"
                                      value={form.venue}
                                      onChange={e => setSectionSchedules(prev => ({ ...prev, [cls.id]: { ...form, venue: e.target.value } }))}
                                      className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-slate-200 transition"
                                    />
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
              )}
            </main>
          </>
        ) : (
          /* Dashboard Views (Lecturer or HOD) */
          <main className="w-full">
            <div className="flex items-center justify-center h-[50vh] text-slate-500">
              No course selected. Please return to the dashboard and select a course.
            </div>
          </main>
        )}

      {/* Historical Syllabus Import & Reuse Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="w-full max-w-4xl max-h-[88vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}
          >
            {/* Modal Header */}
            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: "var(--bg-border)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg" style={{ color: "var(--text-primary)" }}>
                    Import Historical Syllabus & Outline
                  </h3>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Reuse approved topics, weekly lesson plans, and resource links from previous semesters.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x" style={{ borderColor: "var(--bg-border)" }}>
              {/* Left Pane: Historical Semesters List */}
              <div className="w-full md:w-5/12 p-4 overflow-y-auto max-h-[50vh] md:max-h-none space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider px-2" style={{ color: "var(--text-muted)" }}>
                  Available Previous Outlines ({historicalList.length})
                </div>

                {historyLoading ? (
                  <div className="p-8 text-center text-xs text-slate-400">Loading historical archives...</div>
                ) : historicalList.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-2xl" style={{ borderColor: "var(--bg-border)" }}>
                    No historical outlines found for this course.
                  </div>
                ) : (
                  historicalList.map((item, idx) => {
                    const isSelected = selectedHistoryItem?.submissionId === item.submissionId;
                    return (
                      <button
                        key={item.submissionId || idx}
                        type="button"
                        onClick={() => setSelectedHistoryItem(item)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                          isSelected
                            ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                            : "hover:border-slate-300"
                        }`}
                        style={!isSelected ? { backgroundColor: "var(--bg-hover)", borderColor: "var(--bg-border)" } : {}}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs" style={{ color: "var(--text-primary)" }}>
                            {item.term?.name || `${item.term?.academicYear} Sem ${item.term?.semester}`}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            item.status === "APPROVED" 
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200" 
                              : "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200"
                          }`}>
                            {item.status}
                          </span>
                        </div>

                        <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                          By {item.lecturer?.name || "Department Lecturer"}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] font-semibold pt-1" style={{ color: "var(--text-secondary)" }}>
                          <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-blue-500 shrink-0" /> {item.metrics?.topicCount || 0} Topics</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> {item.metrics?.moduleCount || 0} Weeks</span>
                          <span className="flex items-center gap-1"><Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {item.metrics?.resourceCount || 0} Files</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Right Pane: Preview & Import Action */}
              <div className="w-full md:w-7/12 p-6 overflow-y-auto flex flex-col justify-between" style={{ backgroundColor: "var(--bg-hover)" }}>
                {selectedHistoryItem ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black tracking-widest text-blue-600 uppercase">Archive Preview</span>
                        <span className="text-xs text-slate-400 font-semibold">
                          Saved on {new Date(selectedHistoryItem.submittedAt || selectedHistoryItem.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-base mt-1" style={{ color: "var(--text-primary)" }}>
                        {selectedHistoryItem.term?.name} — {basicInfo.courseCode} Outline
                      </h4>
                    </div>

                    {/* Topics Preview */}
                    <div className="p-4 rounded-2xl border bg-white dark:bg-slate-900/60 shadow-2xs space-y-2" style={{ borderColor: "var(--bg-border)" }}>
                      <div className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                        Course Topics ({selectedHistoryItem.content?.topics?.length || 0})
                      </div>
                      <div className="max-h-40 overflow-y-auto divide-y" style={{ borderColor: "var(--bg-border)" }}>
                        {Array.isArray(selectedHistoryItem.content?.topics) && selectedHistoryItem.content.topics.map((t: any, idx: number) => (
                          <div key={idx} className="py-2 text-xs">
                            <span className="font-bold mr-2 text-blue-600">{idx + 1}.</span>
                            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{t.title}</span>
                            {t.description && (
                              <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: "var(--text-muted)" }}>{t.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Weekly Modules Preview */}
                    <div className="p-4 rounded-2xl border bg-white dark:bg-slate-900/60 shadow-2xs space-y-2" style={{ borderColor: "var(--bg-border)" }}>
                      <div className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                        Weekly Lecture Modules ({selectedHistoryItem.metrics?.moduleCount || 0})
                      </div>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Includes week-by-week learning objectives, interactive lesson plans, and attached course lecture slides.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                    Select a historical semester to preview and import its syllabus.
                  </div>
                )}

                {/* Footer Action */}
                <div className="pt-6 border-t mt-6 flex items-center justify-end gap-3" style={{ borderColor: "var(--bg-border)" }}>
                  <button
                    type="button"
                    onClick={() => setIsHistoryModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    style={{ borderColor: "var(--bg-border)" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyHistoricalOutline(selectedHistoryItem)}
                    disabled={!selectedHistoryItem}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-sm shadow-blue-600/30 transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Import & Apply to Draft
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
