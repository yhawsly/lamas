"use client";

import React from "react";
import { History, X, BookOpen, Calendar, Paperclip, Download } from "lucide-react";

interface HistoricalImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  historyLoading: boolean;
  historicalList: any[];
  selectedHistoryItem: any | null;
  setSelectedHistoryItem: (item: any) => void;
  handleApplyHistoricalOutline: (item: any) => void;
  courseCode: string;
}

export default function HistoricalImportModal({
  isOpen,
  onClose,
  historyLoading,
  historicalList,
  selectedHistoryItem,
  setSelectedHistoryItem,
  handleApplyHistoricalOutline,
  courseCode
}: HistoricalImportModalProps) {
  if (!isOpen) return null;

  return (
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
            onClick={onClose}
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
                    {selectedHistoryItem.term?.name} — {courseCode} Outline
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
                onClick={onClose}
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
  );
}
