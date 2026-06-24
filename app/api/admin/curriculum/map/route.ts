import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST: Add or update a course → program mapping
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        const role = (session?.user as any)?.role;
        if (!["ADMIN", "SUPER_ADMIN", "HOD"].includes(role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { programId, courseId, level, semester, isMandatory } = await req.json();

        if (!programId || !courseId || !level || !semester) {
            return NextResponse.json({ error: "Missing required fields: programId, courseId, level, semester" }, { status: 400 });
        }

        const map = await prisma.curriculumMap.upsert({
            where: { programId_courseId: { programId: parseInt(programId), courseId: parseInt(courseId) } },
            update: { level: parseInt(level), semester: parseInt(semester), isMandatory: isMandatory ?? true },
            create: {
                programId: parseInt(programId),
                courseId: parseInt(courseId),
                level: parseInt(level),
                semester: parseInt(semester),
                isMandatory: isMandatory ?? true
            },
            include: {
                course: { select: { id: true, code: true, title: true, credits: true } },
                program: { select: { id: true, name: true, code: true } }
            }
        });

        return NextResponse.json(map, { status: 201 });
    } catch (error: any) {
        console.error("CurriculumMap POST error:", error);
        return NextResponse.json({ error: "Failed to save curriculum mapping" }, { status: 500 });
    }
}

// DELETE: Remove a course from a program's curriculum
export async function DELETE(req: NextRequest) {
    try {
        const session = await auth();
        const role = (session?.user as any)?.role;
        if (!["ADMIN", "SUPER_ADMIN", "HOD"].includes(role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const programId = searchParams.get("programId");
        const courseId = searchParams.get("courseId");

        if (!programId || !courseId) {
            return NextResponse.json({ error: "Missing programId or courseId" }, { status: 400 });
        }

        await prisma.curriculumMap.delete({
            where: {
                programId_courseId: {
                    programId: parseInt(programId),
                    courseId: parseInt(courseId)
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("CurriculumMap DELETE error:", error);
        return NextResponse.json({ error: "Failed to remove curriculum mapping" }, { status: 500 });
    }
}
