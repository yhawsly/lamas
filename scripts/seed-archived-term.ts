import "dotenv/config";
import { prisma } from "../lib/prisma";
import { SubmissionType, SubmissionStatus, ObservationStatus } from "@prisma/client";

async function main() {
    console.log("🚀 POPULATING ARCHIVED SEMESTER (Term ID: 1) WITH COMPREHENSIVE DATA...");

    const term1 = await prisma.academicTerm.findUnique({ where: { id: 1 } });
    if (!term1) {
        console.error("❌ Archived Term with ID 1 not found.");
        return;
    }

    console.log(`   Found Archived Term: "${term1.name}" (${term1.startDate.toISOString().slice(0, 10)} to ${term1.endDate.toISOString().slice(0, 10)})`);

    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } }) || await prisma.user.findFirst();
    const hod = await prisma.user.findFirst({ where: { role: "HOD" } }) || admin;
    const deo = await prisma.user.findFirst({ where: { role: "DEO" } }) || admin;

    // Fetch key lecturers
    const lecturers = await prisma.user.findMany({
        where: { role: { in: ["LECTURER", "HOD", "DEO"] } },
        take: 10
    });

    if (lecturers.length < 2) {
        console.error("❌ Not enough lecturers found in database.");
        return;
    }

    const [u1, u2, u3, u4] = lecturers;
    const l1 = u1.id;
    const l2 = u2.id;
    const l3 = (u3 || u1).id;
    const l4 = (u4 || u2).id;

    console.log(`   Using core faculty: ID ${l1} (${u1.name}), ID ${l2} (${u2.name}), ID ${l3} (${u3?.name}), ID ${l4} (${u4?.name})`);

    // 1. DEADLINES FOR ARCHIVED TERM 1
    console.log("   ➤ Setting up Term 1 Milestones / Deadlines...");
    const deadlineDefs = [
        { type: SubmissionType.SEMESTER_CALENDAR, label: "Semester 1 Academic Calendar", dueDate: new Date("2026-01-26T23:59:59Z") },
        { type: SubmissionType.COURSE_TOPICS, label: "Course Topics & Syllabus Outline", dueDate: new Date("2026-02-09T23:59:59Z") },
        { type: SubmissionType.WEEKLY_TOPICS, label: "Mid-Term Lecture Progress Log (Week 8)", dueDate: new Date("2026-03-16T23:59:59Z") },
        { type: SubmissionType.OBSERVATION_REPORT, label: "Peer Teaching Observation APR Form A (Week 9)", dueDate: new Date("2026-03-23T23:59:59Z") },
        { type: SubmissionType.WEEKLY_TOPICS, label: "End of Term Lecture & Revision Log (Week 14)", dueDate: new Date("2026-05-04T23:59:59Z") },
    ];

    const deadlines: any[] = [];
    for (const d of deadlineDefs) {
        let dl = await prisma.deadline.findFirst({
            where: { termId: term1.id, type: d.type }
        });
        if (!dl) {
            dl = await prisma.deadline.create({
                data: {
                    type: d.type,
                    label: d.label,
                    dueDate: d.dueDate,
                    termId: term1.id,
                    createdBy: (hod?.id || admin?.id) as number,
                }
            });
        }
        deadlines.push(dl);
    }
    console.log(`   ✓ Verified/created ${deadlines.length} milestone deadlines for Term 1`);

    // 2. SUBMISSIONS FOR TERM 1 (variety of statuses: APPROVED, REVIEWED, LATE)
    console.log("   ➤ Creating submissions for Term 1...");
    const sampleSubmissions = [
        // On-time Approved Calendar
        {
            lecturerId: l1,
            type: SubmissionType.SEMESTER_CALENDAR,
            deadlineId: deadlines[0].id,
            title: "CS101 - Semester 1 Calendar & Lecture Plan",
            status: SubmissionStatus.APPROVED,
            submittedAt: new Date("2026-01-22T14:30:00Z"),
            feedback: "Comprehensive calendar alignment with departmental standards.",
            content: {
                weeks: 14,
                lectureHoursPerWeek: 3,
                labHoursPerWeek: 2,
                notes: "Aligned with ABET accreditation guidelines."
            }
        },
        // On-time Approved Topics
        {
            lecturerId: l1,
            type: SubmissionType.COURSE_TOPICS,
            deadlineId: deadlines[1].id,
            title: "CS101 - Detailed Course Topics & Learning Outcomes",
            status: SubmissionStatus.APPROVED,
            submittedAt: new Date("2026-02-05T09:15:00Z"),
            feedback: "Well-structured learning outcomes.",
            content: {
                topics: [
                    "Introduction to Computing & Algorithms",
                    "Variables, Types & Memory Models",
                    "Control Structures & Modular Functions",
                    "Arrays, Pointers & Dynamic Allocation"
                ]
            }
        },
        // Late Submission (to show LATE status in compliance & audit!)
        {
            lecturerId: l1,
            type: SubmissionType.WEEKLY_TOPICS,
            deadlineId: deadlines[2].id,
            title: "CS101 - Mid-Term Log & Topics Covered (Late)",
            status: SubmissionStatus.LATE,
            submittedAt: new Date("2026-03-20T16:45:00Z"), // 4 days past March 16 deadline
            feedback: "Submitted past the cutoff date. Log verified and approved for records.",
            content: {
                midtermReview: "Weeks 1-7 completed. 94% syllabus coverage on schedule."
            }
        },
        // Lecturer 2 Approved Calendar
        {
            lecturerId: l2,
            type: SubmissionType.SEMESTER_CALENDAR,
            deadlineId: deadlines[0].id,
            title: "CS201 - Data Structures Semester Schedule",
            status: SubmissionStatus.APPROVED,
            submittedAt: new Date("2026-01-24T11:00:00Z"),
            feedback: "Excellent schedule distribution.",
            content: { weeks: 14, sessions: 28 }
        },
        // Lecturer 2 Approved Topics
        {
            lecturerId: l2,
            type: SubmissionType.COURSE_TOPICS,
            deadlineId: deadlines[1].id,
            title: "CS201 - Advanced Data Structures Topic Breakdown",
            status: SubmissionStatus.APPROVED,
            submittedAt: new Date("2026-02-07T13:20:00Z"),
            feedback: "Approved by HOD.",
            content: { topics: ["Stacks & Queues", "Linked Lists", "Balanced Trees", "Graph Algorithms"] }
        },
        // Lecturer 2 Mid-Term Log (Reviewed)
        {
            lecturerId: l2,
            type: SubmissionType.WEEKLY_TOPICS,
            deadlineId: deadlines[2].id,
            title: "CS201 - Week 8 Progress & Continuous Assessment Log",
            status: SubmissionStatus.REVIEWED,
            submittedAt: new Date("2026-03-14T10:00:00Z"),
            feedback: "Verified by Department QA Committee.",
            content: { midtermsConducted: true, quizzesGraded: 3 }
        },
        // Lecturer 3 End of Term Log
        {
            lecturerId: l3,
            type: SubmissionType.WEEKLY_TOPICS,
            deadlineId: deadlines[4].id,
            title: "CS301 - End of Term Complete Course Dossier",
            status: SubmissionStatus.APPROVED,
            submittedAt: new Date("2026-04-28T15:00:00Z"),
            feedback: "Complete and archival-grade quality.",
            content: { examPapersIncluded: true, sampleScriptsGraded: 15 }
        }
    ];

    for (const sub of sampleSubmissions) {
        const existing = await prisma.submission.findFirst({
            where: {
                lecturerId: sub.lecturerId,
                termId: term1.id,
                type: sub.type,
                title: sub.title
            }
        });
        if (!existing) {
            await prisma.submission.create({
                data: {
                    lecturerId: sub.lecturerId,
                    termId: term1.id,
                    type: sub.type,
                    deadlineId: sub.deadlineId,
                    title: sub.title,
                    status: sub.status,
                    submittedAt: sub.submittedAt,
                    feedback: sub.feedback,
                    content: sub.content
                }
            });
        }
    }
    console.log("   ✓ Submissions created for Term 1");

    // 3. REVIEWS: FORM A (Instructional Material Observations)
    console.log("   ➤ Creating Form A Peer Reviews for Term 1...");
    const formAData = [
        {
            courseCode: "CS101",
            lecturerId: l1,
            observerId: l2,
            venue: "AVIC LAB",
            sessionDate: new Date("2026-03-10T09:00:00Z"),
            status: "COMPLETED",
            feedback: "Course outline is thoroughly articulated with clear objectives. Lecture slides and lab sheets are exceptionally organized."
        },
        {
            courseCode: "CS102",
            lecturerId: l2,
            observerId: l1,
            venue: "ARAD LAB",
            sessionDate: new Date("2026-03-12T11:00:00Z"),
            status: "COMPLETED",
            feedback: "Textbook references are up to date. Lab manuals provide hands-on programming tasks."
        },
        {
            courseCode: "CS201",
            lecturerId: l3,
            observerId: l4,
            venue: "MAIN OCTAGON",
            sessionDate: new Date("2026-03-17T14:00:00Z"),
            status: "COMPLETED",
            feedback: "Comprehensive syllabus and lecture notes reviewed and signed off."
        },
        {
            courseCode: "CS301",
            lecturerId: l4,
            observerId: l3,
            venue: "DIGITAL LAB",
            sessionDate: new Date("2026-03-19T10:30:00Z"),
            status: "COMPLETED",
            feedback: "Excellent adherence to departmental rubrics."
        }
    ];

    for (const a of formAData) {
        const existingA = await prisma.observation.findFirst({
            where: { courseCode: a.courseCode, termId: term1.id, lecturerId: a.lecturerId }
        });
        if (!existingA) {
            await prisma.observation.create({
                data: {
                    courseCode: a.courseCode,
                    lecturerId: a.lecturerId,
                    observerId: a.observerId,
                    termId: term1.id,
                    venue: a.venue,
                    sessionDate: a.sessionDate,
                    status: a.status as ObservationStatus,
                    feedback: a.feedback,
                    reviewData: {
                        criteria: {
                            courseOutline: { formatConforms: 3, descConforms: 3, objSpecific: 3, outcomesAchievable: 3, topicsRelevant: 3, remarks: {} },
                            mainTextbook: { isCurrent: 3, isAccessible: 3, coversContent: 3, remarks: {} },
                            lectureNotes: { clear: 3, concise: 3, wellOrganized: 3, linkedToContent: 3, remarks: {} },
                            otherTLMs: { relevant: 3, suitable: 3, remarks: {} }
                        },
                        materialsReviewed: { courseOutline: true, mainTextbook: true, lectureNotes: true, otherTLMs: true },
                        strengthsWeaknesses: {
                            courseOutline: { strengths: "Clear structure and weekly expectations", weaknesses: "None noted" },
                            mainTextbook: { strengths: "Current 2024 edition cited", weaknesses: "None" },
                            lectureNotes: { strengths: "High quality diagrams and code listings", weaknesses: "None" },
                            otherTLMs: { strengths: "GitHub repository with starter templates", weaknesses: "None" }
                        }
                    }
                }
            });
        }
    }
    console.log("   ✓ Form A Observations created for Term 1");

    // 4. REVIEWS: FORM B (Teaching Observations)
    console.log("   ➤ Creating Form B Teaching Observations for Term 1...");
    const formBData = [
        {
            courseCode: "CS101",
            lecturerId: l1,
            observerId: l2,
            venue: "AVIC LAB",
            sessionDate: new Date("2026-03-24T08:30:00Z"),
            status: "COMPLETED",
            remarks: "Dynamic lecture engagement. Students participated actively in code walkthroughs.",
            topic: "Introduction to Recursion and Call Stack Mechanics"
        },
        {
            courseCode: "CS102",
            lecturerId: l2,
            observerId: l1,
            venue: "FAD LAB",
            sessionDate: new Date("2026-03-26T10:45:00Z"),
            status: "COMPLETED",
            remarks: "Clear pacing, good use of the whiteboard and live terminal demonstrations.",
            topic: "Pointer Arithmetic and Dynamic Memory in C++"
        },
        {
            courseCode: "CS201",
            lecturerId: l3,
            observerId: l4,
            venue: "BASEMENT",
            sessionDate: new Date("2026-03-31T13:30:00Z"),
            status: "COMPLETED",
            remarks: "Theoretical foundations thoroughly covered with concrete real-world examples.",
            topic: "AVL Tree Rotations and Balance Factors"
        },
        {
            courseCode: "CS301",
            lecturerId: l4,
            observerId: l3,
            venue: "OCTAGON WING",
            sessionDate: new Date("2026-04-02T09:00:00Z"),
            status: "COMPLETED",
            remarks: "Superb classroom management and effective formative assessment questioning.",
            topic: "Software Architecture Patterns: Microservices vs Monoliths"
        },
        {
            courseCode: "CS202",
            lecturerId: l1,
            observerId: l3,
            venue: "V BLOCK",
            sessionDate: new Date("2026-04-07T11:00:00Z"),
            status: "COMPLETED",
            remarks: "Practical lab exercise guided seamlessly. High student comprehension demonstrated.",
            topic: "Relational Database Schema Normalization (3NF & BCNF)"
        }
    ];

    for (const b of formBData) {
        const existingB = await prisma.teachingObservation.findFirst({
            where: { courseCode: b.courseCode, termId: term1.id, lecturerId: b.lecturerId }
        });
        if (!existingB) {
            await prisma.teachingObservation.create({
                data: {
                    courseCode: b.courseCode,
                    lecturerId: b.lecturerId,
                    observerId: b.observerId,
                    termId: term1.id,
                    deoId: (deo?.id || admin?.id || 1) as number,
                    venue: b.venue,
                    sessionDate: b.sessionDate,
                    status: b.status as ObservationStatus,
                    formBData: {
                        metadata: {
                            programme: "B.Tech Computer Science",
                            lessonTopic: b.topic,
                            modeOfDelivery: "Face-to-face lecture & live demonstration",
                            venue: b.venue,
                            lessonPeriodFrom: "08:30",
                            lessonPeriodTo: "10:30",
                            observationPeriodFrom: "08:35",
                            observationPeriodTo: "10:25",
                            natureOfTeaching: "Practical"
                        },
                        responses: {
                            c1: 3, c2: 3, c3: 3, c4: 2, c5: 3,
                            c6: 3, c7: 3, c8: 3, c9: 3, c10: 2,
                            c11: 3, c12: 3, c13: 3, c14: 3, c15: 3
                        },
                        generalComments: b.remarks
                    }
                }
            });
        }
    }
    console.log("   ✓ Form B Teaching Observations created for Term 1");

    // 5. REVIEWS: FORM C (Exam Moderations)
    console.log("   ➤ Creating Form C Exam Moderations for Term 1...");
    const formCData = [
        {
            courseCode: "CS101",
            lecturerId: l1,
            moderatorId: l2,
            status: "COMPLETED",
            comments: "All exam questions align with stated syllabus learning outcomes. Marking scheme is transparent and precise."
        },
        {
            courseCode: "CS102",
            lecturerId: l2,
            moderatorId: l1,
            status: "COMPLETED",
            comments: "Question paper adheres to Bloom's taxonomy distribution. Sample answer key validated."
        },
        {
            courseCode: "CS201",
            lecturerId: l3,
            moderatorId: l4,
            status: "COMPLETED",
            comments: "Section A and Section B mark weightings correctly balance theory and code analysis."
        },
        {
            courseCode: "CS301",
            lecturerId: l4,
            moderatorId: l3,
            status: "COMPLETED",
            comments: "Final examination paper approved without amendments."
        }
    ];

    for (const c of formCData) {
        const existingC = await prisma.examModeration.findFirst({
            where: { courseCode: c.courseCode, termId: term1.id, lecturerId: c.lecturerId }
        });
        if (!existingC) {
            await prisma.examModeration.create({
                data: {
                    courseCode: c.courseCode,
                    lecturerId: c.lecturerId,
                    moderatorId: c.moderatorId,
                    termId: term1.id,
                    deoId: (deo?.id || admin?.id || 1) as number,
                    status: c.status as ObservationStatus,
                    reviewData: {
                        comments: c.comments,
                        isApproved: true,
                        approvalDate: new Date("2026-05-15T12:00:00Z").toISOString(),
                        checks: {
                            questionsAlignedWithOutcomes: true,
                            markingSchemeAccurate: true,
                            timeAllocationReasonable: true,
                            clarityOfInstructions: true
                        }
                    }
                }
            });
        }
    }
    console.log("   ✓ Form C Exam Moderations created for Term 1");

    // 6. UPDATE SECTION VENUES TO OUR INSTITUTIONAL VENUES
    console.log("   ➤ Updating Term 1 CourseSection venues with official institutional venues...");
    const institutionalVenues = ["AVIC LAB", "ARAD LAB", "MAIN OCTAGON", "FAD LAB", "BASEMENT", "DIGITAL LAB", "OCTAGON WING", "V BLOCK"];
    const sections = await prisma.courseSection.findMany({ where: { termId: term1.id } });
    for (let i = 0; i < sections.length; i++) {
        const sec = sections[i];
        const assignedVenue = institutionalVenues[i % institutionalVenues.length];
        await prisma.courseSection.update({
            where: { id: sec.id },
            data: { venue: assignedVenue }
        });
    }
    console.log(`   ✓ Updated ${sections.length} course sections for Term 1 with official venues`);

    console.log("\n🎉 ARCHIVED SEMESTER POPULATION COMPLETE! Term 1 now has rich, comprehensive data across all tabs and review types.");
}

main().catch(err => {
    console.error("Error populating archived term:", err);
}).finally(async () => {
    await prisma.$disconnect();
});
