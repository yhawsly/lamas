import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { headers, cookies } from "next/headers";
import { logAction } from "@/lib/audit";
import { buildReciprocalPairingMap } from "@/features/allocations";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

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
            return NextResponse.json({ error: "Forbidden: Only Academic Officers may auto-provision reviews" }, { status: 403 });
        }

        const deoId = parseInt(session.user.id!);
        const body = await req.json().catch(() => ({}));
        const { termId: reqTermId } = body;

        const { checkAndGetActiveTerm } = await import("@/lib/active-term");
        const activeTerm = await checkAndGetActiveTerm();
        const termId = reqTermId ? parseInt(reqTermId) : activeTerm?.id;

        if (!termId) {
            return NextResponse.json({ error: "No active academic term found. Please create or activate a term first." }, { status: 400 });
        }

        // 1. Fetch all active courses with department & course sections for this term
        const [courses, allFaculty] = await Promise.all([
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
                where: {
                    role: { in: ["LECTURER", "HOD", "DEO"] },
                },
                select: { id: true, name: true, email: true, departmentId: true, role: true }
            })
        ]);

        if (courses.length === 0) {
            return NextResponse.json({ error: "No courses found in the curriculum." }, { status: 400 });
        }

        let createdA = 0;
        let createdB = 0;
        let createdC = 0;
        let skippedExisting = 0;
        const assignedCourses: string[] = [];
        const unassignedCourses: string[] = [];

        // 2. Build reciprocal pairing map across faculty ("You review me, I review you")
        const reciprocalPartnerMap = buildReciprocalPairingMap(allFaculty);

        // 3. Loop through every course to auto-provision Forms A, B, and C
        for (const course of courses) {
            // Find assigned instructor(s) from sections
            const sectionLecturers = Array.from(
                new Set(
                    (course.sections || [])
                        .map(s => s.lecturer)
                        .filter((l): l is NonNullable<typeof l> => l !== null)
                )
            );

            // If no sections assigned yet, try to find a lecturer in the course's department
            let primaryLecturer = sectionLecturers[0];
            if (!primaryLecturer) {
                const deptFaculty = allFaculty.filter(f => f.departmentId === course.departmentId);
                primaryLecturer = deptFaculty[0] || allFaculty[0];
            }

            if (!primaryLecturer) {
                unassignedCourses.push(course.code);
                continue;
            }

            const lecturerId = primaryLecturer.id;

            // Find eligible peer reviewers in the same department (excluding the lecturer)
            let eligibleReviewers = allFaculty.filter(
                f => f.id !== lecturerId && (!course.departmentId || f.departmentId === course.departmentId)
            );
            if (eligibleReviewers.length === 0) {
                eligibleReviewers = allFaculty.filter(f => f.id !== lecturerId);
            }

            // Reciprocal peer partner ("You review me, I review you")
            const partnerId = reciprocalPartnerMap[lecturerId];
            const partnerFaculty = allFaculty.find(f => f.id === partnerId && f.id !== lecturerId);

            const reviewerA = partnerFaculty || eligibleReviewers[0] || primaryLecturer;
            const reviewerB = partnerFaculty || eligibleReviewers[0] || primaryLecturer;
            const reviewerC = partnerFaculty || eligibleReviewers[1] || eligibleReviewers[0] || primaryLecturer;

            // Provision Form A (Instructional Materials Audit)
            const existingA = await prisma.observation.findFirst({
                where: { courseCode: course.code, lecturerId, termId }
            });
            if (!existingA && reviewerA.id !== lecturerId) {
                await prisma.observation.create({
                    data: {
                        courseCode: course.code,
                        lecturerId,
                        observerId: reviewerA.id,
                        termId,
                        status: "PENDING"
                    }
                });
                createdA++;
            } else {
                skippedExisting++;
            }

            // Provision Form B (Classroom Teaching Observation)
            const existingB = await prisma.teachingObservation.findFirst({
                where: { courseCode: course.code, lecturerId, termId }
            });
            if (!existingB && reviewerB.id !== lecturerId) {
                await prisma.teachingObservation.create({
                    data: {
                        courseCode: course.code,
                        lecturerId,
                        observerId: reviewerB.id,
                        deoId,
                        termId,
                        status: "PENDING"
                    }
                });
                createdB++;
            } else {
                skippedExisting++;
            }

            // Provision Form C (Exam Moderation)
            const existingC = await prisma.examModeration.findFirst({
                where: { courseCode: course.code, lecturerId, termId }
            });
            if (!existingC && reviewerC.id !== lecturerId) {
                await prisma.examModeration.create({
                    data: {
                        courseCode: course.code,
                        lecturerId,
                        moderatorId: reviewerC.id,
                        deoId,
                        termId,
                        status: "PENDING"
                    }
                });
                createdC++;
            } else {
                skippedExisting++;
            }

            assignedCourses.push(course.code);
        }

        const totalCreated = createdA + createdB + createdC;

        // 3. Log Audit Event
        await logAction({
            userId: deoId,
            action: "AUTO_PROVISION_REVIEWS",
            details: `DEO provisioned ${totalCreated} reviews across ${courses.length} courses for Term ${termId} (Form A: ${createdA}, Form B: ${createdB}, Form C: ${createdC}, Skipped: ${skippedExisting})`
        }).catch(console.error);

        return NextResponse.json({
            success: true,
            summary: {
                totalCreated,
                createdA,
                createdB,
                createdC,
                skippedExisting,
                totalCourses: courses.length,
                assignedCoursesCount: assignedCourses.length,
                unassignedCourses
            },
            message: `Successfully provisioned ${totalCreated} peer reviews across ${courses.length} courses (${skippedExisting} existing reviews skipped).`
        });
    } catch (error: any) {
        console.error("Bulk provision error:", error);
        return NextResponse.json({ error: error.message || "Failed to auto-provision reviews" }, { status: 500 });
    }
}
