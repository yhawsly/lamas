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

        let observations;
        if (userRole === "DEO" || userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "HOD") {
            observations = await prisma.teachingObservation.findMany({
                where: termWhere,
                include: { lecturer: true, observer: true, deo: true },
                orderBy: { createdAt: "desc" },
            });
        } else {
            observations = await prisma.teachingObservation.findMany({
                where: {
                    ...termWhere,
                    OR: [{ lecturerId: userId }, { observerId: userId }]
                },
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
        const { lecturerId, observerId, courseCode, termId } = body;

        // Check backend term archive guard
        const { assertTermIsActive } = await import("@/lib/term-guard");
        const termGuard = await assertTermIsActive(termId);
        if (!termGuard.allowed) {
            return NextResponse.json(
                { error: termGuard.reason || "Read-Only Archive: Teaching observations cannot be created for archived terms." },
                { status: 403 }
            );
        }

        // Validate Department-Level Boundary (Approach 1) & Conflict of Interest
        const { validateDepartmentBoundary } = await import("@/features/allocations");
        const deptValidation = await validateDepartmentBoundary({
            courseCode,
            lecturerId: Number(lecturerId),
            reviewerId: Number(observerId)
        });

        if (!deptValidation.valid) {
            return NextResponse.json(
                { error: deptValidation.error || "Department boundary validation failed" },
                { status: 400 }
            );
        }

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
