import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { headers, cookies } from "next/headers";
import { logAction } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

interface PairingPayloadItem {
    courseCode: string;
    lecturerId: number;
    observerAId?: number | null;
    observerBId?: number | null;
    moderatorCId?: number | null;
}

export async function GET(req: NextRequest) {
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

        const url = new URL(req.url);
        const termIdParam = url.searchParams.get("termId");

        const { checkAndGetActiveTerm } = await import("@/lib/active-term");
        const activeTerm = await checkAndGetActiveTerm();
        const termId = termIdParam ? parseInt(termIdParam) : activeTerm?.id;

        if (!termId) {
            return NextResponse.json({ error: "No active term found" }, { status: 400 });
        }

        // 1. Fetch courses, faculty, and existing review assignments
        const [courses, faculty, formA, formB, formC] = await Promise.all([
            prisma.course.findMany({
                include: {
                    department: { select: { id: true, name: true, code: true } },
                    sections: {
                        where: { termId },
                        include: {
                            lecturer: { select: { id: true, name: true, email: true, departmentId: true } }
                        }
                    }
                },
                orderBy: { code: "asc" }
            }),
            prisma.user.findMany({
                where: { role: { in: ["LECTURER", "HOD", "DEO"] } },
                select: { id: true, name: true, email: true, departmentId: true, role: true },
                orderBy: { name: "asc" }
            }),
            prisma.observation.findMany({
                where: { termId },
                include: { lecturer: true, observer: true }
            }),
            prisma.teachingObservation.findMany({
                where: { termId },
                include: { lecturer: true, observer: true }
            }),
            prisma.examModeration.findMany({
                where: { termId },
                include: { lecturer: true, moderator: true }
            })
        ]);

        // 2. Build map of existing assignments per courseCode + lecturerId
        const matrix = courses.map(course => {
            const assignedLecturer = course.sections[0]?.lecturer || null;
            const instructor = assignedLecturer || faculty.find(f => f.departmentId === course.departmentId) || faculty[0];

            const existingA = formA.find(a => a.courseCode === course.code && (!instructor || a.lecturerId === instructor.id));
            const existingB = formB.find(b => b.courseCode === course.code && (!instructor || b.lecturerId === instructor.id));
            const existingC = formC.find(c => c.courseCode === course.code && (!instructor || c.lecturerId === instructor.id));

            return {
                courseId: course.id,
                courseCode: course.code,
                courseTitle: course.title,
                domain: course.domain || "General Computing",
                departmentId: course.departmentId,
                departmentName: course.department?.name || "General",
                instructor: instructor ? { id: instructor.id, name: instructor.name, email: instructor.email } : null,
                isAssignedSection: Boolean(assignedLecturer),
                formA: existingA ? { id: existingA.id, reviewerId: existingA.observerId, reviewerName: existingA.observer?.name, status: existingA.status } : null,
                formB: existingB ? { id: existingB.id, observerId: existingB.observerId, observerName: existingB.observer?.name, status: existingB.status } : null,
                formC: existingC ? { id: existingC.id, moderatorId: existingC.moderatorId, moderatorName: existingC.moderator?.name, status: existingC.status } : null,
            };
        });

        // 3. Compute workload statistics
        const workloadMap: Record<number, { name: string; countA: number; countB: number; countC: number; total: number }> = {};
        faculty.forEach(f => {
            workloadMap[f.id] = { name: f.name, countA: 0, countB: 0, countC: 0, total: 0 };
        });

        formA.forEach(a => {
            if (workloadMap[a.observerId]) {
                workloadMap[a.observerId].countA++;
                workloadMap[a.observerId].total++;
            }
        });
        formB.forEach(b => {
            if (workloadMap[b.observerId]) {
                workloadMap[b.observerId].countB++;
                workloadMap[b.observerId].total++;
            }
        });
        formC.forEach(c => {
            if (workloadMap[c.moderatorId]) {
                workloadMap[c.moderatorId].countC++;
                workloadMap[c.moderatorId].total++;
            }
        });

        const workloadList = Object.entries(workloadMap).map(([id, data]) => ({
            facultyId: parseInt(id),
            ...data
        })).sort((a, b) => b.total - a.total);

        return NextResponse.json({
            matrix,
            faculty,
            workloadList,
            termId
        });
    } catch (error: any) {
        console.error("Pairing GET error:", error);
        return NextResponse.json({ error: error.message || "Failed to load pairing matrix" }, { status: 500 });
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
        const { pairings, termId: reqTermId } = body;

        if (!Array.isArray(pairings) || pairings.length === 0) {
            return NextResponse.json({ error: "Invalid pairings array provided." }, { status: 400 });
        }

        const { checkAndGetActiveTerm } = await import("@/lib/active-term");
        const activeTerm = await checkAndGetActiveTerm();
        const termId = reqTermId ? parseInt(reqTermId) : activeTerm?.id;

        if (!termId) {
            return NextResponse.json({ error: "No active term found" }, { status: 400 });
        }

        let createdA = 0;
        let createdB = 0;
        let createdC = 0;
        let updatedCount = 0;

        for (const item of pairings as PairingPayloadItem[]) {
            const { courseCode, lecturerId, observerAId, observerBId, moderatorCId } = item;
            if (!courseCode || !lecturerId) continue;

            // Form A
            if (observerAId && observerAId !== lecturerId) {
                const existing = await prisma.observation.findFirst({
                    where: { courseCode, lecturerId, termId }
                });
                if (existing) {
                    if (existing.observerId !== observerAId) {
                        await prisma.observation.update({
                            where: { id: existing.id },
                            data: { observerId: observerAId }
                        });
                        updatedCount++;
                    }
                } else {
                    await prisma.observation.create({
                        data: {
                            courseCode,
                            lecturerId,
                            observerId: observerAId,
                            termId,
                            status: "PENDING"
                        }
                    });
                    createdA++;
                }
            }

            // Form B
            if (observerBId && observerBId !== lecturerId) {
                const existing = await prisma.teachingObservation.findFirst({
                    where: { courseCode, lecturerId, termId }
                });
                if (existing) {
                    if (existing.observerId !== observerBId) {
                        await prisma.teachingObservation.update({
                            where: { id: existing.id },
                            data: { observerId: observerBId }
                        });
                        updatedCount++;
                    }
                } else {
                    await prisma.teachingObservation.create({
                        data: {
                            courseCode,
                            lecturerId,
                            observerId: observerBId,
                            deoId,
                            termId,
                            status: "PENDING"
                        }
                    });
                    createdB++;
                }
            }

            // Form C
            if (moderatorCId && moderatorCId !== lecturerId) {
                const existing = await prisma.examModeration.findFirst({
                    where: { courseCode, lecturerId, termId }
                });
                if (existing) {
                    if (existing.moderatorId !== moderatorCId) {
                        await prisma.examModeration.update({
                            where: { id: existing.id },
                            data: { moderatorId: moderatorCId }
                        });
                        updatedCount++;
                    }
                } else {
                    await prisma.examModeration.create({
                        data: {
                            courseCode,
                            lecturerId,
                            moderatorId: moderatorCId,
                            deoId,
                            termId,
                            status: "PENDING"
                        }
                    });
                    createdC++;
                }
            }
        }

        const totalCreated = createdA + createdB + createdC;

        await logAction({
            userId: deoId,
            action: "UPDATE_PAIRING_MATRIX",
            details: `DEO updated peer review matrix for Term ${termId}: ${totalCreated} created, ${updatedCount} reviewer assignments updated.`
        });

        return NextResponse.json({
            success: true,
            message: `Pairing matrix committed! ${totalCreated} reviews created, ${updatedCount} updated.`,
            summary: { totalCreated, createdA, createdB, createdC, updatedCount }
        });
    } catch (error: any) {
        console.error("Pairing POST error:", error);
        return NextResponse.json({ error: error.message || "Failed to commit pairing matrix" }, { status: 500 });
    }
}
