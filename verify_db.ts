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

async function main() {
    console.log("🔍 VERIFYING NEON DATABASE DATA...");

    const userCount = await prisma.user.count();
    const deptCount = await prisma.department.count();
    const courseCount = await prisma.course.count();
    const submissionCount = await prisma.submission.count();
    const termsCount = await prisma.academicTerm.count();
    const activeTerm = await prisma.academicTerm.findFirst({ where: { isActive: true } });
    
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Departments: ${deptCount}`);
    console.log(`   - Courses: ${courseCount}`);
    console.log(`   - Submissions: ${submissionCount}`);
    console.log(`   - Active Terms: ${termsCount}`);

    if (activeTerm) {
        const start = new Date(activeTerm.startDate);
        const end = new Date(activeTerm.endDate);
        const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const diffWeeks = Math.ceil(diffDays / 7);
        console.log(`\n✅ ACTIVE TERM FOUND: ${activeTerm.name}`);
        console.log(`   - Start Date: ${start.toISOString().split('T')[0]}`);
        console.log(`   - End Date: ${end.toISOString().split('T')[0]}`);
        console.log(`   - Total Days: ${diffDays}`);
        console.log(`   - Total Weeks (calculated): ${diffWeeks}`);
    } else {
        console.log("\n❌ NO ACTIVE TERM FOUND.");
    }

    const obs = await prisma.observation.findFirst();

    if (obs) {
        console.log("\n✅ SAMPLE OBSERVATION FOUND:");
        console.log(`   - Course: ${obs.courseCode}`);
        console.log(`   - Strengths (JSON):`, JSON.stringify(obs.strengths));
        console.log(`   - Improvements (JSON):`, JSON.stringify(obs.improvements));
        
        if (typeof obs.strengths === 'object' && obs.strengths !== null) {
            console.log("   - Strengths Verification: SUCCESS (Field is an object)");
        } else {
            console.log("   - Strengths Verification: FAILED (Field is NOT an object)");
        }
    } else {
        console.log("\n❌ NO COMPLETED OBSERVATION FOUND.");
    }

    const subs = await prisma.submission.findMany({
        include: { lecturer: true }
    });

    if (subs.length > 0) {
        console.log(`\n✅ ${subs.length} SUBMISSIONS FOUND:`);
        subs.forEach(sub => {
            console.log(`   - [${sub.type}] Title: ${sub.title}`);
            console.log(`   - Content (JSON):`, JSON.stringify(sub.content));
        });
    } else {
        console.log("\n❌ NO SUBMISSIONS FOUND.");
    }

    const admin = await prisma.user.findUnique({ where: { email: "admin@lamas.edu" } });
    if (admin) {
        console.log("\n✅ ADMIN USER VERIFIED:");
        console.log(`   - Role: ${admin.role}`);
    }

    console.log("\n--------------------------------------------------");
}

main()
    .catch((e) => {
        console.error("❌ Verification failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
