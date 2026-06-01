import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
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
