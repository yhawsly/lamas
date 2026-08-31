import { prisma } from "../lib/prisma";

async function runMaintenance() {
    const tables = [
        "User", "Department", "Program", "Course", "CourseSection",
        "CurriculumMap", "Submission", "Deadline", "AcademicTerm",
        "Observation", "TeachingObservation", "ExamModeration", "Resource", "AuditLog"
    ];

    console.log("==================================================");
    console.log("➤ Starting PostgreSQL Database Maintenance Routine");
    console.log("==================================================");

    for (const tbl of tables) {
        try {
            console.log(`➤ Reindexing "${tbl}"...`);
            await prisma.$executeRawUnsafe(`REINDEX TABLE "${tbl}"`);
            console.log(`✅ REINDEX TABLE "${tbl}" successful.`);
        } catch (err: any) {
            console.warn(`⚠️ Warning reindexing "${tbl}":`, err.message || err);
        }
    }

    try {
        console.log("➤ Running ANALYZE across database schema to update query planner statistics...");
        await prisma.$executeRawUnsafe("ANALYZE");
        console.log("✅ ANALYZE completed successfully.");
    } catch (err: any) {
        console.warn("⚠️ Warning running ANALYZE:", err.message || err);
    }

    console.log("==================================================");
    console.log("✅ Database Optimization & Re-Indexing Complete");
    console.log("==================================================");
}

runMaintenance()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("Maintenance failed:", err);
        process.exit(1);
    });
