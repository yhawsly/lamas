import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { computeComplianceScores } from "@/features/submissions/server";
import { SubmissionType, SubmissionStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = parseInt(session.user.id!);
        const role = (session.user as any).role;
        const deptId = (session.user as any).departmentId;

        const url = new URL(req.url);
        const termIdParam = url.searchParams.get("termId");

        let currentTerm = null;
        if (termIdParam) {
            const parsedTermId = parseInt(termIdParam);
            if (!isNaN(parsedTermId)) {
                currentTerm = await prisma.academicTerm.findUnique({ where: { id: parsedTermId } });
            }
        }
        if (!currentTerm) {
            currentTerm = await prisma.academicTerm.findFirst({ where: { isActive: true } });
        }
        const termId = currentTerm?.id;

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

        // 2. Fetch Radar Data (Real aggregations from Observations & Teaching Observations)
        const obsWhere: any = {};
        if (role === "LECTURER") obsWhere.lecturerId = userId;
        else if (role === "HOD" && deptId) obsWhere.lecturer = { departmentId: deptId };
        if (termId) obsWhere.termId = termId;

        const [formAObservations, formBObservations] = await Promise.all([
            prisma.observation.findMany({
                where: { ...obsWhere, status: { in: ["COMPLETED", "REVIEWED"] } },
                select: { reviewData: true, feedback: true, status: true }
            }),
            prisma.teachingObservation.findMany({
                where: { ...obsWhere, status: { in: ["COMPLETED", "REVIEWED"] } },
                select: { formBData: true, status: true }
            })
        ]);

        const scoresMap: Record<string, number[]> = {
            Knowledge: [],
            Engagement: [],
            Organization: [],
            Delivery: [],
            Activities: [],
            Technology: []
        };

        // Extract ratings from Form B (Classroom Teaching Observation)
        formBObservations.forEach(o => {
            const data = o.formBData as any;
            if (!data?.criteria) return;
            const c = data.criteria;

            if (c.contentKnowledge) {
                const kVals = [
                    c.contentKnowledge.knowledgeable,
                    c.contentKnowledge.deliveredClearly,
                    c.contentKnowledge.connectedRealLife,
                    c.contentKnowledge.respondedQuestions
                ].filter((v): v is number => typeof v === "number");
                if (kVals.length > 0) scoresMap.Knowledge.push(...kVals);

                if (typeof c.contentKnowledge.usedRelevantMaterials === "number") {
                    scoresMap.Technology.push(c.contentKnowledge.usedRelevantMaterials);
                }
            }

            if (c.delivery) {
                const engVals = [
                    c.delivery.sustainedAttention,
                    c.delivery.allowedQuestions,
                    c.delivery.allowedContributions,
                    c.delivery.movementEquitable
                ].filter((v): v is number => typeof v === "number");
                if (engVals.length > 0) scoresMap.Engagement.push(...engVals);

                const delVals = [
                    c.delivery.audible,
                    c.delivery.deliveryEthical,
                    c.delivery.modeAppropriate,
                    c.delivery.paceAppropriate
                ].filter((v): v is number => typeof v === "number");
                if (delVals.length > 0) scoresMap.Delivery.push(...delVals);
            }

            if (c.startOfLesson) {
                const orgVals = [
                    c.startOfLesson.punctual,
                    c.startOfLesson.suitablyDressed,
                    c.startOfLesson.reviewedPrevious,
                    c.startOfLesson.explainedObjectives,
                    c.startOfLesson.rapport
                ].filter((v): v is number => typeof v === "number");
                if (orgVals.length > 0) scoresMap.Organization.push(...orgVals);
            }

            if (c.conclusion) {
                const actVals = [
                    c.conclusion.gaveAssignment,
                    c.conclusion.encouragedExploration,
                    c.conclusion.summarizedSatisfactorily
                ].filter((v): v is number => typeof v === "number");
                if (actVals.length > 0) scoresMap.Activities.push(...actVals);
            }
        });

        // Extract ratings from Form A (Course Material Review)
        formAObservations.forEach(o => {
            const data = o.reviewData as any;
            if (!data?.criteria) return;
            const c = data.criteria;

            if (c.courseOutline) {
                const outlineVals = [
                    c.courseOutline.objSpecific,
                    c.courseOutline.descConforms,
                    c.courseOutline.formatConforms,
                    c.courseOutline.topicsRelevant,
                    c.courseOutline.outcomesAchievable
                ].filter((v): v is number => typeof v === "number");
                if (outlineVals.length > 0) scoresMap.Organization.push(...outlineVals);
            }

            if (c.lectureNotes) {
                const noteVals = [
                    c.lectureNotes.clear,
                    c.lectureNotes.concise,
                    c.lectureNotes.wellOrganized,
                    c.lectureNotes.linkedToContent
                ].filter((v): v is number => typeof v === "number");
                if (noteVals.length > 0) scoresMap.Delivery.push(...noteVals);
            }

            if (c.mainTextbook) {
                const bookVals = [
                    c.mainTextbook.isCurrent,
                    c.mainTextbook.isAccessible,
                    c.mainTextbook.coversContent
                ].filter((v): v is number => typeof v === "number");
                if (bookVals.length > 0) scoresMap.Knowledge.push(...bookVals);
            }

            if (c.otherTLMs) {
                const tlmVals = [
                    c.otherTLMs.relevant,
                    c.otherTLMs.suitable
                ].filter((v): v is number => typeof v === "number");
                if (tlmVals.length > 0) scoresMap.Technology.push(...tlmVals);
            }
        });

        const calcDimensionAvg = (key: string) => {
            const arr = scoresMap[key] || [];
            if (arr.length === 0) return 0;
            const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
            return Math.min(100, Math.max(10, Math.round((avg / 5) * 100)));
        };

        const totalRatingCount = Object.values(scoresMap).reduce((sum, arr) => sum + arr.length, 0);

        const radarData = totalRatingCount > 0 ? [
            { subject: 'Engagement',    A: calcDimensionAvg('Engagement'),    fullMark: 100 },
            { subject: 'Knowledge',     A: calcDimensionAvg('Knowledge'),     fullMark: 100 },
            { subject: 'Organization',  A: calcDimensionAvg('Organization'),  fullMark: 100 },
            { subject: 'Delivery',      A: calcDimensionAvg('Delivery'),      fullMark: 100 },
            { subject: 'Activities',    A: calcDimensionAvg('Activities'),    fullMark: 100 },
            { subject: 'Technology',    A: calcDimensionAvg('Technology'),    fullMark: 100 },
        ] : null;

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
        const auditArtifacts = currentTerm ? [
            { 
                title: "Pre-Cycle Audit", 
                desc: "Course Outline Verification", 
                date: new Date(currentTerm.startDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }), 
                iconType: "SHIELD" 
            },
            { 
                title: "Mid-Term Review", 
                desc: "Observational Consistency", 
                date: new Date(new Date(currentTerm.startDate).getTime() + (new Date(currentTerm.endDate).getTime() - new Date(currentTerm.startDate).getTime()) / 2).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }), 
                iconType: "EYE" 
            },
            { 
                title: "Final Compliance", 
                desc: "Institutional Alignment", 
                date: new Date(currentTerm.endDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }), 
                iconType: "CHECK" 
            }
        ] : [
            { title: "Pre-Cycle Audit", desc: "No Active Term", date: "---", iconType: "SHIELD" },
            { title: "Mid-Term Review", desc: "No Active Term", date: "---", iconType: "EYE" },
            { title: "Final Compliance", desc: "No Active Term", date: "---", iconType: "CHECK" }
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

        // 7. Expanded Metrics for Dossier
        const assignedSections = await prisma.courseSection.findMany({
            where: { lecturerId: userId, ...(termId ? { termId } : {}) },
            select: { courseId: true }
        });
        const distinctCourseIds = Array.from(new Set(assignedSections.map(s => s.courseId)));
        const courseCount = distinctCourseIds.length;

        const resourceCount = await prisma.resource.count({
            where: { lecturerId: userId }
        });

        const moderationCount = await prisma.examModeration.count({
            where: {
                ...(termId ? { termId } : {}),
                OR: [
                    { moderatorId: userId },
                    { lecturerId: userId }
                ]
            }
        });

        // 8. End of Semester Clearance — computed from live database records
        // ── Clearance Item 1: Course Syllabuses / Outlines ──
        const totalCourses = distinctCourseIds.length;
        const outlineSubmissions = await prisma.submission.findMany({
            where: {
                lecturerId: userId,
                type: { in: [SubmissionType.COURSE_TOPICS, SubmissionType.WEEKLY_TOPICS] },
                status: { in: [SubmissionStatus.SUBMITTED, SubmissionStatus.LATE, SubmissionStatus.APPROVED, SubmissionStatus.REVIEWED] },
                ...(termId ? { termId } : {}),
            },
            select: { content: true }
        });

        const coveredCourseIds = new Set<number>();
        outlineSubmissions.forEach(sub => {
            const parsed: any = typeof sub.content === "string" ? JSON.parse(sub.content) : sub.content;
            if (parsed?.courseId) {
                coveredCourseIds.add(Number(parsed.courseId));
            }
        });

        const distinctCoveredCourses = distinctCourseIds.filter(id => coveredCourseIds.has(id)).length;
        const syllabusSubmitted = Math.min(totalCourses, Math.max(distinctCoveredCourses, outlineSubmissions.length));
        const pendingSyllabus = totalCourses - syllabusSubmitted;

        const syllabusesDone = totalCourses > 0 ? syllabusSubmitted >= totalCourses : true;
        const syllabusesDetail = totalCourses === 0
            ? "No courses assigned this term"
            : syllabusSubmitted >= totalCourses
            ? `All ${totalCourses} course outlines submitted (covers all assigned classes)`
            : `${syllabusSubmitted} of ${totalCourses} course outlines submitted (${pendingSyllabus} pending)`;

        // ── Clearance Item 2: Teaching Observations ──
        const totalObs = await prisma.teachingObservation.count({
            where: { lecturerId: userId, ...(termId ? { termId } : {}) }
        });
        const completedObs = await prisma.teachingObservation.count({
            where: {
                lecturerId: userId,
                status: { in: ["COMPLETED", "REVIEWED"] },
                ...(termId ? { termId } : {})
            }
        });
        const pendingObs = totalObs - completedObs;
        const obsDone = totalObs > 0 ? completedObs >= totalObs : true;
        const obsDetail = totalObs === 0
            ? "No observations scheduled"
            : completedObs >= totalObs
            ? `All ${totalObs} observations completed`
            : `${completedObs} of ${totalObs} observations completed (${pendingObs} pending)`;

        // ── Clearance Item 3: Exam Moderations ──
        const totalMods = moderationCount;
        const finalizedMods = await prisma.examModeration.count({
            where: {
                status: { in: ["COMPLETED", "REVIEWED"] },
                ...(termId ? { termId } : {}),
                OR: [
                    { moderatorId: userId },
                    { lecturerId: userId }
                ]
            }
        });
        const pendingMods = totalMods - finalizedMods;
        const modsDone = totalMods > 0 ? finalizedMods >= totalMods : true;
        const modsDetail = totalMods === 0
            ? "No moderation duties assigned"
            : finalizedMods >= totalMods
            ? `All ${totalMods} exams moderated`
            : `${finalizedMods} of ${totalMods} exams moderated (${pendingMods} pending)`;

        const clearance = {
            syllabuses: { done: syllabusesDone, submitted: syllabusSubmitted, total: totalCourses, detail: syllabusesDetail },
            observations: { done: obsDone, completed: completedObs, total: totalObs, detail: obsDetail },
            moderations: { done: modsDone, finalized: finalizedMods, total: totalMods, detail: modsDetail },
        };

        const metrics = {
            outlines: weeklySubmissions.length,
            observations: formAObservations.length + formBObservations.length,
            alerts: auditHistory.length,
            coursesTaught: courseCount,
            resources: resourceCount,
            moderations: moderationCount,
            userProfile: session.user
        };

        return NextResponse.json({
            stats: {
                compliance: complianceScore,
                activeTerm: currentTerm?.name ?? "No Active Term",
                institution: "HO Technical University",
            },
            radarData,
            velocity,
            auditHistory,
            auditArtifacts,
            leaderboard,
            metrics,
            clearance,
        });
    } catch (error) {
        console.error("Portfolio Data Fetch Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

