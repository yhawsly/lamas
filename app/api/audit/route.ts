import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "HOD") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const actionQuery = url.searchParams.get("action");
    const userIdQuery = url.searchParams.get("userId");

    const where: any = {};
    if (actionQuery) where.action = actionQuery;
    if (userIdQuery) where.userId = parseInt(userIdQuery);

    const logs = await prisma.activityLog.findMany({
        where,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
            user: {
                select: {
                    name: true,
                    role: true,
                    department: { select: { name: true } }
                }
            }
        }
    });

    return NextResponse.json(logs);
}
