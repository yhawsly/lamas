import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { headers, cookies } from "next/headers";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await headers();
    await cookies();
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const role = (session.user as any).role;
        if (!["ADMIN", "SUPER_ADMIN", "HOD"].includes(role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const resolvedParams = await params;
        const courseId = parseInt(resolvedParams.id);

        if (isNaN(courseId)) {
            return NextResponse.json({ error: "Invalid Course ID" }, { status: 400 });
        }

        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (!course) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        // If HOD, verify department ownership
        if (role === "HOD") {
            const user = await prisma.user.findUnique({ where: { id: parseInt(session.user.id!) } });
            if (user?.departmentId !== course.departmentId) {
                return NextResponse.json({ error: "Forbidden. Course belongs to a different department." }, { status: 403 });
            }
        }

        // Ensure course isn't already used in an observation before deleting
        const checks = await prisma.observation.findFirst({ where: { courseCode: course.code } });
        if (checks) {
            return NextResponse.json({ error: "Cannot delete course: It is actively being used in peer observations." }, { status: 400 });
        }

        await prisma.course.delete({ where: { id: courseId } });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Failed to delete course:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
