"use client";

import React, { useState } from "react";

export interface AssessmentItem {
  id: any;
  name: string;
  weight: number;
}

interface AssessmentsTabProps {
  assessments: AssessmentItem[];
  setAssessments: React.Dispatch<React.SetStateAction<AssessmentItem[]>>;
  isArchiveMode: boolean;
}

export default function AssessmentsTab({
  assessments,
  setAssessments,
  isArchiveMode
}: AssessmentsTabProps) {
  const [editingAssessmentId, setEditingAssessmentId] = useState<any>(null);
  const [editingAssessmentData, setEditingAssessmentData] = useState({ name: "", weight: 0 });

  const startEditAssessment = (a: AssessmentItem) => {
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

  const totalWeight = assessments.reduce((sum, item) => sum + item.weight, 0);

  return (
    <section id="assessments" className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Assessments & Grading</h2>
          <p className="text-slate-500 dark:text-slate-400">Define how the final grade is calculated.</p>
        </div>
        {!isArchiveMode && (
          <button 
            onClick={handleAddAssessment} 
            className="px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-sm font-semibold rounded-lg transition shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Component
          </button>
        )}
      </header>
      
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-4">
          {assessments.map(a => (
            <div key={a.id} className="p-4 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 rounded-lg group">
              {editingAssessmentId === a.id && !isArchiveMode ? (
                <div className="flex items-center gap-3">
                  <input 
                    type="text" 
                    value={editingAssessmentData.name} 
                    onChange={e => setEditingAssessmentData({...editingAssessmentData, name: e.target.value})} 
                    className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500/50 outline-none text-slate-800 dark:text-slate-100"
                  />
                  <div className="flex items-center gap-1">
                    <input 
                      type="number" 
                      value={editingAssessmentData.weight} 
                      onChange={e => setEditingAssessmentData({...editingAssessmentData, weight: parseInt(e.target.value) || 0})} 
                      className="w-16 px-3 py-1.5 text-sm text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500/50 outline-none text-slate-800 dark:text-slate-100"
                    />
                    <span className="text-sm font-semibold text-slate-500">%</span>
                  </div>
                  <button onClick={saveEditAssessment} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md cursor-pointer">Save</button>
                  <button onClick={() => setEditingAssessmentId(null)} className="px-3 py-1.5 text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs font-medium rounded-md cursor-pointer">Cancel</button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-semibold text-sm">
                      {a.weight}%
                    </div>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{a.name}</span>
                  </div>
                  {!isArchiveMode && (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition">
                      <button onClick={() => startEditAssessment(a)} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition p-1.5 rounded-md cursor-pointer" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button onClick={() => deleteAssessment(a.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 transition p-1.5 rounded-md cursor-pointer" title="Delete">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="font-semibold text-slate-600 dark:text-slate-300">Total Weight</span>
          <span className={`text-lg font-bold ${totalWeight === 100 ? "text-green-600 dark:text-green-400" : "text-amber-500"}`}>
            {totalWeight}%
          </span>
        </div>
      </div>
    </section>
  );
}
