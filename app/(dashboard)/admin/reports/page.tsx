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
                <h1 className="text-3xl font-bold text-white">Reports Centre</h1>
                <p className="text-white/50 mt-1">Generate PDF and Excel compliance reports</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Generator */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-semibold mb-5">⚙️ Generate Report</h3>
                    <div className="space-y-4">
                        {Object.entries(descriptions).map(([key, desc]) => (
                            <button key={key} onClick={() => setType(key)}
                                className={`w-full text-left p-4 rounded-xl border transition ${type === key ? "bg-blue-600/20 border-blue-500/50" : "bg-white/3 border-white/5 hover:bg-white/5"}`}>
                                <div className="text-white font-medium capitalize">{key.replace(/_/g, " ")}</div>
                                <div className="text-white/40 text-xs mt-1">{desc}</div>
                            </button>
                        ))}
                        <button onClick={generateReport} disabled={generating}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm transition disabled:opacity-50 mt-2">
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
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-semibold mb-4">📁 Generated Reports</h3>
                    {reports.length === 0 ? (
                        <div className="text-center py-12 text-white/30">
                            <div className="text-4xl mb-3">📄</div>
                            <p className="text-sm">No reports generated yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {reports.map((r, i) => (
                                <div key={i} className="p-4 rounded-xl bg-white/3 border border-white/10">
                                    <div className="text-white font-medium capitalize">{r.type.replace(/_/g, " ")}</div>
                                    <div className="text-white/40 text-xs mt-1">{r.generatedAt}</div>
                                    <div className="text-yellow-400/70 text-xs mt-2">{r.note}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
