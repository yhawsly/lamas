import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
    try {
        const terms = await prisma.academicTerm.findMany({
            orderBy: { startDate: "desc" },
            include: { admin: { select: { name: true } } }
        });
        console.log("Terms fetched successfully:");
        console.log(JSON.stringify(terms, null, 2));
    } catch (e) {
        console.error("Error fetching terms:");
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
