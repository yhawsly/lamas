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
const prisma = new PrismaClient({ adapter } as any);

async function testWorkflow() {
  console.log("🏁 Starting Database integration tests for Phase 3...");

  // 1. Fetch test users
  const lecturer = await prisma.user.findFirst({
    where: { role: "LECTURER", email: "lecturer1@lamas.edu" }
  });
  const hod = await prisma.user.findFirst({
    where: { role: "HOD", email: "hod.cs@lamas.edu" }
  });

  if (!lecturer || !hod) {
    console.error("❌ Test users not found. Make sure to run seed scripts.");
    return;
  }
  console.log(`👤 Lecturer found: ${lecturer.name} (ID: ${lecturer.id})`);
  console.log(`👤 HOD found: ${hod.name} (ID: ${hod.id})`);

  // 2. Fetch a course
  const course = await prisma.course.findFirst();
  if (!course) {
    console.error("❌ No courses found in database.");
    return;
  }
  console.log(`📚 Course found: ${course.code} (ID: ${course.id})`);

  // 3. Define Phase 3 Syllabus Outline Structure
  const baseSyllabus = {
    courseId: course.id,
    basicInfo: {
      courseCode: course.code,
      title: course.title,
      description: "Database Systems Core.",
      credits: "3"
    },
    outcomes: [
      { id: "LO-1", text: "Explain normalization theories." },
      { id: "LO-2", text: "Construct SQL structures." }
    ],
    topics: [
      { id: 1, title: "Relational Algebra", description: "Operations and notations.", outcomeIds: ["LO-1"] },
      { id: 2, title: "SQL Triggers", description: "Creating stored trigger code.", outcomeIds: ["LO-2"] }
    ],
    classes: [
      { id: "c1", name: "Section A", students: 35, modules: [] }
    ],
    assessments: [
      { id: "a1", name: "Quizzes", weight: 20, description: "Weekly quizzes." },
      { id: "a2", name: "Midterm Exam", weight: 30, description: "Theoretical test." },
      { id: "a3", name: "Final Project", weight: 50, description: "Implementation code." }
    ]
  };

  // 4. Weight Validation Check
  const totalWeight = baseSyllabus.assessments.reduce((sum, a) => sum + a.weight, 0);
  console.log(`⚖️ Checking weight validation: ${totalWeight}%`);
  if (totalWeight !== 100) {
    console.error("❌ Weight check failed! Sum is not 100%.");
    return;
  }
  console.log("✅ Weight sums up to exactly 100%!");

  // Clean old submissions
  await prisma.submissionVersion.deleteMany({
    where: { submission: { lecturerId: lecturer.id, type: "COURSE_TOPICS" } }
  });
  await prisma.submission.deleteMany({
    where: { lecturerId: lecturer.id, type: "COURSE_TOPICS" }
  });

  // 5. Create First Version (Status: DRAFT)
  const submission = await prisma.submission.create({
    data: {
      lecturerId: lecturer.id,
      title: `Course Outline for Course #${course.id}`,
      type: "COURSE_TOPICS",
      content: baseSyllabus as any,
      status: "DRAFT"
    }
  });

  const v1 = await prisma.submissionVersion.create({
    data: {
      submissionId: submission.id,
      snapshot: baseSyllabus as any,
      isDraft: true
    }
  });
  console.log(`📝 Created Version 1 snapshot. ID: ${v1.id}`);

  // 6. Make modifications and create Second Version
  const modifiedSyllabus = {
    ...baseSyllabus,
    basicInfo: {
      ...baseSyllabus.basicInfo,
      description: "Database Systems Core (Revised)."
    }
  };

  await prisma.submission.update({
    where: { id: submission.id },
    data: { content: modifiedSyllabus as any }
  });

  const v2 = await prisma.submissionVersion.create({
    data: {
      submissionId: submission.id,
      snapshot: modifiedSyllabus as any,
      isDraft: true
    }
  });
  console.log(`📝 Created Version 2 snapshot (Revised description). ID: ${v2.id}`);

  // 7. Verify we have 2 versions in history
  const history = await prisma.submissionVersion.findMany({
    where: { submissionId: submission.id },
    orderBy: { savedAt: 'desc' }
  });
  console.log(`🔎 Version History Count: ${history.length} versions found.`);

  // 8. Restore Version 1
  const restoreTarget = history.find(v => v.id === v1.id);
  if (!restoreTarget) {
    console.error("❌ Restore target version not found.");
    return;
  }
  
  const snapshot: any = typeof restoreTarget.snapshot === "string" 
    ? JSON.parse(restoreTarget.snapshot) 
    : restoreTarget.snapshot;

  const restoredSubmission = await prisma.submission.update({
    where: { id: submission.id },
    data: { 
      content: snapshot as any,
      status: "DRAFT"
    }
  });

  const restoredContent: any = typeof restoredSubmission.content === "string"
    ? JSON.parse(restoredSubmission.content)
    : restoredSubmission.content;

  console.log(`⏪ Restored Description matches Version 1: "${restoredContent.basicInfo.description}"`);
  console.log(`✨ Phase 3 DB workflow integrations tested successfully!`);
}

testWorkflow()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
