import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { computeComplianceScores } from "@/lib/compliance";
import { SubmissionType, SubmissionStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = parseInt(session.user.id!);
        const role = (session.user as any).role;
        const deptId = (session.user as any).departmentId;

        const activeTerm = await prisma.academicTerm.findFirst({ where: { isActive: true } });
        const termId = activeTerm?.id;

        // 1. Compute Base Stats
        let complianceScore = 0;
        if (role === "LECTURER") {
            const scores = await computeComplianceScores(deptId);
            const myScore = scores.find(s => s.lecturerId === userId);
            complianceScore = myScore?.score ?? 0;
        } else {
            const scores = await computeComplianceScores(role === "HOD" ? deptId : undefined);
            complianceScore = scores.length > 0 
                ? Math.round(scores.reduce((a, b) => a + b.score, 0) / scores.length) 
                : 0;
        }

        // 2. Fetch Radar Data (Real aggregations from Observations)
        const obsWhere: any = {};
        if (role === "LECTURER") obsWhere.lecturerId = userId;
        else if (role === "HOD") obsWhere.lecturer = { departmentId: deptId };

        const observations = await prisma.observation.findMany({
            where: { ...obsWhere, status: { in: ["COMPLETED", "REVIEWED"] } }
        });

        const getAvg = (field: string) => {
            // Only count observations that actually have this rating filled in
            const rated = observations.filter(o => (o as any)[field] != null);
            if (rated.length === 0) return 0; // No data — don't fabricate a score
            const avg = rated.reduce((sum, o) => sum + (o as any)[field], 0) / rated.length;
            return Math.round((avg / 5) * 100); // Normalise 1–5 → 0–100
        };

        const hasRatings = observations.some(o =>
            (o as any).ratingEngagement != null ||
            (o as any).ratingKnowledge  != null
        );

        const radarData = hasRatings ? [
            { subject: 'Engagement',    A: getAvg('ratingEngagement'),    fullMark: 100 },
            { subject: 'Knowledge',     A: getAvg('ratingKnowledge'),     fullMark: 100 },
            { subject: 'Organization',  A: getAvg('ratingOrganization'),  fullMark: 100 },
            { subject: 'Activities',    A: getAvg('ratingActivities'),    fullMark: 100 },
            { subject: 'Technology',    A: getAvg('ratingTech'),          fullMark: 100 },
            { subject: 'Communication', A: getAvg('ratingCommunication'), fullMark: 100 },
        ] : null; // null signals "no rated observations yet" to the frontend

        // 3. Syllabus Velocity (Weekly Trends based on mandatory topic coverage)
        const weeklySubmissions = await prisma.submission.findMany({
            where: {
                type: SubmissionType.WEEKLY_TOPICS,
                status: { in: [SubmissionStatus.SUBMITTED, SubmissionStatus.LATE] },
                ...(role === "LECTURER" ? { lecturerId: userId } : {}),
                ...(role === "HOD" ? { lecturer: { departmentId: deptId } } : {}),
                ...(termId ? { termId } : {})
            },
            select: { content: true, createdAt: true }
        });

        // Simple velocity approximation: Proportion of expected weeks filled
        // In a more complex version, we'd cross-reference 'content' with MasterSyllabus here too.
        const velocity = [
            { week: 'Wk 1', planned: 100, actual: weeklySubmissions.length > 0 ? 100 : 0 },
            { week: 'Wk 5', planned: 100, actual: Math.min(100, Math.round((weeklySubmissions.length / 5) * 100)) },
            { week: 'Wk 10', planned: 100, actual: Math.min(100, Math.round((weeklySubmissions.length / 10) * 100)) },
            { week: 'Wk 15', planned: 100, actual: Math.min(100, Math.round((weeklySubmissions.length / 15) * 100)) },
            { week: 'Wk 20', planned: 100, actual: Math.min(100, Math.round((weeklySubmissions.length / 20) * 100)) },
        ];

        // 4. Audit Trail
        const auditHistory = await prisma.activityLog.findMany({
            where: {
                ...(role === "LECTURER" ? { userId } : {}),
                ...(role === "HOD" ? { user: { departmentId: deptId } } : {}),
            },
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { action: true, createdAt: true, detail: true }
        });

        // 5. Dynamic Audit Artifacts
        const auditArtifacts = activeTerm ? [
            { 
                title: "Pre-Cycle Audit", 
                desc: "Course Outline Verification", 
                date: new Date(activeTerm.startDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }), 
                icon: "🛡️" 
            },
            { 
                title: "Mid-Term Review", 
                desc: "Observational Consistency", 
                date: new Date(activeTerm.startDate.getTime() + (activeTerm.endDate.getTime() - activeTerm.startDate.getTime()) / 2).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }), 
                icon: "👁️" 
            },
            { 
                title: "Final Compliance", 
                desc: "Institutional Alignment", 
                date: new Date(activeTerm.endDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }), 
                icon: "✅" 
            }
        ] : [
            { title: "Pre-Cycle Audit", desc: "No Active Term", date: "---", icon: "🛡️" },
            { title: "Mid-Term Review", desc: "No Active Term", date: "---", icon: "👁️" },
            { title: "Final Compliance", desc: "No Active Term", date: "---", icon: "✅" }
        ];

        return NextResponse.json({
            stats: {
                compliance: complianceScore,
                activeTerm: activeTerm?.name ?? "No Active Term",
                institution: "HO University of Technology",
            },
            radarData,
            velocity,
            auditHistory,
            auditArtifacts
        });
    } catch (error) {
        console.error("Portfolio Data Fetch Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
