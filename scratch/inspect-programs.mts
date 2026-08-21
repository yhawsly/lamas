import pg from "pg";
const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

async function main() {
    const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

    console.log("=== PROGRAMS IN NEON DB ===");
    const progRes = await pool.query(`SELECT id, code, name, description FROM "Program" ORDER BY id ASC`);
    console.table(progRes.rows);

    console.log("\n=== SAMPLE SECTIONS BY PROGRAM LEVEL & SESSION ===");
    const secRes = await pool.query(`
        SELECT cs.id, cs.name, cs.session, cs."dayOfWeek", cs."startTime", cs."endTime", cs.venue, c.code AS "courseCode", u.name AS "lecturer"
        FROM "CourseSection" cs
        JOIN "Course" c ON cs."courseId" = c.id
        LEFT JOIN "User" u ON cs."lecturerId" = u.id
        ORDER BY c.code ASC, cs.name ASC
        LIMIT 25
    `);
    console.table(secRes.rows);

    const countRes = await pool.query(`SELECT count(*) FROM "CourseSection"`);
    console.log(`\nTotal Course Sections Created: ${countRes.rows[0].count}`);

    await pool.end();
}

main().catch(console.error);
