import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";
import { SubmissionStatus } from "@prisma/client";
import { handleApiError } from "@/lib/api-error";
import { hasDeoPrivileges, hasHodPrivileges, isAdmin } from "@/lib/permissions";
import { z } from "zod";

const ReviewSchema = z.object({
    status: z.enum([SubmissionStatus.APPROVED, SubmissionStatus.REJECTED, SubmissionStatus.REVIEWED]),
    feedback: z.string().max(1000).optional(),
});

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const submissionId = parseInt(id);
        const userId = parseInt(session.user.id!);
        const role = (session.user as any).role;

        const body = await req.json();
        const validation = ReviewSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validation.error.format() },
                { status: 400 }
            );
        }

        const { status: requestedStatus, feedback } = validation.data;

        // 1. Fetch submission to check ownership/permissions
        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
            include: { 
                lecturer: { 
                    select: { 
                        name: true,
                        departmentId: true,
                        department: { select: { name: true, hodId: true } }
                    } 
                } 
            }
        });

        if (!submission) {
            return NextResponse.json({ error: "Submission not found" }, { status: 404 });
        }

        // 2. Permission Check
        // Admins can do anything. DEO and HOD can only review their department's submissions.
        if (!isAdmin(role)) {
            if (!hasDeoPrivileges(role) && !hasHodPrivileges(role)) {
                return NextResponse.json({ error: "Forbidden: Reviewer privileges required" }, { status: 403 });
            }

            const currentUser = await prisma.user.findUnique({ 
                where: { id: userId },
                select: { departmentId: true }
            });

            if (!currentUser?.departmentId || currentUser.departmentId !== submission.lecturer.departmentId) {
                return NextResponse.json({ error: "Forbidden: Not your department" }, { status: 403 });
            }
        }

        // Two-Stage Logic: If DEO approves, it moves to REVIEWED (Stage 1 Quality Vetted, ready for HOD)
        let finalStatus = requestedStatus;
        if (role === "DEO" && requestedStatus === SubmissionStatus.APPROVED) {
            finalStatus = SubmissionStatus.REVIEWED;
        }

        // 3. Update Submission
        const updatedSubmission = await prisma.submission.update({
            where: { id: submissionId },
            data: {
                status: finalStatus,
                feedback: feedback || submission.feedback,
                updatedAt: new Date(),
            },
        });

        await logAction({
            userId,
            action: 'SUBMISSION_REVIEWED',
            details: `Reviewed submission ${submissionId}: ${finalStatus} (${role}). Feedback: ${feedback?.substring(0, 50) || 'None'}`,
        });

        // 4. Notifications & Email Dispatch
        if (role === "DEO" && finalStatus === SubmissionStatus.REVIEWED) {
            // Notify HOD that DEO has vetted and approved the outline for final clearance
            if (submission.lecturer?.department?.hodId) {
                await prisma.notification.create({
                    data: {
                        userId: submission.lecturer.department.hodId,
                        message: `DEO has vetted & approved Course Outline "${submission.title}" (Lecturer: ${submission.lecturer.name}). Ready for HOD Final Clearance.`,
                    }
                });
            }
            // Also notify lecturer of Stage 1 DEO clearance
            await prisma.notification.create({
                data: {
                    userId: submission.lecturerId,
                    message: `Your Course Outline "${submission.title}" passed DEO Stage 1 Quality Vetting and has been forwarded to HOD for final approval.${feedback ? ` Notes: ${feedback}` : ''}`,
                }
            });
        } else {
            // Final decision by HOD/Admin or rejection
            const reviewerTitle = role === "DEO" ? "DEO" : "HOD";
            const notifyMsg = `Your submission "${submission.title}" has been ${finalStatus.toLowerCase()} by ${reviewerTitle}.${feedback ? ` Feedback: ${feedback}` : ''}`;
            
            await prisma.notification.create({
                data: {
                    userId: submission.lecturerId,
                    message: notifyMsg,
                }
            });

            const lecUser = await prisma.user.findUnique({
                where: { id: submission.lecturerId },
                select: { email: true }
            });
            if (lecUser?.email) {
                const { sendNotificationEmail } = await import("@/lib/email");
                sendNotificationEmail(lecUser.email, `Course Outline ${finalStatus}`, notifyMsg).catch(console.error);
            }
        }

        return NextResponse.json(updatedSubmission);
    } catch (error) {
        return handleApiError(error, "Failed to review submission");
    }
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const submissionId = parseInt(id);
        const userId = parseInt(session.user.id!);
        const role = (session.user as any).role;

        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
            include: {
                lecturer: { select: { name: true, email: true, department: { select: { name: true } } } },
                deadline: true,
                versions: { orderBy: { savedAt: 'desc' }, take: 1 }
            }
        });

        if (!submission) {
            return NextResponse.json({ error: "Submission not found" }, { status: 404 });
        }

        // Permission Check (Same as PATCH but allows the owner to see it too)
        const isOwner = submission.lecturerId === userId;
        const isHOD = hasHodPrivileges(role);
        
        // Simplified check for now
        if (!isOwner && !isHOD && !isAdmin(role)) {
             return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json(submission);
    } catch (error) {
        return handleApiError(error, "Failed to fetch submission details");
    }
}
