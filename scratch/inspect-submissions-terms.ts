import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
    try {
        const terms = await prisma.academicTerm.findMany();
        console.log("Terms:", terms.map(t => ({ id: t.id, name: t.name, isActive: t.isActive })));

        const submissions = await prisma.submission.findMany({
            where: { type: "COURSE_TOPICS" },
            select: {
                id: true,
                title: true,
                termId: true,
                term: { select: { id: true, name: true, isActive: true } },
                lecturer: { select: { id: true, name: true } },
                status: true,
                content: true
            }
        });

        console.log(`\nFound ${submissions.length} COURSE_TOPICS submissions:`);
        for (const s of submissions) {
            const content = s.content as any;
            console.log({
                id: s.id,
                title: s.title,
                termId: s.termId,
                termName: s.term?.name,
                termIsActive: s.term?.isActive,
                lecturer: s.lecturer.name,
                status: s.status,
                courseId: content?.courseId,
                courseCode: content?.courseCode,
                topicsCount: content?.topics?.length,
                classesCount: content?.classes?.length
            });
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
