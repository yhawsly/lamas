import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            departmentId: true,
            department: { select: { name: true } }
        }
    });

    console.log(`Found ${users.length} users in database:`);
    for (const u of users) {
        console.log(`- ID: ${u.id} | Name: ${u.name} | Email: ${u.email} | Role: ${u.role} | Active: ${u.isActive} | Dept: ${u.department?.name || "None"} (${u.departmentId})`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
