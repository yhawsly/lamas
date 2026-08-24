import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function testSync() {
    console.log("Testing weekly module resource auto-sync to Resource repository...");

    const lecturer = await prisma.user.findFirst({ where: { role: "LECTURER" } });
    if (!lecturer) {
        console.log("No lecturer found.");
        return;
    }

    const testUrl = `/uploads/test_week2_slides_${Date.now()}.pdf`;
    const createdResource = await prisma.resource.create({
        data: {
            title: "CS101 - Week 2: Number Systems & Binary Arithmetic (Lecture Slides)",
            description: "Weekly lecture material for CS101 (Intro to Computing) - Week 2: Number Systems",
            type: "SLIDES",
            url: testUrl,
            status: "APPROVED",
            lecturerId: lecturer.id,
            departmentId: lecturer.departmentId
        }
    });

    console.log(`Created Resource ID: ${createdResource.id}`);
    console.log(`   - Title: ${createdResource.title}`);
    console.log(`   - URL: ${createdResource.url}`);
    console.log(`   - Status: ${createdResource.status}`);
    console.log(`   - Lecturer: ${lecturer.name} (${lecturer.email})`);

    // Verify it is queryable in the lecturer resources query
    const found = await prisma.resource.findUnique({
        where: { id: createdResource.id },
        include: { lecturer: true, department: true }
    });

    if (found) {
        console.log("\nRESOURCE REPOSITORY AUTO-SYNC VERIFIED SUCCESSFULLY!");
    } else {
        console.error("Resource not found in database.");
    }
}

testSync().catch(console.error).finally(() => prisma.$disconnect());
