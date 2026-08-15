import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { headers, cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// Accessible to all authenticated users (Lecturer, HOD, DEO, Admin)
// Returns all academic terms ordered by start date (newest first)
export async function GET() {
    await headers();
    await cookies();
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const terms = await prisma.academicTerm.findMany({
            orderBy: { startDate: "desc" },
            select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true,
                isActive: true,
                createdAt: true,
            },
        });

        return NextResponse.json(terms);
    } catch (error) {
        console.error("[Terms API] Failed to fetch academic terms:", error);
        return NextResponse.json({ error: "Failed to fetch terms" }, { status: 500 });
    }
}
