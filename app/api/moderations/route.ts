import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userRole = (session.user as any).role;
    const userId = Number(session.user.id);

    try {
        const url = new URL(req.url);
        const termIdParam = url.searchParams.get("termId");
        const all = url.searchParams.get("all") === "true";

        const { checkAndGetActiveTerm } = await import("@/lib/active-term");
        const activeTerm = await checkAndGetActiveTerm();

        const termWhere: any = {};
        if (!all) {
            if (termIdParam) {
                termWhere.termId = parseInt(termIdParam);
            } else if (activeTerm) {
                termWhere.termId = activeTerm.id;
            } else {
                return NextResponse.json([]);
            }
        }

        let moderations;
        if (userRole === "DEO" || userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "HOD") {
            moderations = await prisma.examModeration.findMany({
                where: termWhere,
                include: { lecturer: true, moderator: true, deo: true },
                orderBy: { createdAt: "desc" },
            });
        } else {
            moderations = await prisma.examModeration.findMany({
                where: {
                    ...termWhere,
                    OR: [{ lecturerId: userId }, { moderatorId: userId }]
                },
                include: { lecturer: true, moderator: true, deo: true },
                orderBy: { createdAt: "desc" },
            });
        }
        return NextResponse.json(moderations);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to fetch moderations" }, { status: 500 });
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
        const { lecturerId, moderatorId, courseCode } = body;

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

        const moderation = await prisma.examModeration.create({
            data: {
                lecturerId: Number(lecturerId),
                moderatorId: Number(moderatorId),
                courseCode,
                deoId,
                termId: activeTerm?.id || null,
            },
            include: { lecturer: true, moderator: true, deo: true },
        });
        return NextResponse.json(moderation);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to create moderation" }, { status: 500 });
    }
}
