import { prisma } from "@/lib/prisma";
import { SubmissionStatus, SubmissionType } from "@prisma/client";

export interface ComplianceScore {
    lecturerId: number;
    lecturerName: string;
    email: string;
    department: string;
    score: number;
    totalRequired: number;
    fulfilledDeadlines: number;
    submitted: number;
    late: number;
    missing: number;
    isAtRisk: boolean;
}

export async function computeComplianceScores(
    departmentId?: number,
    termId?: number
): Promise<ComplianceScore[]> {
    const { checkAndGetActiveTerm } = await import("@/lib/active-term");
    const activeTerm = await checkAndGetActiveTerm();
    const activeTermId = termId ?? activeTerm?.id;
    const currentTermId = activeTermId;

    const whereClause: any = { isActive: true, role: { in: ["LECTURER", "HOD"] } };
    if (departmentId) {
        whereClause.departmentId = Number(departmentId);
        // For HOD views, we typically only want to see the LECTURERs they manage
        whereClause.role = "LECTURER";
    }
    console.log(`[Compliance] Final WhereClause:`, JSON.stringify(whereClause));


    const lecturers = await prisma.user.findMany({
        where: whereClause,
        include: {
            submissions: { 
                where: currentTermId ? { termId: currentTermId } : {},
                include: { deadline: true } 
            },
            observedBy: {
                where: currentTermId ? { termId: currentTermId } : {}
            },
            teachingObserved: {
                where: currentTermId ? { termId: currentTermId } : {}
            },
            department: true,
        },
    });

    console.log(`[Compliance] Dept: ${departmentId}, Found: ${lecturers.length} lecturers`);


    const now = new Date();
    const termDeadlines = await prisma.deadline.findMany({
        where: currentTermId ? { termId: currentTermId } : {},
        orderBy: { dueDate: "asc" }
    });

    const pastDeadlines = termDeadlines.filter(d => d.dueDate <= now);
    const evaluatedDeadlines = pastDeadlines.length > 0 ? pastDeadlines : termDeadlines;
    const totalRequired = evaluatedDeadlines.length;

    const onTimeStatuses: SubmissionStatus[] = [
        SubmissionStatus.SUBMITTED,
        SubmissionStatus.APPROVED,
        SubmissionStatus.REVIEWED,
    ];

    return lecturers.map((l) => {
        let fulfilledOnTime = 0;
        let fulfilledLate = 0;

        for (const d of evaluatedDeadlines) {
            let hasOnTime = false;
            let hasLate = false;

            if (d.type === "OBSERVATION_REPORT" || (d.type as any) === "OBSERVATION") {
                const hasObs = (l.observedBy && l.observedBy.some(o => o.status === "COMPLETED" || o.status === "REVIEWED")) ||
                               (l.teachingObserved && l.teachingObserved.some(o => o.status === "COMPLETED" || o.status === "REVIEWED"));
                if (hasObs) hasOnTime = true;
            } else {
                const subsForDeadline = l.submissions.filter(
                    s => s.deadlineId === d.id || 
                         (s.type === d.type && s.termId === d.termId) ||
                         (s.type === SubmissionType.COURSE_TOPICS && (d.type === SubmissionType.COURSE_TOPICS || d.type === SubmissionType.WEEKLY_TOPICS || (d.type as any) === "SEMESTER_CALENDAR"))
                );
                hasOnTime = subsForDeadline.some(s => onTimeStatuses.includes(s.status));
                hasLate = subsForDeadline.some(s => s.status === SubmissionStatus.LATE);
            }

            if (hasOnTime) {
                fulfilledOnTime++;
            } else if (hasLate) {
                fulfilledLate++;
            }
        }

        const totalSubmittedSubs = l.submissions.filter(s =>
            onTimeStatuses.includes(s.status) || s.status === SubmissionStatus.LATE
        ).length;
        const totalLateSubs = l.submissions.filter(s => s.status === SubmissionStatus.LATE).length;
        const fulfilledDeadlines = Math.min(totalRequired, fulfilledOnTime + fulfilledLate);

        const missing = Math.max(0, totalRequired - (fulfilledOnTime + fulfilledLate));

        // Score is based on on-time deadline fulfillment percentage, strictly clamped to [0, 100]
        const score = totalRequired > 0
            ? Math.min(100, Math.max(0, Math.round((fulfilledOnTime / totalRequired) * 100)))
            : 100;

        const isAtRisk =
            score < 70 ||
            l.submissions.some(
                (s) =>
                    s.deadline &&
                    s.deadline.dueDate < now &&
                    (s.status === SubmissionStatus.PENDING || s.status === SubmissionStatus.DRAFT || s.status === SubmissionStatus.REJECTED)
            );

        return {
            lecturerId: l.id,
            lecturerName: l.name,
            email: l.email,
            department: l.department?.name ?? "N/A",
            score,
            totalRequired,
            fulfilledDeadlines,
            submitted: totalSubmittedSubs,
            late: totalLateSubs,
            missing,
            isAtRisk,
        };
    });
}

