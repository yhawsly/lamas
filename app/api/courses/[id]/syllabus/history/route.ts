import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { headers, cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await headers();
    await cookies();
    try {
        const session = await auth();
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);
        const resolvedParams = await params;
        const courseId = parseInt(resolvedParams.id);

        if (isNaN(courseId)) {
            return NextResponse.json({ error: "Invalid Course ID" }, { status: 400 });
        }

        // Fetch all historical submissions of type COURSE_TOPICS for this course
        const submissions = await prisma.submission.findMany({
            where: {
                type: "COURSE_TOPICS",
                OR: [
                    { lecturerId: userId },
                    { status: "APPROVED" }
                ]
            },
            include: {
                lecturer: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                term: {
                    select: {
                        id: true,
                        name: true,
                        isActive: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        const history = [];

        for (const sub of submissions) {
            const parsed: any = typeof sub.content === "string" ? JSON.parse(sub.content) : sub.content;
            if (parsed && parsed.courseId === courseId) {
                const topicCount = Array.isArray(parsed.topics) ? parsed.topics.length : 0;
                let moduleCount = 0;
                let resourceCount = 0;

                if (Array.isArray(parsed.classes)) {
                    for (const cls of parsed.classes) {
                        if (Array.isArray(cls.modules)) {
                            moduleCount += cls.modules.length;
                            for (const mod of cls.modules) {
                                if (Array.isArray(mod.resources)) {
                                    resourceCount += mod.resources.length;
                                }
                            }
                        }
                    }
                }

                history.push({
                    submissionId: sub.id,
                    title: sub.title || `Course Outline #${courseId}`,
                    status: sub.status,
                    submittedAt: sub.submittedAt,
                    createdAt: sub.createdAt,
                    lecturer: (sub as any).lecturer || { id: userId, name: "Lecturer", email: "" },
                    term: (sub as any).term || { id: 0, name: "Previous Academic Term", isActive: false },
                    metrics: {
                        topicCount,
                        moduleCount,
                        resourceCount
                    },
                    content: parsed
                });
            }
        }

        return NextResponse.json({ history });
    } catch (error) {
        console.error("Failed to fetch syllabus history:", error);
        return NextResponse.json({ error: "Failed to fetch historical syllabi" }, { status: 500 });
    }
}
