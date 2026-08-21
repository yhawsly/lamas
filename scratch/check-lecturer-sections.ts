import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const lecturers = await prisma.user.findMany({
        where: { role: "LECTURER" },
        include: {
            assignedSections: {
                include: { course: true }
            }
        }
    });

    console.log("=== LECTURER CLASS ALLOCATIONS ===");
    for (const lec of lecturers) {
        console.log(`\n👨‍🏫 ${lec.name} (${lec.email}) — Total Classes: ${lec.assignedSections.length}`);
        for (const sec of lec.assignedSections) {
            console.log(`   • [${sec.course.code}] ${sec.name} | ${sec.dayOfWeek} ${sec.startTime || ""} (${sec.venue || ""})`);
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
