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
    const whereClause = departmentId ? { departmentId, isActive: true } : { isActive: true };

    const lecturers = await prisma.user.findMany({
        where: { ...whereClause, role: { in: ["LECTURER", "HOD"] } },
        include: {
            submissions: { include: { deadline: true } },
            department: true,
        },
    });

    const deadlines = await prisma.deadline.findMany();
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

export async function getDepartmentHeatmap() {
    const departments = await prisma.department.findMany({
        include: { users: { where: { role: { in: ["LECTURER", "HOD"] } } } },
    });

    const types = [
        SubmissionType.SEMESTER_CALENDAR,
        SubmissionType.COURSE_TOPICS,
        SubmissionType.OBSERVATION_REPORT
    ];

    return Promise.all(
        departments.map(async (dept) => {
            const lecturerIds = dept.users.map((u) => u.id);
            const heatRow: Record<string, number> = { departmentId: dept.id };
            heatRow.department = dept.name as any;

            for (const type of types) {
                const count = await prisma.submission.count({
                    where: {
                        lecturerId: { in: lecturerIds },
                        type: type as SubmissionType,
                        status: { in: [SubmissionStatus.SUBMITTED, SubmissionStatus.LATE] },
                    },
                });
                const total = lecturerIds.length;
                heatRow[type] = total > 0 ? Math.round((count / total) * 100) : 0;
            }

            return heatRow;
        })
    );
}

export async function getMonthlyTrend() {
    const submissions = await prisma.submission.findMany({
        where: { status: { in: [SubmissionStatus.SUBMITTED, SubmissionStatus.LATE] } },
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
