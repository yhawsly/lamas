import pg from "pg";
const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

async function main() {
    if (!connectionString) {
        console.error("DATABASE_URL is not defined in environment.");
        process.exit(1);
    }
    const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

    console.log("=== SYNCING TERM DATA IN DATABASE ===");

    // 1. Assign any NULL termId submissions to Term 1 (Archived)
    const updateNullSubs = await pool.query(`UPDATE "Submission" SET "termId" = 1 WHERE "termId" IS NULL`);
    console.log(`Updated ${updateNullSubs.rowCount} NULL submissions to Term 1.`);

    // 2. Ensure Term 1 (Archived) has Form A Observations
    const obsTerm1Count = await pool.query(`SELECT count(*) FROM "Observation" WHERE "termId" = 1`);
    if (parseInt(obsTerm1Count.rows[0].count) === 0) {
        console.log("Seeding Form A Observations for Term 1 (Archived)...");
        await pool.query(`
            INSERT INTO "Observation" ("lecturerId", "observerId", "courseCode", "status", "reviewData", "feedback", "termId", "createdAt", "updatedAt")
            VALUES 
            (4, 3, 'CS101', 'COMPLETED', '{"teachingMethodology": 5, "contentKnowledge": 4, "studentEngagement": 5, "classroomManagement": 4}', 'Excellent lecture structure and student participation in Semester 1.', 1, '2026-04-15 10:00:00', '2026-04-15 10:00:00'),
            (4, 50, 'SE201', 'REVIEWED', '{"teachingMethodology": 5, "contentKnowledge": 5, "studentEngagement": 4, "classroomManagement": 5}', 'Outstanding presentation of software design patterns in Semester 1.', 1, '2026-05-10 14:00:00', '2026-05-10 14:00:00'),
            (51, 4, 'CS102', 'COMPLETED', '{"teachingMethodology": 4, "contentKnowledge": 4, "studentEngagement": 4, "classroomManagement": 4}', 'Good engagement and practical demonstrations in Semester 1.', 1, '2026-06-01 11:30:00', '2026-06-01 11:30:00');
        `);
    }

    // 3. Ensure Term 10 (Live Active) has CourseSections for active courses
    const activeSectionsCount = await pool.query(`SELECT count(*) FROM "CourseSection" WHERE "termId" = 10`);
    if (parseInt(activeSectionsCount.rows[0].count) < 5) {
        console.log("Seeding CourseSections for Term 10 (Live Active)...");
        const coursesRes = await pool.query(`SELECT id, code FROM "Course" LIMIT 10`);
        const lecturersRes = await pool.query(`SELECT id FROM "User" WHERE role = 'LECTURER' OR role = 'HOD' LIMIT 10`);

        if (coursesRes.rows.length > 0 && lecturersRes.rows.length > 0) {
            for (let i = 0; i < coursesRes.rows.length; i++) {
                const c = coursesRes.rows[i];
                const l = lecturersRes.rows[i % lecturersRes.rows.length];
                await pool.query(`
                    INSERT INTO "CourseSection" ("courseId", "termId", "lecturerId", "name", "session", "dayOfWeek", "startTime", "endTime", "venue")
                    VALUES ($1, 10, $2, $3, 'REGULAR', 'Monday', '09:00 AM', '11:00 AM', 'Lecture Hall A')
                `, [c.id, l.id, `Section 0${i + 1}`]);
            }
        }
    }

    // 4. Ensure Term 10 (Live Active) has Submissions
    const subTerm10Count = await pool.query(`SELECT count(*) FROM "Submission" WHERE "termId" = 10`);
    if (parseInt(subTerm10Count.rows[0].count) === 0) {
        console.log("Seeding Submissions for Term 10 (Live Active)...");
        await pool.query(`
            INSERT INTO "Submission" ("lecturerId", "title", "filePath", "status", "termId", "type", "createdAt", "updatedAt")
            VALUES 
            (4, 'Semester 2 Course Syllabus - CS101', 'uploads/cs101_s2_syllabus.pdf', 'SUBMITTED', 10, 'COURSE_TOPICS', '2026-08-10 09:00:00', '2026-08-10 09:00:00'),
            (4, 'Semester 2 Calendar - Dr. Sylvester', 'uploads/sylvester_s2_cal.pdf', 'SUBMITTED', 10, 'SEMESTER_CALENDAR', '2026-08-11 11:00:00', '2026-08-11 11:00:00'),
            (51, 'Semester 2 Course Topics - CS102', 'uploads/cs102_s2_topics.pdf', 'SUBMITTED', 10, 'COURSE_TOPICS', '2026-08-12 15:00:00', '2026-08-12 15:00:00');
        `);
    }

    // 5. Ensure Term 10 (Live Active) has Deadlines
    const dlsTerm10Count = await pool.query(`SELECT count(*) FROM "Deadline" WHERE "termId" = 10`);
    if (parseInt(dlsTerm10Count.rows[0].count) === 0) {
        console.log("Seeding Deadlines for Term 10 (Live Active)...");
        await pool.query(`
            INSERT INTO "Deadline" ("label", "dueDate", "createdBy", "termId", "type", "createdAt", "updatedAt")
            VALUES 
            ('Submission of Semester 2 Syllabus', '2026-09-15 23:59:59', 1, 10, 'COURSE_TOPICS', '2026-08-07 08:00:00', '2026-08-07 08:00:00'),
            ('Submission of Mid-Term Observation Reports', '2026-09-30 23:59:59', 1, 10, 'OBSERVATION_REPORT', '2026-08-07 08:00:00', '2026-08-07 08:00:00');
        `);
    }

    // Print final summary
    console.log("\n=== FINAL TERM RECORD COUNTS ===");
    const termsRes = await pool.query(`SELECT id, name, "isActive" FROM "AcademicTerm" ORDER BY id ASC`);
    for (const term of termsRes.rows) {
        const obs = await pool.query(`SELECT count(*) FROM "Observation" WHERE "termId" = $1`, [term.id]);
        const teach = await pool.query(`SELECT count(*) FROM "TeachingObservation" WHERE "termId" = $1`, [term.id]);
        const mod = await pool.query(`SELECT count(*) FROM "ExamModeration" WHERE "termId" = $1`, [term.id]);
        const sub = await pool.query(`SELECT count(*) FROM "Submission" WHERE "termId" = $1`, [term.id]);
        const sec = await pool.query(`SELECT count(*) FROM "CourseSection" WHERE "termId" = $1`, [term.id]);
        const dl = await pool.query(`SELECT count(*) FROM "Deadline" WHERE "termId" = $1`, [term.id]);

        console.log(`Term ID ${term.id} ("${term.name}", Active: ${term.isActive}):`);
        console.log(`  CourseSections: ${sec.rows[0].count} | Form A: ${obs.rows[0].count} | Form B: ${teach.rows[0].count} | Form C: ${mod.rows[0].count} | Submissions: ${sub.rows[0].count} | Deadlines: ${dl.rows[0].count}`);
    }

    await pool.end();
}

main().catch(console.error);
