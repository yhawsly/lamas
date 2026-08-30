"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AlertCircle, CheckCircle2, AlertTriangle, Info, HelpCircle, X } from "lucide-react";

type ModalType = "info" | "success" | "warning" | "error" | "confirm";

interface ModalOptions {
    title: string;
    message: string;
    type?: ModalType;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
}

interface ModalContextType {
    showModal: (options: ModalOptions) => void;
    showAlert: (title: string, message: string, type?: "info" | "success" | "warning" | "error") => void;
    showSuccess: (title: string, message: string) => void;
    showError: (title: string, message: string) => void;
    showWarning: (title: string, message: string) => void;
    showConfirm: (options: Omit<ModalOptions, "type">) => void;
    hideModal: () => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

export function ModalProvider({ children }: { children: React.ReactNode }) {
    const [modal, setModal] = useState<ModalOptions | null>(null);

    const showModal = useCallback((options: ModalOptions) => {
        setModal(options);
    }, []);

    const hideModal = useCallback(() => {
        setModal(null);
    }, []);

    const showAlert = useCallback((title: string, message: string, type: "info" | "success" | "warning" | "error" = "info") => {
        setModal({ title, message, type });
    }, []);

    const showSuccess = useCallback((title: string, message: string) => {
        setModal({ title, message, type: "success" });
    }, []);

    const showError = useCallback((title: string, message: string) => {
        setModal({ title, message, type: "error" });
    }, []);

    const showWarning = useCallback((title: string, message: string) => {
        setModal({ title, message, type: "warning" });
    }, []);

    const showConfirm = useCallback((options: Omit<ModalOptions, "type">) => {
        setModal({ ...options, type: "confirm" });
    }, []);

    return (
        <ModalContext.Provider
            value={{
                showModal,
                showAlert,
                showSuccess,
                showError,
                showWarning,
                showConfirm,
                hideModal
            }}
        >
            {children}

            {/* Global Styled Modal Dialog */}
            {modal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div
                        className="relative w-full max-w-sm rounded-3xl p-6 shadow-2xl border-2 animate-in zoom-in-95 duration-200 text-center"
                        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }}
                    >
                        {/* Close button in corner */}
                        <button
                            type="button"
                            onClick={() => {
                                if (modal.onCancel) modal.onCancel();
                                hideModal();
                            }}
                            className="absolute top-4 right-4 p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Icon Header */}
                        <div className="mx-auto mb-4 flex items-center justify-center">
                            {modal.type === "error" && (
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-sm shadow-rose-500/10">
                                    <AlertCircle className="w-7 h-7" />
                                </div>
                            )}
                            {modal.type === "warning" && (
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-sm shadow-amber-500/10">
                                    <AlertTriangle className="w-7 h-7" />
                                </div>
                            )}
                            {modal.type === "success" && (
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-sm shadow-emerald-500/10">
                                    <CheckCircle2 className="w-7 h-7" />
                                </div>
                            )}
                            {modal.type === "confirm" && (
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shadow-sm shadow-indigo-500/10">
                                    <HelpCircle className="w-7 h-7" />
                                </div>
                            )}
                            {(!modal.type || modal.type === "info") && (
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-sm shadow-blue-500/10">
                                    <Info className="w-7 h-7" />
                                </div>
                            )}
                        </div>

                        {/* Modal Title & Message */}
                        <h3 className="text-base font-black mb-1.5" style={{ color: "var(--text-primary)" }}>
                            {modal.title}
                        </h3>
                        <p className="text-xs mb-6 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                            {modal.message}
                        </p>

                        {/* Action Buttons */}
                        {modal.type === "confirm" ? (
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (modal.onCancel) modal.onCancel();
                                        hideModal();
                                    }}
                                    className="flex-1 py-2.5 rounded-xl text-xs font-black border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-400 transition cursor-pointer"
                                >
                                    {modal.cancelText || "Cancel"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (modal.onConfirm) modal.onConfirm();
                                        hideModal();
                                    }}
                                    className="flex-1 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-600/30 transition cursor-pointer active:scale-95"
                                >
                                    {modal.confirmText || "Confirm"}
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={hideModal}
                                className="w-full py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-600/20 transition cursor-pointer active:scale-95"
                            >
                                {modal.confirmText || "OK"}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </ModalContext.Provider>
    );
}

export function useModal() {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error("useModal must be used within a ModalProvider");
    }
    return context;
}
