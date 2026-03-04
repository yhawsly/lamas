import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    if (q.length < 2) return NextResponse.json([]);

    try {
        const [submissions, lecturers, resources] = await Promise.all([
            prisma.submission.findMany({
                where: { title: { contains: q } },
                take: 5,
                select: { id: true, title: true, type: true }
            }),
            prisma.user.findMany({
                where: { name: { contains: q }, role: "LECTURER" },
                take: 5,
                select: { id: true, name: true, role: true }
            }),
            prisma.resource.findMany({
                where: { title: { contains: q }, status: "APPROVED" },
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
