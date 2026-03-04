import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/observations
export async function GET() {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = parseInt(session.user.id!);
    const role = (session.user as any).role;

    const where =
        role === "LECTURER"
            ? { OR: [{ lecturerId: userId }, { observerId: userId }] }
            : {};

    const observations = await prisma.observation.findMany({
        where,
        include: {
            lecturer: { select: { name: true, email: true } },
            observer: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(observations);
}

// POST /api/observations — Assign an observation
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (!["HOD", "ADMIN", "SUPER_ADMIN"].includes(role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { lecturerId, observerId, sessionDate, courseCode } = body;

    const observation = await prisma.observation.create({
        data: {
            lecturerId,
            observerId,
            sessionDate: new Date(sessionDate),
            courseCode,
            status: "PENDING",
        },
    });

    // Notify both parties
    await prisma.notification.createMany({
        data: [
            {
                userId: lecturerId,
                message: `You have been scheduled for a classroom observation on ${new Date(sessionDate).toLocaleDateString()}.`,
            },
            {
                userId: observerId,
                message: `You have been assigned to observe a class session on ${new Date(sessionDate).toLocaleDateString()}.`,
            },
        ],
    });

    return NextResponse.json(observation, { status: 201 });
}
