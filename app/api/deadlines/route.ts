import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { headers, cookies } from "next/headers";
import { handleApiError } from "@/lib/api-error";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAction } from "@/lib/audit";
import { isAdmin } from "@/lib/permissions";
import { z } from "zod";

export const dynamic = "force-dynamic";

const deadlineSchema = z.object({
    type: z.enum(["SEMESTER_CALENDAR", "COURSE_TOPICS", "OBSERVATION_REPORT", "WEEKLY_TOPICS"]),
    label: z.string().min(3, "Label must be at least 3 characters").max(100),
    dueDate: z.string().refine(d => !isNaN(Date.parse(d)), "Invalid date format"),
});

// GET /api/deadlines — any authenticated user
export async function GET() {
    await headers();
    await cookies();
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const deadlines = await prisma.deadline.findMany({
            orderBy: { dueDate: "asc" },
        });

        return NextResponse.json(deadlines);
    } catch (error) {
        return handleApiError(error, "Failed to fetch deadlines");
    }
}

// POST /api/deadlines — Admin only
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
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const role = (session.user as any).role;
        if (!isAdmin(role)) {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        const body = await req.json();
        const parsed = deadlineSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { type, label, dueDate } = parsed.data;
        const activeTerm = await prisma.academicTerm.findFirst({ where: { isActive: true } });

        const deadline = await prisma.deadline.create({
            data: {
                type,
                label,
                dueDate: new Date(dueDate),
                createdBy: parseInt(session.user.id!),
                termId: activeTerm?.id || null,
            },
        });

        // Notify all active lecturers and HODs
        const recipients = await prisma.user.findMany({
            where: { role: { in: ["LECTURER", "HOD"] }, isActive: true },
            select: { id: true },
        });

        if (recipients.length > 0) {
            await prisma.notification.createMany({
                data: recipients.map(r => ({
                    userId: r.id,
                    message: `New deadline: "${label}" — due ${new Date(dueDate).toLocaleDateString()}`,
                })),
            });
        }

        await logAction({
            userId: parseInt(session.user.id!),
            action: "ADMIN_ACTION",
            details: `Created deadline: "${label}" (${type}) due ${dueDate}`,
        });

        return NextResponse.json(deadline, { status: 201 });
    } catch (error) {
        return handleApiError(error, "Failed to create deadline");
    }
}
