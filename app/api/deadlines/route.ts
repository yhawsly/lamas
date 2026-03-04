import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/deadlines
export async function GET() {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const deadlines = await prisma.deadline.findMany({
        orderBy: { dueDate: "asc" },
    });

    return NextResponse.json(deadlines);
}

// POST /api/deadlines
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (!["ADMIN", "SUPER_ADMIN"].includes(role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { type, label, dueDate } = body;

    const deadline = await prisma.deadline.create({
        data: {
            type,
            label,
            dueDate: new Date(dueDate),
            createdBy: parseInt(session.user.id!),
        },
    });

    // Notify all active lecturers
    const lecturers = await prisma.user.findMany({
        where: { role: { in: ["LECTURER", "HOD"] }, isActive: true },
    });

    await prisma.notification.createMany({
        data: lecturers.map((l) => ({
            userId: l.id,
            message: `New deadline: "${label}" — due ${new Date(dueDate).toLocaleDateString()}`,
        })),
    });

    return NextResponse.json(deadline, { status: 201 });
}
