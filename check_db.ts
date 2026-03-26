import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_UfDwtkd7zoV0@ep-snowy-bread-ai5c6uw4-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function check() {
    try {
        const usersCount = await prisma.user.count();
        const users = await prisma.user.findMany({
            select: { email: true, role: true }
        });
        console.log(`Total users: ${usersCount}`);
        console.log("Users:", JSON.stringify(users, null, 2));
        
        const termsCount = await prisma.academicTerm.count();
        console.log(`Total terms: ${termsCount}`);
    } catch (e) {
        console.error("Check failed:", e);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

check();
