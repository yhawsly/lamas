"use client";

import { useEffect, useRef, useState } from "react";

interface ExportPDFButtonProps {
    targetRef: React.RefObject<HTMLElement | null>;
    filename?: string;
}

export default function ExportPDFButton({ targetRef, filename = "report.pdf" }: ExportPDFButtonProps) {
    const [loading, setLoading] = useState(false);
    const [html2pdf, setHtml2pdf] = useState<any>(null);

    useEffect(() => {
        // Dynamic import to avoid SSR issues
        import("html2pdf.js").then((mod) => {
            setHtml2pdf(mod.default || mod);
        });
    }, []);

    const handleExport = async () => {
        if (!targetRef.current || !html2pdf) return;

        setLoading(true);
        const element = targetRef.current;
        const opt = {
            margin: 10,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, backgroundColor: '#0f172a' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        try {
            await html2pdf().from(element).set(opt).save();
        } catch (error) {
            console.error("PDF Export failed:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={loading || !html2pdf}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
        >
            {loading ? (
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                <span>📄</span>
            )}
            {loading ? "Exporting..." : "Export to PDF"}
        </button>
    );
}
