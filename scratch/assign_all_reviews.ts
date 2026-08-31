import { prisma } from "../lib/prisma";

async function main() {
    const activeTerm = await prisma.academicTerm.findFirst({ where: { isActive: true } });
    if (!activeTerm) {
        console.error("No active term found");
        process.exit(1);
    }

    const deo = await prisma.user.findFirst({ where: { role: "DEO" } });
    const lim = await prisma.user.findFirst({ where: { email: "slycrypto1@gmail.com" } });
    const red = await prisma.user.findFirst({ where: { email: "dherlharlhi20@gmail.com" } });
    const yhaw = await prisma.user.findFirst({ where: { email: "slyyhaw@gmail.com" } });

    if (!deo || !lim || !red || !yhaw) {
        console.error("Required users not found");
        process.exit(1);
    }

    const courseAssignments = [
        { code: "CS101", teacher: red.id, observer: yhaw.id, moderator: lim.id, venue: "Computer Lab 1", time: "08:30 AM - 10:30 AM", date: new Date("2026-09-12T08:30:00Z") },
        { code: "CS102", teacher: red.id, observer: lim.id, moderator: yhaw.id, venue: "Software Engineering Lab", time: "10:30 AM - 12:30 PM", date: new Date("2026-09-14T10:30:00Z") },
        { code: "CS201", teacher: red.id, observer: yhaw.id, moderator: lim.id, venue: "Computer Lab 2", time: "08:30 AM - 10:30 AM", date: new Date("2026-09-16T08:30:00Z") },
        { code: "CS202", teacher: lim.id, observer: red.id, moderator: yhaw.id, venue: "Computer Lab 1", time: "01:30 PM - 03:30 PM", date: new Date("2026-09-18T13:30:00Z") },
        { code: "CS203", teacher: red.id, observer: lim.id, moderator: yhaw.id, venue: "Lecture Theatre 2", time: "10:30 AM - 12:30 PM", date: new Date("2026-09-21T10:30:00Z") },
        { code: "CS301", teacher: yhaw.id, observer: lim.id, moderator: red.id, venue: "Software Engineering Lab", time: "01:30 PM - 03:30 PM", date: new Date("2026-09-23T13:30:00Z") },
        { code: "CS302", teacher: lim.id, observer: red.id, moderator: yhaw.id, venue: "Computer Lab 2", time: "08:30 AM - 10:30 AM", date: new Date("2026-09-25T08:30:00Z") },
        { code: "CS303", teacher: red.id, observer: yhaw.id, moderator: lim.id, venue: "Systems & Networking Lab", time: "10:30 AM - 12:30 PM", date: new Date("2026-09-28T10:30:00Z") },
        { code: "CS401", teacher: yhaw.id, observer: red.id, moderator: lim.id, venue: "AI & Robotics Lab", time: "01:30 PM - 03:30 PM", date: new Date("2026-10-02T13:30:00Z") },
        { code: "CS402", teacher: lim.id, observer: yhaw.id, moderator: red.id, venue: "Software Engineering Lab", time: "08:30 AM - 10:30 AM", date: new Date("2026-10-05T08:30:00Z") },
        { code: "CS403", teacher: lim.id, observer: red.id, moderator: yhaw.id, venue: "Systems & Networking Lab", time: "10:30 AM - 12:30 PM", date: new Date("2026-10-08T10:30:00Z") }
    ];

    console.log("➤ Syncing Form A (Course Material Reviews)...");
    for (const ca of courseAssignments) {
        const existingA = await prisma.observation.findFirst({
            where: { courseCode: ca.code, termId: activeTerm.id, lecturerId: ca.teacher }
        });
        if (!existingA) {
            await prisma.observation.create({
                data: {
                    courseCode: ca.code,
                    lecturerId: ca.teacher,
                    observerId: ca.observer,
                    termId: activeTerm.id,
                    venue: ca.venue,
                    sessionDate: ca.date,
                    status: "PENDING",
                    reviewData: {
                        criteria: {
                            courseOutline: { formatConforms: null, descConforms: null, objSpecific: null, outcomesAchievable: null, topicsRelevant: null, remarks: {} },
                            mainTextbook: { isCurrent: null, isAccessible: null, coversContent: null, remarks: {} },
                            lectureNotes: { clear: null, concise: null, wellOrganized: null, linkedToContent: null, remarks: {} },
                            otherTLMs: { relevant: null, suitable: null, remarks: {} }
                        },
                        materialsReviewed: { courseOutline: true, mainTextbook: true, lectureNotes: true, otherTLMs: false },
                        strengthsWeaknesses: { courseOutline: { strengths: "", weaknesses: "" }, mainTextbook: { strengths: "", weaknesses: "" }, lectureNotes: { strengths: "", weaknesses: "" }, otherTLMs: { strengths: "", weaknesses: "" } }
                    }
                }
            });
        }
    }

    console.log("➤ Syncing Form B (Teaching Observations)...");
    for (const ca of courseAssignments) {
        const existingB = await prisma.teachingObservation.findFirst({
            where: { courseCode: ca.code, termId: activeTerm.id, lecturerId: ca.teacher }
        });
        if (!existingB) {
            const timeParts = ca.time.split(" - ");
            await prisma.teachingObservation.create({
                data: {
                    courseCode: ca.code,
                    lecturerId: ca.teacher,
                    observerId: ca.observer,
                    deoId: deo.id,
                    termId: activeTerm.id,
                    venue: ca.venue,
                    sessionDate: ca.date,
                    status: "PENDING",
                    formBData: {
                        metadata: {
                            programme: "B.Tech Computer Science",
                            lessonTopic: `${ca.code} Weekly Laboratory & Lecture`,
                            lessonPeriodFrom: timeParts[0],
                            lessonPeriodTo: timeParts[1],
                            observationPeriodFrom: timeParts[0],
                            observationPeriodTo: timeParts[1],
                            venue: ca.venue,
                            natureOfTeaching: "Practical & Theory",
                            modeOfDelivery: "Interactive Presentation & Live Coding"
                        },
                        criteria: {
                            startOfLesson: { punctual: null, suitablyDressed: null, reviewedPrevious: null, explainedObjectives: null, rapport: null, remarks: {} },
                            contentKnowledge: { knowledgeable: null, deliveredClearly: null, usedRelevantMaterials: null, connectedRealLife: null, respondedQuestions: null, remarks: {} },
                            delivery: { audible: null, paceAppropriate: null, modeAppropriate: null, sustainedAttention: null, allowedQuestions: null, allowedContributions: null, movementEquitable: null, deliveryEthical: null, remarks: {} },
                            conclusion: { summarizedSatisfactorily: null, gaveAssignment: null, encouragedExploration: null, remarks: {} }
                        },
                        strengthsWeaknesses: { strengths: "", weaknesses: "" },
                        recommendations: ""
                    }
                }
            });
        }
    }

    console.log("➤ Syncing Form C (Exam Moderations)...");
    for (const ca of courseAssignments) {
        const existingC = await prisma.examModeration.findFirst({
            where: { courseCode: ca.code, termId: activeTerm.id, lecturerId: ca.teacher }
        });
        if (!existingC) {
            await prisma.examModeration.create({
                data: {
                    courseCode: ca.code,
                    lecturerId: ca.teacher,
                    moderatorId: ca.moderator,
                    deoId: deo.id,
                    termId: activeTerm.id,
                    status: "PENDING",
                    reviewData: {
                        metadata: {
                            courseTitle: `${ca.code} Comprehensive Examination`,
                            examType: "End of Semester Examination",
                            totalMarks: 100,
                            durationMinutes: 120
                        },
                        criteria: {
                            syllabusCoverage: { compliant: null, comments: "" },
                            questionClarity: { compliant: null, comments: "" },
                            markingScheme: { compliant: null, comments: "" },
                            bloomsTaxonomy: { compliant: null, comments: "" },
                            timeAllocation: { compliant: null, comments: "" }
                        },
                        generalRemarks: "",
                        recommendation: "APPROVED"
                    }
                }
            });
        }
    }

    const totalA = await prisma.observation.count({ where: { termId: activeTerm.id } });
    const totalB = await prisma.teachingObservation.count({ where: { termId: activeTerm.id } });
    const totalC = await prisma.examModeration.count({ where: { termId: activeTerm.id } });
    console.log(`✅ Complete! Active Term Form A: ${totalA} | Form B: ${totalB} | Form C: ${totalC}`);
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
