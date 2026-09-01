import dotenv from "dotenv";
dotenv.config();

import { prisma } from "./lib/prisma";

async function main() {
  const course = await prisma.course.findUnique({
    where: { id: 9 }
  });
  console.log('Course 9:', JSON.stringify(course, null, 2));

  const syllabus = await prisma.masterSyllabus.findUnique({
    where: { courseId: 9 },
    include: { course: true }
  });
  console.log('Syllabus 9:', JSON.stringify(syllabus, null, 2));

  const submissions = await prisma.submission.findMany({
    where: { type: "COURSE_TOPICS" }
  });
  console.log('Syllabus Submissions:', JSON.stringify(submissions.map(s => ({
    id: s.id,
    lecturerId: s.lecturerId,
    title: s.title,
    status: s.status,
    content: s.content
  })), null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
