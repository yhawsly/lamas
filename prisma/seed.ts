import "dotenv/config";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";

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
        { code: "CS101", title: "Introduction to Computer Science", departmentId: cs.id, credits: 3, level: 100, semester: 1 },
        { code: "CS102", title: "Programming Fundamentals", departmentId: cs.id, credits: 3, level: 100, semester: 2 },
        { code: "CS201", title: "Data Structures & Algorithms", departmentId: cs.id, credits: 4, level: 200, semester: 1 },
        { code: "CS202", title: "Object-Oriented Programming", departmentId: cs.id, credits: 3, level: 200, semester: 2 },
        { code: "CS203", title: "Discrete Mathematics", departmentId: cs.id, credits: 3, level: 200, semester: 1 },
        { code: "CS301", title: "Web Development", departmentId: cs.id, credits: 3, level: 300, semester: 1 },
        { code: "CS302", title: "Database Systems", departmentId: cs.id, credits: 3, level: 300, semester: 2 },
        { code: "CS303", title: "Operating Systems", departmentId: cs.id, credits: 3, level: 300, semester: 1 },
        { code: "CS401", title: "Artificial Intelligence", departmentId: cs.id, credits: 4, level: 400, semester: 1 },
        { code: "CS402", title: "Software Engineering", departmentId: cs.id, credits: 3, level: 400, semester: 2 },
        { code: "CS403", title: "Computer Networks", departmentId: cs.id, credits: 3, level: 400, semester: 1 },
        { code: "ENG101", title: "Engineering Fundamentals", departmentId: eng.id, credits: 3, level: 100, semester: 1 },
        { code: "ENG102", title: "Engineering Mathematics I", departmentId: eng.id, credits: 4, level: 100, semester: 2 },
        { code: "ENG201", title: "Engineering Mathematics II", departmentId: eng.id, credits: 4, level: 200, semester: 1 },
        { code: "ENG202", title: "Thermodynamics", departmentId: eng.id, credits: 4, level: 200, semester: 2 },
        { code: "ENG203", title: "Fluid Mechanics", departmentId: eng.id, credits: 3, level: 200, semester: 1 },
        { code: "ENG301", title: "Structural Analysis", departmentId: eng.id, credits: 3, level: 300, semester: 1 },
        { code: "ENG302", title: "Electrical Circuits", departmentId: eng.id, credits: 3, level: 300, semester: 2 },
        { code: "ENG401", title: "Control Systems Engineering", departmentId: eng.id, credits: 4, level: 400, semester: 1 },
        { code: "BIZ101", title: "Business Management Principles", departmentId: biz.id, credits: 3, level: 100, semester: 1 },
        { code: "BIZ102", title: "Principles of Accounting", departmentId: biz.id, credits: 3, level: 100, semester: 2 },
        { code: "BIZ201", title: "Marketing Strategy", departmentId: biz.id, credits: 3, level: 200, semester: 1 },
        { code: "BIZ202", title: "Organisational Behaviour", departmentId: biz.id, credits: 3, level: 200, semester: 2 },
        { code: "BIZ301", title: "Financial Management", departmentId: biz.id, credits: 4, level: 300, semester: 1 },
        { code: "BIZ302", title: "Business Ethics & Governance", departmentId: biz.id, credits: 3, level: 300, semester: 2 },
        { code: "BIZ401", title: "Strategic Management", departmentId: biz.id, credits: 3, level: 400, semester: 1 },
    ];

    // 2b. Programs
    console.log("   ➤ Syncing academic programs...");
    const btechCS = await prisma.program.upsert({
        where: { code: "BTECH_CS" },
        update: {},
        create: { name: "BTech Computer Science", code: "BTECH_CS", description: "BTech in Computer Science" }
    });
    const btechIT = await prisma.program.upsert({
        where: { code: "BTECH_IT" },
        update: {},
        create: { name: "BTech Information Technology", code: "BTECH_IT", description: "BTech in Information Technology" }
    });
    const bengEE = await prisma.program.upsert({
        where: { code: "BENG_EE" },
        update: {},
        create: { name: "BEng Electrical Engineering", code: "BENG_EE", description: "BEng in Electrical Engineering" }
    });
    const bbaACC = await prisma.program.upsert({
        where: { code: "BBA_ACC" },
        update: {},
        create: { name: "BBA Accounting", code: "BBA_ACC", description: "BBA in Accounting" }
    });

    for (const c of courseData) {
        const { level: _level, semester: _semester, ...cleanCourse } = c;
        await prisma.course.upsert({
            where: { code: c.code },
            update: { title: c.title, credits: c.credits },
            create: cleanCourse,
        });
    }

    console.log("   ➤ Creating Program Curriculum Mappings...");
    const allCoursesDb = await prisma.course.findMany();
    for (const c of courseData) {
        const dbCourse = allCoursesDb.find(dc => dc.code === c.code);
        if (!dbCourse) continue;

        if (c.code.startsWith("CS")) {
            await prisma.curriculumMap.upsert({
                where: { programId_courseId: { programId: btechCS.id, courseId: dbCourse.id } },
                update: { level: c.level, semester: c.semester },
                create: { programId: btechCS.id, courseId: dbCourse.id, level: c.level, semester: c.semester }
            });
            
            if (["CS101", "CS102", "CS301", "CS302"].includes(c.code)) {
                await prisma.curriculumMap.upsert({
                    where: { programId_courseId: { programId: btechIT.id, courseId: dbCourse.id } },
                    update: { level: c.level, semester: c.semester },
                    create: { programId: btechIT.id, courseId: dbCourse.id, level: c.level, semester: c.semester }
                });
            }
        } else if (c.code.startsWith("ENG")) {
            await prisma.curriculumMap.upsert({
                where: { programId_courseId: { programId: bengEE.id, courseId: dbCourse.id } },
                update: { level: c.level, semester: c.semester },
                create: { programId: bengEE.id, courseId: dbCourse.id, level: c.level, semester: c.semester }
            });
        } else if (c.code.startsWith("BIZ")) {
            await prisma.curriculumMap.upsert({
                where: { programId_courseId: { programId: bbaACC.id, courseId: dbCourse.id } },
                update: { level: c.level, semester: c.semester },
                create: { programId: bbaACC.id, courseId: dbCourse.id, level: c.level, semester: c.semester }
            });
        }
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
        where: { email: "ghtrial41922@gmail.com" },
        update: {},
        create: {
            name: "Dr. Ahmad Razif",
            email: "ghtrial41922@gmail.com",
            passwordHash: hash,
            role: "HOD",
            departmentId: cs.id,
            requirePasswordReset: true,
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
            requirePasswordReset: true,
        },
    });

    const userSlyyhaw = await prisma.user.upsert({
        where: { email: "slyyhaw@gmail.com" },
        update: { role: "LECTURER", departmentId: cs.id },
        create: {
            name: "Dr. Sarah Lim (Slyyhaw)",
            email: "slyyhaw@gmail.com",
            passwordHash: hash,
            role: "LECTURER",
            departmentId: cs.id,
            requirePasswordReset: false,
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
            requirePasswordReset: true,
        },
    });

    await prisma.user.upsert({
        where: { email: "deo@lamas.edu" },
        update: {},
        create: {
            name: "Department Exam Officer",
            email: "deo@lamas.edu",
            passwordHash: hash,
            role: "DEO",
            departmentId: cs.id,
            requirePasswordReset: true,
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

    // 4b. Course Sections
    console.log("   ➤ Seeding default course sections with schedules...");
    await prisma.courseSection.deleteMany(); // Reset sections to populate new columns

    const dbLecturer = await prisma.user.findFirst({ where: { email: "lecturer1@lamas.edu" } });
    const dbSlyyhaw = await prisma.user.findFirst({ where: { email: "slyyhaw@gmail.com" } });
    
    const lecturerId = dbLecturer ? dbLecturer.id : null;
    const slyyhawId = dbSlyyhaw ? dbSlyyhaw.id : null;

    const allCourses = await prisma.course.findMany({
        include: { curriculumMaps: true }
    });
    for (const course of allCourses) {
        const mapLevel = course.curriculumMaps[0]?.level || 100;
        let regularName = "";
        let weekendName = "";

        if (course.code.startsWith("CS")) {
            regularName = `BTECH COMPUTER SCIENCE LVL ${mapLevel}`;
            weekendName = `BTECH ICT LVL ${mapLevel}`;
        } else if (course.code.startsWith("ENG")) {
            regularName = `BENG ELECTRICAL LVL ${mapLevel}`;
            weekendName = `BENG MECHANICAL LVL ${mapLevel}`;
        } else if (course.code.startsWith("BIZ")) {
            regularName = `BBA ACCOUNTING LVL ${mapLevel}`;
            weekendName = `BBA MARKETING LVL ${mapLevel}`;
        } else {
            regularName = `GENERAL LEVEL ${mapLevel}`;
            weekendName = `GENERAL WEEKEND LEVEL ${mapLevel}`;
        }

        // Assign some sections to slyyhaw and some to lecturer1
        let assignedLecturerId = null;
        if (["CS101", "CS102", "CS201", "CS301"].includes(course.code)) {
            assignedLecturerId = slyyhawId || lecturerId;
        } else if (["CS202", "CS302", "CS401"].includes(course.code)) {
            assignedLecturerId = lecturerId;
        }

        await prisma.courseSection.createMany({
            data: [
                {
                    courseId: course.id,
                    termId: term.id,
                    name: regularName,
                    session: "REGULAR",
                    lecturerId: assignedLecturerId,
                    dayOfWeek: ["Monday", "Wednesday", "Friday"][course.id % 3],
                    startTime: ["08:30 AM", "11:00 AM", "02:30 PM"][course.id % 3],
                    endTime: ["10:30 AM", "01:00 PM", "04:30 PM"][course.id % 3],
                    venue: ["Lecture Theatre 1", "Computer Lab 2", "Science Block Room 102"][course.id % 3],
                },
                {
                    courseId: course.id,
                    termId: term.id,
                    name: weekendName,
                    session: "WEEKEND",
                    lecturerId: null,
                    dayOfWeek: "Saturday",
                    startTime: "09:00 AM",
                    endTime: "12:00 PM",
                    venue: "Main Hall A",
                }
            ]
        });
    }

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
