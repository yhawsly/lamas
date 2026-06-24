import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const userRole = (session.user as any).role;
        if (userRole !== "HOD" && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Forbidden. Only HODs or Admins can create course sections." }, { status: 403 });
        }

        const body = await req.json();
        const { courseId, name, session: sessionType } = body;

        if (!courseId || !name || !sessionType) {
            return NextResponse.json({ error: "Missing required fields: courseId, name, session" }, { status: 400 });
        }

        if (sessionType !== "REGULAR" && sessionType !== "WEEKEND") {
            return NextResponse.json({ error: "Invalid session type. Must be 'REGULAR' or 'WEEKEND'." }, { status: 400 });
        }

        // Retrieve the active academic term
        const activeTerm = await prisma.academicTerm.findFirst({
            where: { isActive: true }
        });

        if (!activeTerm) {
            return NextResponse.json({ error: "No active academic term found. Please create and activate a term first." }, { status: 400 });
        }

        const newSection = await prisma.courseSection.create({
            data: {
                courseId: parseInt(courseId),
                name,
                session: sessionType,
                termId: activeTerm.id
            },
            include: {
                lecturer: {
                    select: { name: true }
                }
            }
        });

        return NextResponse.json(newSection, { status: 201 });
    } catch (error) {
        console.error("Failed to create course section:", error);
        return NextResponse.json({ error: "Failed to create section" }, { status: 500 });
    }
}
