/**
 * Script: update-suzy-classes.ts
 */
import { prisma } from "../lib/prisma";

async function main() {
    const suzy = await prisma.user.findUnique({
        where: { email: "s.agyemang@university.edu.gh" }
    });

    if (!suzy) {
        console.error("Suzy not found!");
        return;
    }

    const sections = await prisma.courseSection.findMany({
        where: { lecturerId: suzy.id }
    });

    for (const sec of sections) {
        if (sec.name.endsWith("-A")) {
            const course = await prisma.course.findUnique({ where: { id: sec.courseId } });
            
            // Generate a more realistic name "B.Tech Computer Science LVL X00 (Regular)"
            // Determine level from the first digit of the course code (e.g. CS101 -> 100)
            const match = course?.code.match(/\d/);
            const levelStr = match ? match[0] + "00" : "100";
            
            const newName = `B.Tech Computer Science LVL ${levelStr} (Regular)`;
            
            await prisma.courseSection.update({
                where: { id: sec.id },
                data: { name: newName, session: "REGULAR" }
            });
            console.log(`Updated section ${sec.name} -> ${newName}`);
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
