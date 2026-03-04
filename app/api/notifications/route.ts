import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";

// GET /api/notifications
export async function GET() {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = parseInt(session.user.id!);
    const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
    });

    return NextResponse.json(notifications);
}

// PATCH /api/notifications — Mark all as read
export async function PATCH() {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = parseInt(session.user.id!);
    await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
    });

    return NextResponse.json({ success: true });
}

// POST /api/notifications — Broadcast or specific notify
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    const senderId = parseInt(session.user.id!);
    const body = await req.json();
    const { message, targetRole, userId: targetUserId } = body;

    const where: any = { isActive: true };

    if (role === "LECTURER" || role === "HOD") {
        const currentUser = await prisma.user.findUnique({ where: { id: senderId } });
        if (!currentUser?.departmentId) {
            // If no department, they can only notify themselves? Let's say forbidden for now if no dept.
            if (!role.includes("ADMIN") && !targetUserId) return NextResponse.json({ error: "Department membership required for broadcasts" }, { status: 403 });
        }

        if (targetUserId) {
            // Specific user notification
            where.id = parseInt(targetUserId);
            // Optionally: restrict lecturers to only notify people in the same department? 
            // The prompt says "notify members of the department", so let's stick to dept context.
            if (role === "LECTURER" && currentUser?.departmentId) {
                where.departmentId = currentUser.departmentId;
            }
        } else {
            // Department broadcast
            where.role = "LECTURER";
            if (currentUser?.departmentId) where.departmentId = currentUser.departmentId;
            // Also exclude the sender from the broadcast
            where.id = { not: senderId };
        }
    } else if (["ADMIN", "SUPER_ADMIN"].includes(role)) {
        if (targetUserId) {
            where.id = parseInt(targetUserId);
        } else {
            where.role = targetRole || { in: ["LECTURER", "HOD"] };
        }
    } else {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await prisma.user.findMany({ where });

    if (users.length === 0) {
        return NextResponse.json({ error: "No recipients found" }, { status: 404 });
    }

    await prisma.notification.createMany({
        data: users.map((u) => ({ userId: u.id, message })),
    });

    await logAction({
        userId: senderId,
        action: targetUserId ? "DIRECT_NOTIFICATION" : "DEPARTMENT_BROADCAST",
        details: `Sent notification to ${targetUserId ? `User #${targetUserId}` : "Department members"}: "${message.substring(0, 50)}..."`
    });

    return NextResponse.json({ sent: users.length });
}
