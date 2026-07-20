import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { headers, cookies } from "next/headers";
import { cachedQuery } from "@/lib/cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
    await headers();
    await cookies();
    try {
        const session = await auth();
        if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const role = (session.user as any).role;
        if (role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "HOD") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const user = await prisma.user.findUnique({ where: { id: parseInt(session.user.id!) } });

        const activeTerm = await prisma.academicTerm.findFirst({ where: { isActive: true } });
        const termId = activeTerm?.id;

        const where: any = {};
        if (termId) where.termId = termId;

        if (role === "HOD" && user?.departmentId) {
            where.lecturer = { departmentId: user.departmentId };
        }

        // Use groupBy aggregation instead of fetching all rows and counting in-memory
        const cacheKey = `compliance:${role}:${user?.departmentId ?? "all"}:${termId ?? "none"}`;
        const data = await cachedQuery(cacheKey, async () => {
            const grouped = await prisma.submission.groupBy({
                by: ["status"],
                where,
                _count: { status: true },
            });

            return grouped
                .map(g => ({ name: g.status, value: g._count.status }))
                .filter(item => item.value > 0);
        }, 120); // 120s TTL for analytics data

        return NextResponse.json(data, {
            headers: {
                "Cache-Control": "private, max-age=60, stale-while-revalidate=60",
            },
        });
    } catch {
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }
}

