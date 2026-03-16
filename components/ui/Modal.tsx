"use client";

import { useEffect } from "react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: "alert" | "confirm";
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
}

export default function Modal({
    isOpen,
    onClose,
    title,
    message,
    type = "alert",
    onConfirm,
    confirmText = "Confirm",
    cancelText = "Cancel"
}: ModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div
                className="relative w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}
            >
                <h3 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>{title}</h3>
                <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>{message}</p>

                <div className="flex items-center justify-end gap-3 mt-4">
                    {type === "confirm" && (
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
                            style={{ color: "var(--text-primary)" }}
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={() => {
                            if (onConfirm) onConfirm();
                            onClose();
                        }}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 shadow-lg"
                        style={{
                            backgroundColor: type === "confirm" ? "#ef4444" : "var(--primary)",
                            boxShadow: type === "confirm" ? "0 4px 14px 0 rgba(239, 68, 68, 0.3)" : "0 4px 14px 0 rgba(99, 102, 241, 0.3)"
                        }}
                    >
                        {type === "alert" ? "OK" : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
