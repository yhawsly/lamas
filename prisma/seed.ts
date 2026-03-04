import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
    console.log("🌱 Seeding database...");

    // Departments
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

    // Super Admin
    await prisma.user.upsert({
        where: { email: "superadmin@lamas.edu" },
        update: {},
        create: {
            name: "Super Administrator",
            email: "superadmin@lamas.edu",
            passwordHash: hash,
            role: "SUPER_ADMIN",
        },
    });

    // Admin
    await prisma.user.upsert({
        where: { email: "admin@lamas.edu" },
        update: {},
        create: {
            name: "System Administrator",
            email: "admin@lamas.edu",
            passwordHash: hash,
            role: "ADMIN",
        },
    });

    // HoD - CS
    const hod = await prisma.user.upsert({
        where: { email: "hod.cs@lamas.edu" },
        update: {},
        create: {
            name: "Dr. Ahmad Razif",
            email: "hod.cs@lamas.edu",
            passwordHash: hash,
            role: "HOD",
            departmentId: cs.id,
        },
    });

    // Update CS dept with HoD
    await prisma.department.update({
        where: { id: cs.id },
        data: { hodId: hod.id },
    });

    // Lecturers
    const lecturer1 = await prisma.user.upsert({
        where: { email: "lecturer1@lamas.edu" },
        update: {},
        create: {
            name: "Dr. Sarah Lim",
            email: "lecturer1@lamas.edu",
            passwordHash: hash,
            role: "LECTURER",
            departmentId: cs.id,
        },
    });

    await prisma.user.upsert({
        where: { email: "lecturer2@lamas.edu" },
        update: {},
        create: {
            name: "Mr. Hafiz Rahman",
            email: "lecturer2@lamas.edu",
            passwordHash: hash,
            role: "LECTURER",
            departmentId: eng.id,
        },
    });

    await prisma.user.upsert({
        where: { email: "lecturer3@lamas.edu" },
        update: {},
        create: {
            name: "Ms. Priya Nair",
            email: "lecturer3@lamas.edu",
            passwordHash: hash,
            role: "LECTURER",
            departmentId: biz.id,
        },
    });

    // Deadlines
    await prisma.deadline.createMany({
        data: [
            {
                type: "SEMESTER_CALENDAR",
                label: "Semester Calendar Submission — Sem 1 2025/2026",
                dueDate: new Date("2026-03-15T23:59:00Z"),
                createdBy: 2,
            },
            {
                type: "COURSE_TOPICS",
                label: "Course Topics Submission — Sem 1 2025/2026",
                dueDate: new Date("2026-03-20T23:59:00Z"),
                createdBy: 2,
            },
            {
                type: "OBSERVATION_REPORT",
                label: "Observation Report — Mid Semester",
                dueDate: new Date("2026-04-10T23:59:00Z"),
                createdBy: 2,
            },
        ],
    });

    // Sample submission by lecturer1
    const dl = await prisma.deadline.findFirst({ where: { type: "SEMESTER_CALENDAR" } });
    if (dl) {
        await prisma.submission.create({
            data: {
                lecturerId: lecturer1.id,
                type: "SEMESTER_CALENDAR",
                title: "CS101 - Semester Calendar 2025/2026",
                content: JSON.stringify({ weeks: [] }),
                deadlineId: dl.id,
                status: "SUBMITTED",
                submittedAt: new Date(),
            },
        });
    }

    console.log("✅ Seeding complete.");
    console.log("\n📋 Demo Accounts (password: password123):");
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
