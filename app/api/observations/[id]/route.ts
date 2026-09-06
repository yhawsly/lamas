import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const session = await auth();
        if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

        const observation = await prisma.observation.findUnique({
            where: { id: parseInt(id) },
            include: {
                lecturer: { select: { name: true, email: true } },
                observer: { select: { name: true, email: true } },
            }
        });

        if (!observation) return new NextResponse("Not Found", { status: 404 });

        const isAssigned = await prisma.courseSection.findFirst({
            where: {
                lecturerId: observation.lecturerId,
                course: {
                    code: observation.courseCode
                }
            }
        });

        if (!isAssigned) {
            const { notifyDeoIfMismatch } = await import("@/lib/deo-notification");
            notifyDeoIfMismatch("A", observation.id, observation.lecturer.name, observation.courseCode).catch(console.error);
        }

        return NextResponse.json({
            ...observation,
            isObserveeAssigned: !!isAssigned
        });
    } catch (err) {
        console.error("Failed to patch observation:", err);
        return new NextResponse("Error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const session = await auth();
        if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userId = parseInt(session.user.id!);
        const role = (session.user as any).role;

        const observation = await prisma.observation.findUnique({
            where: { id: parseInt(id) },
        });

        if (!observation) return NextResponse.json({ error: "Observation not found" }, { status: 404 });

        const body = await req.json();

        const hasFeedback = body.feedback !== undefined && body.feedback !== null && body.feedback.trim() !== "";
        const hasReviewData = body.reviewData !== undefined && body.reviewData !== null;
        const isSubmittingReview = hasFeedback || hasReviewData;

        // Security check:
        if (isSubmittingReview) {
            const isAssigned = await prisma.courseSection.findFirst({
                where: {
                    lecturerId: observation.lecturerId,
                    course: {
                        code: observation.courseCode
                    }
                }
            });

            if (!isAssigned) {
                return NextResponse.json({ error: "Review blocked: Lecturer is not assigned to this course." }, { status: 400 });
            }

            // Only the assigned observer or an HOD/DEO/Admin can submit evaluation review
            if (observation.observerId !== userId && !["HOD", "DEO", "ADMIN", "SUPER_ADMIN"].includes(role)) {
                return NextResponse.json({ error: "Forbidden: Only the assigned observer may submit this review." }, { status: 403 });
            }

            // Schedule Date Validation: if observation has a scheduled session date, cannot be submitted beforehand
            const targetSessionDate = body.sessionDate ? new Date(body.sessionDate) : observation.sessionDate;
            if (targetSessionDate && new Date() < new Date(targetSessionDate)) {
                const formattedDate = new Date(targetSessionDate).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                });
                return NextResponse.json({
                    error: `Review blocked: Review cannot be submitted before the scheduled session date (${formattedDate}).`
                }, { status: 400 });
            }
        } else {
            // For scheduling / session date / venue updates:
            // Allowed: the assigned observer, the observed lecturer, or administrative roles
            const canSchedule = observation.observerId === userId ||
                                observation.lecturerId === userId ||
                                ["HOD", "DEO", "ADMIN", "SUPER_ADMIN"].includes(role);
            if (!canSchedule) {
                return NextResponse.json({ error: "Forbidden: You do not have permission to update this observation schedule." }, { status: 403 });
            }
        }

        let status = observation.status;
        if (isSubmittingReview) {
            status = "COMPLETED";
        }

        if (body.reviewData?.metadata?.venue) {
            body.reviewData.metadata.venue = body.reviewData.metadata.venue.toUpperCase();
        }

        let sessionDate: Date | undefined = undefined;
        if (body.sessionDate) {
            sessionDate = new Date(body.sessionDate);
            if (isNaN(sessionDate.getTime())) {
                return NextResponse.json({ error: "Invalid date or time provided for schedule." }, { status: 400 });
            }
        }

        const venue = body.venue !== undefined ? (body.venue && body.venue.trim() !== "" ? body.venue.trim().toUpperCase() : null) : undefined;

        const updated = await prisma.observation.update({
            where: { id: parseInt(id) },
            data: {
                ...(body.feedback !== undefined && { feedback: body.feedback }),
                status,
                ...(body.reviewData !== undefined && { reviewData: body.reviewData }),
                ...(sessionDate && { sessionDate }),
                ...(venue !== undefined && { venue }),
            },
            include: { 
                lecturer: { select: { email: true, name: true } },
                observer: { select: { email: true, name: true } }
            }
        });

        // Trigger Resend Email Alerts if status is COMPLETED
        if (status === "COMPLETED" && updated.lecturer?.email) {
            const { sendNotificationEmail } = await import("@/lib/email");
            const message = `Your classroom observation feedback is now available for review.`;
            sendNotificationEmail(updated.lecturer.email, "Observation Feedback Available", message).catch(console.error);

            // Also create a DB notification
            await prisma.notification.create({
                data: {
                    userId: updated.lecturerId,
                    message
                }
            });
        }

        const isAssigned = await prisma.courseSection.findFirst({
            where: {
                lecturerId: observation.lecturerId,
                course: {
                    code: observation.courseCode
                }
            }
        });

        return NextResponse.json({
            ...updated,
            isObserveeAssigned: !!isAssigned
        });
    } catch (error) {
        console.error("Observation Update Error:", error);
        return NextResponse.json({ error: "Failed to update observation" }, { status: 500 });
    }
}
