import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { headers, cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(req: NextRequest) {
    await headers();
    await cookies();
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(req.url);
        const termIdParam = url.searchParams.get("termId");

        const { checkAndGetActiveTerm } = await import("@/lib/active-term");
        const activeTerm = await checkAndGetActiveTerm();
        const termId = termIdParam ? parseInt(termIdParam) : activeTerm?.id;

        const termFilter = termId ? { termId } : {};

        const [formA, formB, formC] = await Promise.all([
            prisma.observation.findMany({
                where: termFilter,
                include: {
                    lecturer: { select: { id: true, name: true, email: true } },
                    observer: { select: { id: true, name: true, email: true } },
                },
                orderBy: { createdAt: "desc" }
            }),
            prisma.teachingObservation.findMany({
                where: termFilter,
                include: {
                    lecturer: { select: { id: true, name: true, email: true } },
                    observer: { select: { id: true, name: true, email: true } },
                },
                orderBy: { createdAt: "desc" }
            }),
            prisma.examModeration.findMany({
                where: termFilter,
                include: {
                    lecturer: { select: { id: true, name: true, email: true } },
                    moderator: { select: { id: true, name: true, email: true } },
                },
                orderBy: { createdAt: "desc" }
            }),
        ]);

        const assignments = [
            ...formA.map(o => ({
                id: o.id,
                formType: "A" as const,
                typeName: "Instructional Materials Audit",
                courseCode: o.courseCode,
                status: o.status,
                lecturer: o.lecturer,
                observer: o.observer,
                createdAt: o.createdAt.toISOString(),
            })),
            ...formB.map(o => ({
                id: o.id,
                formType: "B" as const,
                typeName: "Teaching Observation",
                courseCode: o.courseCode,
                status: o.status,
                lecturer: o.lecturer,
                observer: o.observer,
                createdAt: o.createdAt.toISOString(),
            })),
            ...formC.map(o => ({
                id: o.id,
                formType: "C" as const,
                typeName: "Exam Moderation",
                courseCode: o.courseCode,
                status: o.status,
                lecturer: o.lecturer,
                moderator: o.moderator,
                createdAt: o.createdAt.toISOString(),
            })),
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return NextResponse.json({ assignments });
    } catch (error) {
        console.error("Failed to fetch DEO assignments:", error);
        return NextResponse.json({ assignments: [] });
    }
}

export async function POST(req: NextRequest) {
    await headers();
    await cookies();
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const role = (session.user as any).role;
        if (!["DEO", "HOD", "ADMIN", "SUPER_ADMIN"].includes(role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const deoId = parseInt(session.user.id!);
        const body = await req.json();
        const { formType, lecturerId, observerId, courseCode, termId: reqTermId } = body;

        if (!formType || !lecturerId || !observerId || !courseCode) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        const numLecturerId = Number(lecturerId);
        const numObserverId = Number(observerId);

        if (numLecturerId === numObserverId) {
            return NextResponse.json(
                { error: "Invalid Pairing: A lecturer cannot be assigned to review or observe their own course." },
                { status: 400 }
            );
        }

        const { checkAndGetActiveTerm } = await import("@/lib/active-term");
        const activeTerm = await checkAndGetActiveTerm();
        const termId = reqTermId ? parseInt(reqTermId) : activeTerm?.id;

        if (formType === "A") {
            // Check if Form A already exists for this lecturer on this course and term
            const existingA = await prisma.observation.findFirst({
                where: {
                    courseCode,
                    lecturerId: numLecturerId,
                    ...(termId ? { termId } : {}),
                },
                include: { observer: { select: { name: true } } }
            });

            if (existingA) {
                return NextResponse.json({
                    error: `Duplicate Blocked: Form A (Instructional Materials Audit) is already assigned for this lecturer on course ${courseCode} (Reviewer: ${existingA.observer?.name || 'Assigned'}).`
                }, { status: 409 });
            }

            const assignment = await prisma.observation.create({
                data: {
                    courseCode,
                    lecturerId: numLecturerId,
                    observerId: numObserverId,
                    termId,
                    status: "PENDING"
                },
                include: { lecturer: true, observer: true }
            });

            // Send notification to observer
            await prisma.notification.create({
                data: {
                    userId: numObserverId,
                    message: `You have been assigned to audit Form A Instructional Materials for ${courseCode} (Lecturer: ${assignment.lecturer.name}).`,
                    attachmentUrl: `/lecturer/observations/${assignment.id}`
                }
            }).catch(console.error);

            return NextResponse.json({ success: true, assignment });
        } else if (formType === "B") {
            // Check if Form B already exists for this lecturer on this course and term
            const existingB = await prisma.teachingObservation.findFirst({
                where: {
                    courseCode,
                    lecturerId: numLecturerId,
                    ...(termId ? { termId } : {}),
                },
                include: { observer: { select: { name: true } } }
            });

            if (existingB) {
                return NextResponse.json({
                    error: `Duplicate Blocked: Form B (Teaching Observation) is already assigned for this lecturer on course ${courseCode} (Observer: ${existingB.observer?.name || 'Assigned'}).`
                }, { status: 409 });
            }

            const assignment = await prisma.teachingObservation.create({
                data: {
                    courseCode,
                    lecturerId: numLecturerId,
                    observerId: numObserverId,
                    deoId,
                    termId,
                    status: "PENDING"
                },
                include: { lecturer: true, observer: true }
            });

            // Send notification to observer
            await prisma.notification.create({
                data: {
                    userId: numObserverId,
                    message: `You have been assigned to conduct Form B Teaching Observation for ${courseCode} (Lecturer: ${assignment.lecturer.name}).`,
                    attachmentUrl: `/lecturer/teaching-observations/${assignment.id}`
                }
            }).catch(console.error);

            return NextResponse.json({ success: true, assignment });
        } else if (formType === "C") {
            // Check if Form C already exists for this lecturer on this course and term
            const existingC = await prisma.examModeration.findFirst({
                where: {
                    courseCode,
                    lecturerId: numLecturerId,
                    ...(termId ? { termId } : {}),
                },
                include: { moderator: { select: { name: true } } }
            });

            if (existingC) {
                return NextResponse.json({
                    error: `Duplicate Blocked: Form C (Exam Moderation) is already assigned for this lecturer on course ${courseCode} (Moderator: ${existingC.moderator?.name || 'Assigned'}).`
                }, { status: 409 });
            }

            const assignment = await prisma.examModeration.create({
                data: {
                    courseCode,
                    lecturerId: numLecturerId,
                    moderatorId: numObserverId,
                    deoId,
                    termId,
                    status: "PENDING"
                },
                include: { lecturer: true, moderator: true }
            });

            // Send notification to moderator
            await prisma.notification.create({
                data: {
                    userId: numObserverId,
                    message: `You have been assigned to moderate Form C Exam Paper for ${courseCode} (Internal Examiner: ${assignment.lecturer.name}).`,
                    attachmentUrl: `/moderations/${assignment.id}`
                }
            }).catch(console.error);

            return NextResponse.json({ success: true, assignment });
        }

        return NextResponse.json({ error: "Invalid form type" }, { status: 400 });
    } catch (error: any) {
        console.error("Failed to create DEO assignment:", error);
        return NextResponse.json({ error: error.message || "Failed to create assignment" }, { status: 500 });
    }
}
