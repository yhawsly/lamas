const { Pool } = require("pg");
const dotenv = require("dotenv");
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
  const resCourse = await pool.query('SELECT * FROM "Course" WHERE id = $1', [9]);
  console.log('Course 9:', JSON.stringify(resCourse.rows[0], null, 2));

  const resSyllabus = await pool.query('SELECT * FROM "MasterSyllabus" WHERE "courseId" = $1', [9]);
  console.log('Syllabus 9:', JSON.stringify(resSyllabus.rows[0], null, 2));

  const resSubmissions = await pool.query('SELECT * FROM "Submission" WHERE "type" = $1', ['COURSE_TOPICS']);
  console.log('Syllabus Submissions:', JSON.stringify(resSubmissions.rows.map(s => ({
    id: s.id,
    lecturerId: s.lecturerId,
    title: s.title,
    status: s.status,
    content: s.content
  })), null, 2));
}
main().catch(console.error).finally(() => pool.end());
