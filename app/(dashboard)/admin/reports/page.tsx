"use client";
import { useState } from "react";

export default function AdminReportsPage() {
    const [generating, setGenerating] = useState(false);
    const [reports, setReports] = useState<{ type: string; generatedAt: string; note: string }[]>([]);
    const [type, setType] = useState("lecturer_summary");

    const descriptions: Record<string, string> = {
        lecturer_summary: "Per-lecturer compliance, submissions, and observation history",
        department_compliance: "Department-level ranking, average scores, and at-risk counts",
        audit_report: "Full activity log for the current academic semester",
    };

    async function generateReport() {
        setGenerating(true);
        await new Promise(r => setTimeout(r, 1800)); // Simulate async PDF generation
        setReports(p => [{
            type,
            generatedAt: new Date().toLocaleString(),
            note: "PDF generation requires Puppeteer server setup. Report queued successfully.",
        }, ...p]);
        setGenerating(false);
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Reports Centre</h1>
                <p className="mt-1" style={{ color: "var(--text-muted)" }}>Generate PDF and Excel compliance reports</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Generator */}
                <div className="rounded-2xl p-6" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                    <h3 className="font-semibold mb-5" style={{ color: "var(--text-primary)" }}>⚙️ Generate Report</h3>
                    <div className="space-y-4">
                        {Object.entries(descriptions).map(([key, desc]) => (
                            <button key={key} onClick={() => setType(key)}
                                className="w-full text-left p-4 rounded-xl border transition"
                                style={{
                                  backgroundColor: type === key ? "rgba(59, 130, 246, 0.1)" : "var(--bg-hover)",
                                  borderColor: type === key ? "rgba(59, 130, 246, 0.5)" : "var(--bg-border)",
                                  color: "var(--text-primary)"
                                }}>
                                <div className="font-medium capitalize">{key.replace(/_/g, " ")}</div>
                                <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{desc}</div>
                            </button>
                        ))}
                        <button onClick={generateReport} disabled={generating}
                            className="w-full py-3 rounded-xl text-white font-semibold text-sm transition disabled:opacity-50 mt-2"
                            style={{ backgroundColor: "var(--primary)" }}>
                            {generating ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Generating PDF...
                                </span>
                            ) : "📄 Generate Report"}
                        </button>
                    </div>
                </div>
                {/* Generated list */}
                <div className="rounded-2xl p-6" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                    <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>📁 Generated Reports</h3>
                    {reports.length === 0 ? (
                        <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
                            <div className="text-4xl mb-3">📄</div>
                            <p className="text-sm">No reports generated yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {reports.map((r, i) => (
                                <div key={i} className="p-4 rounded-xl" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)" }}>
                                    <div className="font-medium capitalize" style={{ color: "var(--text-primary)" }}>{r.type.replace(/_/g, " ")}</div>
                                    <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{r.generatedAt}</div>
                                    <div className="text-xs mt-2" style={{ color: "#f59e0b" }}>{r.note}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
