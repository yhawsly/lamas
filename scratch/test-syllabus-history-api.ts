import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
    const courseId = 1;
    const user = await prisma.user.findFirst({ where: { role: "LECTURER" } });
    const userId = user!.id;

    // Same query as app/api/courses/[id]/syllabus/history/route.ts
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
                select: { id: true, name: true, email: true }
            },
            term: {
                select: { id: true, name: true, isActive: true }
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
                title: sub.title,
                status: sub.status,
                lecturer: sub.lecturer.name,
                term: sub.term?.name,
                termIsActive: sub.term?.isActive,
                metrics: { topicCount, moduleCount, resourceCount }
            });
        }
    }

    console.log("=== API History Output for Course 1 (CS101) ===");
    console.log(JSON.stringify(history, null, 2));
}

main().finally(() => prisma.$disconnect());
