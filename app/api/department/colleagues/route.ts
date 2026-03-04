import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = parseInt(session.user.id!);
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { departmentId: true }
    });

    if (!user?.departmentId) {
        return NextResponse.json([]);
    }

    const colleagues = await prisma.user.findMany({
        where: {
            departmentId: user.departmentId,
            isActive: true,
            id: { not: userId },
            role: "LECTURER"
        },
        select: {
            id: true,
            name: true,
            email: true,
        },
        orderBy: { name: "asc" }
    });

    return NextResponse.json(colleagues);
}
