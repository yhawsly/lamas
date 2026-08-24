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

async function cleanup() {
    await prisma.resource.deleteMany({
        where: {
            url: { contains: "test_week2_slides" }
        }
    });
    console.log("Cleanup complete.");
}

cleanup().catch(console.error).finally(() => prisma.$disconnect());
