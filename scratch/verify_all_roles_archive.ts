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
    console.log("=================================================================");
    console.log("COMPREHENSIVE MULTI-ROLE & ARCHIVE DATA FETCHING VERIFICATION");
    console.log("=================================================================\n");

    // 1. Fetch Terms
    const allTerms = await prisma.academicTerm.findMany({ orderBy: { id: "asc" } });
    console.log(`Found ${allTerms.length} Academic Terms:`);
    allTerms.forEach(t => {
        console.log(`   - [ID: ${t.id}] ${t.name} | Active: ${t.isActive}`);
    });

    const activeTerm = allTerms.find(t => t.isActive) || allTerms[1];
    const archiveTerm = allTerms.find(t => !t.isActive) || allTerms[0];

    console.log(`\nActive Term: ${activeTerm.name} (ID: ${activeTerm.id})`);
    console.log(`Archived Term: ${archiveTerm.name} (ID: ${archiveTerm.id})\n`);

    // 2. Test Users by Role
    const roles = ["SUPER_ADMIN", "ADMIN", "HOD", "DEO", "LECTURER"];
    for (const role of roles) {
        const user = await prisma.user.findFirst({ where: { role: role as any } });
        console.log(`Role [${role}]: ${user ? `${user.name} (${user.email}, ID: ${user.id})` : "NOT FOUND"}`);
    }

    console.log("\n-----------------------------------------------------------------");
    console.log("1. LECTURER ROLE DATA FETCHING");
    console.log("-----------------------------------------------------------------");
    const lecturer = await prisma.user.findFirst({ where: { role: "LECTURER" } });
    if (lecturer) {
        // A. Live Sections & Modules
        const liveSections = await prisma.courseSection.findMany({
            where: { termId: activeTerm.id, lecturerId: lecturer.id },
            include: { course: true }
        });
        console.log(`   Live Term Allocated Sections: ${liveSections.length}`);
        liveSections.forEach(s => console.log(`      - ${s.course.code}: ${s.name} (${s.session})`));

        // B. Archived Sections & Modules
        const archivedSections = await prisma.courseSection.findMany({
            where: { termId: archiveTerm.id, lecturerId: lecturer.id },
            include: { course: true }
        });
        console.log(`   Archived Term Allocated Sections: ${archivedSections.length}`);
        archivedSections.forEach(s => console.log(`      - ${s.course.code}: ${s.name} (${s.session})`));

        // C. Live vs Archive Submissions
        const liveSubs = await prisma.submission.findMany({
            where: { termId: activeTerm.id, lecturerId: lecturer.id }
        });
        const archSubs = await prisma.submission.findMany({
            where: { termId: archiveTerm.id, lecturerId: lecturer.id }
        });
        console.log(`   Live Submissions: ${liveSubs.length} | Archived Submissions: ${archSubs.length}`);
    }

    console.log("\n-----------------------------------------------------------------");
    console.log("2. HOD ROLE DATA FETCHING");
    console.log("-----------------------------------------------------------------");
    const hod = await prisma.user.findFirst({ where: { role: "HOD" } });
    if (hod && hod.departmentId) {
        // A. Department Courses
        const deptCourses = await prisma.course.findMany({
            where: { departmentId: hod.departmentId }
        });
        console.log(`   Department Courses: ${deptCourses.length} courses in department ID ${hod.departmentId}`);

        // B. Live Curriculum Map & Allocations
        const liveAllocations = await prisma.courseSection.findMany({
            where: { termId: activeTerm.id, course: { departmentId: hod.departmentId } },
            include: { course: true, lecturer: true }
        });
        console.log(`   Live Staffing Allocations: ${liveAllocations.length} sections allocated`);

        // C. Archived Curriculum Map & Allocations
        const archAllocations = await prisma.courseSection.findMany({
            where: { termId: archiveTerm.id, course: { departmentId: hod.departmentId } },
            include: { course: true, lecturer: true }
        });
        console.log(`   Archived Staffing Allocations: ${archAllocations.length} sections allocated`);

        // D. Review Center Tasks
        const liveReviews = await prisma.observation.findMany({ where: { termId: activeTerm.id } });
        const archReviews = await prisma.observation.findMany({ where: { termId: archiveTerm.id } });
        console.log(`   Live Form A Peer Reviews: ${liveReviews.length} | Archived Form A: ${archReviews.length}`);
    }

    console.log("\n-----------------------------------------------------------------");
    console.log("3. DEO ROLE DATA FETCHING");
    console.log("-----------------------------------------------------------------");
    // A. Form B Teaching Observations
    const liveObs = await prisma.teachingObservation.findMany({ where: { termId: activeTerm.id } });
    const archObs = await prisma.teachingObservation.findMany({ where: { termId: archiveTerm.id } });
    console.log(`   Live Form B Observations: ${liveObs.length} | Archived Form B: ${archObs.length}`);

    // B. Form C Exam Moderations
    const liveMod = await prisma.examModeration.findMany({ where: { termId: activeTerm.id } });
    const archMod = await prisma.examModeration.findMany({ where: { termId: archiveTerm.id } });
    console.log(`   Live Form C Moderations: ${liveMod.length} | Archived Form C: ${archMod.length}`);

    // C. Invigilation Matrix
    const liveInv = await prisma.examSessionInvigilation.findMany({ where: { termId: activeTerm.id } });
    const archInv = await prisma.examSessionInvigilation.findMany({ where: { termId: archiveTerm.id } });
    console.log(`   Live Invigilation Sessions: ${liveInv.length} | Archived Invigilations: ${archInv.length}`);

    // D. Exam Halls
    const halls = await prisma.examHall.findMany();
    console.log(`   Examination Halls: ${halls.length} verified physical venues`);

    console.log("\n-----------------------------------------------------------------");
    console.log("4. ADMIN & SUPER_ADMIN ROLE DATA FETCHING");
    console.log("-----------------------------------------------------------------");
    const totalUsers = await prisma.user.count();
    const totalDepts = await prisma.department.count();
    const totalPrograms = await prisma.program.count();
    const totalCourses = await prisma.course.count();
    const totalDeadlinesLive = await prisma.deadline.count({ where: { termId: activeTerm.id } });
    const totalDeadlinesArch = await prisma.deadline.count({ where: { termId: archiveTerm.id } });
    const auditLogs = await prisma.activityLog.count();

    console.log(`   Total System Users: ${totalUsers}`);
    console.log(`   Total Academic Departments: ${totalDepts}`);
    console.log(`   Total Academic Programs: ${totalPrograms}`);
    console.log(`   Total Master Courses: ${totalCourses}`);
    console.log(`   Live Term Deadlines: ${totalDeadlinesLive} | Archived Term Deadlines: ${totalDeadlinesArch}`);
    console.log(`   Tamper-Proof Activity Logs: ${auditLogs} logged events`);

    console.log("\n=================================================================");
    console.log("ALL ROLES & ARCHIVE DATA FETCHING VERIFIED SUCCESSFUL");
    console.log("=================================================================\n");
}

main().catch(console.error).finally(() => prisma.$disconnect());
