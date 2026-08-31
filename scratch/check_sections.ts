import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const sections = await prisma.courseSection.findMany({
    include: { course: true },
    take: 10
  });
  console.log(JSON.stringify(sections, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
