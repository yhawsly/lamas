"use client";

import React, { Component, ReactNode } from "react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Institutional Error Caught:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="flex flex-col items-center justify-center min-h-[450px] text-center p-8 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
                    <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-xl shadow-slate-100/50 dark:shadow-none flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-300">
                        {/* Professional Monochrome SVG Alert Icon */}
                        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30">
                            <svg 
                                className="w-8 h-8" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                viewBox="0 0 24 24" 
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                                />
                            </svg>
                        </div>
                        
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-2">
                                Institutional Circuit Breaker Triggered
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                An unexpected interface error has occurred. Please refresh the registry or contact the system administrator if the issue persists.
                            </p>
                        </div>

                        <button 
                            onClick={() => window.location.reload()}
                            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm tracking-wide transition-all shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer"
                        >
                            Re-initialize Registry
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
