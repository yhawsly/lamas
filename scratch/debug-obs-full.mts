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

// 1. Verify course assignments exist for each observation
console.log('=== COURSE ASSIGNMENT VALIDATION ===\n');
const obs = await prisma.observation.findMany({ orderBy: { id: 'asc' } });
for (const o of obs) {
  const assignment = await prisma.courseSection.findFirst({
    where: {
      lecturerId: o.lecturerId,
      course: { code: o.courseCode },
    },
    include: { course: { select: { code: true, title: true } } },
  });
  const status = assignment ? `✓ VALID (${(assignment as any).course.title})` : '✗ MISSING';
  console.log(`  Obs ${o.id}: Lecturer ${o.lecturerId} -> ${o.courseCode} : ${status}`);
}

// 2. Check active term
console.log('\n=== ACTIVE TERM ===\n');
const activeTerm = await prisma.academicTerm.findFirst({ where: { isActive: true } });
if (activeTerm) {
  console.log(`Active Term: id=${activeTerm.id}, label=${(activeTerm as any).label ?? 'N/A'}, isActive=${activeTerm.isActive}`);
} else {
  console.log('⚠ No active term found!');
}

// 3. List all course sections for the lecturers in observations
console.log('\n=== COURSE SECTIONS FOR OBSERVED LECTURERS ===\n');
const lecturerIds = [...new Set(obs.map(o => o.lecturerId))];
for (const lid of lecturerIds) {
  const sections = await prisma.courseSection.findMany({
    where: { lecturerId: lid },
    include: { course: { select: { code: true, title: true } } },
  });
  const user = await prisma.user.findUnique({ where: { id: lid }, select: { name: true } });
  console.log(`  Lecturer: ${user?.name} (id:${lid})`);
  if (sections.length === 0) {
    console.log('    ⚠ No course sections assigned!');
  } else {
    sections.forEach((s: any) => {
      console.log(`    Section ${s.id}: ${s.course.code} - ${s.course.title}`);
    });
  }
  console.log('');
}

// 4. Check the POST endpoint duplicate prevention
console.log('=== DUPLICATE ANALYSIS ===\n');
const dupeMap = new Map<string, any[]>();
obs.forEach((o: any) => {
  const key = `lec:${o.lecturerId}-obs:${o.observerId}-${o.courseCode}-term:${o.termId}`;
  if (!dupeMap.has(key)) dupeMap.set(key, []);
  dupeMap.get(key)!.push(o);
});
for (const [key, entries] of dupeMap) {
  if (entries.length > 1) {
    console.log(`  DUPLICATE: ${key}`);
    entries.forEach((e: any) => console.log(`    ID:${e.id} status:${e.status} created:${e.createdAt}`));
  }
}
if (![...dupeMap.values()].some(v => v.length > 1)) {
  console.log('  No duplicates found.');
}

await prisma.$disconnect();
await pool.end();
