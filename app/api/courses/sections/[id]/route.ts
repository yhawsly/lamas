import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/courses/sections/[id]
// Updates schedule fields (dayOfWeek, startTime, endTime, venue) and/or lecturerId
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userRole = (session.user as any).role;
        const userId = Number(session.user.id);
        const isAdminOrHod = ["HOD", "ADMIN", "SUPER_ADMIN"].includes(userRole);
        const isLecturer = userRole === "LECTURER";

        if (!isAdminOrHod && !isLecturer) {
            return NextResponse.json({ error: "Forbidden." }, { status: 403 });
        }

        const { id } = await params;
        const sectionId = parseInt(id);
        if (isNaN(sectionId)) {
            return NextResponse.json({ error: "Invalid section ID" }, { status: 400 });
        }

        // Lecturers may only update sections they are assigned to
        if (isLecturer) {
            const section = await prisma.courseSection.findUnique({ where: { id: sectionId } });
            if (!section || section.lecturerId !== userId) {
                return NextResponse.json({ error: "Forbidden. You can only update your own sections." }, { status: 403 });
            }
        }

        const body = await req.json();
        const { dayOfWeek, startTime, endTime, venue, lecturerId } = body;

        // Build update data — only include fields that were provided
        const updateData: Record<string, any> = {};
        if (dayOfWeek !== undefined) updateData.dayOfWeek = dayOfWeek || null;
        if (startTime !== undefined) updateData.startTime = startTime || null;
        if (endTime !== undefined) updateData.endTime = endTime || null;
        if (venue !== undefined) updateData.venue = venue || null;
        if (lecturerId !== undefined) {
            updateData.lecturerId = lecturerId ? parseInt(lecturerId) : null;
        }

        const updated = await prisma.courseSection.update({
            where: { id: sectionId },
            data: updateData,
            include: {
                lecturer: { select: { id: true, name: true } },
                course: { select: { id: true, code: true, title: true } },
            },
        });

        return NextResponse.json({ success: true, section: updated });
    } catch (error) {
        console.error("Failed to update section schedule:", error);
        return NextResponse.json({ error: "Failed to update section" }, { status: 500 });
    }
}
