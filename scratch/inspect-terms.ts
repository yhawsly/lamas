import { prisma } from "../lib/prisma.js";

async function main() {
    const terms = await prisma.academicTerm.findMany({
        orderBy: { id: "asc" }
    });

    console.log("=== ACADEMIC TERMS ===");
    console.log(JSON.stringify(terms, null, 2));

    for (const t of terms) {
        const sectionsCount = await prisma.courseSection.count({ where: { termId: t.id } });
        const obsCount = await prisma.observation.count({ where: { termId: t.id } });
        const teachObsCount = await prisma.teachingObservation.count({ where: { termId: t.id } });
        const modCount = await prisma.examModeration.count({ where: { termId: t.id } });
        const subCount = await prisma.submission.count({ where: { termId: t.id } });

        console.log(`\nTerm ID ${t.id} ("${t.name}", Active: ${t.isActive}):`);
        console.log(`  - CourseSections: ${sectionsCount}`);
        console.log(`  - Form A Observations: ${obsCount}`);
        console.log(`  - Form B Teaching Observations: ${teachObsCount}`);
        console.log(`  - Form C Moderations: ${modCount}`);
        console.log(`  - Submissions: ${subCount}`);
    }

    const nullObs = await prisma.observation.count({ where: { termId: null } });
    const nullTeach = await prisma.teachingObservation.count({ where: { termId: null } });
    const nullMod = await prisma.examModeration.count({ where: { termId: null } });
    const nullSub = await prisma.submission.count({ where: { termId: null } });
    console.log(`\nRecords with NULL termId:`);
    console.log(`  - Form A Observations: ${nullObs}`);
    console.log(`  - Form B Teaching Observations: ${nullTeach}`);
    console.log(`  - Form C Moderations: ${nullMod}`);
    console.log(`  - Submissions: ${nullSub}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
