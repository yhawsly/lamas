"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    ArrowLeftRight,
    Save,
    CheckCircle2,
    AlertCircle,
    Search,
    BookOpen,
    Eye,
    ShieldCheck,
    ChevronDown,
    Users,
    Link2,
    Unlink,
    Tag,
} from "lucide-react";
import { useTerm } from "@/context/TermContext";
import { useModal } from "@/context/ModalContext";


/* ─── Types ─────────────────────────────────────────────────────── */
interface CourseRow {
    courseId: number;
    courseCode: string;
    courseTitle: string;
    domain: string;
    departmentId: number | null;
    departmentName: string;
    instructor: { id: number; name: string; email: string } | null;
    isAssignedSection: boolean;
    formA: { id: number; reviewerId: number; reviewerName?: string; status: string } | null;
    formB: { id: number; observerId: number; observerName?: string; status: string } | null;
    formC: { id: number; moderatorId: number; moderatorName?: string; status: string } | null;
}
interface FacultyMember {
    id: number;
    name: string;
    email: string;
    departmentId: number | null;
    role: string;
}

/* ─── Helpers ────────────────────────────────────────────────────── */
function Avatar({ name, size = 40 }: { name: string; size?: number }) {
    const initials = name.split(" ").slice(0, 2).map(p => p[0]).join("").toUpperCase();
    return (
        <svg width={size} height={size} viewBox="0 0 40 40" style={{ borderRadius: 10, flexShrink: 0 }}>
            <rect width="40" height="40" rx="10" fill="#3b82f6" />
            <text x="20" y="20" textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight="800" fill="white" fontFamily="system-ui, sans-serif">
                {initials}
            </text>
        </svg>
    );
}

