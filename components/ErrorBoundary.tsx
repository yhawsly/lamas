"use client";

import { ReactNode, useEffect } from "react";

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: string) => void;
}

export default function ErrorBoundary({ children, fallback, onError }: ErrorBoundaryProps) {
    useEffect(() => {
        const handleError = (event: ErrorEvent) => {
            console.error("Error caught by boundary:", event.error);
            onError?.(event.error, event.message);
        };

        const handleRejection = (event: PromiseRejectionEvent) => {
            console.error("Unhandled rejection caught by boundary:", event.reason);
            onError?.(new Error(String(event.reason)), "Unhandled Promise Rejection");
        };

        window.addEventListener("error", handleError);
        window.addEventListener("unhandledrejection", handleRejection);

        return () => {
            window.removeEventListener("error", handleError);
            window.removeEventListener("unhandledrejection", handleRejection);
        };
    }, [onError]);

    return (
        <>
            {fallback ?? children}
        </>
    );
}
