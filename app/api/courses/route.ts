import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { headers, cookies } from "next/headers";

export const dynamic = "force-dynamic";

const CourseSchema = z.object({
    code: z.string().min(2).max(20).toUpperCase(),
    title: z.string().min(3).max(255),
    credits: z.union([z.number(), z.string().transform(v => parseInt(v))]).optional().default(3),
    departmentId: z.union([z.number(), z.string().transform(v => parseInt(v))]),
});

export async function GET() {
    await headers();
    await cookies();
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

        // Zod validation
        const validation = CourseSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validation.error.format() },
                { status: 400 }
            );
        }

        const { code, title, credits, departmentId } = validation.data;

        // Enforce HODs can only create courses for their own department
        if (role === "HOD") {
            const user = await prisma.user.findUnique({ where: { id: parseInt(session.user.id!) } });
            if (user?.departmentId !== departmentId) {
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
                credits: credits || 3,
                departmentId: departmentId
            }
        });

        return NextResponse.json(newCourse, { status: 201 });
    } catch (error: any) {
        console.error("Failed to create course:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
