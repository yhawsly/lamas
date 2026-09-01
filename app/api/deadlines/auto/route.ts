import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/permissions";
import { generateAutomatedDeadlinesForTerm, ACTIVE_MILESTONES } from "@/features/submissions/server";
import { headers, cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// POST /api/deadlines/auto — Admin manual or 1-click trigger
export async function POST(req: NextRequest) {
    await headers();
    await cookies();
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const role = (session.user as any).role;
        if (!isAdmin(role)) {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        const body = await req.json().catch(() => ({}));
        let termId = body.termId ? parseInt(body.termId) : null;

        if (!termId) {
            const activeTerm = await prisma.academicTerm.findFirst({ where: { isActive: true } });
            termId = activeTerm?.id || null;
        }

        if (!termId) {
            return NextResponse.json({ error: "No active or selected academic term found to generate milestones for." }, { status: 400 });
        }

        const createdDeadlines = await generateAutomatedDeadlinesForTerm(termId, parseInt(session.user.id!));

        return NextResponse.json({
            success: true,
            message: `Generated ${createdDeadlines.length} automated milestone deadlines for the term.`,
            count: createdDeadlines.length,
            deadlines: createdDeadlines,
            milestones: ACTIVE_MILESTONES
        });
    } catch (error: any) {
        console.error("Auto deadline generation error:", error);
        return NextResponse.json({ error: error?.message || "Failed to auto-generate deadlines" }, { status: 500 });
    }
}
