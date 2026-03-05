import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

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

    // Pagination Params
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (shared) {
        // Shared context
        const currentUser = await prisma.user.findUnique({ where: { id: userId } });
        where.status = "APPROVED";
        where.lecturer = { role: { in: ["ADMIN", "SUPER_ADMIN", "HOD"] } };
        where.OR = [
            { departmentId: null },
            { departmentId: currentUser?.departmentId ?? undefined },
        ];
    } else {
        // Private context
        if (role === "LECTURER") {
            where.lecturerId = userId;
        } else if (role === "HOD") {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (user?.departmentId) where.departmentId = user.departmentId;
        }
        if (status) where.status = status;
    }

    const [resources, totalCount] = await Promise.all([
        prisma.resource.findMany({
            where,
            include: {
                lecturer: { select: { name: true, email: true, role: true } },
                department: { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.resource.count({ where })
    ]);

    return NextResponse.json({
        data: resources,
        meta: {
            totalCount,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit)
        }
    });
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
