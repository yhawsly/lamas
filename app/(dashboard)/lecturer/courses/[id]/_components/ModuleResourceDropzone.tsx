"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileText, Trash2, AlertTriangle } from "lucide-react";
import { useSWRConfig } from "swr";

export type ResourceFile = { id: string; name: string; url: string; size?: number; type?: string };
export type Module = { id: number; week: number; title: string; description: string; lesson_plan: string; completed?: boolean; resources?: ResourceFile[] };

function mapExtensionToResourceType(extension: string): string {
    if (["pdf"].includes(extension)) return "PDF";
    if (["ppt", "pptx", "key"].includes(extension)) return "SLIDES";
    if (["doc", "docx", "txt", "rtf"].includes(extension)) return "DOCUMENT";
    if (["xls", "xlsx", "csv"].includes(extension)) return "SPREADSHEET";
    if (["png", "jpg", "jpeg", "webp", "svg"].includes(extension)) return "IMAGE";
    if (["mp4", "webm", "mov"].includes(extension)) return "VIDEO";
    if (["js", "ts", "py", "java", "cpp", "c", "html", "css", "zip"].includes(extension)) return "CODE";
    return "OTHER";
}

interface ModuleResourceDropzoneProps {
    module: Module;
    courseCode?: string;
    courseTitle?: string;
    onUpdateResources: (resources: ResourceFile[]) => void;
    disabled?: boolean;
}

export default function ModuleResourceDropzone({
    module,
    courseCode,
    courseTitle,
    onUpdateResources,
    disabled = false
}: ModuleResourceDropzoneProps) {
    const { mutate } = useSWRConfig();
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFiles = async (files: FileList | File[]) => {
        if (!files || files.length === 0 || disabled) return;
        setIsUploading(true);
        setUploadError(null);

        const MAX_FILE_SIZE = 10 * 1024 * 1024;
        const validFiles: File[] = [];
        const oversizedFiles: string[] = [];

        Array.from(files).forEach(f => {
            if (f.size > MAX_FILE_SIZE) oversizedFiles.push(f.name);
            else validFiles.push(f);
        });

        if (oversizedFiles.length > 0) {
            setUploadError(`Skipped: ${oversizedFiles.join(", ")} (Exceeds 10MB limit)`);
        }

        if (validFiles.length === 0) {
            setIsUploading(false);
            return;
        }

        // Parallelize upload tasks using Promise.allSettled
        const uploadPromises = validFiles.map(async (file): Promise<ResourceFile> => {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || `Failed to upload ${file.name}`);
            }

            const data = await res.json();
            const fileUrl = data.url || data.path || "#";

            // Non-blocking auto-sync into institutional repository (/api/resources)
            const extension = file.name.split('.').pop()?.toLowerCase() || '';
            const resourceType = mapExtensionToResourceType(extension);
            const resourceTitle = courseCode 
                ? `${courseCode} - Week ${module.week}: ${file.name}`
                : `Week ${module.week}: ${file.name}`;
            const resourceDesc = `Lecture material for ${courseCode || "Course"} (${courseTitle || ""}) - Week ${module.week}: ${module.title}`;

            fetch("/api/resources", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: resourceTitle,
                    description: resourceDesc,
                    type: resourceType,
                    url: fileUrl
                })
            }).then(r => {
                if (r.ok) {
                    mutate("/api/resources");
                    mutate("/api/resources?shared=true");
                }
            }).catch(syncErr => {
                console.error("Failed to auto-register resource in repository:", syncErr);
            });

            return {
                id: Math.random().toString(36).substring(2, 9),
                name: file.name,
                url: fileUrl,
                size: file.size,
                type: file.type
            };
        });

        const settledResults = await Promise.allSettled(uploadPromises);
        const successfulNewResources: ResourceFile[] = [];
        const errors: string[] = [];

        settledResults.forEach(result => {
            if (result.status === "fulfilled") {
                successfulNewResources.push(result.value);
            } else {
                errors.push(result.reason?.message || "Upload error");
            }
        });

        if (successfulNewResources.length > 0) {
            onUpdateResources([...(module.resources || []), ...successfulNewResources]);
        }

        if (errors.length > 0) {
            setUploadError(errors.join(" | "));
        }

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
                            <p className="text-xs text-slate-400 mt-0.5">PDF, PPT, DOC, PNG, ZIP — up to 10MB each</p>
                        </div>
                        <button
                            type="button"
                            disabled={disabled || isUploading}
                            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                            className="mt-1 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition cursor-pointer"
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
                                        className="text-slate-400 hover:text-red-500 transition p-1 rounded hover:bg-red-50 shrink-0 cursor-pointer"
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
