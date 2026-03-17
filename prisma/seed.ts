import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 STARTING PROFESSIONAL DATABASE SEEDING...");

    // 1. Departments
    console.log("   ➤ Creating departments...");
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

    // 2. Courses
    console.log("   ➤ Syncing course list...");
    const courseData = [
        { code: "CS101", title: "Introduction to Computer Science", departmentId: cs.id, credits: 3 },
        { code: "CS102", title: "Programming Fundamentals", departmentId: cs.id, credits: 3 },
        { code: "CS201", title: "Data Structures & Algorithms", departmentId: cs.id, credits: 4 },
        { code: "CS202", title: "Object-Oriented Programming", departmentId: cs.id, credits: 3 },
        { code: "CS203", title: "Discrete Mathematics", departmentId: cs.id, credits: 3 },
        { code: "CS301", title: "Web Development", departmentId: cs.id, credits: 3 },
        { code: "CS302", title: "Database Systems", departmentId: cs.id, credits: 3 },
        { code: "CS303", title: "Operating Systems", departmentId: cs.id, credits: 3 },
        { code: "CS401", title: "Artificial Intelligence", departmentId: cs.id, credits: 4 },
        { code: "CS402", title: "Software Engineering", departmentId: cs.id, credits: 3 },
        { code: "CS403", title: "Computer Networks", departmentId: cs.id, credits: 3 },
        { code: "ENG101", title: "Engineering Fundamentals", departmentId: eng.id, credits: 3 },
        { code: "ENG102", title: "Engineering Mathematics I", departmentId: eng.id, credits: 4 },
        { code: "ENG201", title: "Engineering Mathematics II", departmentId: eng.id, credits: 4 },
        { code: "ENG202", title: "Thermodynamics", departmentId: eng.id, credits: 4 },
        { code: "ENG203", title: "Fluid Mechanics", departmentId: eng.id, credits: 3 },
        { code: "ENG301", title: "Structural Analysis", departmentId: eng.id, credits: 3 },
        { code: "ENG302", title: "Electrical Circuits", departmentId: eng.id, credits: 3 },
        { code: "ENG401", title: "Control Systems Engineering", departmentId: eng.id, credits: 4 },
        { code: "BIZ101", title: "Business Management Principles", departmentId: biz.id, credits: 3 },
        { code: "BIZ102", title: "Principles of Accounting", departmentId: biz.id, credits: 3 },
        { code: "BIZ201", title: "Marketing Strategy", departmentId: biz.id, credits: 3 },
        { code: "BIZ202", title: "Organisational Behaviour", departmentId: biz.id, credits: 3 },
        { code: "BIZ301", title: "Financial Management", departmentId: biz.id, credits: 4 },
        { code: "BIZ302", title: "Business Ethics & Governance", departmentId: biz.id, credits: 3 },
        { code: "BIZ401", title: "Strategic Management", departmentId: biz.id, credits: 3 },
    ];
    for (const c of courseData) {
        await prisma.course.upsert({
            where: { code: c.code },
            update: { title: c.title, credits: c.credits },
            create: c,
        });
    }

    const hash = await hashPassword("password123");

    // 3. Admin & Users
    console.log("   ➤ Provisioning system users...");
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

    await prisma.department.update({
        where: { id: cs.id },
        data: { hodId: hod.id },
    });

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

    // 4. Academic Term
    console.log("   ➤ Setting up active semester...");
    const term = await prisma.academicTerm.upsert({
        where: { name: "Semester 1 2025/2026" },
        update: { isActive: true },
        create: {
            name: "Semester 1 2025/2026",
            startDate: new Date("2026-03-01"),
            endDate: new Date("2026-07-31"),
            isActive: true,
            createdBy: 1, 
        }
    });

    // 5. Deadlines
    console.log("   ➤ Initializing core deadlines...");
    const deadlinesCount = await prisma.deadline.count();
    if (deadlinesCount === 0) {
        await prisma.deadline.createMany({
            data: [
                {
                    type: "SEMESTER_CALENDAR",
                    label: "Semester Calendar Submission",
                    dueDate: new Date("2026-03-15T23:59:00Z"),
                    createdBy: hod.id,
                    termId: term.id,
                },
                {
                    type: "COURSE_TOPICS",
                    label: "Weekly Course Topics Planning",
                    dueDate: new Date("2026-03-20T23:59:00Z"),
                    createdBy: hod.id,
                    termId: term.id,
                },
                {
                    type: "OBSERVATION_REPORT",
                    label: "Mid-Term Peer Observation",
                    dueDate: new Date("2026-04-10T23:59:00Z"),
                    createdBy: hod.id,
                    termId: term.id,
                },
            ],
        });
    }

    // 6. Sample Submission
    console.log("   ➤ Populating sample activity...");
    const dl = await prisma.deadline.findFirst({ where: { type: "SEMESTER_CALENDAR" } });
    if (dl) {
        const subExists = await prisma.submission.findFirst({
            where: { lecturerId: lecturer1.id, deadlineId: dl.id }
        });
        if (!subExists) {
            await prisma.submission.create({
                data: {
                    lecturerId: lecturer1.id,
                    type: "SEMESTER_CALENDAR",
                    title: "CS101 - Semester Calendar 2025/2026",
                    content: { weeks: [], note: "Seeded initial data" },
                    deadlineId: dl.id,
                    status: "SUBMITTED",
                    submittedAt: new Date(),
                    termId: term.id,
                },
            });
        }
    }

    console.log("\n✅ PROFESSIONAL SEEDING COMPLETE.");
    console.log("--------------------------------------------------");
}

main()
    .catch((e) => {
        console.error("❌ Seeding failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
