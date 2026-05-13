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
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
                    <div className="text-6xl mb-6">⚠️</div>
                    <h2 className="text-2xl font-bold text-white mb-2">Institutional Circuit Breaker Triggered</h2>
                    <p className="text-sm text-slate-400 max-w-md">An unexpected interface error has occurred. Please refresh the registry or contact the system administrator if the issue persists.</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="mt-8 px-6 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all"
                    >
                        Re-initialize Registry
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