const FORM_META = {
    A: { label: "Form A", desc: "Syllabus Audit", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", icon: BookOpen },
    B: { label: "Form B", desc: "Peer Observation", color: "#3b82f6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.3)", icon: Eye },
    C: { label: "Form C", desc: "Exam Moderation", color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", border: "rgba(139,92,246,0.3)", icon: ShieldCheck },
} as const;

/* ─── Component ──────────────────────────────────────────────────── */
export default function PairingMatrixTab({ onRefresh }: { onRefresh?: () => void }) {
    const { selectedTermId, isArchiveMode } = useTerm();
    const { showSuccess, showError, showWarning, showConfirm } = useModal();

    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [matrix, setMatrix] = useState<CourseRow[]>([]);
    const [faculty, setFaculty] = useState<FacultyMember[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDept, setSelectedDept] = useState("ALL");
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [draftPairings, setDraftPairings] = useState<Record<string, {
        observerAId?: number | null;
        observerBId?: number | null;
        moderatorCId?: number | null;
    }>>({});

    /* fetch */
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const url = selectedTermId ? `/api/deo/pairing?termId=${selectedTermId}` : "/api/deo/pairing";
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setMatrix(data.matrix || []);
                setFaculty(data.faculty || []);
                const init: typeof draftPairings = {};
                (data.matrix || []).forEach((row: CourseRow) => {
                    init[row.courseCode] = {
                        observerAId: row.formA?.reviewerId || null,
                        observerBId: row.formB?.observerId || null,
                        moderatorCId: row.formC?.moderatorId || null,
                    };
                });
                setDraftPairings(init);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [selectedTermId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    /* set reviewer for all 3 forms across all courses of a lecturer, and auto-reciprocate strictly 1-to-1 */
    const pairLecturer = (lecturerId: number, courses: CourseRow[], reviewerId: number | null) => {
        setDraftPairings(prev => {
            const next = { ...prev };
            
            // Iterate over all courses in the matrix to enforce 1-to-1 pairing rule
            matrix.forEach(c => {
                const instructorId = c.instructor?.id;
                if (!instructorId) return;
                
                if (instructorId === lecturerId) {
                    // The lecturer's courses get the new reviewer (or null if unpairing)
                    next[c.courseCode] = { observerAId: reviewerId, observerBId: reviewerId, moderatorCId: reviewerId };
                } 
                else if (reviewerId !== null && instructorId === reviewerId) {
                    // The new reviewer's courses are automatically reciprocated to the lecturer
                    next[c.courseCode] = { observerAId: lecturerId, observerBId: lecturerId, moderatorCId: lecturerId };
                }
                else {
                    // For any other lecturer's courses...
                    // If they were previously paired with either the lecturer or the new reviewer, break the old pair
                    const currentReviewer = prev[c.courseCode]?.observerAId;
                    if (currentReviewer === lecturerId || (reviewerId !== null && currentReviewer === reviewerId)) {
                        next[c.courseCode] = { observerAId: null, observerBId: null, moderatorCId: null };
                    }
                }
            });
            
            return next;
        });
    };

    /* set reviewer for a specific form of a specific course */
    const setFormReviewer = (courseCode: string, form: "A" | "B" | "C", id: number | null) => {
        setDraftPairings(prev => {
            const cur = prev[courseCode] || {};
            return {
                ...prev,
                [courseCode]: {
                    ...cur,
                    ...(form === "A" ? { observerAId: id } : form === "B" ? { observerBId: id } : { moderatorCId: id }),
                }
            };
        });
    };


    /* save */
    const save = () => {
        if (isArchiveMode) { showWarning("Read-only", "Archive mode is read-only."); return; }
        const payload = matrix.map(row => {
            const d = draftPairings[row.courseCode] || {};
            return { courseCode: row.courseCode, lecturerId: row.instructor?.id, observerAId: d.observerAId || null, observerBId: d.observerBId || null, moderatorCId: d.moderatorCId || null };
        }).filter(x => x.lecturerId);
        showConfirm({
            title: "Commit Pairings",
            message: `Dispatch reviewer pairings for ${payload.length} courses? Faculty will be notified.`,
            confirmText: "Save & Dispatch",
            onConfirm: async () => {
                setIsSaving(true);
                try {
                    const res = await fetch("/api/deo/pairing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pairings: payload, termId: selectedTermId }) });
                    const d = await res.json();
                    if (res.ok) { showSuccess("Dispatched", d.message || "Done!"); fetchData(); onRefresh?.(); }
                    else showError("Error", d.error || "Failed.");
                } catch { showError("Network Error", "Could not reach server."); }
                finally { setIsSaving(false); }
            }
        });
    };

    /* derive per-lecturer pairing entries */
    interface LecturerEntry {
        id: number; name: string; email: string; dept: string;
        courses: CourseRow[];
        reviewerId: number | null;
    }

    const lecturerEntries = useMemo<LecturerEntry[]>(() => {
        const map = new Map<number, LecturerEntry>();
        matrix.forEach(row => {
            const instr = row.instructor;
            if (!instr) return;
            if (!map.has(instr.id)) map.set(instr.id, { id: instr.id, name: instr.name, email: instr.email, dept: row.departmentName || "—", courses: [], reviewerId: null });
            map.get(instr.id)!.courses.push(row);
        });
        map.forEach(entry => {
            const d = draftPairings[entry.courses[0]?.courseCode] || {};
            entry.reviewerId = d.observerAId ?? null;
        });
        return Array.from(map.values());
    }, [matrix, draftPairings]);

    const departments = useMemo(() => {
        const m = new Map<number, string>();
        matrix.forEach(r => { if (r.departmentId && r.departmentName) m.set(r.departmentId, r.departmentName); });
        return Array.from(m.entries()).map(([id, name]) => ({ id, name }));
    }, [matrix]);

    useEffect(() => {
        if (selectedDept === "ALL" && departments.length > 0) {
            setSelectedDept(String(departments[0].id));
        }
    }, [departments, selectedDept]);

    const filtered = useMemo(() => lecturerEntries.filter(e => {
        if (selectedDept !== "ALL" && !e.courses.some(c => String(c.departmentId) === selectedDept)) return false;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            return e.name.toLowerCase().includes(q) || e.courses.some(c => c.courseCode.toLowerCase().includes(q) || c.courseTitle.toLowerCase().includes(q));
        }
        return true;
    }), [lecturerEntries, selectedDept, searchQuery]);

    const pairedCount = lecturerEntries.filter(e => e.reviewerId != null).length;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* ── Toolbar ───────────────────────────────────────────── */}
            <div style={{
                background: "var(--bg-surface, white)",
                border: "1px solid var(--bg-border, #e2e8f0)",
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}>
                <div style={{ height: 3, background: "linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4)" }} />
                <div style={{ padding: "18px 24px", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(59,130,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <ArrowLeftRight size={16} color="#3b82f6" />
                            </div>
                            <span style={{ fontWeight: 800, fontSize: 15, color: "var(--text-primary, #0f172a)" }}>Faculty Peer Pairing</span>
                        </div>
                        <p style={{ fontSize: 11.5, color: "var(--text-muted, #94a3b8)", margin: "0 0 0 42px" }}>
                            Each lecturer is automatically paired with one peer reviewer for <b>all 3 review types</b>. Pairings are reciprocal.
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12, marginLeft: 2 }}>
                            <StatBadge icon={<Users size={12} />} label={`${lecturerEntries.length} lecturers`} color="#3b82f6" />
                            <StatBadge icon={<CheckCircle2 size={12} />} label={`${pairedCount} paired`} color="#10b981" />
                            {lecturerEntries.length - pairedCount > 0 && (
                                <StatBadge icon={<AlertCircle size={12} />} label={`${lecturerEntries.length - pairedCount} unassigned`} color="#f59e0b" />
                            )}
                        </div>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                        <ToolBtn icon={<Save size={13} />} label={isSaving ? "Saving..." : "Save Pairings"} onClick={save} success disabled={isSaving || isArchiveMode} />
                    </div>
                </div>
            </div>

            {/* ── Search + Dept Filters ─────────────────────────────── */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
                    <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                    <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search lecturer or course..."
                        style={{
                            width: "100%", boxSizing: "border-box",
                            paddingLeft: 36, paddingRight: 14, paddingTop: 9, paddingBottom: 9,
                            borderRadius: 12, border: "1px solid var(--bg-border, #e2e8f0)",
                            background: "var(--bg-surface, white)", color: "var(--text-primary, #0f172a)",
                            fontSize: 12.5, fontWeight: 600, outline: "none",
                        }}
                    />
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {departments.map(d => ({ id: String(d.id), name: d.name })).map(d => (
                        <button key={d.id} onClick={() => setSelectedDept(d.id)} style={{
                            padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, border: "1px solid",
                            cursor: "pointer", transition: "all 0.15s",
                            background: selectedDept === d.id ? "#3b82f6" : "var(--bg-surface, white)",
                            borderColor: selectedDept === d.id ? "#3b82f6" : "var(--bg-border, #e2e8f0)",
                            color: selectedDept === d.id ? "white" : "var(--text-secondary, #475569)",
                        }}>
                            {d.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Column Headers ────────────────────────────────────── */}
            <div className="hidden md:grid gap-3 px-1" style={{ gridTemplateColumns: "1fr 56px 1fr" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", paddingLeft: 4 }}>
                    LECTURER
                </div>
                <div />
                <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", paddingLeft: 4 }}>
                    PEER REVIEWER <span style={{ color: "#cbd5e1", fontWeight: 600 }}>(forms A · B · C)</span>
                </div>
            </div>

            {/* ── Pair Cards ────────────────────────────────────────── */}
            {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} style={{ height: 88, borderRadius: 18, background: "var(--bg-hover, #f1f5f9)", animation: "pulse 1.5s ease-in-out infinite" }} />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ padding: "64px 0", textAlign: "center", borderRadius: 20, border: "1px dashed var(--bg-border, #e2e8f0)" }}>
                    <Users size={40} style={{ color: "#cbd5e1", margin: "0 auto 12px" }} />
                    <div style={{ fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>No faculty found</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Adjust search or department filter.</div>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {filtered.map(entry => {
                        const reviewer = faculty.find(f => f.id === entry.reviewerId);
                        const paired = entry.reviewerId !== null;
                        const expanded = expandedIds.has(entry.id);
                        const eligible = faculty.filter(f => f.id !== entry.id);

                        return (
                            <div key={entry.id} style={{
                                borderRadius: 18,
                                border: `1px solid ${paired ? "var(--bg-border, #e2e8f0)" : "#fcd34d"}`,
                                background: "var(--bg-surface, white)",
                                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                                overflow: "hidden",
                                transition: "border-color 0.2s",
                            }}>
                                {/* Main row */}
                                <div className="flex flex-col md:grid md:items-center" style={{ gridTemplateColumns: "minmax(0,1fr) 56px minmax(0,1fr)" }}>

                                    {/* LEFT: Lecturer */}
                                    <div className="p-4 sm:p-5 flex items-center gap-3 w-full border-b md:border-b-0 border-slate-100">
                                        <Avatar name={entry.name} />
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontWeight: 800, fontSize: 13.5, color: "var(--text-primary, #0f172a)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{entry.name}</div>
                                            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{entry.email}</div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
                                                <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", background: "var(--bg-hover, #f1f5f9)", padding: "2px 8px", borderRadius: 6, border: "1px solid var(--bg-border, #e2e8f0)" }}>
                                                    {entry.dept}
                                                </span>
                                                <span style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8" }}>
                                                    {entry.courses.length} course{entry.courses.length !== 1 ? "s" : ""}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* CENTER: connector + status */}
                                    <div className="flex flex-row md:flex-col items-center justify-center gap-2 md:gap-1 py-3 md:py-2 border-y md:border-y-0 md:border-x border-slate-100 bg-slate-50/50 md:bg-transparent" style={{ height: "100%", width: "100%" }}>
                                        {paired ? (
                                            <>
                                                <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <Link2 size={13} color="#3b82f6" />
                                                </div>
                                                <span style={{ fontSize: 9, fontWeight: 800, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.05em" }}>Paired</span>
                                            </>
                                        ) : (
                                            <>
                                                <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <Unlink size={13} color="#f59e0b" />
                                                </div>
                                                <span style={{ fontSize: 9, fontWeight: 800, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.05em" }}>None</span>
                                            </>
                                        )}
                                    </div>

                                    {/* RIGHT: Reviewer picker + expand */}
                                    <div className="p-4 sm:p-5 flex items-center gap-3 w-full">
                                        {reviewer && <Avatar name={reviewer.name} size={36} />}
                                        {!reviewer && (
                                            <div style={{ width: 36, height: 36, borderRadius: 9, border: "2px dashed #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                <Users size={14} color="#cbd5e1" />
                                            </div>
                                        )}

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            {reviewer ? (
                                                <>
                                                    <div style={{ fontWeight: 800, fontSize: 13, color: "var(--text-primary, #0f172a)", marginBottom: 2 }}>{reviewer.name}</div>
                                                    <div style={{ display: "flex", gap: 4 }}>
                                                        {(["A", "B", "C"] as const).map(f => {
                                                            const m = FORM_META[f];
                                                            const Icon = m.icon;
                                                            return (
                                                                <span key={f} style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 6px", borderRadius: 5, background: m.bg, border: `1px solid ${m.border}`, fontSize: 9.5, fontWeight: 700, color: m.color }}>
                                                                    <Icon size={9} /> {m.label}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                </>
                                            ) : (
                                                <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>No reviewer assigned yet</div>
                                            )}

                                            {/* Selector */}
                                            <div style={{ marginTop: 8, position: "relative" }}>
                                                <select
                                                    value={entry.reviewerId ?? ""}
                                                    onChange={e => pairLecturer(entry.id, entry.courses, e.target.value ? Number(e.target.value) : null)}
                                                    disabled={isArchiveMode}
                                                    style={{
                                                        width: "100%", appearance: "none",
                                                        paddingLeft: 10, paddingRight: 28, paddingTop: 7, paddingBottom: 7,
                                                        borderRadius: 10, border: `1.5px solid ${paired ? "#3b82f6" : "#e2e8f0"}`,
                                                        background: paired ? "rgba(59,130,246,0.04)" : "var(--bg-hover, #f8fafc)",
                                                        color: "var(--text-primary, #0f172a)", fontSize: 12, fontWeight: 600,
                                                        cursor: isArchiveMode ? "not-allowed" : "pointer", outline: "none",
                                                    }}
                                                >
                                                    <option value="">— Choose reviewer —</option>
                                                    {eligible.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                                </select>
                                                <ChevronDown size={13} style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                                            </div>
                                        </div>

                                        {/* Expand button */}
                                        <button
                                            onClick={() => setExpandedIds(prev => { 
                                                const n = new Set(prev); 
                                                if (n.has(entry.id)) {
                                                    n.delete(entry.id);
                                                } else {
                                                    n.add(entry.id);
                                                }
                                                return n; 
                                            })}
                                            title={expanded ? "Collapse" : "Per-course control"}
                                            style={{
                                                width: 32, height: 32, borderRadius: 9, border: "1px solid var(--bg-border, #e2e8f0)",
                                                background: expanded ? "rgba(59,130,246,0.08)" : "var(--bg-hover, #f8fafc)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                cursor: "pointer", flexShrink: 0,
                                            }}
                                        >
                                            <ChevronDown size={14} color={expanded ? "#3b82f6" : "#94a3b8"} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                                        </button>
                                    </div>
                                </div>

                                {/* Reciprocal indicator bar */}
                                {paired && reviewer && (
                                    <div className="px-4 py-3 sm:px-5 sm:py-2.5 text-xs bg-blue-50/50 border-t border-slate-100 flex items-start sm:items-center gap-2">
                                        <CheckCircle2 size={12} color="#10b981" style={{ flexShrink: 0 }} />
                                        <span style={{ fontSize: 11, color: "#64748b" }}>
                                            <b style={{ color: "var(--text-primary, #0f172a)" }}>{reviewer.name}</b> and <b style={{ color: "var(--text-primary, #0f172a)" }}>{entry.name}</b> are assigned to review each other.
                                        </span>
                                    </div>
                                )}

                                {/* Expanded: per-course, per-form control */}
                                {expanded && (
                                    <div style={{ borderTop: "1px solid var(--bg-border, #f1f5f9)", background: "var(--bg-hover, #f8fafc)" }}>
                                        <div style={{ padding: "10px 20px 6px", fontSize: 10, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                            Per-course override
                                        </div>
                                        {entry.courses.map(course => {
                                            const d = draftPairings[course.courseCode] || {};
                                            const elig = faculty.filter(f => f.id !== course.instructor?.id);
                                            return (
                                                <div key={course.courseId} style={{ padding: "12px 20px", borderTop: "1px solid var(--bg-border, #f1f5f9)" }}>
                                                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                                        <span style={{ fontWeight: 800, fontSize: 13, color: "#3b82f6" }}>{course.courseCode}</span>
                                                        <span style={{ fontSize: 12, color: "var(--text-secondary, #475569)", fontWeight: 600 }}>{course.courseTitle}</span>
                                                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 5, background: "var(--bg-surface, white)", border: "1px solid var(--bg-border, #e2e8f0)", fontSize: 10, fontWeight: 700, color: "#64748b" }}>
                                                            <Tag size={9} /> {course.domain}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                                                        {(["A", "B", "C"] as const).map(form => {
                                                            const m = FORM_META[form];
                                                            const Icon = m.icon;
                                                            const val = form === "A" ? d.observerAId : form === "B" ? d.observerBId : d.moderatorCId;
                                                            return (
                                                                <div key={form}>
                                                                    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 8px", borderRadius: 6, border: `1px solid ${m.border}`, background: m.bg, marginBottom: 6, fontSize: 10.5, fontWeight: 700, color: m.color }}>
                                                                        <Icon size={10} /> {m.label} · {m.desc}
                                                                    </div>
                                                                    <div style={{ position: "relative" }}>
                                                                        <select
                                                                            value={val ?? ""}
                                                                            onChange={e => setFormReviewer(course.courseCode, form, e.target.value ? Number(e.target.value) : null)}
                                                                            disabled={isArchiveMode}
                                                                            style={{
                                                                                width: "100%", appearance: "none",
                                                                                padding: "7px 28px 7px 10px", borderRadius: 9,
                                                                                border: `1.5px solid ${m.border}`,
                                                                                background: "var(--bg-surface, white)",
                                                                                color: "var(--text-primary, #0f172a)",
                                                                                fontSize: 12, fontWeight: 600, cursor: isArchiveMode ? "not-allowed" : "pointer", outline: "none",
                                                                            }}
                                                                        >
                                                                            <option value="">— Unassigned —</option>
                                                                            {elig.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                                                        </select>
                                                                        <ChevronDown size={12} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: m.color, pointerEvents: "none" }} />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* ─── Mini Sub-Components ───────────────────────────────────────── */
function StatBadge({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "4px 10px", borderRadius: 8,
            background: `${color}15`, border: `1px solid ${color}30`,
            fontSize: 11.5, fontWeight: 700, color,
        }}>
            {icon} {label}
        </span>
    );
}

function ToolBtn({ icon, label, onClick, primary, success, disabled }: {
    icon: React.ReactNode; label: string; onClick: () => void;
    primary?: boolean; success?: boolean; disabled?: boolean;
}) {
    const bg = success ? "#10b981" : primary ? "linear-gradient(135deg,#3b82f6,#6366f1)" : "var(--bg-surface,white)";
    const textColor = (primary || success) ? "white" : "var(--text-secondary,#475569)";
    const border = (primary || success) ? "transparent" : "var(--bg-border,#e2e8f0)";
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "9px 16px", borderRadius: 12, fontSize: 12.5, fontWeight: 700,
                background: bg, color: textColor, border: `1px solid ${border}`,
                boxShadow: (primary || success) ? "0 2px 8px rgba(59,130,246,0.25)" : "none",
                cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
                transition: "all 0.15s",
            }}
        >
            {icon} {label}
        </button>
    );
}
