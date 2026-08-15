import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const obs = await prisma.observation.findMany({
  include: {
    lecturer: { select: { id: true, name: true, departmentId: true } },
    observer: { select: { id: true, name: true, departmentId: true } }
  }
});

console.log(`\nTotal observations: ${obs.length}\n`);
obs.forEach(o => {
  console.log(
    `ID:${o.id} | termId:${o.termId} | status:${o.status}`,
    `\n  Lecturer: ${o.lecturer?.name} (deptId: ${o.lecturer?.departmentId})`,
    `\n  Observer: ${o.observer?.name} (deptId: ${o.observer?.departmentId})\n`
  );
});

await prisma.$disconnect();
