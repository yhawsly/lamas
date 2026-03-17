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

        const userId = parseInt(session.user.id!);
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, departmentId: true }
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Admins see all users capable of being observed/observing
        // HODs see everyone in their department
        const whereClause: any = { isActive: true };

        if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
            if (!user.departmentId) return NextResponse.json([]);
            whereClause.departmentId = user.departmentId;
        }

        const lecturers = await prisma.user.findMany({
            where: whereClause,
            select: { id: true, name: true, email: true, role: true, departmentId: true },
            orderBy: { name: "asc" }
        });

        return NextResponse.json(lecturers);
    } catch (error) {
        console.error("Failed to fetch lecturers:", error);
        return NextResponse.json(
            { error: "Failed to fetch lecturers" },
            { status: 500 }
        );
    }
}
