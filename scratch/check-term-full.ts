const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const term = await prisma.academicTerm.findFirst({ where: { isActive: true } });
  console.log('Active Term:', JSON.stringify(term, null, 2));

  // Check deadline schema
  const deadlines = await prisma.deadline.findMany({
    where: term ? { termId: term.id, dueDate: { lte: new Date() } } : { dueDate: { lte: new Date() } },
  });
  console.log(`\nDeadlines due (count: ${deadlines.length}):`, JSON.stringify(deadlines.slice(0,3), null, 2));

  // Simulate the compliance query for HOD dept 1
  const lecturers = await prisma.user.findMany({
    where: { isActive: true, role: 'LECTURER', departmentId: 1 },
    select: { id: true, name: true, email: true, departmentId: true }
  });
  console.log(`\nLecturers in dept 1 (count: ${lecturers.length}):`, JSON.stringify(lecturers, null, 2));

  await pool.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
