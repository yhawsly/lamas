import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
    try {
        const courses = await prisma.course.findMany({ select: { id: true, code: true, title: true } });
        console.log("All courses:", courses);

        const subs = await prisma.submission.findMany({
            where: { type: "COURSE_TOPICS" },
            select: { id: true, title: true, termId: true, lecturerId: true, status: true, content: true }
        });

        console.log(`\nTotal COURSE_TOPICS submissions: ${subs.length}`);
        subs.forEach(s => {
            const c = s.content as any;
            console.log(`ID: ${s.id} | Title: "${s.title}" | Term: ${s.termId} | Status: ${s.status} | courseId: ${c?.courseId} | topics: ${c?.topics?.length} | classes: ${c?.classes?.length}`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
