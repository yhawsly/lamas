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
        update: { name: "B.Tech Computer Science" },
        create: { name: "B.Tech Computer Science", code: "BTECH_CS", description: "B.Tech in Computer Science (Levels 100-400, Regular & Weekend)" }
    });
    const btechICT = await prisma.program.upsert({
        where: { code: "BTECH_ICT" },
        update: { name: "B.Tech Information and Communication Technology (ICT)" },
        create: { name: "B.Tech Information and Communication Technology (ICT)", code: "BTECH_ICT", description: "B.Tech in Information and Communication Technology (Levels 100-400, Regular & Weekend)" }
    });
    const hndCS = await prisma.program.upsert({
        where: { code: "HND_CS" },
        update: { name: "HND Computer Science" },
        create: { name: "HND Computer Science", code: "HND_CS", description: "Higher National Diploma in Computer Science (Levels 100-300, Regular & Weekend)" }
    });
    const hndICT = await prisma.program.upsert({
        where: { code: "HND_ICT" },
        update: { name: "HND Information and Communication Technology" },
        create: { name: "HND Information and Communication Technology", code: "HND_ICT", description: "Higher National Diploma in Information and Communication Technology (Levels 100-300, Regular & Weekend)" }
    });
    const btechCSTopUp = await prisma.program.upsert({
        where: { code: "BTECH_CS_TOPUP" },
        update: { name: "B.Tech Computer Science (Top-Up)" },
        create: { name: "B.Tech Computer Science (Top-Up)", code: "BTECH_CS_TOPUP", description: "B.Tech Computer Science Top-Up (Levels 300-400, Weekend Only)" }
    });
    const btechICTTopUp = await prisma.program.upsert({
        where: { code: "BTECH_ICT_TOPUP" },
        update: { name: "B.Tech ICT (Top-Up)" },
        create: { name: "B.Tech ICT (Top-Up)", code: "BTECH_ICT_TOPUP", description: "B.Tech ICT Top-Up (Levels 300-400, Weekend Only)" }
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
            // 1. BTech Computer Science (Levels 100-400)
            await prisma.curriculumMap.upsert({
                where: { programId_courseId: { programId: btechCS.id, courseId: dbCourse.id } },
                update: { level: c.level, semester: c.semester },
                create: { programId: btechCS.id, courseId: dbCourse.id, level: c.level, semester: c.semester }
            });

            // 2. BTech ICT (Levels 100-400)
            await prisma.curriculumMap.upsert({
                where: { programId_courseId: { programId: btechICT.id, courseId: dbCourse.id } },
                update: { level: c.level, semester: c.semester },
                create: { programId: btechICT.id, courseId: dbCourse.id, level: c.level, semester: c.semester }
            });

            // 3. HND CS (Levels 100-300 only)
            if (c.level <= 300) {
                await prisma.curriculumMap.upsert({
                    where: { programId_courseId: { programId: hndCS.id, courseId: dbCourse.id } },
                    update: { level: c.level, semester: c.semester },
                    create: { programId: hndCS.id, courseId: dbCourse.id, level: c.level, semester: c.semester }
                });

                // 4. HND ICT (Levels 100-300 only)
                await prisma.curriculumMap.upsert({
                    where: { programId_courseId: { programId: hndICT.id, courseId: dbCourse.id } },
                    update: { level: c.level, semester: c.semester },
                    create: { programId: hndICT.id, courseId: dbCourse.id, level: c.level, semester: c.semester }
                });
            }

            // 5. BTech Top-Up (Levels 300-400 only, Weekend Only)
            if (c.level >= 300) {
                await prisma.curriculumMap.upsert({
                    where: { programId_courseId: { programId: btechCSTopUp.id, courseId: dbCourse.id } },
                    update: { level: c.level, semester: c.semester },
                    create: { programId: btechCSTopUp.id, courseId: dbCourse.id, level: c.level, semester: c.semester }
                });

                await prisma.curriculumMap.upsert({
                    where: { programId_courseId: { programId: btechICTTopUp.id, courseId: dbCourse.id } },
                    update: { level: c.level, semester: c.semester },
                    create: { programId: btechICTTopUp.id, courseId: dbCourse.id, level: c.level, semester: c.semester }
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
    console.log("   ➤ Provisioning system users with official emails...");
    // Official Super Admin (@lamas.edu.gh)
    await prisma.user.upsert({
        where: { email: "superadmin@lamas.edu.gh" },
        update: { name: "Super Administrator", role: "SUPER_ADMIN", departmentId: cs.id, isActive: true, passwordHash: hash },
        create: {
            name: "Super Administrator",
            email: "superadmin@lamas.edu.gh",
            passwordHash: hash,
            role: "SUPER_ADMIN",
            departmentId: cs.id,
            isActive: true,
        },
    });

    // Official System Admin (@lamas.edu.gh)
    await prisma.user.upsert({
        where: { email: "admin@lamas.edu.gh" },
        update: { name: "System Administrator", role: "ADMIN", departmentId: cs.id, isActive: true, passwordHash: hash },
        create: {
            name: "System Administrator",
            email: "admin@lamas.edu.gh",
            passwordHash: hash,
            role: "ADMIN",
            departmentId: cs.id,
            isActive: true,
        },
    });

    // Sylvester Yhaw (Lecturer, CS Faculty)
    await prisma.user.upsert({
        where: { email: "slyyhaw@gmail.com" },
        update: { name: "Sylvester Yhaw", role: "LECTURER", departmentId: cs.id, isActive: true, passwordHash: hash },
        create: {
            name: "Sylvester Yhaw",
            email: "slyyhaw@gmail.com",
            passwordHash: hash,
            role: "LECTURER",
            departmentId: cs.id,
            isActive: true,
        },
    });

    // Dr. Redeemer (Lecturer, CS Faculty)
    await prisma.user.upsert({
        where: { email: "dherlharlhi20@gmail.com" },
        update: { name: "Dr. Redeemer", role: "LECTURER", departmentId: cs.id, isActive: true, passwordHash: hash },
        create: {
            name: "Dr. Redeemer",
            email: "dherlharlhi20@gmail.com",
            passwordHash: hash,
            role: "LECTURER",
            departmentId: cs.id,
            isActive: true,
        },
    });

    // Dr. Sarah Lim (Lecturer, CS Faculty)
    await prisma.user.upsert({
        where: { email: "slycrypto1@gmail.com" },
        update: { name: "Dr. Sarah Lim", role: "LECTURER", departmentId: cs.id, isActive: true, passwordHash: hash },
        create: {
            name: "Dr. Sarah Lim",
            email: "slycrypto1@gmail.com",
            passwordHash: hash,
            role: "LECTURER",
            departmentId: cs.id,
            isActive: true,
        },
    });

    // Mr. Manuel (Head of Department, CS)
    const hod = await prisma.user.upsert({
        where: { email: "maformaley@gmail.com" },
        update: { name: "Mr. Manuel", role: "HOD", departmentId: cs.id, isActive: true, passwordHash: hash },
        create: {
            name: "Mr. Manuel",
            email: "maformaley@gmail.com",
            passwordHash: hash,
            role: "HOD",
            departmentId: cs.id,
            isActive: true,
        },
    });

    await prisma.department.update({
        where: { id: cs.id },
        data: { hodId: hod.id },
    });

    // Mr. Emmanuel Edzia (Department Exam Officer, CS)
    await prisma.user.upsert({
        where: { email: "edziaemmanuel1@gmail.com" },
        update: { name: "Mr. Emmanuel Edzia", role: "DEO", departmentId: cs.id, isActive: true, passwordHash: hash },
        create: {
            name: "Mr. Emmanuel Edzia",
            email: "edziaemmanuel1@gmail.com",
            passwordHash: hash,
            role: "DEO",
            departmentId: cs.id,
            isActive: true,
        },
    });

    // Purge any accounts that are not in our official roster
    const validEmails = [
        "superadmin@lamas.edu.gh",
        "admin@lamas.edu.gh",
        "maformaley@gmail.com",
        "edziaemmanuel1@gmail.com",
        "slyyhaw@gmail.com",
        "dherlharlhi20@gmail.com",
        "slycrypto1@gmail.com",
    ];

    const superAdminUser = await prisma.user.findUnique({ where: { email: "superadmin@lamas.edu.gh" } });
    if (superAdminUser) {
        await prisma.academicTerm.updateMany({ data: { createdBy: superAdminUser.id } }).catch(() => {});
        await prisma.deadline.updateMany({ data: { createdBy: superAdminUser.id } }).catch(() => {});
    }

    const oldUsers = await prisma.user.findMany({
        where: { email: { notIn: validEmails } },
        select: { id: true, email: true }
    });
    const oldIds = oldUsers.map(u => u.id);
    if (oldIds.length > 0) {
        console.log(`   ➤ Purging ${oldIds.length} obsolete users and cleaning related records...`);
        const oldSubmissions = await prisma.submission.findMany({ where: { lecturerId: { in: oldIds } }, select: { id: true } });
        const oldSubIds = oldSubmissions.map(s => s.id);
        if (oldSubIds.length > 0) {
            await prisma.submissionVersion.deleteMany({ where: { submissionId: { in: oldSubIds } } }).catch(() => {});
        }
        await prisma.submission.deleteMany({ where: { lecturerId: { in: oldIds } } }).catch(() => {});
        await prisma.notification.deleteMany({ where: { userId: { in: oldIds } } }).catch(() => {});
        await prisma.activityLog.deleteMany({ where: { userId: { in: oldIds } } }).catch(() => {});
        await prisma.passwordReset.deleteMany({ where: { userId: { in: oldIds } } }).catch(() => {});
        await prisma.resource.deleteMany({ where: { lecturerId: { in: oldIds } } }).catch(() => {});
        await prisma.observation.deleteMany({ where: { OR: [{ lecturerId: { in: oldIds } }, { observerId: { in: oldIds } }] } }).catch(() => {});
        await prisma.teachingObservation.deleteMany({ where: { OR: [{ lecturerId: { in: oldIds } }, { observerId: { in: oldIds } }, { deoId: { in: oldIds } }] } }).catch(() => {});
        await prisma.examModeration.deleteMany({ where: { OR: [{ lecturerId: { in: oldIds } }, { moderatorId: { in: oldIds } }, { deoId: { in: oldIds } }] } }).catch(() => {});
        await prisma.examSessionInvigilation.deleteMany({ where: { chiefInvigilatorId: { in: oldIds } } }).catch(() => {});
        await prisma.courseSection.updateMany({ where: { lecturerId: { in: oldIds } }, data: { lecturerId: null } }).catch(() => {});
        await prisma.department.updateMany({ where: { hodId: { in: oldIds } }, data: { hodId: null } }).catch(() => {});
        await prisma.user.deleteMany({ where: { id: { in: oldIds } } }).catch(() => {});
    }

    // 4. Academic Terms (Semester 1 Past Archive & Semester 2 Active for August)
    console.log("   ➤ Setting up Semester 1 (Archived) and Semester 2 (Active for August 2026)...");
    await prisma.academicTerm.updateMany({ data: { isActive: false } });

    // Past Semester 1 (Archived)
    const term1 = await prisma.academicTerm.upsert({
        where: { name: "Semester 1 2025/2026" },
        update: { 
            startDate: new Date("2026-01-12"),
            endDate: new Date("2026-06-30"),
            isActive: false 
        },
        create: {
            name: "Semester 1 2025/2026",
            startDate: new Date("2026-01-12"),
            endDate: new Date("2026-06-30"),
            isActive: false,
            createdBy: superAdminUser ? superAdminUser.id : 1,
        }
    });

    // Current Semester 2 (Live Active for August 2026)
    const term = await prisma.academicTerm.upsert({
        where: { name: "Semester 2 2025/2026" },
        update: { 
            startDate: new Date("2026-08-06"),
            endDate: new Date("2026-11-30"),
            isActive: true 
        },
        create: {
            name: "Semester 2 2025/2026",
            startDate: new Date("2026-08-06"),
            endDate: new Date("2026-11-30"),
            isActive: true,
            createdBy: superAdminUser ? superAdminUser.id : 1,
        }
    });

    // 4b. Course Sections
    console.log("   ➤ Seeding comprehensive course sections (B.Tech 100-400, HND 100-300, Top-Up 300-400 Weekend Only)...");
    await prisma.courseSection.deleteMany(); // Reset sections to populate new columns

    const dbSlyYhaw = await prisma.user.findFirst({ where: { email: "slyyhaw@gmail.com" } });
    const dbDherlharlhi = await prisma.user.findFirst({ where: { email: "dherlharlhi20@gmail.com" } });
    const dbSlycrypto = await prisma.user.findFirst({ where: { email: "slycrypto1@gmail.com" } });

    const slyYhawId = dbSlyYhaw ? dbSlyYhaw.id : null;
    const dherId = dbDherlharlhi ? dbDherlharlhi.id : null;
    const slyId = dbSlycrypto ? dbSlycrypto.id : null;

    const allCourses = await prisma.course.findMany({
        include: { curriculumMaps: true }
    });

    const daysRegular = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const venuesRegular = ["Computer Lab 1", "Computer Lab 2", "Science Block Rm 102", "Lecture Theatre 2", "Software Engineering Lab"];
    const venuesWeekend = ["Main Hall A", "CS Lab 1", "Computer Lab 3", "Auditorium Annex"];

    for (const course of allCourses) {
        const mapLevel = course.curriculumMaps[0]?.level || 100;
        const sectionsToCreate: any[] = [];

        if (course.code === "CS101") {
            sectionsToCreate.push(
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech Computer Science LVL 100 (Regular)",
                    session: "REGULAR",
                    lecturerId: slyYhawId,
                    dayOfWeek: "Tuesday",
                    startTime: "08:30 AM",
                    endTime: "10:30 AM",
                    venue: "Computer Lab 1",
                },
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech ICT LVL 100 (Weekend)",
                    session: "WEEKEND",
                    lecturerId: slyYhawId,
                    dayOfWeek: "Saturday",
                    startTime: "08:30 AM",
                    endTime: "11:30 AM",
                    venue: "CS Lab 1",
                },
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "HND Computer Science LVL 100 (Regular)",
                    session: "REGULAR",
                    lecturerId: dherId,
                    dayOfWeek: "Thursday",
                    startTime: "10:45 AM",
                    endTime: "12:45 PM",
                    venue: "Computer Lab 2",
                }
            );
        } else if (course.code === "CS102") {
            sectionsToCreate.push(
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech Computer Science LVL 100 (Regular)",
                    session: "REGULAR",
                    lecturerId: dherId,
                    dayOfWeek: "Monday",
                    startTime: "10:45 AM",
                    endTime: "12:45 PM",
                    venue: "Computer Lab 1",
                },
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech ICT LVL 100 (Regular)",
                    session: "REGULAR",
                    lecturerId: dherId,
                    dayOfWeek: "Wednesday",
                    startTime: "01:30 PM",
                    endTime: "03:30 PM",
                    venue: "Science Block Rm 102",
                },
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "HND ICT LVL 100 (Weekend)",
                    session: "WEEKEND",
                    lecturerId: dherId,
                    dayOfWeek: "Saturday",
                    startTime: "12:00 PM",
                    endTime: "03:00 PM",
                    venue: "Main Hall A",
                }
            );
        } else if (course.code === "CS201") {
            sectionsToCreate.push(
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech Computer Science LVL 200 (Regular)",
                    session: "REGULAR",
                    lecturerId: dherId,
                    dayOfWeek: "Wednesday",
                    startTime: "08:30 AM",
                    endTime: "10:30 AM",
                    venue: "Computer Lab 2",
                },
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech ICT LVL 200 (Weekend)",
                    session: "WEEKEND",
                    lecturerId: dherId,
                    dayOfWeek: "Sunday",
                    startTime: "08:30 AM",
                    endTime: "11:30 AM",
                    venue: "CS Lab 1",
                }
            );
        } else if (course.code === "CS202") {
            sectionsToCreate.push(
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech Computer Science LVL 200 (Regular)",
                    session: "REGULAR",
                    lecturerId: slyId,
                    dayOfWeek: "Tuesday",
                    startTime: "01:30 PM",
                    endTime: "03:30 PM",
                    venue: "Computer Lab 1",
                },
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech ICT LVL 200 (Regular)",
                    session: "REGULAR",
                    lecturerId: slyId,
                    dayOfWeek: "Thursday",
                    startTime: "08:30 AM",
                    endTime: "10:30 AM",
                    venue: "Lecture Theatre 2",
                },
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "HND Computer Science LVL 200 (Weekend)",
                    session: "WEEKEND",
                    lecturerId: slyId,
                    dayOfWeek: "Saturday",
                    startTime: "08:30 AM",
                    endTime: "11:30 AM",
                    venue: "Computer Lab 3",
                }
            );
        } else if (course.code === "CS203") {
            sectionsToCreate.push(
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech Computer Science LVL 200 (Regular)",
                    session: "REGULAR",
                    lecturerId: dherId,
                    dayOfWeek: "Friday",
                    startTime: "08:30 AM",
                    endTime: "10:30 AM",
                    venue: "Science Block Rm 102",
                },
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "HND ICT LVL 200 (Regular)",
                    session: "REGULAR",
                    lecturerId: dherId,
                    dayOfWeek: "Friday",
                    startTime: "11:00 AM",
                    endTime: "01:00 PM",
                    venue: "Computer Lab 2",
                }
            );
        } else if (course.code === "CS301") {
            sectionsToCreate.push(
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech Computer Science LVL 300 (Regular)",
                    session: "REGULAR",
                    lecturerId: slyYhawId,
                    dayOfWeek: "Monday",
                    startTime: "01:30 PM",
                    endTime: "03:30 PM",
                    venue: "Software Engineering Lab",
                },
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech Computer Science Top-Up LVL 300 (Weekend)",
                    session: "WEEKEND",
                    lecturerId: slyYhawId,
                    dayOfWeek: "Saturday",
                    startTime: "03:30 PM",
                    endTime: "06:30 PM",
                    venue: "CS Lab 1",
                }
            );
        } else if (course.code === "CS302") {
            sectionsToCreate.push(
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech Computer Science LVL 300 (Regular)",
                    session: "REGULAR",
                    lecturerId: slyId,
                    dayOfWeek: "Tuesday",
                    startTime: "10:45 AM",
                    endTime: "12:45 PM",
                    venue: "Computer Lab 2",
                },
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech ICT Top-Up LVL 300 (Weekend)",
                    session: "WEEKEND",
                    lecturerId: slyId,
                    dayOfWeek: "Sunday",
                    startTime: "03:30 PM",
                    endTime: "06:30 PM",
                    venue: "CS Lab 2",
                }
            );
        } else if (course.code === "CS303") {
            sectionsToCreate.push(
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech Computer Science LVL 300 (Regular)",
                    session: "REGULAR",
                    lecturerId: dherId,
                    dayOfWeek: "Wednesday",
                    startTime: "10:45 AM",
                    endTime: "12:45 PM",
                    venue: "Science Block Rm 102",
                },
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech ICT LVL 300 (Weekend)",
                    session: "WEEKEND",
                    lecturerId: dherId,
                    dayOfWeek: "Sunday",
                    startTime: "12:00 PM",
                    endTime: "03:00 PM",
                    venue: "Auditorium Annex",
                }
            );
        } else if (course.code === "CS401") {
            sectionsToCreate.push(
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech Computer Science LVL 400 (Regular)",
                    session: "REGULAR",
                    lecturerId: slyYhawId,
                    dayOfWeek: "Thursday",
                    startTime: "01:30 PM",
                    endTime: "03:30 PM",
                    venue: "Computer Lab 1",
                },
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech Computer Science Top-Up LVL 400 (Weekend)",
                    session: "WEEKEND",
                    lecturerId: slyYhawId,
                    dayOfWeek: "Saturday",
                    startTime: "03:30 PM",
                    endTime: "06:30 PM",
                    venue: "Main Hall A",
                }
            );
        } else if (course.code === "CS402") {
            sectionsToCreate.push(
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech Computer Science LVL 400 (Regular)",
                    session: "REGULAR",
                    lecturerId: slyId,
                    dayOfWeek: "Friday",
                    startTime: "01:30 PM",
                    endTime: "03:30 PM",
                    venue: "Software Engineering Lab",
                },
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech ICT Top-Up LVL 400 (Weekend)",
                    session: "WEEKEND",
                    lecturerId: slyId,
                    dayOfWeek: "Sunday",
                    startTime: "03:30 PM",
                    endTime: "06:30 PM",
                    venue: "Computer Lab 3",
                }
            );
        } else if (course.code === "CS403") {
            sectionsToCreate.push(
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech ICT LVL 400 (Regular)",
                    session: "REGULAR",
                    lecturerId: slyId,
                    dayOfWeek: "Monday",
                    startTime: "08:30 AM",
                    endTime: "10:30 AM",
                    venue: "Lecture Theatre 2",
                },
                {
                    courseId: course.id,
                    termId: term.id,
                    name: "B.Tech Computer Science LVL 400 (Weekend)",
                    session: "WEEKEND",
                    lecturerId: slyId,
                    dayOfWeek: "Saturday",
                    startTime: "12:00 PM",
                    endTime: "03:00 PM",
                    venue: "CS Lab 1",
                }
            );
        } else if (course.code.startsWith("ENG")) {
            sectionsToCreate.push(
                {
                    courseId: course.id,
                    termId: term.id,
                    name: `BEng Electrical LVL ${mapLevel} (Regular)`,
                    session: "REGULAR",
                    lecturerId: null,
                    dayOfWeek: "Tuesday",
                    startTime: "09:00 AM",
                    endTime: "11:00 AM",
                    venue: "Engineering Hall 1",
                },
                {
                    courseId: course.id,
                    termId: term.id,
                    name: `BEng Mechanical LVL ${mapLevel} (Weekend)`,
                    session: "WEEKEND",
                    lecturerId: null,
                    dayOfWeek: "Saturday",
                    startTime: "09:00 AM",
                    endTime: "12:00 PM",
                    venue: "Engineering Hall 2",
                }
            );
        } else if (course.code.startsWith("BIZ")) {
            sectionsToCreate.push(
                {
                    courseId: course.id,
                    termId: term.id,
                    name: `BBA Accounting LVL ${mapLevel} (Regular)`,
                    session: "REGULAR",
                    lecturerId: null,
                    dayOfWeek: "Wednesday",
                    startTime: "10:00 AM",
                    endTime: "12:00 PM",
                    venue: "Business Block Rm 4",
                },
                {
                    courseId: course.id,
                    termId: term.id,
                    name: `BBA Marketing LVL ${mapLevel} (Weekend)`,
                    session: "WEEKEND",
                    lecturerId: null,
                    dayOfWeek: "Saturday",
                    startTime: "01:00 PM",
                    endTime: "04:00 PM",
                    venue: "Business Block Rm 5",
                }
            );
        }

        if (sectionsToCreate.length > 0) {
            await prisma.courseSection.createMany({ data: sectionsToCreate });
        }
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
    if (dl && dherId) {
        const subExists = await prisma.submission.findFirst({
            where: { lecturerId: dherId, deadlineId: dl.id }
        });
        if (!subExists) {
            await prisma.submission.create({
                data: {
                    lecturerId: dherId,
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
