import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://neondb_owner:npg_UfDwtkd7zoV0@ep-snowy-bread-ai5c6uw4-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&connection_limit=20"
        }
    }
});

async function checkHod() {
    const hods = await prisma.user.findMany({
        where: { role: "HOD" },
        include: { department: true }
    });
    console.log("HODs in system:");
    hods.forEach(h => {
        console.log(`ID: ${h.id}, Name: ${h.name}, Email: ${h.email}, Role: ${h.role}, Dept: ${h.department?.name || "NONE"} (${h.departmentId})`);
    });

    const lecturers = await prisma.user.findMany({
        where: { role: "LECTURER" },
        include: { department: true }
    });
    console.log("\nLecturers in system:");
    lecturers.forEach(l => {
        console.log(`ID: ${l.id}, Name: ${l.name}, Dept: ${l.department?.name || "NONE"} (${l.departmentId})`);
    });
}

checkHod().finally(() => prisma.$disconnect());
