"use client";
export default function HoDReportsPage() {
    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8"><h1 className="text-3xl font-bold text-white">Department Reports</h1><p className="text-white/50 mt-1">Generate compliance reports for your department</p></div>
            <div className="grid grid-cols-1 gap-4">
                {[
                    { icon: "📊", title: "Department Compliance Report", desc: "Full compliance breakdown for all lecturers in your department", color: "from-amber-600 to-orange-600" },
                    { icon: "👁️", title: "Observation Summary", desc: "All observations conducted and their outcomes", color: "from-blue-600 to-indigo-600" },
                    { icon: "📅", title: "Submission Timeline", desc: "Timeline of submissions relative to deadlines", color: "from-green-600 to-emerald-600" },
                ].map(r => (
                    <div key={r.title} className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center text-xl`}>{r.icon}</div>
                            <div><div className="text-white font-medium">{r.title}</div><div className="text-white/40 text-sm">{r.desc}</div></div>
                        </div>
                        <button className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm transition shrink-0">Generate</button>
                    </div>
                ))}
            </div>
            <p className="text-white/20 text-xs text-center mt-6">PDF generation powered by Puppeteer. Reports will download when ready.</p>
        </div>
    );
}
