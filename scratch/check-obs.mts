import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 2,
});

const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter } as any);

const obs = await prisma.observation.findMany({
  include: {
    lecturer: { select: { id: true, name: true, departmentId: true } },
    observer: { select: { id: true, name: true, departmentId: true } }
  }
});

console.log(`\nTotal observations: ${obs.length}\n`);
obs.forEach((o: any) => {
  console.log(
    `ID:${o.id} | termId:${o.termId ?? 'NULL'} | status:${o.status}` +
    `\n  Lecturer ID:${o.lecturerId} -> ${o.lecturer?.name ?? 'NOT FOUND'} (deptId: ${o.lecturer?.departmentId ?? 'NULL'})` +
    `\n  Observer ID:${o.observerId} -> ${o.observer?.name ?? 'NOT FOUND'} (deptId: ${o.observer?.departmentId ?? 'NULL'})\n`
  );
});

await prisma.$disconnect();
await pool.end();
