import "dotenv/config";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";

async function main() {
    console.log("🔄 Syncing official users into database...");
    const hash = await hashPassword("password123");

    // Ensure CS department exists
    const cs = await prisma.department.upsert({
        where: { code: "CS" },
        update: {},
        create: { name: "Computer Science", code: "CS" },
    });

    // 1. Super Admin: dherlharlhi20@gmail.com
    const superAdmin = await prisma.user.upsert({
        where: { email: "dherlharlhi20@gmail.com" },
        update: { role: "SUPER_ADMIN", isActive: true, passwordHash: hash },
        create: {
            name: "Super Administrator",
            email: "dherlharlhi20@gmail.com",
            passwordHash: hash,
            role: "SUPER_ADMIN",
            isActive: true,
        },
    });
    console.log("✅ Super Admin synced:", superAdmin.email, superAdmin.role);

    // 2. Admin: slycrypto1@gmail.com
    const admin = await prisma.user.upsert({
        where: { email: "slycrypto1@gmail.com" },
        update: { role: "ADMIN", isActive: true, passwordHash: hash },
        create: {
            name: "System Administrator",
            email: "slycrypto1@gmail.com",
            passwordHash: hash,
            role: "ADMIN",
            isActive: true,
        },
    });
    console.log("✅ Admin synced:", admin.email, admin.role);

    // 3. Head of Department: maformaley@gmail.com
    const hod = await prisma.user.upsert({
        where: { email: "maformaley@gmail.com" },
        update: { role: "HOD", departmentId: cs.id, isActive: true, passwordHash: hash },
        create: {
            name: "Head of Department (CS)",
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
    console.log("✅ HOD synced:", hod.email, hod.role);

    // 4. Exam Officer (DEO): edziaemmanuel1@gmail.com
    const deo = await prisma.user.upsert({
        where: { email: "edziaemmanuel1@gmail.com" },
        update: { role: "DEO", departmentId: cs.id, isActive: true, passwordHash: hash },
        create: {
            name: "Department Exam Officer",
            email: "edziaemmanuel1@gmail.com",
            passwordHash: hash,
            role: "DEO",
            departmentId: cs.id,
            isActive: true,
        },
    });
    console.log("✅ DEO synced:", deo.email, deo.role);

    console.log("\n🎉 All 4 official accounts successfully provisioned in the database!");
}

main()
    .catch((e) => {
        console.error("❌ Error syncing users:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
