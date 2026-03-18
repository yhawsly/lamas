import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";
import { handleApiError } from "@/lib/api-error";
import { checkRateLimit } from "@/lib/rate-limit";
import { ROLES, isAdmin, hasHodPrivileges } from "@/lib/permissions";
import { headers, cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// GET /api/notifications
export async function GET(req: NextRequest) {
    await headers();
    await cookies();
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
        const url = new URL(req.url);

        // Pagination Params
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        if (page < 1 || limit < 1) {
            return NextResponse.json(
                { error: "Invalid pagination parameters" },
                { status: 400 }
            );
        }

        const where = { userId };

        const [notifications, totalCount] = await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.notification.count({ where })
        ]);

        return NextResponse.json({
            data: notifications,
            meta: {
                totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        return handleApiError(error, "Failed to fetch notifications");
    }
}

// PATCH /api/notifications — Mark all as read
export async function PATCH() {
    await headers();
    await cookies();
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = parseInt(session.user.id!);
        await prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleApiError(error, "Failed to mark notifications as read");
    }
}

// POST /api/notifications — Broadcast or specific notify
export async function POST(req: NextRequest) {
    await headers();
    await cookies();
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

        const role = (session.user as any).role;
        const senderId = parseInt(session.user.id!);
        const body = await req.json();
        const { message, targetRole, userId: targetUserId } = body;

        if (!message || !message.trim()) {
            return NextResponse.json(
                { error: "Message is required" },
                { status: 400 }
            );
        }

        const where: any = { isActive: true };

        if (role === ROLES.LECTURER || hasHodPrivileges(role) && !isAdmin(role)) {
            const currentUser = await prisma.user.findUnique({ where: { id: senderId } });
            if (!currentUser?.departmentId) {
                // If the user has no department, they cannot brodcast.
                if (!isAdmin(role) && !targetUserId) {
                    return NextResponse.json(
                        { error: "Department membership required for broadcasts" },
                        { status: 403 }
                    );
                }
            }

            if (targetUserId) {
                where.id = parseInt(targetUserId);
                if (role === ROLES.LECTURER && currentUser?.departmentId) {
                    where.departmentId = currentUser.departmentId;
                }
            } else {
                if (role === ROLES.LECTURER) {
                    return NextResponse.json(
                        { error: "Lecturers are not permitted to send department broadcasts" },
                        { status: 403 }
                    );
                }
                where.role = ROLES.LECTURER;
                if (currentUser?.departmentId) where.departmentId = currentUser.departmentId;
                where.id = { not: senderId };
            }
        } else if (isAdmin(role)) {
            if (targetUserId) {
                where.id = parseInt(targetUserId);
            } else {
                where.role = targetRole || { in: [ROLES.LECTURER, ROLES.HOD] };
            }
        } else {
            return NextResponse.json(
                { error: "You do not have permission to send notifications" },
                { status: 403 }
            );
        }

        const users = await prisma.user.findMany({ where });

        if (users.length === 0) {
            return NextResponse.json({ error: "No recipients found" }, { status: 404 });
        }

        await prisma.notification.createMany({
            data: users.map((u) => ({ userId: u.id, message: message.trim() })),
        });

        await logAction({
            userId: senderId,
            action: targetUserId ? "DIRECT_NOTIFICATION" : "DEPARTMENT_BROADCAST",
            details: `Sent notification to ${targetUserId ? `User #${targetUserId}` : "Department members"}: "${message.substring(0, 50)}..."`
        });

        return NextResponse.json({ sent: users.length }, { status: 201 });
    } catch (error) {
        return handleApiError(error, "Failed to send notification");
    }
}
