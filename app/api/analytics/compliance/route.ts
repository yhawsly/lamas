import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await auth();
        if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const role = (session.user as any).role;
        if (role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "HOD") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const user = await prisma.user.findUnique({ where: { id: parseInt(session.user.id!) } });

        const where: any = {};
        if (role === "HOD" && user?.departmentId) {
            where.lecturer = { departmentId: user.departmentId };
        }

        const submissions = await prisma.submission.findMany({ where, select: { status: true } });

        const counts: Record<string, number> = {
            "SUBMITTED": 0,
            "PENDING": 0,
            "LATE": 0,
            "APPROVED": 0,
            "REJECTED": 0,
            "DRAFT": 0
        };

        submissions.forEach(sub => {
            if (counts[sub.status] !== undefined) counts[sub.status]++;
            else counts[sub.status] = 1;
        });

        const data = Object.keys(counts).map(key => ({
            name: key,
            value: counts[key]
        })).filter(item => item.value > 0);

        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }
}
