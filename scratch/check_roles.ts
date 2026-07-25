import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
    const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true, role: true }
    });
    console.log("USERS IN DB:\n", JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
