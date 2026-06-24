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
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🔓 CLEARING requirePasswordReset FLAG FOR ALL USERS...");
    const result = await prisma.user.updateMany({
        data: {
            requirePasswordReset: false,
            isActive: true
        }
    });
    console.log(`✅ Updated ${result.count} users successfully.`);
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
