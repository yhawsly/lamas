import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userRole = (session.user as any).role;
    const userId = Number(session.user.id);

    try {
        let observations;
        if (userRole === "DEO" || userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "HOD") {
            observations = await prisma.teachingObservation.findMany({
                include: { lecturer: true, observer: true, deo: true },
                orderBy: { createdAt: "desc" },
            });
        } else {
            observations = await prisma.teachingObservation.findMany({
                where: { OR: [{ lecturerId: userId }, { observerId: userId }] },
                include: { lecturer: true, observer: true, deo: true },
                orderBy: { createdAt: "desc" },
            });
        }
        return NextResponse.json(observations);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to fetch teaching observations" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userRole = (session.user as any).role;
    if (userRole !== "DEO" && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { lecturerId, observerId, courseCode } = body;

        // Validate that the lecturer is assigned to the course
        const isAssigned = await prisma.courseSection.findFirst({
            where: {
                lecturerId: Number(lecturerId),
                course: {
                    code: courseCode
                }
            }
        });

        if (!isAssigned) {
            return NextResponse.json(
                { error: `Assignment blocked: The observed lecturer is not assigned to course ${courseCode}.` },
                { status: 400 }
            );
        }

        const deoId = Number(session.user.id);
        const activeTerm = await prisma.academicTerm.findFirst({ where: { isActive: true } });

        const observation = await prisma.teachingObservation.create({
            data: {
                lecturerId: Number(lecturerId),
                observerId: Number(observerId),
                courseCode,
                deoId,
                termId: activeTerm?.id || null,
            },
            include: { lecturer: true, observer: true, deo: true },
        });
        return NextResponse.json(observation);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to create teaching observation" }, { status: 500 });
    }
}
