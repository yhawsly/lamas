import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { headers, cookies } from "next/headers";

import { generateAutomatedDeadlinesForTerm } from "@/features/submissions";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await headers();
    await cookies();
    try {
        const session = await auth();
        if (!session || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any)?.role as string)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const resolvedParams = await params;
        const termId = parseInt(resolvedParams.id);

        if (isNaN(termId)) return NextResponse.json({ error: "Invalid Term ID" }, { status: 400 });

        const term = await prisma.academicTerm.findUnique({ where: { id: termId } });
        if (!term) return NextResponse.json({ error: "Term not found" }, { status: 404 });

        const now = new Date();
        const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const termEndDate = new Date(term.endDate);
        const termEndDay = new Date(termEndDate.getFullYear(), termEndDate.getMonth(), termEndDate.getDate());

        if (termEndDay < todayDate) {
            return NextResponse.json({ error: "Cannot activate an academic term that has already ended (its end date is in the past)." }, { status: 400 });
        }

        // Enforce only one active term at a time by turning off all others
        // using Prisma transactions.
        await prisma.$transaction([
            prisma.academicTerm.updateMany({ data: { isActive: false } }),
            prisma.academicTerm.update({ where: { id: termId }, data: { isActive: true } })
        ]);

        // Automatically generate standard academic milestones for the newly activated term
        const createdDeadlines = await generateAutomatedDeadlinesForTerm(
            termId, 
            parseInt(session.user!.id!)
        );

        return NextResponse.json({ 
            success: true, 
            message: `Term activated successfully. ${createdDeadlines.length} automated milestone deadlines generated.`,
            autoDeadlinesCount: createdDeadlines.length
        });
    } catch (error) {
        console.error("Failed to activate term:", error);
        return NextResponse.json({ error: "Failed to activate term" }, { status: 500 });
    }
}
