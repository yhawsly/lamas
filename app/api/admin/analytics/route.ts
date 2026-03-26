import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
import { auth } from "@/auth";
import {
    computeComplianceScores,
    getDepartmentHeatmap,
    getMonthlyTrend,
} from "@/lib/compliance";
import { prisma } from "@/lib/prisma";
import { headers, cookies } from "next/headers";

// GET /api/admin/analytics
export async function GET() {
    await headers();
    await cookies();
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (!["ADMIN", "SUPER_ADMIN", "HOD"].includes(role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const deptId =
        role === "HOD" ? (session.user as any).departmentId : undefined;

    const activeTerm = await prisma.academicTerm.findFirst({ where: { isActive: true } });
    const termId = activeTerm?.id;

    const [scores, heatmap, trend] = await Promise.all([
        computeComplianceScores(deptId),
        getDepartmentHeatmap(termId, deptId),
        getMonthlyTrend(termId),
    ]);

    const atRisk = scores.filter((s) => s.isAtRisk);
    const avgScore =
        scores.length > 0
            ? Math.round(scores.reduce((a, b) => a + b.score, 0) / scores.length)
            : 0;

    // Summary stats
    const userWhere: any = { role: { in: ["LECTURER", "HOD"] }, isActive: true };
    const submissionWhere: any = { status: { in: ["SUBMITTED", "LATE"] } };
    if (termId) submissionWhere.termId = termId;

    if (deptId) {
        userWhere.departmentId = deptId;
        submissionWhere.lecturer = { departmentId: deptId };
    }

    const [totalLecturers, totalSubmissions, totalDeadlines] = await Promise.all([
        prisma.user.count({ where: userWhere }),
        prisma.submission.count({ where: submissionWhere }),
        prisma.deadline.count({ where: termId ? { termId } : {} }),
    ]);

    return NextResponse.json({
        summary: { totalLecturers, totalSubmissions, totalDeadlines, avgScore, atRiskCount: atRisk.length },
        scores,
        atRisk,
        heatmap,
        trend,
    });
}
