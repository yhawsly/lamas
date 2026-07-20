"use client";

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";

interface AdminDashboardChartsProps {
    data: {
        scores: any[];
        heatmap: any[];
        trend: any[];
    };
    type: "pie" | "bar" | "line";
}

export default function AdminDashboardCharts({ data, type }: AdminDashboardChartsProps) {
    if (type === "pie") {
        return (
            <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                    <Pie data={[
                        { name: "Excellent (90-100%)", value: data.scores.filter(s => s.score >= 90).length },
                        { name: "Good (70-89%)", value: data.scores.filter(s => s.score >= 70 && s.score < 90).length },
                        { name: "At Risk (<70%)", value: data.scores.filter(s => s.score < 70).length },
                    ]} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ value }) => `${value}`}>
                        {[0, 1, 2].map(i => <Cell key={i} fill={["#10b981", "#3b82f6", "#ef4444"][i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)", borderRadius: "8px", color: "var(--text-primary)" }} />
                    <Legend formatter={(v) => <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{v}</span>} />
                </PieChart>
            </ResponsiveContainer>
        );
    }

    if (type === "bar") {
        return (
            <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.heatmap} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" />
                    <XAxis dataKey="department" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
                    <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)", borderRadius: "8px", color: "var(--text-primary)" }} />
                    <Bar dataKey="SEMESTER_CALENDAR" name="Calendar" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="COURSE_TOPICS" name="Topics" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="OBSERVATION_REPORT" name="Observation" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Legend formatter={(v) => <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{v}</span>} />
                </BarChart>
            </ResponsiveContainer>
        );
    }

    if (type === "line") {
        return (
            <ResponsiveContainer width="100%" height={320}>
                <LineChart data={data.trend} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" />
                    <XAxis dataKey="month" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
                    <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)", borderRadius: "8px", color: "var(--text-primary)" }} />
                    <Legend formatter={(v) => <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{v}</span>} />
                    <Line type="monotone" dataKey="submitted" name="On Time" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981" }} />
                    <Line type="monotone" dataKey="late" name="Late" stroke="#ef4444" strokeWidth={2} dot={{ fill: "#ef4444" }} />
                </LineChart>
            </ResponsiveContainer>
        );
    }

    return null;
}
