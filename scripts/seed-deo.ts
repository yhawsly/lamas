import { prisma } from "./lib/prisma";
import { hashPassword } from "./lib/password";

async function main() {
    const hash = await hashPassword("password123");
    const cs = await prisma.department.findFirst({ where: { code: "CS" } });
    await prisma.user.upsert({
        where: { email: "deo@lamas.edu" },
        update: {},
        create: {
            name: "Department Exam Officer",
            email: "deo@lamas.edu",
            passwordHash: hash,
            role: "DEO",
            departmentId: cs?.id,
            requirePasswordReset: true,
        },
    });
    console.log("DEO created");
}

main().catch(console.error).finally(() => prisma.$disconnect());
