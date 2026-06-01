import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";
import { SubmissionStatus } from "@prisma/client";
import { handleApiError } from "@/lib/api-error";
import { hasHodPrivileges, isAdmin } from "@/lib/permissions";
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

        const { status, feedback } = validation.data;

        // 1. Fetch submission to check ownership/permissions
        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
            include: { lecturer: { select: { departmentId: true } } }
        });

        if (!submission) {
            return NextResponse.json({ error: "Submission not found" }, { status: 404 });
        }

        // 2. Permission Check
        // Admins can do anything. HODs can only review their department's submissions.
        if (!isAdmin(role)) {
            if (!hasHodPrivileges(role)) {
                return NextResponse.json({ error: "Forbidden: Not an HOD" }, { status: 403 });
            }

            const currentUser = await prisma.user.findUnique({ 
                where: { id: userId },
                select: { departmentId: true }
            });

            if (!currentUser?.departmentId || currentUser.departmentId !== submission.lecturer.departmentId) {
                return NextResponse.json({ error: "Forbidden: Not your department" }, { status: 403 });
            }
        }

        // 3. Update Submission
        const updatedSubmission = await prisma.submission.update({
            where: { id: submissionId },
            data: {
                status,
                feedback: feedback || submission.feedback,
                updatedAt: new Date(),
            },
        });

        await logAction({
            userId,
            action: 'SUBMISSION_REVIEWED',
            details: `Reviewed submission ${submissionId}: ${status}. Feedback: ${feedback?.substring(0, 50) || 'None'}`,
        });

        // 4. Notify Lecturer (optional but recommended)
        await prisma.notification.create({
            data: {
                userId: submission.lecturerId,
                message: `Your submission "${submission.title}" has been ${status.toLowerCase()} by your HOD.`,
            }
        });

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
