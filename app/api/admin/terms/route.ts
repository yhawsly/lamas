import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
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
    try {
        const session = await auth();
        if (!session || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any)?.role as string)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        if (!body.name || !body.startDate || !body.endDate) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const term = await prisma.academicTerm.create({
            data: {
                name: body.name,
                startDate: new Date(body.startDate),
                endDate: new Date(body.endDate),
                createdBy: parseInt(session.user!.id!)
            }
        });

        return NextResponse.json(term);
    } catch (error) {
        console.error("Failed to create term:", error);
        return NextResponse.json({ error: "Failed to create term" }, { status: 500 });
    }
}
