"use client";

import { useState, useEffect } from "react";
import { FileText, Download, Table2, Users, AlertCircle } from "lucide-react";

const ReportsSkeleton = () => (
    <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
                <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                <div className="h-4 w-96 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
            <div className="flex items-center gap-3 shrink-0">
                <div className="h-11 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                <div className="h-11 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            </div>
        </div>

        <div className="rounded-3xl border overflow-hidden shadow-sm" style={{ borderColor: "var(--bg-border)", backgroundColor: "var(--bg-surface)" }}>
            <div className="px-6 py-5 border-b" style={{ borderColor: "var(--bg-border)" }}>
                <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead style={{ backgroundColor: "var(--bg-hover)" }}>
                        <tr>
                            <th className="px-6 py-4"><div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" /></th>
                            <th className="px-6 py-4"><div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded" /></th>
                            <th className="px-6 py-4"><div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded" /></th>
                            <th className="px-6 py-4"><div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded" /></th>
                            <th className="px-6 py-4 text-right"><div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded ml-auto" /></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--bg-border)]">
                        {[1, 2, 3, 4, 5].map(i => (
                            <tr key={i}>
                                <td className="px-6 py-4">
                                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-1" />
                                    <div className="h-3 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
                                </td>
                                <td className="px-6 py-4"><div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                                <td className="px-6 py-4"><div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                                <td className="px-6 py-4"><div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-3">
                                        <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                        <div className="h-4 w-8 bg-slate-200 dark:bg-slate-800 rounded" />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
);

export default function HODReportsPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        fetch("/api/reports/department-summary")
            .then(res => res.json())
            .then(res => {
                if (res.data) setData(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const exportPDF = () => {
        window.print();
    };

    const exportExcel = async () => {
        setExporting(true);
        try {
            const ExcelJS = (await import("exceljs")).default;
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Compliance Report");

            worksheet.columns = [
                { header: 'Lecturer Name', key: 'name', width: 30 },
                { header: 'Email', key: 'email', width: 30 },
                { header: 'Peer Obs. (Form A)', key: 'peer', width: 20 },
                { header: 'Teaching Obs. (Form B)', key: 'teach', width: 25 },
                { header: 'Moderation (Form C)', key: 'mod', width: 25 },
                { header: 'Overall Compliance %', key: 'score', width: 20 },
            ];

            data.forEach(lecturer => {
                worksheet.addRow({
                    name: lecturer.name,
                    email: lecturer.email,
                    peer: lecturer.stats.peerObservation,
                    teach: lecturer.stats.teachingObservation,
                    mod: lecturer.stats.moderation,
                    score: lecturer.stats.complianceScore + "%"
                });
            });

            // Styling
            worksheet.getRow(1).font = { bold: true };
            
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'department-compliance-report.xlsx';
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Excel export failed:", err);
        } finally {
            setExporting(false);
        }
    };

    if (loading) return <ReportsSkeleton />;

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #report-table, #report-table * {
                        visibility: visible;
                    }
                    #report-table {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        border: none;
                        box-shadow: none;
                    }
                }
            `}</style>
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3" style={{ color: "var(--text-primary)" }}>
                        <FileText className="w-8 h-8 text-emerald-500" /> Department Compliance Report
                    </h1>
                    <p className="text-sm print:hidden" style={{ color: "var(--text-muted)" }}>
                        Review and export appraisal completion rates across your department.
                    </p>
                </div>
                <div className="flex items-center gap-3 print:hidden">
                    <button onClick={exportExcel} disabled={exporting} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 text-sm font-bold transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-wait">
                        {exporting ? <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /> : <Table2 className="w-4 h-4" />}
                        {exporting ? "Exporting…" : "Export Excel"}
                    </button>
                    <button onClick={exportPDF} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 text-sm font-bold transition-all shadow-sm active:scale-[0.98]">
                        <Download className="w-4 h-4" /> Export PDF
                    </button>
                </div>
            </div>

            <div className="rounded-3xl border overflow-hidden shadow-sm transition-all" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--bg-border)" }} id="report-table">
                <div className="px-6 py-5 border-b" style={{ borderColor: "var(--bg-border)" }}>
                    <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                        <Users className="w-5 h-5 text-blue-500" /> Lecturer Status Overview
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="text-[10px] uppercase tracking-widest font-bold" style={{ backgroundColor: "var(--bg-hover)", color: "var(--text-muted)" }}>
                            <tr>
                                <th className="px-6 py-4">Lecturer</th>
                                <th className="px-6 py-4">Peer Obs (Form A)</th>
                                <th className="px-6 py-4">Teaching Obs (Form B)</th>
                                <th className="px-6 py-4">Moderation (Form C)</th>
                                <th className="px-6 py-4 text-right">Compliance Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--bg-border)]">
                            {data.map(lecturer => (
                                <tr key={lecturer.id} className="transition-colors group" style={{ color: "var(--text-primary)" }}>
                                    <td className="px-6 py-4">
                                        <div className="font-bold">{lecturer.name}</div>
                                        <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>{lecturer.email}</div>
                                    </td>
                                    <td className="px-6 py-4 font-medium">{lecturer.stats.peerObservation}</td>
                                    <td className="px-6 py-4 font-medium">{lecturer.stats.teachingObservation}</td>
                                    <td className="px-6 py-4 font-medium">{lecturer.stats.moderation}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-3">
                                            <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-border)" }}>
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-1000 ${lecturer.stats.complianceScore >= 80 ? 'bg-emerald-500' : lecturer.stats.complianceScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                    style={{ width: `${lecturer.stats.complianceScore}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-black" style={{ color: lecturer.stats.complianceScore >= 80 ? "#10b981" : lecturer.stats.complianceScore >= 50 ? "#f59e0b" : "#f43f5e" }}>
                                                {lecturer.stats.complianceScore}%
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {data.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex justify-center mb-4">
                                            <AlertCircle className="w-10 h-10 text-slate-300 dark:text-white/10" />
                                        </div>
                                        <p className="font-semibold text-lg mb-1" style={{ color: "var(--text-primary)" }}>No Data Available</p>
                                        <p className="text-sm" style={{ color: "var(--text-muted)" }}>There are no active lecturers with compliance records in your department yet.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
