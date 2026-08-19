import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { headers, cookies } from "next/headers";

export const dynamic = "force-dynamic";

// GET /api/lecturer/invigilation?termId=...
export async function GET(req: NextRequest) {
    await headers();
    await cookies();
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userId = parseInt(session.user.id!);
        const url = new URL(req.url);
        const termIdParam = url.searchParams.get("termId");

        const { checkAndGetActiveTerm } = await import("@/lib/active-term");
        const activeTerm = await checkAndGetActiveTerm();
        const termId = termIdParam ? parseInt(termIdParam) : activeTerm?.id;

        if (!termId) return NextResponse.json({ data: [] });

        const duties = await prisma.examSessionInvigilation.findMany({
            where: {
                termId,
                OR: [
                    { chiefInvigilatorId: userId },
                    { assistantInvigilatorIds: { has: userId } }
                ]
            },
            include: {
                hall: true,
                chiefInvigilator: { select: { id: true, name: true, email: true } }
            },
            orderBy: [
                { examDate: "asc" },
                { timeSlot: "asc" }
            ]
        });

        const mapped = duties.map((d: any) => ({
            ...d,
            roleInExam: d.chiefInvigilatorId === userId ? "Chief Invigilator" : "Assistant Invigilator"
        }));

        return NextResponse.json({ data: mapped });

    } catch (error: any) {
        console.error("Failed to fetch lecturer duties:", error);
        return NextResponse.json({ error: "Failed to fetch invigilation duties" }, { status: 500 });
    }
}
