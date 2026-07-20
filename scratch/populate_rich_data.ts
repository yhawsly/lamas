import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
    console.log("🌱 STARTING POPULATION OF RICH SIMULATION DATA...");

    const csDept = await prisma.department.findUnique({ where: { code: "CS" } });
    if (!csDept) {
        console.error("CS Department not found. Please run seed script first.");
        return;
    }

    const slyyhaw = await prisma.user.findUnique({ where: { email: "slyyhaw@gmail.com" } });
    const hod = await prisma.user.findUnique({ where: { email: "ghtrial41922@gmail.com" } });
    const deo = await prisma.user.findUnique({ where: { email: "deo@lamas.edu" } });
    const lecturer1 = await prisma.user.findUnique({ where: { email: "lecturer1@lamas.edu" } });

    if (!slyyhaw || !hod || !deo || !lecturer1) {
        console.error("Core users not found. Make sure base seed has run.");
        return;
    }

    const term = await prisma.academicTerm.findFirst({ where: { isActive: true } });
    if (!term) {
        console.error("No active academic term found.");
        return;
    }

    console.log("   ➤ Creating additional Deadlines...");
    const dlCalendar = await prisma.deadline.create({
        data: {
            type: "SEMESTER_CALENDAR",
            label: "Mid-Term Calendar Audit",
            dueDate: new Date("2026-06-15T23:59:00Z"),
            createdBy: hod.id,
            termId: term.id,
        }
    });

    const dlWeekly = await prisma.deadline.create({
        data: {
            type: "WEEKLY_TOPICS",
            label: "Weekly Topics Lesson Planning - Phase 2",
            dueDate: new Date("2026-07-25T23:59:00Z"),
            createdBy: hod.id,
            termId: term.id,
        }
    });

    console.log("   ➤ Seeding Submissions for Slyyhaw (Lecturer ID: 4)...");
    
    // Approved Semester Calendar
    await prisma.submission.create({
        data: {
            lecturerId: slyyhaw.id,
            type: "SEMESTER_CALENDAR",
            title: "CS102 - Semester Calendar 2025/2026",
            content: { note: "Approved semester calendar for programming fundamentals", weeks: [1, 2, 3, 4, 5, 6, 7, 8] },
            status: "APPROVED",
            submittedAt: new Date("2026-03-10T10:00:00Z"),
            termId: term.id,
            feedback: "Excellent layout. Matches learning objectives perfectly."
        }
    });

    // Rejected Syllabus
    await prisma.submission.create({
        data: {
            lecturerId: slyyhaw.id,
            type: "COURSE_TOPICS",
            title: "CS201 - Data Structures Outline (Draft 1)",
            content: { note: "Rejected draft", topics: ["Arrays", "Lists"] },
            status: "REJECTED",
            submittedAt: new Date("2026-03-12T14:30:00Z"),
            termId: term.id,
            feedback: "Please include advanced topics like Red-Black trees and Graph algorithms."
        }
    });

    // Submitted Calendar (Pending Review)
    await prisma.submission.create({
        data: {
            lecturerId: slyyhaw.id,
            type: "SEMESTER_CALENDAR",
            title: "CS301 - Web Development Semester Calendar",
            content: { note: "Awaiting approval for Web dev calendar", weeks: [1, 2, 3, 4, 5] },
            status: "SUBMITTED",
            submittedAt: new Date(),
            termId: term.id,
            deadlineId: dlCalendar.id
        }
    });

    // Late Submission
    await prisma.submission.create({
        data: {
            lecturerId: slyyhaw.id,
            type: "WEEKLY_TOPICS",
            title: "CS203 - Discrete Mathematics Weekly Outline",
            content: { note: "Late submission due to medical leave", weeks: [1, 2] },
            status: "LATE",
            submittedAt: new Date(),
            termId: term.id,
            deadlineId: dlWeekly.id
        }
    });

    console.log("   ➤ Seeding classroom peer observations...");

    // Scheduled Pending Observation
    await prisma.observation.create({
        data: {
            lecturerId: slyyhaw.id,
            observerId: hod.id,
            sessionDate: new Date("2026-07-28T09:00:00Z"),
            venue: "Lecture Theatre 2",
            courseCode: "CS201",
            status: "PENDING",
            termId: term.id
        }
    });

    // Completed Peer Observation
    await prisma.observation.create({
        data: {
            lecturerId: slyyhaw.id,
            observerId: lecturer1.id,
            sessionDate: new Date("2026-05-15T11:00:00Z"),
            venue: "Computer Lab 3",
            courseCode: "CS102",
            status: "COMPLETED",
            feedback: "Strong student interaction. Used practical coding assignments very effectively.",
            termId: term.id,
            reviewData: {
                introduction: "Started class on time and reviewed previous concepts.",
                delivery: "Clear explanation of recursion with slide decks and board work.",
                conclusion: "Summarized key points and gave a brief homework assignment."
            }
        }
    });

    // Observation where slyyhaw is the observer
    await prisma.observation.create({
        data: {
            lecturerId: lecturer1.id,
            observerId: slyyhaw.id,
            sessionDate: new Date("2026-06-10T14:00:00Z"),
            venue: "Lecture Theatre 1",
            courseCode: "CS401",
            status: "COMPLETED",
            feedback: "Advanced concepts explained with high clarity. Excellent student participation.",
            termId: term.id,
            reviewData: {
                delivery: "Presented neural network weights update math in a very understandable way."
            }
        }
    });

    console.log("   ➤ Seeding Exam Moderation Form C records...");

    // Scheduled Exam Moderation
    await prisma.examModeration.create({
        data: {
            courseCode: "CS302",
            lecturerId: slyyhaw.id,
            moderatorId: lecturer1.id,
            deoId: deo.id,
            termId: term.id,
            status: "PENDING"
        }
    });

    // Completed Exam Moderation
    await prisma.examModeration.create({
        data: {
            courseCode: "CS101",
            lecturerId: lecturer1.id,
            moderatorId: slyyhaw.id,
            deoId: deo.id,
            termId: term.id,
            status: "COMPLETED",
            reviewData: {
                syllabusCoverage: "Covers all 8 key learning areas.",
                standardLevel: "Questions meet level 100 specifications.",
                marksDistribution: "Balanced distribution across theory and practice."
            }
        }
    });

    console.log("   ➤ Seeding Teaching Observation Form B records...");

    // Scheduled Lesson Observation Form B
    await prisma.teachingObservation.create({
        data: {
            courseCode: "CS201",
            lecturerId: slyyhaw.id,
            observerId: lecturer1.id,
            deoId: deo.id,
            termId: term.id,
            sessionDate: new Date("2026-07-29T10:30:00Z"),
            venue: "Seminar Room B",
            status: "PENDING"
        }
    });

    // Completed Lesson Observation Form B
    await prisma.teachingObservation.create({
        data: {
            courseCode: "CS102",
            lecturerId: lecturer1.id,
            observerId: slyyhaw.id,
            deoId: deo.id,
            termId: term.id,
            sessionDate: new Date("2026-06-05T09:00:00Z"),
            venue: "Computer Lab 2",
            status: "COMPLETED",
            formBData: {
                prePlanning: "Detailed lesson outline was shared.",
                execution: "Demonstrated live programming techniques.",
                studentResponse: "Active participation in debugging tasks."
            }
        }
    });

    console.log("   ➤ Seeding Resource Library uploads for CS Department...");
    await prisma.resource.create({
        data: {
            title: "Advanced Data Structures Lecture Notes",
            description: "Full study slide deck covering B-Trees, Segment Trees, and Tries.",
            url: "/uploads/advanced-dsa-notes.pdf",
            lecturerId: slyyhaw.id,
            departmentId: csDept.id,
            type: "PDF",
            status: "APPROVED",
            feedback: "Approved for Level 200 student access."
        }
    });

    await prisma.resource.create({
        data: {
            title: "Web Development Project Guideline",
            description: "Term project outline and grading rubric for CS301.",
            url: "/uploads/webdev-project.pdf",
            lecturerId: slyyhaw.id,
            departmentId: csDept.id,
            type: "DOCUMENT",
            status: "PENDING"
        }
    });

    console.log("   ➤ Seeding notification streams...");
    await prisma.notification.create({
        data: {
            userId: slyyhaw.id,
            message: "Your Semester Calendar for CS102 has been APPROVED by the Head of Department.",
            read: false,
        }
    });

    await prisma.notification.create({
        data: {
            userId: slyyhaw.id,
            message: "A new Peer Observation session (CS201) has been scheduled on 28 July 2026.",
            read: false,
        }
    });

    await prisma.notification.create({
        data: {
            userId: slyyhaw.id,
            message: "You have been assigned to moderate the CS101 final examination paper.",
            read: true,
        }
    });

    console.log("\n🚀 RICH DATABASE POPULATION COMPLETE!");
    console.log("--------------------------------------------------");
}

main()
    .catch(e => {
        console.error("❌ Population failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
