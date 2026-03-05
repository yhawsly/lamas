"use client";

import { useEffect, useState } from "react";

interface ExportPDFButtonProps {
    targetRef: React.RefObject<HTMLElement | null>;
    filename?: string;
}

export default function ExportPDFButton({ targetRef, filename = "report.pdf" }: ExportPDFButtonProps) {
    const [loading, setLoading] = useState(false);
    const [html2pdf, setHtml2pdf] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Dynamic import to avoid SSR issues
        const loadLib = async () => {
            try {
                const mod = await import("html2pdf.js");
                // html2pdf.js has varied export patterns depending on the environment/bundler
                setHtml2pdf(() => mod);
            } catch (err) {
                console.error("Failed to load html2pdf:", err);
                setError("PDF library load failed");
            }
        };
        loadLib();
    }, []);

    const handleExport = async () => {
        const element = targetRef.current;
        if (!element) {
            console.error("Target element for PDF export not found.");
            setError("Export target not found");
            return;
        }

        if (!html2pdf) {
            setError("Library still loading...");
            return;
        }

        setLoading(true);
        setError(null);

        const opt = {
            margin: 10,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        try {
            // Find the actual function in the module object
            let exporter = html2pdf;
            if (typeof exporter !== 'function') {
                exporter = html2pdf.default || html2pdf;
            }
            if (typeof exporter !== 'function' && exporter.default) {
                exporter = exporter.default;
            }

            if (typeof exporter !== 'function') {
                // Last ditch effort: check if it's on window (common for UMD)
                exporter = (window as any).html2pdf;
            }

            if (typeof exporter !== 'function') {
                throw new Error(`PDF Export failed: Library is ${typeof exporter} instead of function`);
            }

            await exporter().from(element).set(opt).save();
        } catch (err: any) {
            console.error("PDF Export failed:", err);
            setError(`Export failed: ${err.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
            // Clear status after 3s
            setTimeout(() => setError(null), 3000);
        }
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <button
                onClick={handleExport}
                type="button"
                disabled={loading || !html2pdf}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg disabled:opacity-50"
                style={{
                    background: error ? "rgb(220, 38, 38)" : "rgb(37, 99, 235)",
                    color: "white",
                    boxShadow: error ? "0 0 16px rgba(220, 38, 38, 0.2)" : "0 0 16px rgba(37, 99, 235, 0.2)"
                }}
            >
                {loading ? (
                    <div className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: "white", borderTopColor: "transparent" }} />
                ) : (
                    <span>{error ? "⚠️" : "📄"}</span>
                )}
                {loading ? "Exporting..." : error ? "Try Again" : "Export to PDF"}
            </button>
            {error && (
                <span className="text-[10px] font-medium animate-in fade-in slide-in-from-top-1" style={{ color: "rgb(239, 68, 68)" }}>
                    {error}
                </span>
            )}
        </div>
    );
}
