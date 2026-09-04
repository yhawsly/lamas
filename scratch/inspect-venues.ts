import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
    try {
        const terms = await prisma.academicTerm.findMany({
            select: { id: true, name: true, isActive: true }
        });
        console.log("Academic Terms:", terms);

        for (const t of terms) {
            console.log(`\n=================== Term ${t.id} (${t.name}, isActive: ${t.isActive}) ===================`);
            
            const sections = await prisma.courseSection.findMany({
                where: { termId: t.id },
                select: { id: true, name: true, venue: true, course: { select: { code: true } } }
            });
            console.log(`CourseSections (${sections.length}):`);
            sections.forEach(s => console.log(`  ${s.course.code} (${s.name}): venue = "${s.venue}"`));

            const obsA = await prisma.observation.findMany({
                where: { termId: t.id },
                select: { id: true, courseCode: true, venue: true }
            });
            console.log(`Observation Form A (${obsA.length}):`);
            obsA.forEach(o => console.log(`  ${o.courseCode}: venue = "${o.venue}"`));

            const obsB = await prisma.teachingObservation.findMany({
                where: { termId: t.id },
                select: { id: true, courseCode: true, venue: true, formBData: true }
            });
            console.log(`TeachingObservation Form B (${obsB.length}):`);
            obsB.forEach(o => {
                const bData = o.formBData as any;
                console.log(`  ${o.courseCode}: venue = "${o.venue}", metadata.venue = "${bData?.metadata?.venue}"`);
            });
        }
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
