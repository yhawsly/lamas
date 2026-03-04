import { prisma } from "@/lib/prisma";

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
        const submitted = l.submissions.filter((s) =>
            ["SUBMITTED"].includes(s.status)
        ).length;
        const late = l.submissions.filter((s) => s.status === "LATE").length;
        const onTime = submitted - late;
        const missing = Math.max(0, totalRequired - submitted - late);
        const score =
            totalRequired > 0 ? Math.round(((onTime) / totalRequired) * 100) : 100;
        const isAtRisk =
            score < 70 ||
            l.submissions.some(
                (s) =>
                    s.deadline &&
                    s.deadline.dueDate < new Date() &&
                    s.status === "PENDING"
            );

        return {
            lecturerId: l.id,
            lecturerName: l.name,
            email: l.email,
            department: l.department?.name ?? "N/A",
            score,
            totalRequired,
            submitted,
            late,
            missing,
            isAtRisk,
        };
    });
}

export async function getDepartmentHeatmap() {
    const departments = await prisma.department.findMany({
        include: { users: { where: { role: { in: ["LECTURER", "HOD"] } } } },
    });

    const types = ["SEMESTER_CALENDAR", "COURSE_TOPICS", "OBSERVATION_REPORT"];

    return Promise.all(
        departments.map(async (dept) => {
            const lecturerIds = dept.users.map((u) => u.id);
            const heatRow: Record<string, number> = { departmentId: dept.id };
            heatRow.department = dept.name as any;

            for (const type of types) {
                const count = await prisma.submission.count({
                    where: {
                        lecturerId: { in: lecturerIds },
                        type,
                        status: { in: ["SUBMITTED", "LATE"] },
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
        where: { status: { in: ["SUBMITTED", "LATE"] } },
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
        if (s.status === "LATE") months[key].late++;
        else months[key].submitted++;
    }

    return Object.values(months);
}
