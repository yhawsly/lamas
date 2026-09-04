import "dotenv/config";
import { prisma } from "../lib/prisma";
import { SubmissionType, SubmissionStatus } from "@prisma/client";

async function main() {
    console.log("🚀 Setting up distinct historical semesters and course outline archives...");

    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } }) || await prisma.user.findFirst();
    const sly = await prisma.user.findFirst({ where: { name: { contains: "Sylvester", mode: "insensitive" } } }) || admin;
    const redeemer = await prisma.user.findFirst({ where: { name: { contains: "Redeemer", mode: "insensitive" } } }) || admin;
    const sarah = await prisma.user.findFirst({ where: { name: { contains: "Sarah", mode: "insensitive" } } }) || admin;

    // 1. Ensure historical terms exist
    // Term 1: Semester 1 2025/2026
    const term1 = await prisma.academicTerm.findUnique({ where: { id: 1 } });
    if (!term1) {
        console.error("Term 1 not found!");
        return;
    }

    // 2. Fetch all courses
    const courses = await prisma.course.findMany({ orderBy: { id: "asc" } });

    // 3. For each course, ensure Term 1 (Semester 1 2025/2026) has an APPROVED historical outline
    
    // Specifically for CS101:
    // Update Submission 107 (Redeemer's CS101 Approved Outline) -> move to Term 1 (Semester 1 2025/2026)
    const sub107 = await prisma.submission.findUnique({ where: { id: 107 } });
    if (sub107) {
        await prisma.submission.update({
            where: { id: 107 },
            data: {
                termId: term1.id,
                title: "CS101 - Approved Course Outline & Syllabus",
                status: SubmissionStatus.APPROVED,
                submittedAt: new Date("2026-01-18T10:00:00Z"),
                feedback: "Approved by Head of Department for Semester 1 teaching."
            }
        });
        console.log(`✓ Updated Submission 107 (Redeemer CS101) -> Term 1 ("${term1.name}")`);
    }

    // Update Submission 106 (Sylvester's 14-week CS101 Outline) -> move to Term 1 (Semester 1 2025/2026) and mark APPROVED
    const sub106 = await prisma.submission.findUnique({ where: { id: 106 } });
    if (sub106) {
        await prisma.submission.update({
            where: { id: 106 },
            data: {
                termId: term1.id,
                title: "[CS101] Introduction to Computer Science & Systems — Course Outline & Syllabus",
                status: SubmissionStatus.APPROVED,
                submittedAt: new Date("2026-01-22T14:30:00Z"),
                feedback: "Approved by Curriculum Committee for 2025/2026 academic session."
            }
        });
        console.log(`✓ Updated Submission 106 (Sylvester CS101) -> Term 1 ("${term1.name}")`);
    }

    // Update other course outlines that were seeded as APPROVED reference outlines:
    // Move APPROVED reference outlines to Term 1 ("Semester 1 2025/2026") so they serve as immediate historical references!
    const approvedSubs = [
        { id: 109, courseCode: "CS201", lecturer: redeemer },
        { id: 112, courseCode: "CS301", lecturer: sly },
        { id: 117, courseCode: "CS403", lecturer: sarah },
    ];

    for (const item of approvedSubs) {
        const sub = await prisma.submission.findUnique({ where: { id: item.id } });
        if (sub) {
            await prisma.submission.update({
                where: { id: item.id },
                data: {
                    termId: term1.id,
                    submittedAt: new Date("2026-01-25T11:00:00Z"),
                    status: SubmissionStatus.APPROVED
                }
            });
            console.log(`✓ Updated Submission ${item.id} (${item.courseCode}) -> Term 1 ("${term1.name}")`);
        }
    }

    // For all remaining courses, ensure at least one APPROVED historical outline exists in Term 1 (Semester 1 2025/2026)
    for (const course of courses) {
        const existingInTerm1 = await prisma.submission.findFirst({
            where: {
                type: SubmissionType.COURSE_TOPICS,
                termId: term1.id,
                status: SubmissionStatus.APPROVED,
                content: {
                    path: ["courseId"],
                    equals: course.id
                }
            }
        });

        if (!existingInTerm1) {
            // Find any submission with this course's content
            const sampleSub = await prisma.submission.findFirst({
                where: {
                    type: SubmissionType.COURSE_TOPICS,
                    content: {
                        path: ["courseId"],
                        equals: course.id
                    }
                }
            });

            if (sampleSub) {
                const sampleContent = sampleSub.content as any;
                await prisma.submission.create({
                    data: {
                        title: `[${course.code}] ${course.title} — Approved Syllabus`,
                        lecturerId: redeemer!.id,
                        deadlineId: null,
                        type: SubmissionType.COURSE_TOPICS,
                        status: SubmissionStatus.APPROVED,
                        submittedAt: new Date("2026-02-02T09:00:00Z"),
                        termId: term1.id,
                        feedback: "Approved by Department Board.",
                        content: sampleContent
                    }
                });
                console.log(`✓ Created Term 1 approved outline for ${course.code}`);
            }
        }
    }

    console.log("\n🎉 HISTORICAL OUTLINES ASSIGNED TO GENUINE PREVIOUS SEMESTER (Semester 1 2025/2026)!");
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
