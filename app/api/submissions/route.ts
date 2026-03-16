import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";
import { handleApiError } from "@/lib/api-error";
import { checkRateLimit } from "@/lib/rate-limit";
import { ROLES, hasHodPrivileges } from "@/lib/permissions";
import { z } from "zod";

const SubmissionSchema = z.object({
    type: z.enum(["SEMESTER_CALENDAR", "COURSE_TOPICS", "OBSERVATION_REPORT"]),
    title: z.string().min(3).max(255),
    content: z.any().optional(),
    deadlineId: z.number().int().positive().optional().nullable(),
    isDraft: z.boolean().optional().default(false),
});

export const dynamic = "force-dynamic";

// GET /api/submissions
export async function GET(req: NextRequest) {
    try {
        // Rate limiting: 20 requests per 15 minutes
        const rateLimit = checkRateLimit(req, "general");
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: "Rate limit exceeded. Please try again later." },
                {
                    status: 429,
                    headers: { "Retry-After": String(rateLimit.retryAfter || 900) },
                }
            );
        }

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
        if (role === ROLES.LECTURER) {
            where.lecturerId = userId;
        } else if (hasHodPrivileges(role) && !["ADMIN", "SUPER_ADMIN"].includes(role)) {
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
        // Rate limiting: 20 requests per 15 minutes
        const rateLimit = checkRateLimit(req, 'general');
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: "Rate limit exceeded. Please try again later." },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(rateLimit.retryAfter || 900),
                    }
                }
            );
        }

        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = parseInt(session.user.id!);
        const body = await req.json();
        
        // Zod validation
        const validation = SubmissionSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validation.error.format() },
                { status: 400 }
            );
        }

        const { type, title, content, deadlineId, isDraft } = validation.data;

        // Check if submission is late
        let status = isDraft ? "DRAFT" : "SUBMITTED";
        if (deadlineId && !isDraft) {
            const deadline = await prisma.deadline.findUnique({ where: { id: deadlineId } });
            if (deadline && new Date() > deadline.dueDate) status = "LATE";
        }

        const activeTerm = await prisma.academicTerm.findFirst({ where: { isActive: true } });

        const submission = await prisma.submission.create({
            data: {
                lecturerId: userId,
                type,
                title,
                content: content ? JSON.stringify(content) : null,
                deadlineId: deadlineId || null,
                termId: activeTerm?.id || null,
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
