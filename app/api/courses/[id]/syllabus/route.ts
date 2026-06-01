import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { headers, cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await headers();
    await cookies();
    try {
        const session = await auth();
        if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const resolvedParams = await params;
        const courseId = parseInt(resolvedParams.id);

        if (isNaN(courseId)) {
            return NextResponse.json({ error: "Invalid Course ID" }, { status: 400 });
        }

        const syllabus = await prisma.masterSyllabus.findUnique({
            where: { courseId },
            include: { course: { select: { code: true, title: true } } }
        });

        if (!syllabus) {
            return NextResponse.json({ error: "No Master Syllabus found for this course." }, { status: 404 });
        }

        return NextResponse.json(syllabus);
    } catch (error) {
        console.error("Syllabus fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch syllabus" }, { status: 500 });
    }
}
