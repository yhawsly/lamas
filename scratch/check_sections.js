const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/arad?schema=public"
    }
  }
});

async function main() {
  const sections = await prisma.courseSection.findMany({
    select: { name: true, course: { select: { code: true } } },
    take: 10
  });
  console.log(JSON.stringify(sections, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
