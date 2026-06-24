import cron from "node-cron";
import { prisma } from "@/lib/prisma";
import { sendNotificationEmail } from "@/lib/email";

let isCronStarted = false;

export function startCronJobs() {
    if (isCronStarted) return;
    isCronStarted = true;
    
    console.log("⏰ [CRON] Starting background schedule manager...");

    // Run every day at 8:00 AM (server time)
    cron.schedule("0 8 * * *", async () => {
        console.log("⏰ [CRON] Running daily deadline check...");
        await checkUpcomingDeadlines();
    });

    // In development, also run it once 10 seconds after boot to test it easily
    if (process.env.NODE_ENV === "development") {
        setTimeout(() => {
            console.log("⏰ [CRON] Running immediate dev test check...");
            checkUpcomingDeadlines();
        }, 10000);
    }
}

async function checkUpcomingDeadlines() {
    try {
        const now = new Date();
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(now.getDate() + 3);

        // Find deadlines due between now and 3 days from now
        const upcomingDeadlines = await prisma.deadline.findMany({
            where: {
                dueDate: {
                    gt: now,
                    lte: threeDaysFromNow
                }
            }
        });

        if (upcomingDeadlines.length === 0) {
            console.log("⏰ [CRON] No upcoming deadlines in the next 3 days.");
            return;
        }

        // Get all active lecturers
        const activeLecturers = await prisma.user.findMany({
            where: { role: "LECTURER", isActive: true },
            select: { id: true, email: true, name: true }
        });

        for (const deadline of upcomingDeadlines) {
            const timeDiff = new Date(deadline.dueDate).getTime() - now.getTime();
            const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
            
            console.log(`⏰ [CRON] Deadline '${deadline.label}' is due in ${daysLeft} days. Checking missing submissions...`);

            // Find missing submissions
            for (const lecturer of activeLecturers) {
                const submission = await prisma.submission.findFirst({
                    where: {
                        deadlineId: deadline.id,
                        lecturerId: lecturer.id
                    }
                });

                if (!submission) {
                    // Create an in-app notification
                    await prisma.notification.create({
                        data: {
                            userId: lecturer.id,
                            message: `Reminder: The deadline for "${deadline.label}" is due in ${daysLeft} days!`,
                        }
                    });

                    // Send an email
                    await sendNotificationEmail(
                        lecturer.email,
                        "Deadline Approaching: " + deadline.label,
                        `Hello ${lecturer.name},\n\nThis is a friendly reminder that the deadline for **${deadline.label}** is due in ${daysLeft} days.\n\nPlease log in to LAMAS and submit your work as soon as possible.`
                    );
                    
                    console.log(`⏰ [CRON] Sent reminder to ${lecturer.email} for ${deadline.label}`);
                }
            }
        }
    } catch (error) {
        console.error("⏰ [CRON] Error checking deadlines:", error);
    }
}
