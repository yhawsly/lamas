const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sections = await prisma.courseSection.findMany({
    select: { id: true, name: true, course: { select: { code: true } } },
    take: 20
  });
  console.log(JSON.stringify(sections.filter(s => !s.name.endsWith('-A')), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
