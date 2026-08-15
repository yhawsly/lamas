import pg from "pg";
const { Pool } = pg;

const connectionString = "postgresql://neondb_owner:npg_oz6hFQDEda2x@ep-snowy-bread-ai5c6uw4-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require";

async function main() {
    const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

    console.log("=== CONNECTED TO NEON DB ===");
    
    // 1. Fetch AcademicTerms
    const termsRes = await pool.query(`SELECT id, name, "startDate", "endDate", "isActive" FROM "AcademicTerm" ORDER BY id ASC`);
    console.log("Academic Terms:");
    console.table(termsRes.rows);

    // 2. Count records per termId across all tables
    for (const term of termsRes.rows) {
        const obsRes = await pool.query(`SELECT count(*) FROM "Observation" WHERE "termId" = $1`, [term.id]);
        const teachRes = await pool.query(`SELECT count(*) FROM "TeachingObservation" WHERE "termId" = $1`, [term.id]);
        const modRes = await pool.query(`SELECT count(*) FROM "ExamModeration" WHERE "termId" = $1`, [term.id]);
        const subRes = await pool.query(`SELECT count(*) FROM "Submission" WHERE "termId" = $1`, [term.id]);
        const sectionRes = await pool.query(`SELECT count(*) FROM "CourseSection" WHERE "termId" = $1`, [term.id]);
        const deadlineRes = await pool.query(`SELECT count(*) FROM "Deadline" WHERE "termId" = $1`, [term.id]);

        console.log(`\nTerm ID ${term.id} ("${term.name}", Active: ${term.isActive}):`);
        console.log(`  - CourseSections: ${sectionRes.rows[0].count}`);
        console.log(`  - Form A Observations: ${obsRes.rows[0].count}`);
        console.log(`  - Form B Teaching Observations: ${teachRes.rows[0].count}`);
        console.log(`  - Form C Moderations: ${modRes.rows[0].count}`);
        console.log(`  - Submissions: ${subRes.rows[0].count}`);
        console.log(`  - Deadlines: ${deadlineRes.rows[0].count}`);
    }

    // 3. Count records with NULL termId
    const nullObs = await pool.query(`SELECT count(*) FROM "Observation" WHERE "termId" IS NULL`);
    const nullTeach = await pool.query(`SELECT count(*) FROM "TeachingObservation" WHERE "termId" IS NULL`);
    const nullMod = await pool.query(`SELECT count(*) FROM "ExamModeration" WHERE "termId" IS NULL`);
    const nullSub = await pool.query(`SELECT count(*) FROM "Submission" WHERE "termId" IS NULL`);
    const nullSection = await pool.query(`SELECT count(*) FROM "CourseSection" WHERE "termId" IS NULL`);
    console.log(`\nRecords with NULL termId:`);
    console.log(`  - CourseSections: ${nullSection.rows[0].count}`);
    console.log(`  - Form A Observations: ${nullObs.rows[0].count}`);
    console.log(`  - Form B Teaching Observations: ${nullTeach.rows[0].count}`);
    console.log(`  - Form C Moderations: ${nullMod.rows[0].count}`);
    console.log(`  - Submissions: ${nullSub.rows[0].count}`);

    await pool.end();
}

main().catch(console.error);
