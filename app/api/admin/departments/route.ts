import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await auth();
        if (!session || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any)?.role as string)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const departments = await prisma.department.findMany({
            include: {
                _count: { select: { users: true, courses: true } }
            },
            orderBy: { name: "asc" }
        });

        return NextResponse.json(departments);
    } catch (error) {
        console.error("Failed to fetch departments:", error);
        return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any)?.role as string)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, code } = body;

        if (!name || !code) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check for uniqueness
        const existing = await prisma.department.findUnique({ where: { code } });
        if (existing) {
            return NextResponse.json({ error: "Department code already exists" }, { status: 400 });
        }

        const department = await prisma.department.create({
            data: {
                name,
                code: code.toUpperCase()
            }
        });

        return NextResponse.json(department, { status: 201 });
    } catch (error: any) {
        console.error("Failed to create department:", error);
        return NextResponse.json({ error: "Failed to create department" }, { status: 500 });
    }
}
