import { prisma } from "@/lib/prisma";
import { SubmissionStatus, SubmissionType } from "@prisma/client";

export interface ComplianceScore {
    lecturerId: number;
    lecturerName: string;
    email: string;
    department: string;
    score: number;
    totalRequired: number;
    submitted: number;
    late: number;
    missing: number;
    isAtRisk: boolean;
}

export async function computeComplianceScores(
    departmentId?: number,
    termId?: number
): Promise<ComplianceScore[]> {
    const { checkAndGetActiveTerm } = await import("./active-term");
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
            const subsForDeadline = l.submissions.filter(
                s => s.deadlineId === d.id || (s.type === d.type && s.termId === d.termId)
            );
            const hasOnTime = subsForDeadline.some(s => onTimeStatuses.includes(s.status));
            const hasLate = subsForDeadline.some(s => s.status === SubmissionStatus.LATE);

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

        const types = [
            SubmissionType.SEMESTER_CALENDAR,
            "TOPICS", // Internal key for both COURSE_TOPICS and WEEKLY_TOPICS
            SubmissionType.OBSERVATION_REPORT
        ];

        return Promise.all(
            departments.map(async (dept) => {
                const lecturerIds = dept.users.map((u) => u.id);
                const heatRow: Record<string, number | string | any> = { departmentId: dept.id };
                heatRow.department = dept.name;

                for (const type of types) {
                    let whereType: any = type;
                    if (type === "TOPICS") {
                        whereType = { in: [SubmissionType.COURSE_TOPICS, SubmissionType.WEEKLY_TOPICS] };
                    }

                    const distinctSubmissions = await prisma.submission.findMany({
                        where: {
                            lecturerId: { in: lecturerIds },
                            type: whereType,
                            status: { in: [SubmissionStatus.SUBMITTED, SubmissionStatus.LATE, SubmissionStatus.APPROVED, SubmissionStatus.REVIEWED] },
                            termId: termId || undefined,
                        },
                        select: { lecturerId: true },
                        distinct: ['lecturerId'],
                    });
                    
                    const total = lecturerIds.length;
                    const value = total > 0 ? Math.min(100, Math.round((distinctSubmissions.length / total) * 100)) : 0;
                    
                    // Map back to the keys the frontend expects
                    if (type === "TOPICS") heatRow["COURSE_TOPICS"] = value;
                    else heatRow[type] = value;
                }

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
