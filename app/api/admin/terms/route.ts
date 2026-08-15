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
        if (!session || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any)?.role as string)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const terms = await prisma.academicTerm.findMany({
            orderBy: { startDate: "desc" },
            include: { admin: { select: { name: true } } }
        });

        return NextResponse.json(terms);
    } catch (error) {
        console.error("Failed to fetch terms:", error);
        return NextResponse.json({ error: "Failed to fetch terms" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    await headers();
    await cookies();
    try {
        const session = await auth();
        if (!session || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any)?.role as string)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        if (!body.name || !body.startDate || !body.endDate) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const start = new Date(body.startDate);
        const end = new Date(body.endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
        }

        // Compare day, month, and year strictly by resetting hours
        const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

        if (endDay <= startDay) {
            return NextResponse.json({ error: "End date must be after the start date." }, { status: 400 });
        }

        const now = new Date();
        const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (endDay < todayDate) {
            return NextResponse.json({ error: "Cannot create an academic term with an end date in the past." }, { status: 400 });
        }

        const term = await prisma.academicTerm.create({
            data: {
                name: body.name,
                startDate: start,
                endDate: end,
                createdBy: parseInt(session.user!.id!)
            }
        });

        return NextResponse.json(term);
    } catch (error) {
        console.error("Failed to create term:", error);
        return NextResponse.json({ error: "Failed to create term" }, { status: 500 });
    }
}
