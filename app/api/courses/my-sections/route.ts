import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { headers, cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// GET /api/courses/my-sections
// Returns all course sections assigned to the currently logged-in lecturer.
export async function GET(req: Request) {
    await headers();
    await cookies();
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = Number(session.user.id);
        const url = new URL(req.url);
        const termIdParam = url.searchParams.get("termId");
        const all = url.searchParams.get("all") === "true";

        const { checkAndGetActiveTerm } = await import("@/lib/active-term");
        const activeTerm = await checkAndGetActiveTerm();

        const termWhere: any = {};
        if (!all) {
            if (termIdParam) {
                termWhere.termId = parseInt(termIdParam);
            } else if (activeTerm) {
                termWhere.termId = activeTerm.id;
            } else {
                termWhere.termId = 0;
            }
        }

        const sections = await prisma.courseSection.findMany({
            where: { 
                lecturerId: userId,
                ...termWhere
            },
            include: {
                course: true,
                term: {
                    select: { id: true, name: true, isActive: true }
                },
                lecturer: {
                    select: { id: true, name: true, email: true }
                }
            },
            orderBy: [
                { term: { isActive: "desc" } },
                { course: { code: "asc" } }
            ]
        });

        // Group sections by course, prioritising the active-term section
        const coursesMap = new Map<number, { course: any; sections: any[]; activeTerm: boolean }>();
        for (const sec of sections) {
            if (!coursesMap.has(sec.courseId)) {
                coursesMap.set(sec.courseId, { course: sec.course, sections: [], activeTerm: false });
            }
            const entry = coursesMap.get(sec.courseId)!;
            entry.sections.push(sec);
            if (sec.term?.isActive) entry.activeTerm = true;
        }

        const courses = Array.from(coursesMap.values());

        return NextResponse.json({ sections, courses });
    } catch (error) {
        console.error("Failed to fetch lecturer sections:", error);
        return NextResponse.json({ error: "Failed to fetch your course assignments" }, { status: 500 });
    }
}
