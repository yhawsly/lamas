"use client";

import React, { useState, useEffect } from "react";
import { Building2, Plus, Edit2, X, Check, Users, MapPin } from "lucide-react";

interface ExamHall {
    id: number;
    name: string;
    code?: string | null;
    capacity: number;
    location?: string | null;
}

interface HallsManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onHallSaved?: () => void;
    disabled?: boolean;
}

export default function HallsManagementModal({
    isOpen,
    onClose,
    onHallSaved,
    disabled = false
}: HallsManagementModalProps) {
    const [halls, setHalls] = useState<ExamHall[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingHall, setEditingHall] = useState<ExamHall | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({ name: "", code: "", capacity: "50", location: "" });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const fetchHalls = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/deo/halls");
            if (res.ok) {
                const d = await res.json();
                setHalls(Array.isArray(d) ? d : []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchHalls();
        }
    }, [isOpen]);

    const handleStartEdit = (hall: ExamHall) => {
        setEditingHall(hall);
        setIsCreating(false);
        setFormData({
            name: hall.name,
            code: hall.code || "",
            capacity: String(hall.capacity),
            location: hall.location || ""
        });
        setError("");
    };

    const handleStartCreate = () => {
        setEditingHall(null);
        setIsCreating(true);
        setFormData({ name: "", code: "", capacity: "50", location: "" });
        setError("");
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (disabled) return;
        if (!formData.name.trim()) {
            setError("Venue name is required");
            return;
        }

        setSaving(true);
        setError("");

        try {
            const res = await fetch("/api/deo/halls", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editingHall?.id,
                    name: formData.name,
                    code: formData.code,
                    capacity: formData.capacity,
                    location: formData.location
                })
            });

            if (res.ok) {
                setEditingHall(null);
                setIsCreating(false);
                setFormData({ name: "", code: "", capacity: "50", location: "" });
                await fetchHalls();
                onHallSaved?.();
            } else {
                const d = await res.json().catch(() => ({}));
                setError(d.error || "Failed to save venue");
            }
        } catch {
            setError("Network error while saving venue");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Examination Halls & Venues</h3>
                            <p className="text-xs text-slate-500">Manage departmental halls, seating capacities, and locations</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                    {/* Add / Edit Form */}
                    {(isCreating || editingHall) && (
                        <form onSubmit={handleSave} className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
                                    {editingHall ? `Edit Venue: ${editingHall.name}` : "Add New Examination Venue"}
                                </h4>
                                <button
                                    type="button"
                                    onClick={() => { setEditingHall(null); setIsCreating(false); }}
                                    className="text-xs text-slate-400 hover:text-slate-600"
                                >
                                    Cancel
                                </button>
                            </div>

                            {error && (
                                <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                                    {error}
                                </p>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                                        Venue Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Auditorium Hall A, Room 204"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                                        Venue Code
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. AUD-A"
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                                        className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                                        Seating Capacity *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        placeholder="e.g. 100"
                                        value={formData.capacity}
                                        onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                                        className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                                        Location / Floor
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Faculty Complex, Floor 2"
                                        value={formData.location}
                                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="submit"
                                    disabled={saving || disabled}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
                                >
                                    <Check className="w-4 h-4" />
                                    {saving ? "Saving..." : editingHall ? "Update Venue" : "Save Venue"}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Venue List */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Available Halls ({halls.length})
                            </span>
                            {!isCreating && !editingHall && !disabled && (
                                <button
                                    onClick={handleStartCreate}
                                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 transition"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add Venue
                                </button>
                            )}
                        </div>

                        {loading ? (
                            <div className="py-8 text-center text-xs text-slate-400">Loading examination halls...</div>
                        ) : halls.length === 0 ? (
                            <div className="py-8 text-center text-xs text-slate-400">No examination halls registered.</div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {halls.map(h => (
                                    <div
                                        key={h.id}
                                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-start justify-between gap-3 group"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h5 className="font-bold text-sm text-slate-800 dark:text-slate-100">{h.name}</h5>
                                                {h.code && (
                                                    <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md">
                                                        {h.code}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-3.5 h-3.5 text-emerald-500" />
                                                    Capacity: <strong className="text-slate-700 dark:text-slate-300">{h.capacity} seats</strong>
                                                </span>
                                            </div>
                                            {h.location && (
                                                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3 shrink-0" />
                                                    {h.location}
                                                </p>
                                            )}
                                        </div>

                                        {!disabled && (
                                            <button
                                                onClick={() => handleStartEdit(h)}
                                                className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                                title="Edit Venue"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
