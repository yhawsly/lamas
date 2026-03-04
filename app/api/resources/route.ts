import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";

// GET /api/resources?shared=true  → admin-shared resources for download
// GET /api/resources               → my own uploaded resources
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = parseInt(session.user.id!);
    const role = (session.user as any).role;
    const url = new URL(req.url);
    const shared = url.searchParams.get("shared") === "true";
    const status = url.searchParams.get("status");

    if (shared) {
        // Return APPROVED resources shared by admin/HOD/super-admin (any dept or same dept)
        const currentUser = await prisma.user.findUnique({ where: { id: userId } });
        const resources = await prisma.resource.findMany({
            where: {
                status: "APPROVED",
                lecturer: { role: { in: ["ADMIN", "SUPER_ADMIN", "HOD"] } },
                OR: [
                    { departmentId: null },                         // institution-wide
                    { departmentId: currentUser?.departmentId ?? undefined }, // same dept
                ],
            },
            include: {
                lecturer: { select: { name: true, role: true } },
                department: { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(resources);
    }

    const where: any = {};
    if (role === "LECTURER") {
        where.lecturerId = userId;
    } else if (role === "HOD") {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user?.departmentId) where.departmentId = user.departmentId;
    }

    if (status) where.status = status;

    const resources = await prisma.resource.findMany({
        where,
        include: {
            lecturer: { select: { name: true, email: true } },
            department: true,
        },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(resources);
}

// POST /api/resources
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = parseInt(session.user.id!);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const body = await req.json();
    const { title, description, type, url } = body;

    const role = (session.user as any).role;
    const isAutoApprovable = ["ADMIN", "SUPER_ADMIN", "HOD"].includes(role);

    const resource = await prisma.resource.create({
        data: {
            title,
            description,
            type,
            url,
            lecturerId: userId,
            departmentId: user?.departmentId || null,
            status: isAutoApprovable ? "APPROVED" : "PENDING",
        },
    });

    await logAction({
        userId: userId,
        action: 'RESOURCE_UPLOADED',
        details: `Uploaded new ${type} resource: "${title}"`,
    });

    // Notify admins
    const admins = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } });
    await prisma.notification.createMany({
        data: admins.map((a) => ({
            userId: a.id,
            message: `New resource uploaded for review: "${title}" by ${user?.name}`,
        })),
    });

    return NextResponse.json(resource, { status: 201 });
}
