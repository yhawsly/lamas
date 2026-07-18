import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasHodPrivileges } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userRole = (session.user as any).role;
        if (!hasHodPrivileges(userRole)) {
            return NextResponse.json({ error: "Unauthorized. Only Admins and HODs can assign courses." }, { status: 403 });
        }

        const { sectionId, lecturerId } = await req.json();

        if (!sectionId) {
            return NextResponse.json({ error: "Missing sectionId" }, { status: 400 });
        }

        const updatedSection = await prisma.courseSection.update({
            where: { id: parseInt(sectionId) },
            data: { lecturerId: lecturerId ? parseInt(lecturerId) : null }
        });

        return NextResponse.json({ success: true, section: updatedSection });
    } catch (error) {
        console.error("Assignment error:", error);
        return NextResponse.json({ error: "Failed to assign course" }, { status: 500 });
    }
}
