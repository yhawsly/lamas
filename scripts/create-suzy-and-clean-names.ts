/**
 * Script: create-suzy-and-clean-names.ts
 * 
 * 1. Strips Mr./Dr./Mrs./Prof./Ms. prefixes from ALL user names
 * 2. Creates lecturer Suzy Agyemang in the Computer Science department
 * 3. Assigns CS courses and sections to her for the active term
 */

import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";

async function main() {
    console.log("═══════════════════════════════════════════════════");
    console.log(" ARAD Data Script: Clean Names + Create Suzy ");
    console.log("═══════════════════════════════════════════════════\n");

    // ─── STEP 1: Strip honorific prefixes from all user names ──────
    console.log("▶ Step 1: Stripping honorific prefixes from all user names...");
    const allUsers = await prisma.user.findMany({ select: { id: true, name: true } });

    const HONORIFICS = /^(Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.|Sir |Engr\.|Rev\.)\s*/i;
    let renamed = 0;

    for (const user of allUsers) {
        const cleaned = user.name.replace(HONORIFICS, "").trim();
        if (cleaned !== user.name) {
            await prisma.user.update({ where: { id: user.id }, data: { name: cleaned } });
            console.log(`   ✓  "${user.name}" → "${cleaned}"`);
            renamed++;
        }
    }
    console.log(`   → ${renamed} name(s) cleaned.\n`);

    // ─── STEP 2: Find the Computer Science department ──────────────
    console.log("▶ Step 2: Finding Computer Science department...");
    const csDept = await prisma.department.findFirst({
        where: {
            OR: [
                { name: { contains: "Computer Science", mode: "insensitive" } },
                { code: { contains: "CS", mode: "insensitive" } },
            ]
        }
    });

    if (!csDept) {
        console.error("   ✗ Computer Science department not found. Aborting.");
        process.exit(1);
    }
    console.log(`   ✓ Found: ${csDept.name} (id=${csDept.id}, code=${csDept.code})\n`);

    // ─── STEP 3: Create Suzy Agyemang ─────────────────────────────
    console.log("▶ Step 3: Creating lecturer Suzy Agyemang...");
    const email = "s.agyemang@university.edu.gh";

    const existing = await prisma.user.findUnique({ where: { email } });
    let suzy;

    if (existing) {
        console.log(`   ℹ  User already exists (id=${existing.id}). Updating name + dept...`);
        suzy = await prisma.user.update({
            where: { email },
            data: {
                name: "Suzy Agyemang",
                departmentId: csDept.id,
                role: "LECTURER",
                isActive: true,
            }
        });
    } else {
        const passwordHash = await bcrypt.hash("changeme123", 12);
        suzy = await prisma.user.create({
            data: {
                name: "Suzy Agyemang",
                email,
                passwordHash,
                role: "LECTURER",
                departmentId: csDept.id,
                isActive: true,
                requirePasswordReset: true,
                specializations: ["Computer Science", "Software Engineering", "Algorithms"],
            }
        });
        console.log(`   ✓ Created Suzy Agyemang (id=${suzy.id}, email=${email})`);
    }
    console.log();

    // ─── STEP 4: Find active term ──────────────────────────────────
    console.log("▶ Step 4: Finding active academic term...");
    const activeTerm = await prisma.academicTerm.findFirst({
        where: { isActive: true },
        orderBy: { startDate: "desc" }
    });

    if (!activeTerm) {
        console.error("   ✗ No active academic term found. Cannot create sections.");
        process.exit(1);
    }
    console.log(`   ✓ Active term: ${activeTerm.name} (id=${activeTerm.id})\n`);

    // ─── STEP 5: Find CS courses ───────────────────────────────────
    console.log("▶ Step 5: Finding Computer Science courses...");
    const csCourses = await prisma.course.findMany({
        where: {
            departmentId: csDept.id,
            deletedAt: null,
        },
        orderBy: { code: "asc" },
        take: 20
    });

    console.log(`   ✓ Found ${csCourses.length} CS course(s).\n`);

    if (csCourses.length === 0) {
        console.log("   ✗ No courses found for this department. Skipping section assignment.");
        return;
    }

    // ─── STEP 6: Assign Suzy to 3–4 CS courses ────────────────────
    console.log("▶ Step 6: Assigning sections to Suzy Agyemang...");

    // Pick up to 4 courses (prefer ones not already having a lecturer in this term)
    const SCHEDULE = [
        { day: "Monday",    start: "08:00 AM", end: "10:00 AM", venue: "LT-1" },
        { day: "Tuesday",   start: "10:00 AM", end: "12:00 PM", venue: "LT-2" },
        { day: "Wednesday", start: "02:00 PM", end: "04:00 PM", venue: "Lab-3" },
        { day: "Thursday",  start: "08:00 AM", end: "10:00 AM", venue: "LT-1" },
    ];

    const picked = csCourses.slice(0, 4);
    let created = 0;
    let skipped = 0;

    for (let i = 0; i < picked.length; i++) {
        const course = picked[i];
        const sched = SCHEDULE[i % SCHEDULE.length];

        // Check if a section for this course+term already exists for Suzy
        const existing = await prisma.courseSection.findFirst({
            where: { courseId: course.id, termId: activeTerm.id, lecturerId: suzy.id }
        });

        if (existing) {
            console.log(`   ⟳  ${course.code} — section already exists for Suzy (id=${existing.id}), skipping.`);
            skipped++;
            continue;
        }

        // If section already exists without a lecturer, assign Suzy
        const unassigned = await prisma.courseSection.findFirst({
            where: { courseId: course.id, termId: activeTerm.id, lecturerId: null }
        });

        if (unassigned) {
            await prisma.courseSection.update({
                where: { id: unassigned.id },
                data: {
                    lecturerId: suzy.id,
                    dayOfWeek: sched.day,
                    startTime: sched.start,
                    endTime: sched.end,
                    venue: sched.venue,
                }
            });
            console.log(`   ✓ Assigned ${course.code} (${course.title}) — existing unassigned section → Suzy`);
        } else {
            // Create a new section
            await prisma.courseSection.create({
                data: {
                    courseId: course.id,
                    termId: activeTerm.id,
                    lecturerId: suzy.id,
                    name: `${course.code}-A`,
                    session: "REGULAR",
                    dayOfWeek: sched.day,
                    startTime: sched.start,
                    endTime: sched.end,
                    venue: sched.venue,
                }
            });
            console.log(`   ✓ Created section ${course.code}-A (${course.title}) → ${sched.day} ${sched.start}–${sched.end} @ ${sched.venue}`);
        }
        created++;
    }

    console.log(`\n   → ${created} section(s) assigned, ${skipped} skipped.\n`);

    // ─── Summary ───────────────────────────────────────────────────
    console.log("═══════════════════════════════════════════════════");
    console.log(" ✅  ALL DONE");
    console.log("═══════════════════════════════════════════════════");
    console.log(`  Lecturer  : Suzy Agyemang (id=${suzy.id})`);
    console.log(`  Email     : ${suzy.email}`);
    console.log(`  Password  : changeme123 (reset required on first login)`);
    console.log(`  Dept      : ${csDept.name}`);
    console.log(`  Courses   : ${picked.map(c => c.code).join(", ")}`);
    console.log(`  Term      : ${activeTerm.name}`);
    console.log("═══════════════════════════════════════════════════\n");
}

main()
    .catch(e => { console.error("Script failed:", e); process.exit(1); })
    .finally(() => prisma.$disconnect());
