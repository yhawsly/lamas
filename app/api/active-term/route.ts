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
            // Institutional Fallback: If no term is marked active, provide a standard 18-week default
            return NextResponse.json({
                id: 0,
                name: "Standard Academic Term (Fallback)",
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + 18 * 7 * 24 * 60 * 60 * 1000).toISOString(),
                totalWeeks: 18
            });
        }

        // Compute the number of full weeks between startDate and endDate
        const start = new Date(term.startDate);
        const end = new Date(term.endDate);
        const msPerWeek = 7 * 24 * 60 * 60 * 1000;
        
        let totalWeeks = 18;
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            const diffMs = end.getTime() - start.getTime();
            totalWeeks = Math.max(1, Math.ceil(diffMs / msPerWeek));
        }

        return NextResponse.json({ ...term, totalWeeks });
    } catch (error) {
        console.error("Failed to fetch active term:", error);
        // Crisis Fallback: Prevent system-wide crash if DB is unresponsive
        return NextResponse.json({
            id: -1,
            name: "Emergency Fallback Term",
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 18 * 7 * 24 * 60 * 60 * 1000).toISOString(),
            totalWeeks: 18
        });
    }
}
