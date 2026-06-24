import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 3,
    connectionTimeoutMillis: 30000,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
    const engDept = await prisma.department.findUnique({ where: { code: 'ENG' } });
    if (!engDept) throw new Error("Engineering department not found");

    let engHOD = await prisma.user.findFirst({
        where: { role: 'HOD', departmentId: engDept.id }
    });

    if (!engHOD) {
        console.log("Creating Engineering HOD...");
        const hash = await bcrypt.hash("password123", 10);
        engHOD = await prisma.user.create({
            data: {
                name: "Dr. Eng Hod",
                email: "enghod@lamas.edu",
                passwordHash: hash,
                role: "HOD",
                departmentId: engDept.id,
                isActive: true,
                requirePasswordReset: false
            }
        });
        
        await prisma.department.update({
            where: { id: engDept.id },
            data: { hodId: engHOD.id }
        });
        console.log("Created Engineering HOD: enghod@lamas.edu / password123");
    } else {
        console.log("Engineering HOD exists:", engHOD.email);
    }
}

main().catch(console.error).finally(() => {
    prisma.$disconnect();
    pool.end();
});
