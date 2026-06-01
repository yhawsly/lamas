import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function check() {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { email: true, role: true, requirePasswordReset: true, createdAt: true }
    });
    
    console.log("--- LATEST 5 USERS ---");
    users.forEach(u => {
        console.log(`[${u.createdAt.toISOString()}] ${u.email} (${u.role}) - ResetRequired: ${u.requirePasswordReset}`);
    });
}

check().finally(() => prisma.$disconnect());
