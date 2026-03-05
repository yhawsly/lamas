"use client";
export default function HoDReportsPage() {
    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8"><h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Department Reports</h1><p className="mt-1" style={{ color: "var(--text-muted)" }}>Generate compliance reports for your department</p></div>
            <div className="grid grid-cols-1 gap-4">
                {[
                    { icon: "📊", title: "Department Compliance Report", desc: "Full compliance breakdown for all lecturers in your department", color: "var(--primary)" },
                    { icon: "👁️", title: "Observation Summary", desc: "All observations conducted and their outcomes", color: "var(--primary)" },
                    { icon: "📅", title: "Submission Timeline", desc: "Timeline of submissions relative to deadlines", color: "var(--primary)" },
                ].map(r => (
                    <div key={r.title} className="flex items-center justify-between p-5 rounded-2xl" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", color: "var(--primary)" }}>{r.icon}</div>
                            <div><div className="font-medium" style={{ color: "var(--text-primary)" }}>{r.title}</div><div className="text-sm" style={{ color: "var(--text-muted)" }}>{r.desc}</div></div>
                        </div>
                        <button className="px-4 py-2 rounded-xl text-sm transition shrink-0" style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }}>Generate</button>
                    </div>
                ))}
            </div>
            <p className="text-xs text-center mt-6" style={{ color: "var(--text-muted)" }}>PDF generation powered by Puppeteer. Reports will download when ready.</p>
        </div>
    );
}
