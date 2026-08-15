import { NextRequest, NextResponse } from "next/server";
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

// GET /api/admin/analytics
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    const userId = Number(session.user.id);

    if (!["ADMIN", "SUPER_ADMIN", "HOD"].includes(role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // For HODs: always do a live DB lookup so we never depend on a potentially stale JWT
    let deptId: number | undefined = undefined;
    if (role === "HOD") {
        const hodUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { departmentId: true },
        });
        deptId = hodUser?.departmentId ?? undefined;
    }

    const url = new URL(req.url);
    const termIdParam = url.searchParams.get("termId");

    const { checkAndGetActiveTerm } = await import("@/lib/active-term");
    const activeTerm = await checkAndGetActiveTerm();
    const termId = termIdParam ? parseInt(termIdParam) : activeTerm?.id;


    const [scores, heatmap, trend] = await Promise.all([
        computeComplianceScores(deptId, termId || undefined),
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

    const [totalLecturers, totalSubmissions, totalDeadlines, pendingObservations] = await Promise.all([
        prisma.user.count({ where: userWhere }),
        prisma.submission.count({ where: submissionWhere }),
        prisma.deadline.count({ where: termId ? { termId } : {} }),
        prisma.observation.count({ where: { status: "PENDING", ...(termId ? { termId } : {}) } }),
    ]);

    return NextResponse.json({
        summary: { totalLecturers, totalSubmissions, totalDeadlines, pendingObservations, avgScore, atRiskCount: atRisk.length },
        scores,
        atRisk,
        heatmap,
        trend,
    });
}
