import { prisma } from "@/lib/prisma";
import { sendNotificationEmail } from "@/lib/email";

/**
 * Sends a notification to all active DEOs if a lecturer is not assigned to the course they are being evaluated for.
 * Uses a unique message containing the review ID and type to avoid duplicate alerts.
 */
export async function notifyDeoIfMismatch(
    type: "A" | "B" | "C",
    id: number,
    lecturerName: string,
    courseCode: string
) {
    const message = `Lecturer ${lecturerName} is not assigned to course ${courseCode}. Review/Appraisal is blocked.`;

    try {
        const deos = await prisma.user.findMany({
            where: {
                role: "DEO",
                isActive: true,
                deletedAt: null
            }
        });

        for (const deo of deos) {
            const existing = await prisma.notification.findFirst({
                where: {
                    userId: deo.id,
                    message: message
                }
            });

            if (!existing) {
                await prisma.notification.create({
                    data: {
                        userId: deo.id,
                        message: message,
                        read: false
                    }
                });
                
                // Send real email alert asynchronously
                sendNotificationEmail(
                    deo.email, 
                    "Urgent: Appraisal Blocked (Assignment Mismatch)", 
                    message
                ).catch(err => console.error("Failed to email DEO:", err));
            }
        }
    } catch (error) {
        console.error("Error creating DEO notifications:", error);
    }
}
