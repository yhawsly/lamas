import { NextResponse } from "next/server";
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

        // Admins see all courses, HODs/Lecturers see their own department's courses
        const whereClause = ["ADMIN", "SUPER_ADMIN"].includes(user.role)
            ? {}
            : { departmentId: user.departmentId! };

        const courses = await prisma.course.findMany({
            where: whereClause,
            select: { id: true, code: true, title: true, departmentId: true },
            orderBy: { code: "asc" }
        });

        return NextResponse.json(courses);
    } catch (error) {
        console.error("Failed to fetch courses:", error);
        return NextResponse.json(
            { error: "Failed to fetch courses" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const role = (session.user as any).role;
        if (!["ADMIN", "SUPER_ADMIN", "HOD"].includes(role)) {
            return NextResponse.json({ error: "Forbidden. Only Admins and HODs can create courses." }, { status: 403 });
        }

        const body = await req.json();
        const { code, title, credits, departmentId } = body;

        if (!code || !title || !departmentId) {
            return NextResponse.json({ error: "Missing required fields: code, title, or departmentId" }, { status: 400 });
        }

        // Enforce HODs can only create courses for their own department
        if (role === "HOD") {
            const user = await prisma.user.findUnique({ where: { id: parseInt(session.user.id!) } });
            if (user?.departmentId !== parseInt(departmentId)) {
                return NextResponse.json({ error: "Forbidden. You can only create courses for your own department." }, { status: 403 });
            }
        }

        const courseCodeExists = await prisma.course.findUnique({ where: { code } });
        if (courseCodeExists) {
            return NextResponse.json({ error: "A course with this code already exists." }, { status: 400 });
        }

        const newCourse = await prisma.course.create({
            data: {
                code,
                title,
                credits: credits ? parseInt(credits) : 3,
                departmentId: parseInt(departmentId)
            }
        });

        return NextResponse.json(newCourse, { status: 201 });
    } catch (error: any) {
        console.error("Failed to create course:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
