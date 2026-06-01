import { prisma } from '../lib/prisma';

async function main() {
    try {
        console.log("Re-assigning lecturers to CS department (ID: 1)...");
        
        // Assign Hafiz and Kofi to CS
        await prisma.user.updateMany({
            where: { email: { in: ["rahman@lamas.edu", "kofi@lamas.edu"] } },
            data: { departmentId: 1 }
        });
        
        console.log("✅ Hafiz and Kofi moved to Computer Science.");
        
        const users = await prisma.user.findMany({
            where: { departmentId: 1 },
            select: { name: true, email: true, role: true }
        });
        console.log("Lecturers now in Dept 1:", JSON.stringify(users, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
main();
