import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id } = await params;
        const moderation = await prisma.examModeration.findUnique({
            where: { id: parseInt(id) },
            include: { lecturer: true, moderator: true, deo: true },
        });
        if (!moderation) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const isAssigned = await prisma.courseSection.findFirst({
            where: {
                lecturerId: moderation.lecturerId,
                course: {
                    code: moderation.courseCode
                }
            }
        });

        if (!isAssigned) {
            const { notifyDeoIfMismatch } = await import("@/lib/deo-notification");
            notifyDeoIfMismatch("C", moderation.id, moderation.lecturer.name, moderation.courseCode).catch(console.error);
        }

        return NextResponse.json({
            ...moderation,
            isObserveeAssigned: !!isAssigned
        });
    } catch {
        return NextResponse.json({ error: "Failed to fetch moderation" }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = Number(session.user.id);
    const role = (session.user as any).role;

    try {
        const body = await req.json();
        const { reviewData } = body;
        
        const { id } = await params;
        const existingMod = await prisma.examModeration.findUnique({
            where: { id: parseInt(id) }
        });
        if (!existingMod) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // Security: only the assigned moderator or DEO/Admin can update
        if (existingMod.moderatorId !== userId && !["DEO", "ADMIN", "SUPER_ADMIN"].includes(role)) {
            return NextResponse.json({ error: "Forbidden: Only the assigned moderator may submit this form." }, { status: 403 });
        }

        const isAssigned = await prisma.courseSection.findFirst({
            where: {
                lecturerId: existingMod.lecturerId,
                course: {
                    code: existingMod.courseCode
                }
            }
        });

        if (!isAssigned) {
            return NextResponse.json({ error: "Review blocked: Lecturer is not assigned to this course." }, { status: 400 });
        }

        const moderation = await prisma.examModeration.update({
            where: { id: parseInt(id) },
            data: {
                reviewData,
                status: "COMPLETED",
            },
        });
        return NextResponse.json(moderation);
    } catch {
        return NextResponse.json({ error: "Failed to update moderation" }, { status: 500 });
    }
}
