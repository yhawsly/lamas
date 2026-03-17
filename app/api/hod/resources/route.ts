import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const role = (session.user as any).role;
        if (role !== "HOD" && role !== "ADMIN" && role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const user = await prisma.user.findUnique({ where: { id: parseInt(session.user.id!) } });

        const departmentId = user?.departmentId;

        // If it's an admin without a specific department, maybe we want to fetch all or we can just require department.
        // For HOD, they only see their department's resources.

        const where: any = {};
        if (departmentId) {
            where.departmentId = departmentId;
        }

        const resources = await prisma.resource.findMany({
            where,
            include: {
                lecturer: { select: { name: true, email: true } }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(resources);
    } catch (error) {
        console.error("Failed to fetch HOD resources:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
