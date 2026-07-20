"use client";
import { GraduationCap, CheckCircle, AlertTriangle, Circle, Clock, Check } from "lucide-react";

import React, { useState, useRef, useEffect } from "react";
import useSWR, { useSWRConfig } from "swr";

type Module = { id: number, week: number, title: string, description: string, lesson_plan: string, completed?: boolean };
type Class = { id: string, name: string, modules: Module[] };

import { useParams, useRouter } from "next/navigation";

const fetcher = (url: string) => fetch(url).then(res => res.ok ? res.json() : null);

const CourseOutlineSkeleton = () => (
    <div className="max-w-7xl mx-auto space-y-8 animate-pulse pb-20 pt-6 px-4">
        {/* Header navigation skeleton */}
        <div className="flex justify-between items-center">
            <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>

        {/* Title area skeleton */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="space-y-3">
                <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-9 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                <div className="h-5 w-72 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
            <div className="flex gap-3 w-full md:w-auto">
                <div className="h-10 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                <div className="h-10 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            </div>
        </div>

        {/* Tabs navigation skeleton */}
        <div className="flex gap-6 border-b border-slate-200 dark:border-slate-800 pb-3">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
            ))}
        </div>

        {/* Main section content skeleton */}
        <div className="space-y-6">
            <div className="flex justify-between">
                <div className="space-y-2">
                    <div className="h-6 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
                <div className="h-9 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            </div>

            <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 flex flex-col items-center justify-center space-y-4">
                <div className="h-12 w-12 bg-slate-200 dark:bg-slate-800 rounded-full" />
                <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-3 w-64 bg-slate-200 dark:bg-slate-800 rounded" />
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
    { id: 1, name: "Midterm Exam", weight: 30 },
    { id: 2, name: "Final Exam", weight: 40 },
    { id: 3, name: "Assignments", weight: 30 },
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
  const courseId = params?.id ? Number(params.id) : null;
  const { data: courseData } = useSWR(courseId ? `/api/courses/${courseId}` : null, fetcher);
  const { data: sectionsData } = useSWR("/api/courses/my-sections", fetcher);
  const { data: syllabusData } = useSWR(courseId ? `/api/courses/${courseId}/syllabus` : null, fetcher);
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
    if (!courseData || !sectionsData || !syllabusData) return;

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

    // 2. Syllabus Data (Saved State)
    let savedClasses: any = null;
    if (syllabusData) {
      if (syllabusData.lecturer) {
        const lec = syllabusData.lecturer;
        if (lec.topics) setTopics(lec.topics);
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
      } else if (syllabusData.master) {
        // Fallback to master syllabus topics if no lecturer edits exist yet
        const master = syllabusData.master;
        if (master.mandatoryTopics) {
          const parsedTopics = typeof master.mandatoryTopics === "string" 
            ? JSON.parse(master.mandatoryTopics) 
            : master.mandatoryTopics;
          
          if (Array.isArray(parsedTopics)) {
            setTopics(parsedTopics.map((t: any, index: number) => ({
              id: t.id || index + 1,
              title: t.title || t.name || "",
              description: t.description || ""
            })));
          }
        }
      }
    }

    // 3. Classes (Merge saved classes with assigned sections)
    const mySections = (sectionsData.sections || []).filter((sec: any) => sec.courseId === courseId);
    if (mySections.length > 0) {
      setClasses(mySections.map((sec: any) => {
        const savedClass = savedClasses?.find((c: any) => c.id === sec.id.toString());
        return {
          id: sec.id.toString(),
          name: sec.name,
          modules: savedClass ? savedClass.modules : [],
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
      setClasses(savedClasses || []);
    }

    setLoadedCourseId(courseId);

    // Mark initial load complete in the next tick to prevent triggering auto-save on initial set
    setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 100);
  }, [courseId, courseData, sectionsData, syllabusData, loadedCourseId]);

  // Auto-save effect
  useEffect(() => {
    if (isInitialLoadRef.current) return;

    setIsDirty(true);
    setSaveIndicator("idle");

    const delayDebounceFn = setTimeout(() => {
      const autoSave = async () => {
        if (!params?.id) return;
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
              submit: false
            })
          });
          if (res.ok) {
            mutate(`/api/courses/${params.id}/syllabus`);
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
  }, [basicInfo, topics, classes, assessments, params?.id, mutate]);

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
          submit
        })
      });
      if (res.ok) {
        mutate(`/api/courses/${params.id}/syllabus`);
        if (submit) {
          setToastMessage("Submitted successfully!");
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
    setEditingTopicId(t.id);
    setEditingTopicData({ title: t.title, description: t.description || "" });
  };
  const saveEditTopic = () => {
    setTopics(topics.map(t => t.id === editingTopicId ? { ...t, ...editingTopicData } : t));
    setEditingTopicId(null);
  };
  const deleteTopic = (id: any) => {
    setTopics(topics.filter(t => t.id !== id));
  };

  // Editing state for assessments
  const [editingAssessmentId, setEditingAssessmentId] = useState<any>(null);
  const [editingAssessmentData, setEditingAssessmentData] = useState({ name: "", weight: 0 });
  const startEditAssessment = (a: any) => {
    setEditingAssessmentId(a.id);
    setEditingAssessmentData({ name: a.name, weight: a.weight });
  };
  const saveEditAssessment = () => {
    setAssessments(assessments.map(a => a.id === editingAssessmentId ? { ...a, ...editingAssessmentData } : a));
    setEditingAssessmentId(null);
  };
  const deleteAssessment = (id: any) => {
    setAssessments(assessments.filter(a => a.id !== id));
  };

  const handleAddAssessment = () => {
    const newId = Date.now();
    setAssessments([...assessments, { id: newId, name: "", weight: 0 }]);
    setEditingAssessmentId(newId);
    setEditingAssessmentData({ name: "", weight: 0 });
  };

  const handleAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTopicTitle) {
      setTopics([...topics, { id: Date.now(), title: newTopicTitle, description: newTopicDesc }]);
      setIsAddingTopic(false);
      setNewTopicTitle("");
      setNewTopicDesc("");
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
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

  if (!courseData || !sectionsData || !syllabusData) {
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
                            onClick={() => handleSaveToDB(false)} 
                            disabled={isSaving} 
                            className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 transition-all font-bold flex items-center justify-center gap-2 shadow-sm text-sm border border-slate-200 hover:border-slate-300"
                        >
                            {isSaving ? "Saving..." : "Save Draft"}
                        </button>
                        <button 
                            onClick={() => handleSaveToDB(true)} 
                            disabled={isSaving || submissionStatus === "SUBMITTED"} 
                            className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl ${submissionStatus === "SUBMITTED" ? "bg-green-100 text-green-700 border-green-200 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20 hover:shadow-blue-600/30"} transition-all font-bold flex items-center justify-center gap-2 text-sm border border-transparent`}
                        >
                            {submissionStatus === "SUBMITTED" ? "Submitted" : "Submit"}
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
                  ) : (
                    <div className="space-y-4">
                      {topics.map((t) => (
                        <div key={t.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm group animate-in fade-in slide-in-from-bottom-2">
                          {editingTopicId === t.id ? (
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
                                <button onClick={saveEditTopic} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md">Save</button>
                                <button onClick={() => setEditingTopicId(null)} className="px-3 py-1 text-slate-600 hover:bg-slate-100 text-xs font-medium rounded-md">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-semibold text-slate-800">{t.title}</h4>
                                {t.description && <p className="text-sm text-slate-500 mt-1">{t.description}</p>}
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                                <button onClick={() => startEditTopic(t)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition" title="Edit">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                                <button onClick={() => deleteTopic(t.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition" title="Delete">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {isAddingTopic ? (
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
                              <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition shadow-sm">
                                Save Topic
                              </button>
                              <button 
                                type="button" 
                                onClick={() => setIsAddingTopic(false)}
                                className="px-5 py-2 text-slate-600 hover:bg-slate-100 font-medium rounded-lg transition"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setIsAddingTopic(true)}
                          className="w-full py-4 border-2 border-dashed border-slate-200 text-slate-500 font-medium rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition flex items-center justify-center gap-2"
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
                        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Back to Classes
                      </button>

                      <header className="flex items-center justify-between pb-6 border-b border-slate-200">
                        <div>
                          <h2 className="text-2xl font-bold text-slate-800">{activeClass?.name}</h2>
                          <p className="text-slate-500">Weekly Schedule & Progress</p>
                        </div>
                        <button 
                          onClick={() => activeClass && handleAddWeek(activeClass.id)}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition shadow-sm flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                          Add Week
                        </button>
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
                                  <label className="block text-sm font-medium text-slate-700 mb-2">Lecture Resources</label>
                                  <div className="border-2 border-dashed border-slate-300 bg-slate-50/50 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50/50 transition cursor-pointer flex flex-col items-center justify-center gap-2">
                                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                    <span className="text-sm font-medium text-slate-600">Drag & drop presentation slides or PDFs</span>
                                  </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                                  <button onClick={() => setEditingModuleId(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-medium rounded-lg transition">Cancel</button>
                                  <button onClick={() => setEditingModuleId(null)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition shadow-sm">Save Changes</button>
                                </div>
                              </div>
                            ) : (
                              <div className={`p-6 flex items-start gap-4 transition-opacity ${m.completed ? 'opacity-70' : 'opacity-100'}`}>
                                <div className={`flex-shrink-0 w-12 h-12 border rounded-xl flex items-center justify-center flex-col transition-colors ${
                                  m.completed ? 'bg-green-100 border-green-200' : 'bg-blue-50 border-blue-100'
                                }`}>
                                  <span className={`text-[10px] font-bold uppercase tracking-wider ${m.completed ? 'text-green-700' : 'text-blue-600'}`}>Week</span>
                                  <span className={`text-lg font-bold leading-none ${m.completed ? 'text-green-800' : 'text-blue-700'}`}>{m.week}</span>
                                </div>
                                <div className="flex-1 pt-1">
                                  <h3 className={`text-lg font-semibold ${m.completed ? 'text-slate-600 line-through decoration-slate-300' : 'text-slate-800'}`}>
                                    {m.title}
                                  </h3>
                                  <p className="text-slate-500 mt-1">{m.description}</p>
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
                    <button onClick={handleAddAssessment} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition shadow-sm flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Add Component
                    </button>
                  </header>
                  
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="space-y-4">
                      {assessments.map(a => (
                        <div key={a.id} className="p-4 border border-slate-100 bg-slate-50/50 rounded-lg group">
                          {editingAssessmentId === a.id ? (
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
                              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition">
                                <button onClick={() => startEditAssessment(a)} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition p-1.5 rounded-md" title="Edit">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                                <button onClick={() => deleteAssessment(a.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 transition p-1.5 rounded-md" title="Delete">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
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
                  <header>
                    <h2 className="text-2xl font-bold text-slate-800">My Schedule</h2>
                    <p className="text-slate-500 mt-1">Set the day and time for each of your class sections. This powers the &quot;Today Class&quot; card on your dashboard.</p>
                  </header>

                  {classes.length === 0 ? (
                    <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
                      <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="font-semibold text-slate-500">No sections assigned to you for this course yet.</p>
                      <p className="text-sm text-slate-400 mt-1">Contact your HOD or Admin to have a section assigned to you.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {classes.map(cls => {
                        const form = sectionSchedules[cls.id] || { dayOfWeek: "", startTime: "", endTime: "", venue: "" };
                        const isSavingThis = savingScheduleId === cls.id;
                        return (
                          <div key={cls.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
                              <div className="w-2 h-8 rounded-full bg-blue-500" />
                              <div>
                                <div className="font-bold text-slate-800">{cls.name}</div>
                                {form.dayOfWeek ? (
                                  <div className="text-xs text-blue-600 font-semibold mt-0.5 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {form.dayOfWeek} {form.startTime && `· ${form.startTime}`}{form.endTime && ` – ${form.endTime}`}{form.venue && ` · ${form.venue}`}
                                  </div>
                                ) : (
                                  <div className="text-xs text-amber-500 font-semibold mt-0.5">⚠ Schedule not set — set it below</div>
                                )}
                              </div>
                            </div>
                            <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Day of Week</label>
                                <select
                                  value={form.dayOfWeek}
                                  onChange={e => setSectionSchedules(prev => ({ ...prev, [cls.id]: { ...form, dayOfWeek: e.target.value } }))}
                                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-800"
                                >
                                  <option value="">— Select day —</option>
                                  {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(d => (
                                    <option key={d} value={d}>{d}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Start Time</label>
                                <input type="time" value={form.startTime}
                                  onChange={e => setSectionSchedules(prev => ({ ...prev, [cls.id]: { ...form, startTime: e.target.value } }))}
                                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-800"
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">End Time</label>
                                <input type="time" value={form.endTime}
                                  onChange={e => setSectionSchedules(prev => ({ ...prev, [cls.id]: { ...form, endTime: e.target.value } }))}
                                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-800"
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Venue / Room</label>
                                <input type="text" placeholder="e.g. LT1, Room 204" value={form.venue}
                                  onChange={e => setSectionSchedules(prev => ({ ...prev, [cls.id]: { ...form, venue: e.target.value } }))}
                                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-800"
                                />
                              </div>
                            </div>
                            <div className="px-6 pb-5">
                              <button onClick={() => handleSaveSchedule(cls.id)}
                                disabled={isSavingThis || !form.dayOfWeek}
                                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition disabled:opacity-50 shadow-sm shadow-blue-500/20"
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
    </div>
  );
}
