import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// TEMP DEBUG route — ADMIN/SUPER_ADMIN only
// GET /api/debug/sections?email=hafiz@example.com
export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const role = (session.user as any).role;
        if (!["ADMIN", "SUPER_ADMIN"].includes(role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const url = new URL(req.url);
        const email = url.searchParams.get("email");
        const name = url.searchParams.get("name");

        // Search for the user
        const user = await prisma.user.findFirst({
            where: {
                ...(email ? { email: { contains: email, mode: "insensitive" } } : {}),
                ...(name ? { name: { contains: name, mode: "insensitive" } } : {}),
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                departmentId: true,
                isActive: true,
                department: { select: { id: true, name: true } }
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found", hint: "Try ?name=hafiz or ?email=hafiz@..." });
        }

        // Get ALL sections assigned to this user
        const sections = await prisma.courseSection.findMany({
            where: { lecturerId: user.id },
            include: {
                course: { select: { id: true, code: true, title: true, departmentId: true } },
                term: { select: { id: true, name: true, isActive: true } },
            }
        });

        // Get sections in this user's department
        const deptSections = await prisma.courseSection.findMany({
            where: { course: { departmentId: user.departmentId! } },
            include: {
                course: { select: { id: true, code: true, title: true } },
                lecturer: { select: { id: true, name: true } },
                term: { select: { name: true, isActive: true } }
            },
            orderBy: { id: "asc" }
        });

        // Find any sections with a non-null lecturerId
        const assignedAnywhere = await prisma.courseSection.findMany({
            where: { lecturerId: { not: null } },
            include: {
                course: { select: { code: true, title: true } },
                lecturer: { select: { id: true, name: true } },
                term: { select: { name: true, isActive: true } }
            },
            take: 20
        });

        return NextResponse.json({
            user,
            assignedSections: sections,
            assignedCount: sections.length,
            deptSections,
            deptSectionsCount: deptSections.length,
            assignedAnywhereInDB: assignedAnywhere,
            assignedAnywhereCount: assignedAnywhere.length,
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
