import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as bcrypt from "bcrypt";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🔍 QUERYING USERS AND VERIFYING HASHES...");
    const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, passwordHash: true }
    });

    for (const u of users) {
        const testMatch = await bcrypt.compare("password123", u.passwordHash);
        console.log(`User: ${u.name} | Email: ${u.email} | Role: ${u.role} | PasswordMatch: ${testMatch}`);
    }
}

main()
    .catch((e) => {
        console.error("❌ Failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
