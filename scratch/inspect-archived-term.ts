import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
    try {
        const termId = 1;
        const [deadlines, submissions, sections, obsA, obsB, examMods, resources] = await Promise.all([
            prisma.deadline.count({ where: { termId } }),
            prisma.submission.count({ where: { termId } }),
            prisma.courseSection.count({ where: { termId } }),
            prisma.observation.count({ where: { termId } }),
            prisma.teachingObservation.count({ where: { termId } }),
            prisma.examModeration.count({ where: { termId } }),
            prisma.resource.count(),
        ]);

        console.log(`=== Term 1 (Archived) Data Counts ===`);
        console.log(`Deadlines: ${deadlines}`);
        console.log(`Submissions: ${submissions}`);
        console.log(`Course Sections: ${sections}`);
        console.log(`Observation Form A: ${obsA}`);
        console.log(`Observation Form B: ${obsB}`);
        console.log(`Exam Moderations: ${examMods}`);
        console.log(`Educational Resources (Total): ${resources}`);

        const term10 = 10;
        const [d10, s10, sec10, a10, b10, e10] = await Promise.all([
            prisma.deadline.count({ where: { termId: term10 } }),
            prisma.submission.count({ where: { termId: term10 } }),
            prisma.courseSection.count({ where: { termId: term10 } }),
            prisma.observation.count({ where: { termId: term10 } }),
            prisma.teachingObservation.count({ where: { termId: term10 } }),
            prisma.examModeration.count({ where: { termId: term10 } }),
        ]);

        console.log(`\n=== Term 10 (Active) Data Counts ===`);
        console.log(`Deadlines: ${d10}`);
        console.log(`Submissions: ${s10}`);
        console.log(`Course Sections: ${sec10}`);
        console.log(`Observation Form A: ${a10}`);
        console.log(`Observation Form B: ${b10}`);
        console.log(`Exam Moderations: ${e10}`);
        console.log(`Educational Resources: ${r10}`);

    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}
main();