export async function getDepartmentHeatmap(termId?: number, departmentId?: number) {
    const departments = await prisma.department.findMany({
        where: departmentId ? { id: departmentId } : {},
        include: { users: { where: { role: { in: ["LECTURER", "HOD"] }, isActive: true } } },
    });

    return Promise.all(
        departments.map(async (dept) => {
            const lecturerIds = dept.users.map((u) => u.id);
            const heatRow: Record<string, number | string | any> = { departmentId: dept.id };
            heatRow.department = dept.name;
            const totalLecturers = lecturerIds.length;

            if (totalLecturers === 0) {
                heatRow["COURSE_TOPICS"] = 0;
                heatRow["OBSERVATIONS"] = 0;
                heatRow["OBSERVATION_REPORT"] = 0;
                heatRow["RESOURCES"] = 0;
                heatRow["SEMESTER_CALENDAR"] = 0;
                return heatRow;
            }

            // 1. Course Syllabi & Topics
            const distinctSyllabusSubmissions = await prisma.submission.findMany({
                where: {
                    lecturerId: { in: lecturerIds },
                    type: { in: [SubmissionType.COURSE_TOPICS, SubmissionType.WEEKLY_TOPICS] },
                    status: { in: [SubmissionStatus.SUBMITTED, SubmissionStatus.LATE, SubmissionStatus.APPROVED, SubmissionStatus.REVIEWED] },
                    ...(termId ? { termId } : {}),
                },
                select: { lecturerId: true },
                distinct: ['lecturerId'],
            });
            const topicsRate = Math.min(100, Math.round((distinctSyllabusSubmissions.length / totalLecturers) * 100));
            heatRow["COURSE_TOPICS"] = topicsRate;

            // 2. Observations & Appraisals (Form A & Form B peer observations)
            const [completedFormA, completedFormB] = await Promise.all([
                prisma.observation.findMany({
                    where: {
                        OR: [
                            { lecturerId: { in: lecturerIds } },
                            { observerId: { in: lecturerIds } }
                        ],
                        status: { in: ["COMPLETED", "REVIEWED"] },
                        ...(termId ? { termId } : {}),
                    },
                    select: { lecturerId: true, observerId: true },
                }),
                prisma.teachingObservation.findMany({
                    where: {
                        OR: [
                            { lecturerId: { in: lecturerIds } },
                            { observerId: { in: lecturerIds } }
                        ],
                        status: { in: ["COMPLETED", "REVIEWED"] },
                        ...(termId ? { termId } : {}),
                    },
                    select: { lecturerId: true, observerId: true },
                })
            ]);
            const observedLecturers = new Set<number>();
            completedFormA.forEach(o => {
                if (lecturerIds.includes(o.lecturerId)) observedLecturers.add(o.lecturerId);
                if (lecturerIds.includes(o.observerId)) observedLecturers.add(o.observerId);
            });
            completedFormB.forEach(o => {
                if (lecturerIds.includes(o.lecturerId)) observedLecturers.add(o.lecturerId);
                if (lecturerIds.includes(o.observerId)) observedLecturers.add(o.observerId);
            });
            const observationRate = Math.min(100, Math.round((observedLecturers.size / totalLecturers) * 100));
            heatRow["OBSERVATIONS"] = observationRate;
            heatRow["OBSERVATION_REPORT"] = observationRate;

            // 3. Educational Resources
            const distinctResourceUploaders = await prisma.resource.findMany({
                where: {
                    lecturerId: { in: lecturerIds },
                },
                select: { lecturerId: true },
                distinct: ['lecturerId'],
            });
            const resourceRate = Math.min(100, Math.round((distinctResourceUploaders.length / totalLecturers) * 100));
            heatRow["RESOURCES"] = resourceRate;
            heatRow["SEMESTER_CALENDAR"] = resourceRate;

            return heatRow;
        })
    );
}

export async function getMonthlyTrend(termId?: number) {
    const submissions = await prisma.submission.findMany({
        where: { 
            status: { in: [SubmissionStatus.SUBMITTED, SubmissionStatus.LATE] },
            ...(termId ? { termId } : {})
        },
        select: { submittedAt: true, status: true },
        orderBy: { submittedAt: "asc" },
    });

    const months: Record<string, { month: string; submitted: number; late: number }> = {};

    for (const s of submissions) {
        if (!s.submittedAt) continue;
        const key = s.submittedAt.toISOString().slice(0, 7); // YYYY-MM
        if (!months[key]) {
            months[key] = { month: key, submitted: 0, late: 0 };
        }
        if (s.status === SubmissionStatus.LATE) months[key].late++;
        else months[key].submitted++;
    }

    return Object.values(months);
}
