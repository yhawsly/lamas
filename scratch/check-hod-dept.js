const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, departmentId: true, isActive: true },
    where: { role: { in: ['HOD', 'LECTURER'] } },
    orderBy: { role: 'asc' }
  });
  console.log('=== HODs and Lecturers ===');
  users.forEach(u => console.log(JSON.stringify(u)));
  
  const depts = await prisma.department.findMany({ select: { id: true, name: true, code: true } });
  console.log('\n=== Departments ===');
  depts.forEach(d => console.log(JSON.stringify(d)));

  await pool.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
