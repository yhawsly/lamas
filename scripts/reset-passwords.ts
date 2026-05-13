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

  // Reset all user passwords + fix corrupted name
  const updates = [
    { id: 1, name: "Super Administrator",   email: "superadmin@lamas.edu" },
    { id: 2, name: "System Administrator",  email: "admin@lamas.edu"      },
    { id: 3, name: "Dr. Ahmad Razif",       email: "ahmad@lamas.edu"      },  // HOD
    { id: 4, name: "Dr. Sarah Lim",         email: "slyyhaw@gmail.com"    },  // Lecturer
    { id: 5, name: "Mr. Hafiz Rahman",      email: "rahman@lamas.edu"     },  // Lecturer
    { id: 12, name: "Ms. Priya Nair",       email: "priya@lamas.edu"      },  // Lecturer
    { id: 25, name: "Mr. Kofi Mensah",      email: "kofi@lamas.edu"       },  // Lecturer (fixed broken name)
  ];

  for (const u of updates) {
    await prisma.user.update({
      where: { id: u.id },
      data: { passwordHash: hash, name: u.name, isActive: true },
    });
    console.log(`✅ Reset password for ${u.name} (${u.email})`);
  }

  console.log("\n🔑 All passwords reset to: password123");
  console.log("\n📋 Login Credentials Summary:");
  console.log("─".repeat(55));
  console.log("Role         | Email                  | Password");
  console.log("─".repeat(55));
  for (const u of updates) {
    const role = u.id === 1 ? "SUPER_ADMIN" : u.id === 2 ? "ADMIN" : u.id === 3 ? "HOD" : "LECTURER";
    console.log(`${role.padEnd(12)} | ${u.email.padEnd(22)} | ${newPassword}`);
  }
  console.log("─".repeat(55));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
