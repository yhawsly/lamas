import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { headers, cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// Publicly accessible (any authenticated user) — returns the active academic term
export async function GET() {
    await headers();
    await cookies();
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const term = await prisma.academicTerm.findFirst({
            where: { isActive: true },
            select: { id: true, name: true, startDate: true, endDate: true }
        });

        if (!term) {
            return NextResponse.json(null);
        }

        // Compute the number of full weeks between startDate and endDate
        const msPerWeek = 7 * 24 * 60 * 60 * 1000;
        const diffMs = new Date(term.endDate).getTime() - new Date(term.startDate).getTime();
        const totalWeeks = Math.max(1, Math.ceil(diffMs / msPerWeek));

        return NextResponse.json({ ...term, totalWeeks });
    } catch (error) {
        console.error("Failed to fetch active term:", error);
        return NextResponse.json({ error: "Failed to fetch active term" }, { status: 500 });
    }
}
