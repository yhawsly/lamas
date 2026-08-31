import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasDeoPrivileges } from "@/lib/permissions";
import { headers, cookies } from "next/headers";

// GET /api/deo/resources — List department educational resources for DEO review
export async function GET(req: NextRequest) {
    await headers();
    await cookies();
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const role = (session.user as any).role;
        if (!hasDeoPrivileges(role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const userId = parseInt(session.user.id!);
        const user = await prisma.user.findUnique({ 
            where: { id: userId },
            select: { departmentId: true }
        });

        const url = new URL(req.url);
        const statusParam = url.searchParams.get("status");

        const where: any = {};
        if (user?.departmentId && role !== "ADMIN" && role !== "SUPER_ADMIN") {
            where.departmentId = user.departmentId;
        }
        if (statusParam && ["PENDING", "APPROVED", "REJECTED"].includes(statusParam)) {
            where.status = statusParam;
        }

        const resources = await prisma.resource.findMany({
            where,
            include: {
                lecturer: { 
                    select: { 
                        id: true,
                        name: true, 
                        email: true,
                        department: { select: { id: true, name: true, code: true } }
                    } 
                },
                department: { select: { id: true, name: true, code: true } }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(resources);
    } catch (error) {
        console.error("Failed to fetch DEO resources:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
