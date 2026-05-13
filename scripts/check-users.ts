import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, isActive: true, departmentId: true },
    orderBy: { role: "asc" },
  });
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
