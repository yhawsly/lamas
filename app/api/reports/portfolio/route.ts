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

        // 3. Syllabus Velocity (Real data based on Registry Weeks)
        const weeklySubmissions = await prisma.submission.findMany({
            where: {
                type: { in: [SubmissionType.WEEKLY_TOPICS, SubmissionType.COURSE_TOPICS] },
                status: { in: [SubmissionStatus.SUBMITTED, SubmissionStatus.LATE] },
                ...(role === "LECTURER" ? { lecturerId: userId } : {}),
                ...(role === "HOD" ? { lecturer: { departmentId: deptId } } : {}),
                ...(termId ? { termId } : {})
            },
            select: { content: true }
        });

        const filledWeeks = new Set<number>();

        weeklySubmissions.forEach(s => {
            const content = s.content as any;
            if (content?.weeks && Array.isArray(content.weeks)) {
                content.weeks.forEach((w: any) => {
                    if (w.sessions && w.sessions.some((sess: any) => sess.topic?.trim())) {
                        filledWeeks.add(Number(w.week));
                    }
                });
            }
        });

        const velocity = [
            { week: 'Wk 1', planned: 100, actual: filledWeeks.has(1) ? 100 : 0 },
            { week: 'Wk 5', planned: 100, actual: Math.min(100, Math.round((Array.from(filledWeeks).filter(w => w <= 5).length / 5) * 100)) },
            { week: 'Wk 10', planned: 100, actual: Math.min(100, Math.round((Array.from(filledWeeks).filter(w => w <= 10).length / 10) * 100)) },
            { week: 'Wk 15', planned: 100, actual: Math.min(100, Math.round((Array.from(filledWeeks).filter(w => w <= 15).length / 15) * 100)) },
            { week: 'Wk 20', planned: 100, actual: Math.min(100, Math.round((Array.from(filledWeeks).filter(w => w <= 20).length / 20) * 100)) },
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

        // 6. Leadership & Metrics (for Final Compliance)
        let leaderboard: any[] = [];
        if (role !== "LECTURER") {
            const scores = await computeComplianceScores(role === "HOD" ? deptId : undefined);
            leaderboard = scores
                .sort((a, b) => b.score - a.score)
                .slice(0, 3)
                .map(s => ({ name: s.lecturerName, score: s.score }));
        }

        // 7. Expanded Lecturer Specific Metrics for Dossier
        let courseCount = 0;
        let invigilationCount = 0;
        let moderationCount = 0;

        if (role === "LECTURER") {
            courseCount = await prisma.courseSection.count({
                where: { lecturerId: userId, ...(termId ? { termId } : {}) }
            });

            invigilationCount = await prisma.examSessionInvigilation.count({
                where: {
                    ...(termId ? { termId } : {}),
                    OR: [
                        { chiefInvigilatorId: userId },
                        { assistantInvigilatorIds: { has: userId } }
                    ]
                }
            });

            moderationCount = await prisma.examModeration.count({
                where: {
                    ...(termId ? { termId } : {}),
                    OR: [
                        { moderatorId: userId },
                        { lecturerId: userId }
                    ]
                }
            });
        }

        const metrics = {
            outlines: weeklySubmissions.length, // approximation
            observations: observations.length,
            alerts: auditHistory.length,
            coursesTaught: courseCount,
            invigilations: invigilationCount,
            moderations: moderationCount,
            userProfile: session.user // To display Name, Email, Role on the Dossier Header
        };

        return NextResponse.json({
            stats: {
                compliance: complianceScore,
                activeTerm: activeTerm?.name ?? "No Active Term",
                institution: "HO Technical University",
            },
            radarData,
            velocity,
            auditHistory,
            auditArtifacts,
            leaderboard,
            metrics
        });
    } catch (error) {
        console.error("Portfolio Data Fetch Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
