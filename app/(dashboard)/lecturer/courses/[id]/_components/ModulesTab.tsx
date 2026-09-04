"use client";

import React, { useState } from "react";
import { GraduationCap, Layers, FileText, Paperclip } from "lucide-react";
import ModuleResourceDropzone, { Module } from "./ModuleResourceDropzone";

export type Class = { id: string; name: string; modules: Module[] };

interface ModulesTabProps {
  classes: Class[];
  selectedClassId: string | null;
  setSelectedClassId: (id: string | null) => void;
  updateModule: (classId: string, moduleId: number, updates: Partial<Module>) => void;
  handleAddWeek: (classId: string) => void;
  handleSyncClassWithTopics: (classId: string) => void;
  isArchiveMode: boolean;
  basicInfo: { courseCode: string; title: string };
  setActiveTab: (tab: string) => void;
}

export default function ModulesTab({
  classes,
  selectedClassId,
  setSelectedClassId,
  updateModule,
  handleAddWeek,
  handleSyncClassWithTopics,
  isArchiveMode,
  basicInfo,
  setActiveTab
}: ModulesTabProps) {
  const [editingModuleId, setEditingModuleId] = useState<number | null>(null);
  const activeClass = classes.find(c => c.id === selectedClassId);

  return (
    <section id="classes" className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {!selectedClassId ? (
        <>
          <header>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">My Classes</h2>
            <p className="text-slate-500 dark:text-slate-400">
              {classes.length > 0
                ? `You are assigned to ${classes.length} class${classes.length !== 1 ? "es" : ""} for this course.`
                : "No class sections have been assigned to you for this course yet."}
            </p>
          </header>
          {classes.length === 0 && (
            <div className="p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center bg-slate-50/50 dark:bg-slate-900/40">
              <div className="flex justify-center mb-3"><GraduationCap className="w-10 h-10 text-gray-400" /></div>
              <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-1">No Sections Assigned</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
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
                  className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-400 hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
                >
                   <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">{c.name}</h3>
                   
                   <div className="mt-8">
                     <div className="flex justify-between text-sm mb-2">
                       <span className="font-medium text-slate-700 dark:text-slate-300">Progress</span>
                       <span className="text-slate-500 dark:text-slate-400 font-medium">{completedCount} of {total} Weeks</span>
                     </div>
                     <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                       <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                     </div>
                   </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          <button 
            onClick={() => setSelectedClassId(null)}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Classes
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{activeClass?.name}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Weekly Syllabus Modules & Teaching Schedule</p>
            </div>
            <div className="flex items-center gap-2">
              {!isArchiveMode && (
                <button 
                  onClick={() => activeClass && handleSyncClassWithTopics(activeClass.id)}
                  className="px-3.5 py-2 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-lg transition border border-blue-200 dark:border-blue-800 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Regenerate/sync weeks directly from Course Topics"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Sync with Course Topics</span>
                </button>
              )}
              {!isArchiveMode && (
                <button 
                  onClick={() => {
                    if (activeClass) {
                      handleAddWeek(activeClass.id);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-lg transition shadow-sm shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  <span>Add Week</span>
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {activeClass?.modules.map((m) => (
              <div 
                key={m.id} 
                className={`group relative bg-white dark:bg-slate-900 border rounded-xl transition-all duration-300 ${
                  editingModuleId === m.id 
                    ? "border-blue-400 shadow-xl shadow-blue-900/5 ring-1 ring-blue-400/20" 
                    : m.completed 
                      ? "border-green-200 dark:border-green-800/60 bg-green-50/30 dark:bg-green-950/20"
                      : "border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md"
                }`}
              >
                {editingModuleId !== m.id && (
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-sm rounded-lg flex items-center overflow-hidden z-10">
                     <button 
                      onClick={() => updateModule(activeClass.id, m.id, { completed: !m.completed })} 
                      className={`p-2.5 sm:p-2 min-w-[36px] min-h-[36px] flex items-center justify-center transition ${m.completed ? 'text-green-600 hover:bg-green-50 dark:hover:bg-slate-700' : 'text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-slate-700'}`} 
                      title={m.completed ? "Mark incomplete" : "Mark complete"}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </button>
                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                    <button onClick={() => setEditingModuleId(m.id)} className="p-2.5 sm:p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-500 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition" title="Edit">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                  </div>
                )}

                {editingModuleId === m.id ? (
                  <div className="p-6 space-y-5 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-md">WEEK {m.week}</span>
                      <input 
                        type="text" 
                        value={m.title}
                        onChange={(e) => updateModule(activeClass.id, m.id, { title: e.target.value })}
                        className="flex-1 px-3 py-1.5 text-lg font-semibold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Module Overview</label>
                      <textarea 
                        value={m.description}
                        onChange={(e) => updateModule(activeClass.id, m.id, { description: e.target.value })}
                        className="w-full px-4 py-2 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none"
                        rows={2}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Structured Lesson Plan</label>
                      <textarea 
                        value={m.lesson_plan}
                        onChange={(e) => updateModule(activeClass.id, m.id, { lesson_plan: e.target.value })}
                        className="w-full px-4 py-2 text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none"
                        rows={3}
                        placeholder="1. Lecture... &#10;2. Lab... &#10;3. Q&A..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Lecture Resources</label>
                      <ModuleResourceDropzone
                        module={m}
                        courseCode={basicInfo.courseCode}
                        courseTitle={basicInfo.title}
                        onUpdateResources={(resources) => updateModule(activeClass.id, m.id, { resources })}
                        disabled={isArchiveMode}
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button onClick={() => setEditingModuleId(null)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium rounded-lg transition cursor-pointer">Cancel</button>
                      <button onClick={() => setEditingModuleId(null)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition shadow-sm cursor-pointer">Save Changes</button>
                    </div>
                  </div>
                ) : (
                  <div className={`p-6 flex items-start gap-4 transition-opacity ${m.completed ? 'opacity-85' : 'opacity-100'}`}>
                    <div className={`flex-shrink-0 w-12 h-12 border rounded-xl flex items-center justify-center flex-col transition-colors ${
                      m.completed ? 'bg-green-100 dark:bg-green-950/60 border-green-200 dark:border-green-800' : 'bg-blue-50 dark:bg-blue-950/60 border-blue-100 dark:border-blue-900'
                    }`}>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${m.completed ? 'text-green-700 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>Week</span>
                      <span className={`text-lg font-bold leading-none ${m.completed ? 'text-green-800 dark:text-green-300' : 'text-blue-700 dark:text-blue-300'}`}>{m.week}</span>
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className={`text-lg font-bold ${m.completed ? 'text-slate-600 dark:text-slate-400 line-through decoration-slate-300' : 'text-slate-800 dark:text-slate-100'}`}>
                        {m.title}
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 leading-relaxed">{m.description}</p>
                      {m.lesson_plan && (
                        <div className="mt-2.5 text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800 font-mono whitespace-pre-line leading-relaxed">
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
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400 text-xs font-bold">
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
              <div className="p-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center">
                <p className="text-slate-500 dark:text-slate-400 mb-4">No schedule created for this class yet.</p>
                <button onClick={() => setActiveTab("topics")} className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg shadow-sm cursor-pointer">Import from Excel via Topics Tab</button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
