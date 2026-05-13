import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
    try {
        const session = await auth();
        if (!["ADMIN", "SUPER_ADMIN", "HOD"].includes((session?.user as any)?.role)) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const [programs, categories, courses] = await Promise.all([
            prisma.program.findMany({
                include: { _count: { select: { courses: true } } }
            }),
            prisma.courseCategory.findMany({
                include: { _count: { select: { courses: true } } }
            }),
            prisma.course.findMany({
                include: { category: true, programs: true, masterSyllabus: true }
            })
        ]);

        return NextResponse.json({ programs, categories, courses });
    } catch (error) {
        console.error("Curriculum Fetch Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!["ADMIN", "SUPER_ADMIN", "HOD"].includes((session?.user as any)?.role)) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const body = await req.json();
        const { type, name, code, description, isGlobal } = body;

        if (type === "PROGRAM") {
            const program = await prisma.program.create({
                data: { name, code, description }
            });
            return NextResponse.json(program);
        }

        if (type === "CATEGORY") {
            const category = await prisma.courseCategory.create({
                data: { name, description, isGlobal }
            });
            return NextResponse.json(category);
        }

        return new NextResponse("Invalid Type", { status: 400 });
    } catch (error) {
        console.error("Curriculum Create Error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
