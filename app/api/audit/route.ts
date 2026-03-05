import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const role = (session.user as any).role;
        if (role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "HOD") {
            return NextResponse.json(
                { error: "You do not have permission to view audit logs" },
                { status: 403 }
            );
        }

        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const skip = (page - 1) * limit;
        const actionQuery = url.searchParams.get("action");
        const userIdQuery = url.searchParams.get("userId");

        if (page < 1 || limit < 1) {
            return NextResponse.json(
                { error: "Invalid pagination parameters" },
                { status: 400 }
            );
        }

        const where: any = {};
        if (actionQuery) where.action = actionQuery;

        if (role === "HOD") {
            const departmentId = (session.user as any).departmentId;
            if (departmentId) {
                where.user = { departmentId };
            } else {
                return NextResponse.json({
                    data: [],
                    meta: { totalCount: 0, page: 1, limit, totalPages: 0 }
                });
            }
        }

        if (userIdQuery) {
            const targetId = parseInt(userIdQuery);
            // Security check: HOD can only see logs for their department members
            if (role === "HOD") {
                const targetUser = await prisma.user.findUnique({ 
                    where: { id: targetId }, 
                    select: { departmentId: true } 
                });
                if (targetUser?.departmentId !== (session.user as any).departmentId) {
                    return NextResponse.json(
                        { error: "You do not have permission to view these logs" },
                        { status: 403 }
                    );
                }
            }
            where.userId = targetId;
        }

        const [logs, totalCount] = await Promise.all([
            prisma.activityLog.findMany({
                where,
                skip,
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
            }),
            prisma.activityLog.count({ where })
        ]);

        return NextResponse.json({
            data: logs,
            meta: {
                totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        return handleApiError(error, "Failed to fetch audit logs");
    }
}
