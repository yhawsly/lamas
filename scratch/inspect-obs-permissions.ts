import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
    try {
        const users = await prisma.user.findMany({ select: { id: true, name: true, role: true } });
        console.log("Users:", users);

        const obs = await prisma.observation.findMany({
            include: {
                lecturer: { select: { id: true, name: true } },
                observer: { select: { id: true, name: true } },
                term: { select: { id: true, name: true } }
            }
        });

        console.log("\nForm A Observations:");
        for (const o of obs) {
            const isAssigned = await prisma.courseSection.findFirst({
                where: {
                    lecturerId: o.lecturerId,
                    course: { code: o.courseCode }
                }
            });
            console.log(`ID: ${o.id} | Course: ${o.courseCode} | Lecturer: ${o.lecturer.name} (ID: ${o.lecturerId}) | Observer: ${o.observer?.name} (ID: ${o.observerId}) | Term: ${o.term?.name} (ID: ${o.termId}) | isAssigned: ${!!isAssigned}`);
        }

        const tobs = await prisma.teachingObservation.findMany({
            include: {
                lecturer: { select: { id: true, name: true } },
                observer: { select: { id: true, name: true } },
                term: { select: { id: true, name: true } }
            }
        });

        console.log("\nForm B Teaching Observations:");
        for (const o of tobs) {
            const isAssigned = await prisma.courseSection.findFirst({
                where: {
                    lecturerId: o.lecturerId,
                    course: { code: o.courseCode }
                }
            });
            console.log(`ID: ${o.id} | Course: ${o.courseCode} | Lecturer: ${o.lecturer.name} (ID: ${o.lecturerId}) | Observer: ${o.observer?.name} (ID: ${o.observerId}) | Term: ${o.term?.name} (ID: ${o.termId}) | isAssigned: ${!!isAssigned}`);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
