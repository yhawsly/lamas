import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any)?.role as string)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const resolvedParams = await params;
        const termId = parseInt(resolvedParams.id);

        if (isNaN(termId)) return NextResponse.json({ error: "Invalid Term ID" }, { status: 400 });

        // Enforce only one active term at a time by turning off all others
        // using Prisma transactions.
        await prisma.$transaction([
            prisma.academicTerm.updateMany({ data: { isActive: false } }),
            prisma.academicTerm.update({ where: { id: termId }, data: { isActive: true } })
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to activate term:", error);
        return NextResponse.json({ error: "Failed to activate term" }, { status: 500 });
    }
}
