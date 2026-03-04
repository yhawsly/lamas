import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
    computeComplianceScores,
    getDepartmentHeatmap,
    getMonthlyTrend,
} from "@/lib/compliance";
import { prisma } from "@/lib/prisma";

// GET /api/admin/analytics
export async function GET() {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (!["ADMIN", "SUPER_ADMIN", "HOD"].includes(role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const deptId =
        role === "HOD" ? (session.user as any).departmentId : undefined;

    const [scores, heatmap, trend] = await Promise.all([
        computeComplianceScores(deptId),
        getDepartmentHeatmap(),
        getMonthlyTrend(),
    ]);

    const atRisk = scores.filter((s) => s.isAtRisk);
    const avgScore =
        scores.length > 0
            ? Math.round(scores.reduce((a, b) => a + b.score, 0) / scores.length)
            : 0;

    // Summary stats
    const [totalLecturers, totalSubmissions, totalDeadlines] = await Promise.all([
        prisma.user.count({ where: { role: { in: ["LECTURER", "HOD"] }, isActive: true } }),
        prisma.submission.count({ where: { status: { in: ["SUBMITTED", "LATE"] } } }),
        prisma.deadline.count(),
    ]);

    return NextResponse.json({
        summary: { totalLecturers, totalSubmissions, totalDeadlines, avgScore, atRiskCount: atRisk.length },
        scores,
        atRisk,
        heatmap,
        trend,
    });
}
