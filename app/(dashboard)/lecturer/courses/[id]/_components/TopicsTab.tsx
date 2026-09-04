"use client";

import React, { useState, useRef } from "react";
import { Calendar } from "lucide-react";

interface Topic {
  id: any;
  title: string;
  description?: string;
}

interface TopicsTabProps {
  topics: Topic[];
  setTopics: React.Dispatch<React.SetStateAction<any[]>>;
  isArchiveMode: boolean;
  handleExport: () => Promise<void>;
  isExporting: boolean;
  handleFileUpload: (file: File) => Promise<void>;
  isExtracting: boolean;
}

export default function TopicsTab({
  topics,
  setTopics,
  isArchiveMode,
  handleExport,
  isExporting,
  handleFileUpload,
  isExtracting
}: TopicsTabProps) {
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicDesc, setNewTopicDesc] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editing state for topics
  const [editingTopicId, setEditingTopicId] = useState<any>(null);
  const [editingTopicData, setEditingTopicData] = useState({ title: "", description: "" });

  const startEditTopic = (t: Topic) => {
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <section id="topics" className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Course Topics</h2>
          <p className="text-slate-500 dark:text-slate-400">Define the main subjects covered in this course.</p>
        </div>
        <button 
          onClick={handleExport}
          disabled={isExporting}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          {isExporting ? "Exporting..." : "Export to Excel"}
        </button>
      </div>

      {topics.length === 0 && !isAddingTopic ? (
        isArchiveMode ? (
          <div className="p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
            <p className="font-bold text-slate-600 dark:text-slate-300">No course topics recorded for this archived term.</p>
            <p className="text-xs text-slate-400 mt-1">This semester is archived and in read-only mode.</p>
          </div>
        ) : (
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !isExtracting && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition duration-200 cursor-pointer ${
              isDragOver ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/40 hover:border-blue-400 hover:bg-blue-50/50"
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
                <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 animate-pulse">Importing Spreadsheet...</h3>
                  <p className="text-blue-500 text-sm mt-1">Reading your Excel file and extracting course structure. Please wait.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Import from Spreadsheet or PDF</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-sm mx-auto">
                    Drag and drop your Course Outline spreadsheet or PDF (.xlsx, .csv, .pdf) here, or click to upload. We&apos;ll automatically extract the topics and modules for you.
                  </p>
                  <a href="/sample_syllabus.xlsx" download onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline transition">
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
                    className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-lg shadow-sm transition cursor-pointer"
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
            <div key={t.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs group animate-in fade-in slide-in-from-bottom-2">
              {editingTopicId === t.id && !isArchiveMode ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editingTopicData.title}
                    onChange={e => setEditingTopicData({...editingTopicData, title: e.target.value})}
                    className="w-full px-3 py-1.5 font-semibold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none"
                  />
                  <textarea
                    value={editingTopicData.description}
                    onChange={e => setEditingTopicData({...editingTopicData, description: e.target.value})}
                    className="w-full px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button onClick={saveEditTopic} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md cursor-pointer">Save</button>
                    <button onClick={() => setEditingTopicId(null)} className="px-3 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium rounded-md cursor-pointer">Cancel</button>
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
                      {t.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{t.description}</p>}
                    </div>
                  </div>
                  {!isArchiveMode && (
                    <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                      <button onClick={() => startEditTopic(t)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-md transition cursor-pointer" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button onClick={() => deleteTopic(t.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 rounded-md transition cursor-pointer" title="Delete">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {isAddingTopic && !isArchiveMode ? (
            <div className="p-6 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-xl shadow-lg shadow-blue-900/5 ring-1 ring-blue-500/20 animate-in slide-in-from-top-4 duration-300">
              <form onSubmit={handleAddTopic} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Topic Title</label>
                  <input 
                    type="text" 
                    value={newTopicTitle}
                    onChange={e => setNewTopicTitle(e.target.value)}
                    placeholder="e.g. Relational Databases"
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none transition text-slate-800 dark:text-slate-100"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description (Optional)</label>
                  <textarea 
                    value={newTopicDesc}
                    onChange={e => setNewTopicDesc(e.target.value)}
                    placeholder="Briefly describe what this topic covers..."
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none transition text-slate-800 dark:text-slate-100"
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
                    className="px-5 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium rounded-lg transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <button 
              onClick={() => setIsAddingTopic(true)}
              className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium rounded-xl hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Another Topic
            </button>
          )}
        </div>
      )}
    </section>
  );
}
