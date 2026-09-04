import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
    try {
        const s107 = await prisma.submission.findUnique({ where: { id: 107 } });
        console.log("Submission 107 content keys:", Object.keys(s107?.content as any || {}));
        console.log("Submission 107 courseId:", (s107?.content as any)?.courseId);

        const s124 = await prisma.submission.findUnique({ where: { id: 124 } });
        console.log("Submission 124 content:", s124?.content);

        const s106 = await prisma.submission.findUnique({ where: { id: 106 } });
        console.log("Submission 106 content keys:", Object.keys(s106?.content as any || {}));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
