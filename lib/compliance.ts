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
    departmentId?: number
): Promise<ComplianceScore[]> {
    const activeTerm = await prisma.academicTerm.findFirst({ where: { isActive: true } });
    const termId = activeTerm?.id;

    const whereClause: any = { isActive: true, role: { in: ["LECTURER", "HOD"] } };
    if (departmentId) whereClause.departmentId = departmentId;

    const lecturers = await prisma.user.findMany({
        where: whereClause,
        include: {
            submissions: { 
                where: termId ? { termId } : {},
                include: { deadline: true } 
            },
            department: true,
        },
    });

    const now = new Date();
    const deadlines = await prisma.deadline.findMany({
        where: {
            AND: [
                termId ? { termId } : {},
                { dueDate: { lte: now } }
            ]
        }
    });
    const totalRequired = deadlines.length;

    return lecturers.map((l) => {
        const submittedOnTime = l.submissions.filter((s) => s.status === SubmissionStatus.SUBMITTED).length;
        const submittedLate = l.submissions.filter((s) => s.status === SubmissionStatus.LATE).length;
        const totalSubmitted = submittedOnTime + submittedLate;

        const missing = Math.max(0, totalRequired - totalSubmitted);

        // Score is based on on-time submissions relative to requirements
        const score = totalRequired > 0
            ? Math.round((submittedOnTime / totalRequired) * 100)
            : 100;

        const isAtRisk =
            score < 70 ||
            l.submissions.some(
                (s) =>
                    s.deadline &&
                    s.deadline.dueDate < new Date() &&
                    (s.status === SubmissionStatus.PENDING || s.status === SubmissionStatus.DRAFT)
            );

        return {
            lecturerId: l.id,
            lecturerName: l.name,
            email: l.email,
            department: l.department?.name ?? "N/A",
            score,
            totalRequired,
            submitted: totalSubmitted,
            late: submittedLate,
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
        SubmissionType.COURSE_TOPICS,
        SubmissionType.OBSERVATION_REPORT
    ];

    return Promise.all(
        departments.map(async (dept) => {
            const lecturerIds = dept.users.map((u) => u.id);
            const heatRow: Record<string, number | string | any> = { departmentId: dept.id };
            heatRow.department = dept.name;

            for (const type of types) {
                const count = await prisma.submission.count({
                    where: {
                        lecturerId: { in: lecturerIds },
                        type: type as SubmissionType,
                        status: { in: [SubmissionStatus.SUBMITTED, SubmissionStatus.LATE] },
                        termId: termId || undefined,
                    },
                });
                const total = lecturerIds.length;
                heatRow[type] = total > 0 ? Math.round((count / total) * 100) : 0;
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
