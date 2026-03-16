import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await auth();
        if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const role = (session.user as any).role;
        if (role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "HOD") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const user = await prisma.user.findUnique({ where: { id: parseInt(session.user.id!) } });

        const where: any = { status: "COMPLETED" };
        if (role === "HOD" && user?.departmentId) {
            where.lecturer = { departmentId: user.departmentId };
        }

        const observations = await prisma.observation.findMany({ where });

        let knowledgeSum = 0, engagementSum = 0, techSum = 0, punctualitySum = 0;
        let count = 0;

        observations.forEach(o => {
            if (o.ratingKnowledge || o.ratingEngagement || o.ratingTech || o.ratingPunctuality) {
                knowledgeSum += o.ratingKnowledge || 0;
                engagementSum += o.ratingEngagement || 0;
                techSum += o.ratingTech || 0;
                punctualitySum += o.ratingPunctuality || 0;
                count++;
            }
        });

        if (count === 0) return NextResponse.json([]);

        const data = [
            { subject: "Knowledge", A: parseFloat((knowledgeSum / count).toFixed(1)), fullMark: 5 },
            { subject: "Engagement", A: parseFloat((engagementSum / count).toFixed(1)), fullMark: 5 },
            { subject: "Technology", A: parseFloat((techSum / count).toFixed(1)), fullMark: 5 },
            { subject: "Punctuality", A: parseFloat((punctualitySum / count).toFixed(1)), fullMark: 5 }
        ];

        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }
}
