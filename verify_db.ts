import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🔍 VERIFYING NEON DATABASE DATA...");

    const userCount = await prisma.user.count();
    const deptCount = await prisma.department.count();
    const courseCount = await prisma.course.count();
    const submissionCount = await prisma.submission.count();

    console.log(`   - Users: ${userCount}`);
    console.log(`   - Departments: ${deptCount}`);
    console.log(`   - Courses: ${courseCount}`);
    console.log(`   - Submissions: ${submissionCount}`);

    const sub = await prisma.submission.findFirst({
        where: { type: "SEMESTER_CALENDAR" },
        include: { lecturer: true }
    });

    if (sub) {
        console.log("\n✅ SAMPLE SUBMISSION FOUND:");
        console.log(`   - Title: ${sub.title}`);
        console.log(`   - Lecturer: ${sub.lecturer.name}`);
        console.log(`   - Status: ${sub.status}`);
        console.log(`   - Content (JSON):`, JSON.stringify(sub.content));
        
        if (typeof sub.content === 'object' && sub.content !== null) {
            console.log("   - JSON Verification: SUCCESS (Field is an object)");
        } else {
            console.log("   - JSON Verification: FAILED (Field is NOT an object)");
        }
    } else {
        console.log("\n❌ NO SAMPLE SUBMISSION FOUND.");
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
    });
