import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { headers, cookies } from "next/headers";

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

        const where: any = { status: "COMPLETED" };
        if (termId) where.termId = termId;

        if (role === "HOD" && user?.departmentId) {
            where.lecturer = { departmentId: user.departmentId };
        }

        const observations = await prisma.observation.count({ where });

        if (observations === 0) return NextResponse.json([]);

        // Ratings are no longer collected as discrete fields, returning neutral values
        const data = [
            { subject: "Knowledge", A: 0, fullMark: 5 },
            { subject: "Engagement", A: 0, fullMark: 5 },
            { subject: "Technology", A: 0, fullMark: 5 },
            { subject: "Punctuality", A: 0, fullMark: 5 }
        ];

        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }
}
