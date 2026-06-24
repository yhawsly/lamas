"use client";

import { useState, useEffect } from "react";
import ExcelJS from "exceljs";
import html2pdf from "html2pdf.js";

export default function HODReportsPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
        const element = document.getElementById("report-table");
        if (!element) return;
        const opt = {
            margin: 1,
            filename: 'department-compliance-report.pdf',
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in' as const, format: 'letter', orientation: 'landscape' as const }
        };
        html2pdf().set(opt).from(element).save();
    };

    const exportExcel = async () => {
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
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading department data...</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Department Compliance Report</h1>
                    <p className="text-gray-500 text-sm mt-1">Review appraisal completion rates across your department.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={exportExcel} className="px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors">
                        Export Excel
                    </button>
                    <button onClick={exportPDF} className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors">
                        Export PDF
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden" id="report-table">
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Lecturer Status Overview</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                        <thead className="bg-gray-50/50 dark:bg-gray-900/20 text-xs uppercase text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-4 font-medium">Lecturer Name</th>
                                <th className="px-6 py-4 font-medium">Email</th>
                                <th className="px-6 py-4 font-medium">Peer Obs (Form A)</th>
                                <th className="px-6 py-4 font-medium">Teaching Obs (Form B)</th>
                                <th className="px-6 py-4 font-medium">Moderation (Form C)</th>
                                <th className="px-6 py-4 font-medium">Compliance Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {data.map(lecturer => (
                                <tr key={lecturer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{lecturer.name}</td>
                                    <td className="px-6 py-4">{lecturer.email}</td>
                                    <td className="px-6 py-4">{lecturer.stats.peerObservation}</td>
                                    <td className="px-6 py-4">{lecturer.stats.teachingObservation}</td>
                                    <td className="px-6 py-4">{lecturer.stats.moderation}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${lecturer.stats.complianceScore >= 80 ? 'bg-green-500' : lecturer.stats.complianceScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                    style={{ width: `${lecturer.stats.complianceScore}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium">{lecturer.stats.complianceScore}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        No active lecturers found in this department.
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
