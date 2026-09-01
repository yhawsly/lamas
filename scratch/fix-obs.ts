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

// Step 1: Delete duplicate observations (IDs 10, 11, 12)
console.log('=== Step 1: Deleting duplicate observations ===\n');
const dupeIds = [10, 11, 12];
const deleted = await prisma.observation.deleteMany({
  where: { id: { in: dupeIds } },
});
console.log(`  Deleted ${deleted.count} duplicate observations (IDs: ${dupeIds.join(', ')})\n`);

// Step 2: Update remaining observations to active term (termId: 10)
console.log('=== Step 2: Updating term assignment ===\n');
const activeTermId = 10;
const updated = await prisma.observation.updateMany({
  where: { termId: 1 },
  data: { termId: activeTermId },
});
console.log(`  Updated ${updated.count} observations to termId: ${activeTermId}\n`);

// Verify final state
console.log('=== Final State ===\n');
const obs = await prisma.observation.findMany({
  include: {
    lecturer: { select: { name: true } },
    observer: { select: { name: true } },
  },
  orderBy: { id: 'asc' },
});
console.log(`Total observations: ${obs.length}\n`);
obs.forEach((o: any) => {
  console.log(`  ID:${o.id} | term:${o.termId} | status:${o.status} | ${o.courseCode}`);
  console.log(`    ${o.lecturer?.name} ← observed by → ${o.observer?.name}\n`);
});

await prisma.$disconnect();
await pool.end();
