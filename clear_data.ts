import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    console.log("Clearing all compliance data...");

    // Delete Submission versions first
    await prisma.submissionVersion.deleteMany({});
    
    // Delete Submissions
    await prisma.submission.deleteMany({});

    // Delete Observations
    await prisma.observation.deleteMany({});
    
    // Delete TeachingObservations
    await prisma.teachingObservation.deleteMany({});
    
    // Delete ExamModerations
    await prisma.examModeration.deleteMany({});

    // Delete Notifications
    await prisma.notification.deleteMany({});

    // Delete Activity Logs (optional, but good for a full compliance reset)
    await prisma.activityLog.deleteMany({});

    console.log("Compliance data successfully cleared!");
}

main()
    .catch((e) => {
        console.error("Error clearing data:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
