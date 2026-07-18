"use client";

import { useState } from "react";

interface ExportPDFButtonProps {
    targetRef?: React.RefObject<HTMLElement | null>;
    filename?: string;
}

export default function ExportPDFButton({ targetRef, filename = "report.pdf" }: ExportPDFButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleExport = () => {
        setLoading(true);
        try {
            window.print();
        } catch (err) {
            console.error("Print failed:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <button
                onClick={handleExport}
                type="button"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg disabled:opacity-50"
                style={{
                    background: "rgb(37, 99, 235)",
                    color: "white",
                    boxShadow: "0 0 16px rgba(37, 99, 235, 0.2)"
                }}
            >
                {loading ? (
                    <div className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: "white", borderTopColor: "transparent" }} />
                ) : (
                    <span>📄</span>
                )}
                {loading ? "Exporting..." : "Export to PDF"}
            </button>
        </div>
    );
}
