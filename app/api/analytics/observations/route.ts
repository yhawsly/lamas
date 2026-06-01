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

        const completedObservations = await prisma.observation.findMany({
            where,
            select: {
                ratingEngagement: true,
                ratingKnowledge: true,
                ratingOrganization: true,
                ratingActivities: true,
                ratingTech: true,
                ratingCommunication: true
            }
        });

        if (completedObservations.length === 0) return NextResponse.json([]);

        const getAvg = (field: keyof typeof completedObservations[0]) => {
            const values = completedObservations.map(o => o[field]).filter(v => v !== null && v !== undefined) as number[];
            if (values.length === 0) return 0;
            return parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1));
        };

        const data = [
            { subject: "Knowledge", A: getAvg("ratingKnowledge"), fullMark: 5 },
            { subject: "Engagement", A: getAvg("ratingEngagement"), fullMark: 5 },
            { subject: "Organization", A: getAvg("ratingOrganization"), fullMark: 5 },
            { subject: "Activities", A: getAvg("ratingActivities"), fullMark: 5 },
            { subject: "Technology", A: getAvg("ratingTech"), fullMark: 5 },
            { subject: "Communication", A: getAvg("ratingCommunication"), fullMark: 5 }
        ];

        return NextResponse.json(data);

    } catch {
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }
}
