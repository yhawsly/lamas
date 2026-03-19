// Simple JS seed script for Prisma v5 (avoids TS compilation issues)
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database...");

    // Create departments
    const cs = await prisma.department.upsert({
        where: { code: "CS" },
        update: {},
        create: { name: "Computer Science", code: "CS" },
    });
    const eng = await prisma.department.upsert({
        where: { code: "ENG" },
        update: {},
        create: { name: "Engineering", code: "ENG" },
    });
    const biz = await prisma.department.upsert({
        where: { code: "BIZ" },
        update: {},
        create: { name: "Business Administration", code: "BIZ" },
    });

    const hash = await bcrypt.hash("password123", 12);

    // Create users
    await prisma.user.upsert({ 
        where: { email: "superadmin@lamas.edu" }, 
        update: { role: "SUPER_ADMIN" }, 
        create: { name: "Super Administrator", email: "superadmin@lamas.edu", passwordHash: hash, role: "SUPER_ADMIN" } 
    });
    await prisma.user.upsert({ 
        where: { email: "admin@lamas.edu" }, 
        update: { role: "ADMIN" }, 
        create: { name: "System Administrator", email: "admin@lamas.edu", passwordHash: hash, role: "ADMIN" } 
    });

    const hod = await prisma.user.upsert({ 
        where: { email: "hod.cs@lamas.edu" }, 
        update: { role: "HOD" }, 
        create: { name: "Dr. Ahmad Razif", email: "hod.cs@lamas.edu", passwordHash: hash, role: "HOD", departmentId: cs.id } 
    });
    await prisma.department.update({ where: { id: cs.id }, data: { hodId: hod.id } });

    const lec1 = await prisma.user.upsert({ 
        where: { email: "lecturer1@lamas.edu" }, 
        update: { role: "LECTURER" }, 
        create: { name: "Dr. Sarah Lim", email: "lecturer1@lamas.edu", passwordHash: hash, role: "LECTURER", departmentId: cs.id } 
    });
    await prisma.user.upsert({ 
        where: { email: "lecturer2@lamas.edu" }, 
        update: { role: "LECTURER" }, 
        create: { name: "Mr. Hafiz Rahman", email: "lecturer2@lamas.edu", passwordHash: hash, role: "LECTURER", departmentId: eng.id } 
    });
    await prisma.user.upsert({ 
        where: { email: "lecturer3@lamas.edu" }, 
        update: { role: "LECTURER" }, 
        create: { name: "Ms. Priya Nair", email: "lecturer3@lamas.edu", passwordHash: hash, role: "LECTURER", departmentId: biz.id } 
    });

    // Deadlines
    const existingDl = await prisma.deadline.count();
    if (existingDl === 0) {
        await prisma.deadline.create({ data: { type: "SEMESTER_CALENDAR", label: "Semester Calendar — Sem 1 2025/2026", dueDate: new Date("2026-03-15T23:59:00Z"), createdBy: 2 } });
        await prisma.deadline.create({ data: { type: "COURSE_TOPICS", label: "Course Topics — Sem 1 2025/2026", dueDate: new Date("2026-03-20T23:59:00Z"), createdBy: 2 } });
        await prisma.deadline.create({ data: { type: "OBSERVATION_REPORT", label: "Observation Report — Mid Semester", dueDate: new Date("2026-04-10T23:59:00Z"), createdBy: 2 } });
    }

    // Demo submission
    const dl = await prisma.deadline.findFirst({ where: { type: "SEMESTER_CALENDAR" } });
    if (dl) {
        const existing = await prisma.submission.findFirst({ where: { lecturerId: lec1.id } });
        if (!existing) {
            await prisma.submission.create({ data: { lecturerId: lec1.id, type: "SEMESTER_CALENDAR", title: "CS101 - Semester Calendar 2025/2026", deadlineId: dl.id, status: "SUBMITTED", submittedAt: new Date() } });
        }
    }

    console.log("✅ Seeding complete!\n");
    console.log("📋 Demo Accounts (password: password123):");
    console.log("  superadmin@lamas.edu  — SUPER_ADMIN");
    console.log("  admin@lamas.edu       — ADMIN");
    console.log("  hod.cs@lamas.edu      — HOD (Computer Science)");
    console.log("  lecturer1@lamas.edu   — LECTURER (CS)");
    console.log("  lecturer2@lamas.edu   — LECTURER (Engineering)");
    console.log("  lecturer3@lamas.edu   — LECTURER (Business)");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
