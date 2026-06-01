import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as bcrypt from "bcryptjs";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const newPassword = "password123";
  const hash = await bcrypt.hash(newPassword, 12);

  // Fetch all users currently in the database dynamically
  const users = await prisma.user.findMany();
  
  console.log(`📡 Found ${users.length} users in database. Resetting all passwords...`);

  for (const u of users) {
    await prisma.user.update({
      where: { id: u.id },
      data: { passwordHash: hash, isActive: true },
    });
    console.log(`   ✅ Reset password for ${u.role}: ${u.name} (${u.email})`);
  }

  console.log("\n🔑 All passwords successfully reset to: password123");
  console.log("\n📋 Login Credentials Summary of Primary Accounts:");
  console.log("─".repeat(55));
  console.log("Role         | Email                  | Password");
  console.log("─".repeat(55));
  const primaryAccounts = [
    { role: "SUPER_ADMIN", email: "superadmin@lamas.edu" },
    { role: "ADMIN",       email: "admin@lamas.edu" },
    { role: "HOD",         email: "ahmad@lamas.edu" },
    { role: "LECTURER",    email: "slyyhaw@gmail.com" },
    { role: "LECTURER",    email: "rahman@lamas.edu" },
  ];
  for (const acc of primaryAccounts) {
    console.log(`${acc.role.padEnd(12)} | ${acc.email.padEnd(22)} | ${newPassword}`);
  }
  console.log("─".repeat(55));

}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
