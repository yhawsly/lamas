import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { headers, cookies } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    await headers();
    await cookies();
    try {
        const rateLimit = checkRateLimit(req, "general");
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: "Rate limit exceeded. Please try again later." },
                { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter || 900) } }
            );
        }

        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const role = (session.user as any).role;
        if (!["DEO", "HOD", "ADMIN", "SUPER_ADMIN"].includes(role)) {
            return NextResponse.json({ error: "Forbidden: Only examination officers and HODs can trigger reminders." }, { status: 403 });
        }

        const body = await req.json();
        const { bulk, formType, reviewId, termId: reqTermId } = body;

        const { checkAndGetActiveTerm } = await import("@/lib/active-term");
        const activeTerm = await checkAndGetActiveTerm();
        const termId = reqTermId ? parseInt(reqTermId) : activeTerm?.id;

        const notificationsToCreate: { userId: number; message: string }[] = [];

        if (bulk) {
            // Nudge all pending reviewers across Forms A, B, and C
            const termFilter = termId ? { termId } : {};

            const [pendingObs, pendingTeach, pendingMod] = await Promise.all([
                prisma.observation.findMany({
                    where: { ...termFilter, status: "PENDING" },
                    include: { lecturer: { select: { name: true } }, observer: { select: { id: true, name: true } } }
                }),
                prisma.teachingObservation.findMany({
                    where: { ...termFilter, status: "PENDING" },
                    include: { lecturer: { select: { name: true } }, observer: { select: { id: true, name: true } } }
                }),
                prisma.examModeration.findMany({
                    where: { ...termFilter, status: "PENDING" },
                    include: { lecturer: { select: { name: true } }, moderator: { select: { id: true, name: true } } }
                }),
            ]);

            // Track unique reviewer notifications to avoid spamming multiple identical messages
            const reviewerMap = new Map<number, string[]>();

            pendingObs.forEach(o => {
                if (o.observerId) {
                    const list = reviewerMap.get(o.observerId) || [];
                    list.push(`Form A (Course Outline: ${o.courseCode})`);
                    reviewerMap.set(o.observerId, list);
                }
            });

            pendingTeach.forEach(t => {
                if (t.observerId) {
                    const list = reviewerMap.get(t.observerId) || [];
                    list.push(`Form B (Teaching Observation: ${t.courseCode})`);
                    reviewerMap.set(t.observerId, list);
                }
            });

            pendingMod.forEach(m => {
                if (m.moderatorId) {
                    const list = reviewerMap.get(m.moderatorId) || [];
                    list.push(`Form C (Exam Moderation: ${m.courseCode})`);
                    reviewerMap.set(m.moderatorId, list);
                }
            });

            reviewerMap.forEach((tasks, observerId) => {
                const taskSummary = tasks.slice(0, 3).join(", ") + (tasks.length > 3 ? ` and ${tasks.length - 3} more` : "");
                notificationsToCreate.push({
                    userId: observerId,
                    message: `DEO Reminder: You have ${tasks.length} pending academic peer review(s) awaiting completion: ${taskSummary}. Please review on your portal.`
                });
            });

        } else {
            // Individual nudge
            if (!formType || !reviewId) {
                return NextResponse.json({ error: "Missing formType or reviewId for individual reminder." }, { status: 400 });
            }

            if (formType === "A") {
                const record = await prisma.observation.findUnique({
                    where: { id: parseInt(reviewId) },
                    include: { lecturer: { select: { name: true } } }
                });
                if (record && record.observerId) {
                    const course = await prisma.course.findUnique({ where: { code: record.courseCode } });
                    const courseDisplay = course?.title ? `${record.courseCode} - ${course.title}` : record.courseCode;
                    notificationsToCreate.push({
                        userId: record.observerId,
                        message: `DEO Nudge: Please complete the Course Outline review (Form A) for ${courseDisplay} (Lecturer: ${record.lecturer?.name || 'Assigned Staff'}).`
                    });
                }
            } else if (formType === "B") {
                const record = await prisma.teachingObservation.findUnique({
                    where: { id: parseInt(reviewId) },
                    include: { lecturer: { select: { name: true } } }
                });
                if (record && record.observerId) {
                    const course = await prisma.course.findUnique({ where: { code: record.courseCode } });
                    const courseDisplay = course?.title ? `${record.courseCode} - ${course.title}` : record.courseCode;
                    notificationsToCreate.push({
                        userId: record.observerId,
                        message: `DEO Nudge: Please complete the Classroom Teaching Observation (Form B) for ${courseDisplay} (Lecturer: ${record.lecturer?.name || 'Assigned Staff'}).`
                    });
                }
            } else if (formType === "C") {
                const record = await prisma.examModeration.findUnique({
                    where: { id: parseInt(reviewId) },
                    include: { lecturer: { select: { name: true } } }
                });
                if (record && record.moderatorId) {
                    const course = await prisma.course.findUnique({ where: { code: record.courseCode } });
                    const courseDisplay = course?.title ? `${record.courseCode} - ${course.title}` : record.courseCode;
                    notificationsToCreate.push({
                        userId: record.moderatorId,
                        message: `DEO Nudge: Urgent exam paper moderation (Form C) for ${courseDisplay} is pending your evaluation.`
                    });
                }
            }
        }

        if (notificationsToCreate.length === 0) {
            return NextResponse.json({ success: true, count: 0, message: "No pending reviewers to notify." });
        }

        await prisma.notification.createMany({
            data: notificationsToCreate
        });

        // Dispatch Email Alerts asynchronously
        const { sendNotificationEmail } = await import("@/lib/email");
        const uniqueUserIds = Array.from(new Set(notificationsToCreate.map(n => n.userId)));
        const usersToEmail = await prisma.user.findMany({
            where: { id: { in: uniqueUserIds } },
            select: { id: true, email: true }
        });
        const userEmailMap = new Map(usersToEmail.map(u => [u.id, u.email]));

        for (const item of notificationsToCreate) {
            const email = userEmailMap.get(item.userId);
            if (email) {
                sendNotificationEmail(email, "Urgent: Academic Review Reminder", item.message).catch(console.error);
            }
        }

        return NextResponse.json({
            success: true,
            count: notificationsToCreate.length,
            message: `Successfully dispatched ${notificationsToCreate.length} reminder notification(s).`
        });

    } catch (error: any) {
        console.error("Failed to send reminders:", error);
        return NextResponse.json({ error: error.message || "Failed to send reminders." }, { status: 500 });
    }
}
