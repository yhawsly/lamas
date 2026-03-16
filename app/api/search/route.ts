import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ROLES, hasHodPrivileges } from "@/lib/permissions";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    if (q.length < 2) return NextResponse.json([]);

    const userId = parseInt(session.user.id!);
    const role = (session.user as any).role;
    const departmentId = (session.user as any).departmentId;

    try {
        const submissionWhere: any = { title: { contains: q, lte: undefined } }; // Basic search
        const lecturerWhere: any = { name: { contains: q }, role: "LECTURER", isActive: true };
        const resourceWhere: any = { title: { contains: q }, status: "APPROVED" };

        if (role === ROLES.LECTURER) {
            submissionWhere.lecturerId = userId;
            // Lecturers can search all approved resources, keep resourceWhere as is
            // Lecturers can search colleagues in their department
            if (departmentId) {
                lecturerWhere.departmentId = departmentId;
            }
        } else if (hasHodPrivileges(role) && !["ADMIN", "SUPER_ADMIN"].includes(role) && departmentId) {
            submissionWhere.lecturer = { departmentId };
            lecturerWhere.departmentId = departmentId;
            resourceWhere.OR = [
                { status: "APPROVED" },
                { departmentId: departmentId } // HOD can see pending resources in their department
            ];
        }

        const [submissions, lecturers, resources] = await Promise.all([
            prisma.submission.findMany({
                where: submissionWhere,
                take: 5,
                select: { id: true, title: true, type: true }
            }),
            prisma.user.findMany({
                where: lecturerWhere,
                take: 5,
                select: { id: true, name: true, role: true }
            }),
            prisma.resource.findMany({
                where: resourceWhere,
                take: 5,
                select: { id: true, title: true, type: true, url: true }
            })
        ]);

        const results = [
            ...submissions.map(s => ({ ...s, category: "Submission", href: `/lecturer/submissions` })),
            ...lecturers.map(l => ({ ...l, title: l.name, category: "Lecturer", href: `/lecturer/department` })),
            ...resources.map(r => ({ ...r, category: "Resource", href: r.url }))
        ];

        return NextResponse.json(results);
    } catch {
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
