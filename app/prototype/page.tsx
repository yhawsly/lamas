/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useRef } from "react";
import { BookOpen, CheckCircle2, AlertTriangle, BarChart2 } from "lucide-react";

type Module = { id: number, week: number, title: string, description: string, lesson_plan: string, completed?: boolean };
type Class = { id: string, name: string, students: number, modules: Module[] };

export default function CourseOutlinePrototype() {
  const [activeRole, setActiveRole] = useState<"LECTURER" | "HOD">("LECTURER");
  const [activeLecturerId, setActiveLecturerId] = useState<string>("l1");
  const [lecturers] = useState([
    { id: "l1", name: "Dr. Alice Smith", email: "alice@university.edu" },
    { id: "l2", name: "Dr. Robert Johnson", email: "robert@university.edu" },
    { id: "l3", name: "Prof. Sarah Connor", email: "sarah@university.edu" },
  ]);
  const [courses, setCourses] = useState([
    { id: "c1", code: "CS-101", title: "Web Engineering", students: 125, classes: 3, lecturerId: "l1" },
    { id: "c2", code: "CS-202", title: "Data Structures", students: 80, classes: 2, lecturerId: "l2" },
    { id: "c3", code: "ENG-105", title: "Technical Writing", students: 45, classes: 1, lecturerId: "l1" },
    { id: "c4", code: "CS-303", title: "Database Systems", students: 95, classes: 2, lecturerId: "" },
  ]);
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("basic-info");
  
  const [basicInfo, setBasicInfo] = useState({
    courseCode: "CS-101",
    title: "Web Engineering",
    description: "Introduction to modern web development and engineering principles.",
    credits: "3",
  });

  const [assessments, setAssessments] = useState([
    { id: 1, name: "Midterm Exam", weight: 20 },
    { id: 2, name: "Final Exam", weight: 60 },
    { id: 3, name: "Assignments", weight: 20 },
  ]);

  // Classes State
  const [classes, setClasses] = useState<Class[]>([
    { id: "c1", name: "Section A (Morning)", students: 45, modules: [] },
    { id: "c2", name: "Section B (Afternoon)", students: 42, modules: [] },
    { id: "c3", name: "Section C (Evening)", students: 38, modules: [] },
  ]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

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

  const activeClass = classes.find(c => c.id === selectedClassId);

  // Filter courses based on active lecturer
  const activeLecturer = lecturers.find(l => l.id === activeLecturerId);
  const lecturerCourses = courses.filter(c => c.lecturerId === activeLecturerId);

  // Handle assignment of lecturer
  const handleAssignLecturer = (courseId: string, lecturerId: string) => {
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, lecturerId } : c));
    const course = courses.find(c => c.id === courseId);
    const lecturer = lecturers.find(l => l.id === lecturerId);
    if (course) {
      if (lecturer) {
        showToast(`Assigned ${course.code} to ${lecturer.name}`);
      } else {
        showToast(`Unassigned ${course.code}`);
      }
    }
  };

  const renderHodDashboard = () => {
    const totalCourses = courses.length;
    const assignedCourses = courses.filter(c => c.lecturerId).length;
    const unassignedCourses = totalCourses - assignedCourses;
    const coverage = totalCourses > 0 ? Math.round((assignedCourses / totalCourses) * 100) : 0;

    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <header>
          <h1 className="text-3xl font-bold text-slate-800">HOD Course Assignments</h1>
          <p className="text-slate-500 mt-1">Manage department curriculum distribution and assign academic staff.</p>
        </header>

        {/* Department Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {[
            { label: "Total Courses", value: totalCourses, icon: <BookOpen className="w-5 h-5" />, color: "text-blue-600 bg-blue-50 border-blue-100" },
            { label: "Assigned Workload", value: assignedCourses, icon: <CheckCircle2 className="w-5 h-5" />, color: "text-green-600 bg-green-50 border-green-100" },
            { label: "Pending Assignment", value: unassignedCourses, icon: <AlertTriangle className="w-5 h-5" />, color: "text-amber-600 bg-amber-50 border-amber-100" },
            { label: "Staff Coverage", value: `${coverage}%`, icon: <BarChart2 className="w-5 h-5" />, color: "text-purple-600 bg-purple-50 border-purple-100" },
          ].map((stat, i) => (
            <div key={i} className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold border ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <div className={`text-2xl font-bold ${stat.color.split(" ")[0]}`}>{stat.value}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Courses Table/Grid */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-800">Departmental Offerings</h3>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">{courses.length} Active Courses</span>
          </div>

          <div className="divide-y divide-slate-100">
            {courses.map(course => {
              const currentLecturer = lecturers.find(l => l.id === course.lecturerId);
              return (
                <div key={course.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-700 font-bold text-sm shrink-0 border border-slate-200">
                      {course.code}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg">{course.title}</h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2" /></svg>
                          {course.classes} Classes
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></svg>
                          {course.students} Students
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
                    <div className="flex flex-col min-w-[180px]">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Assigned Academic Staff</span>
                      {currentLecturer ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-blue-100 text-blue-700 text-xs font-bold rounded-full flex items-center justify-center border border-blue-200 uppercase">
                            {currentLecturer.name.split(" ").pop()?.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-800 leading-tight">{currentLecturer.name}</div>
                            <div className="text-xs text-slate-500">{currentLecturer.email}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-100/50 w-fit">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                          <span className="text-[10px] font-bold uppercase tracking-wider">Unassigned</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 border-l border-slate-100 pl-0 sm:pl-4">
                      <select
                        value={course.lecturerId}
                        onChange={(e) => handleAssignLecturer(course.id, e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition hover:border-slate-300"
                      >
                        <option value="">-- Assign Lecturer --</option>
                        {lecturers.map(l => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderLecturerDashboard = () => {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <header>
          <h1 className="text-3xl font-bold text-slate-800">Lecturer Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Logged in as <span className="font-bold text-slate-800">{activeLecturer?.name}</span> ({activeLecturer?.email}).
          </p>
        </header>

        {lecturerCourses.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-4 border border-slate-100">
              <BookOpen className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">No Courses Assigned</h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-2 text-sm">
              You currently do not have any courses assigned to you by the HOD. Please use the HOD switcher at the top to assign courses to your account.
            </p>
            <button
              onClick={() => setActiveRole("HOD")}
              className="mt-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-sm"
            >
              Go to HOD Workspace
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
            {lecturerCourses.map(course => (
              <div 
                key={course.id}
                onClick={() => {
                  setSelectedCourseId(course.id);
                  setBasicInfo(prev => ({
                    ...prev,
                    courseCode: course.code,
                    title: course.title,
                  }));
                }}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-bold mb-4 border border-blue-100">
                    {course.code}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition">{course.title}</h3>
                  <div className="mt-4 flex flex-col gap-2 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                      {course.classes} Classes (Sections)
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      {course.students} Total Students
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-semibold group-hover:text-blue-700">
                  <span>Manage Syllabus</span>
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-800 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-300 z-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Global Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-md shadow-blue-500/20">
            A
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 leading-tight">Academic Syllabus Manager</h2>
            <p className="text-xs text-slate-500">Interactive Prototype</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Role Toggle Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
            <button
              onClick={() => {
                setActiveRole("LECTURER");
                setSelectedCourseId(null);
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeRole === "LECTURER"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Lecturer Mode
            </button>
            <button
              onClick={() => {
                setActiveRole("HOD");
                setSelectedCourseId(null);
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeRole === "HOD"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              HOD Mode
            </button>
          </div>

          {/* Lecturer Persona Selector */}
          {activeRole === "LECTURER" && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
              <span className="text-xs font-semibold text-slate-500">Acting as:</span>
              <select
                value={activeLecturerId}
                onChange={(e) => {
                  setActiveLecturerId(e.target.value);
                  setSelectedCourseId(null);
                }}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
              >
                {lecturers.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0">
        {selectedCourseId ? (
          /* Course Workspace View (Sidebar + Main Canvas) */
          <>
            {/* Sidebar Navigation */}
            <aside className="w-64 bg-white border-r border-slate-200 p-6 sticky top-[73px] h-[calc(100vh-73px)] flex flex-col gap-6 hidden md:flex shrink-0">
              <div>
                <button 
                  onClick={() => setSelectedCourseId(null)}
                  className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition mb-6"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Back to Dashboard
                </button>
                <h1 className="text-xl font-bold text-slate-800">{basicInfo.courseCode}</h1>
                <p className="text-sm text-slate-500 truncate">{basicInfo.title}</p>
              </div>
              
              <nav className="flex flex-col gap-2 mt-4">
                {[
                  { id: "basic-info", label: "Basic Info" },
                  { id: "topics", label: "Course Topics" },
                  { id: "classes", label: "My Classes" },
                  { id: "assessments", label: "Assessments" },
                ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (tab.id !== "classes") setSelectedClassId(null);
                    }}
                    className={`text-left px-4 py-2 rounded-lg text-sm font-medium transition ${
                      activeTab === tab.id 
                        ? "text-blue-600 bg-blue-50" 
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </aside>

            {/* Main Canvas Area */}
            <main className="flex-1 p-6 md:p-10 max-w-4xl mx-auto w-full overflow-y-auto">
              {activeTab === "basic-info" && (
                <section id="basic-info" className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <header className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800">Basic Info</h2>
                      <p className="text-slate-500">General details about the course.</p>
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
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Course Code</label>
                        <input type="text" value={basicInfo.courseCode} onChange={e => setBasicInfo({...basicInfo, courseCode: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/50 transition" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Credits</label>
                        <input type="text" value={basicInfo.credits} onChange={e => setBasicInfo({...basicInfo, credits: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/50 transition" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Course Title</label>
                      <input type="text" value={basicInfo.title} onChange={e => setBasicInfo({...basicInfo, title: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/50 transition" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                      <textarea value={basicInfo.description} onChange={e => setBasicInfo({...basicInfo, description: e.target.value})} rows={4} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/50 transition" />
                    </div>
                    <div className="flex justify-end pt-4 border-t border-slate-100">
                      <button className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition">Save Info</button>
                    </div>
                  </div>
                </section>
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
                        accept=".xlsx,.xls,.csv,.pdf"
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
                        <div key={t.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm animate-in fade-in slide-in-from-bottom-2">
                          <h4 className="font-semibold text-slate-800">{t.title}</h4>
                          {t.description && <p className="text-sm text-slate-500 mt-1">{t.description}</p>}
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
                        <p className="text-slate-500">You are assigned to {classes.length} sections for this course.</p>
                      </header>
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
                               <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                 {c.students} Students
                               </p>
                               
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
                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition shadow-sm flex items-center gap-2 cursor-pointer">
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
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition shadow-sm flex items-center gap-2 cursor-pointer">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Add Component
                    </button>
                  </header>
                  
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="space-y-4">
                      {assessments.map(a => (
                        <div key={a.id} className="flex items-center justify-between p-4 border border-slate-100 bg-slate-50/50 rounded-lg group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
                              {a.weight}%
                            </div>
                            <span className="font-medium text-slate-800">{a.name}</span>
                          </div>
                          <button className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition p-1">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
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
            </main>
          </>
        ) : (
          /* Dashboard Views (Lecturer or HOD) */
          <main className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full overflow-y-auto">
            {activeRole === "HOD" ? renderHodDashboard() : renderLecturerDashboard()}
          </main>
        )}
      </div>
    </div>
  );
}
