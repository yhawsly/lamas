import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    // Basic API Key security for external CRON services (Vercel Cron, cron-job.org, etc.)
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const activeTerm = await prisma.academicTerm.findFirst({
            where: { isActive: true }
        });

        if (!activeTerm) {
            return NextResponse.json({ message: "No active term found. Skipping." });
        }

        const now = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(now.getDate() + 1);

        const notifications = [];

        // 1. Find upcoming deadlines (due within 24 hours)
        const upcomingDeadlines = await prisma.deadline.findMany({
            where: {
                termId: activeTerm.id,
                dueDate: {
                    gt: now,
                    lte: tomorrow
                }
            }
        });

        for (const deadline of upcomingDeadlines) {
            // Find assigned lecturers who HAVE NOT submitted
            const lecturers = await prisma.user.findMany({
                where: {
                    role: { in: ["LECTURER", "HOD"] },
                    submissions: {
                        none: {
                            deadlineId: deadline.id,
                            status: { in: ["SUBMITTED", "APPROVED", "PENDING"] }
                        }
                    }
                }
            });

            for (const lecturer of lecturers) {
                // Prevent duplicate notifications in the same 24 hours
                const existingNotif = await prisma.notification.findFirst({
                    where: {
                        userId: lecturer.id,
                        message: { contains: `Reminder: Deadline approaching - ${deadline.label}` },
                        createdAt: { gt: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
                    }
                });

                if (!existingNotif) {
                    notifications.push({
                        userId: lecturer.id,
                        message: `Reminder: Deadline approaching - ${deadline.label} is due on ${deadline.dueDate.toLocaleDateString()}`
                    });
                }
            }
        }

        // 2. Report overdue deadlines to Heads of Department
        const pastDeadlines = await prisma.deadline.findMany({
            where: {
                termId: activeTerm.id,
                dueDate: { lt: now }
            }
        });

        for (const deadline of pastDeadlines) {
            const lecturersMissing = await prisma.user.findMany({
                where: {
                    role: "LECTURER",
                    submissions: {
                        none: {
                            deadlineId: deadline.id,
                            status: { in: ["SUBMITTED", "APPROVED", "PENDING"] }
                        }
                    }
                },
                include: { department: true }
            });

            // Group missing lecturers by department
            const missingByDept: Record<number, string[]> = {};
            for (const lecturer of lecturersMissing) {
                if (lecturer.departmentId) {
                    if (!missingByDept[lecturer.departmentId]) missingByDept[lecturer.departmentId] = [];
                    missingByDept[lecturer.departmentId].push(lecturer.name);
                }
            }

            for (const [deptId, missingNames] of Object.entries(missingByDept)) {
                const hods = await prisma.user.findMany({
                    where: { departmentId: parseInt(deptId), role: "HOD" }
                });

                for (const hod of hods) {
                    // Send overdue report to HOD once a week
                    const existingNotif = await prisma.notification.findFirst({
                        where: {
                            userId: hod.id,
                            message: { contains: `Overdue Report: ${deadline.label}` },
                            createdAt: { gt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
                        }
                    });

                    if (!existingNotif) {
                        notifications.push({
                            userId: hod.id,
                            message: `Overdue Report: ${deadline.label}. Missing from: ${missingNames.join(", ")}`
                        });
                    }
                }
            }
        }

        if (notifications.length > 0) {
            await prisma.notification.createMany({ data: notifications });
            // Cannot use logAction safely with fake system user, so skipping it or using a generic approach
        }

        return NextResponse.json({ success: true, processedDeadlines: upcomingDeadlines.length + pastDeadlines.length, notificationsSent: notifications.length });

    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
