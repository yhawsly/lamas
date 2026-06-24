import { prisma } from "../lib/prisma";

async function main() {
  const p = await prisma.program.findMany({
    include: {
      _count: { select: { curriculumMaps: true } }
    }
  });
  console.log("Programs and Curriculum Map Counts:");
  console.log(JSON.stringify(p, null, 2));

  const c = await prisma.course.count();
  console.log("\nTotal Courses:", c);
}

main().finally(() => prisma.$disconnect());
