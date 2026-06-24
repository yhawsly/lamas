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
    } catch {
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
        if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

        const userId = parseInt(session.user.id!);
        const role = (session.user as any).role;

        const observation = await prisma.observation.findUnique({
            where: { id: parseInt(id) },
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
            return new NextResponse("Review blocked: Lecturer is not assigned to this course.", { status: 400 });
        }

        // Security: Only the assigned observer or an HOD/DEO/Admin can update
        if (observation.observerId !== userId && !["HOD", "DEO", "ADMIN", "SUPER_ADMIN"].includes(role)) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const body = await req.json();
        
        // Simple status logic: if feedback was provided, it's COMPLETED
        let status = observation.status;
        if (body.feedback && body.feedback.trim() !== "") {
            status = "COMPLETED";
        }

        const updated = await prisma.observation.update({
            where: { id: parseInt(id) },
            data: {
                feedback: body.feedback,
                status,
                ...(body.reviewData !== undefined && { reviewData: body.reviewData }),
                ...(body.sessionDate && { sessionDate: new Date(body.sessionDate) }),
                ...(body.venue !== undefined && { venue: body.venue }),
            },
            include: { lecturer: { select: { email: true, name: true } } }
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

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Observation Update Error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
