import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";

// GET /api/submissions
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = parseInt(session.user.id!);
    const role = (session.user as any).role;
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const type = url.searchParams.get("type");

    const where: any = {};
    if (role === "LECTURER") where.lecturerId = userId;
    if (status) where.status = status;
    if (type) where.type = type;

    const submissions = await prisma.submission.findMany({
        where,
        include: {
            lecturer: { select: { name: true, email: true, department: { select: { name: true } } } },
            deadline: true,
        },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(submissions);
}

// POST /api/submissions
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = parseInt(session.user.id!);
    const body = await req.json();
    const { type, title, content, deadlineId, isDraft } = body;

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

    // Save version snapshot
    await prisma.submissionVersion.create({
        data: {
            submissionId: submission.id,
            snapshot: JSON.stringify({ type, title, content }),
            isDraft: isDraft ?? false,
        },
    });

    // Log activity
    await logAction({
        userId,
        action: isDraft ? "SUBMISSION_DRAFTED" : "SUBMISSION_CREATED",
        details: JSON.stringify({ submissionId: submission.id, type, title }),
    });

    // Auto-notify admin
    if (!isDraft) {
        const admins = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } });
        await prisma.notification.createMany({
            data: admins.map((a) => ({
                userId: a.id,
                message: `New submission: "${title}" by Lecturer #${userId}`,
            })),
        });
    }

    return NextResponse.json(submission, { status: 201 });
}
