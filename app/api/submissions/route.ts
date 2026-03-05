import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";
import { handleApiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

// GET /api/submissions
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = parseInt(session.user.id!);
        const role = (session.user as any).role;
        const url = new URL(req.url);
        const status = url.searchParams.get("status");
        const type = url.searchParams.get("type");

        // Pagination Params
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        if (page < 1 || limit < 1) {
            return NextResponse.json(
                { error: "Invalid pagination parameters: page and limit must be >= 1" },
                { status: 400 }
            );
        }

        const where: any = {};
        if (role === "LECTURER") {
            where.lecturerId = userId;
        } else if (role === "HOD") {
            const currentUser = await prisma.user.findUnique({ where: { id: userId } });
            if (currentUser?.departmentId) {
                where.lecturer = { departmentId: currentUser.departmentId };
            } else {
                where.lecturerId = -1;
            }
        }
        if (status) where.status = status;
        if (type) where.type = type;

        const [submissions, totalCount] = await Promise.all([
            prisma.submission.findMany({
                where,
                include: {
                    lecturer: { select: { name: true, email: true, department: { select: { name: true } } } },
                    deadline: true,
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.submission.count({ where })
        ]);

        return NextResponse.json({
            data: submissions,
            meta: {
                totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        return handleApiError(error, "Failed to fetch submissions");
    }
}

// POST /api/submissions
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = parseInt(session.user.id!);
        const body = await req.json();
        const { type, title, content, deadlineId, isDraft } = body;

        if (!type || !title) {
            return NextResponse.json(
                { error: "Missing required fields: type, title" },
                { status: 400 }
            );
        }

        // Check if submission is late
        let status = isDraft ? "DRAFT" : "SUBMITTED";
        if (deadlineId && !isDraft) {
            const deadline = await prisma.deadline.findUnique({ where: { id: deadlineId } });
            if (deadline && new Date() > deadline.dueDate) status = "LATE";
        }

        const submission = await prisma.submission.create({
            data: {
                lecturerId: userId,
                type,
                title,
                content: content ? JSON.stringify(content) : null,
                deadlineId: deadlineId || null,
                status,
                submittedAt: isDraft ? null : new Date(),
            },
        });

        await logAction({
            userId: userId,
            action: 'SUBMISSION_CREATED',
            details: `Submitted new ${type}: "${title}"`,
        });

        // Save version snapshot
        await prisma.submissionVersion.create({
            data: {
                submissionId: submission.id,
                snapshot: content ? JSON.stringify(content) : "{}",
                isDraft: isDraft || false,
            },
        });

        return NextResponse.json(submission, { status: 201 });
    } catch (error) {
        return handleApiError(error, "Failed to create submission");
    }
}
