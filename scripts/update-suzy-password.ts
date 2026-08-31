import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";

async function main() {
    const email = "s.agyemang@university.edu.gh";
    const newPasswordHash = await bcrypt.hash("password123", 10);
    
    await prisma.user.update({
        where: { email },
        data: { passwordHash: newPasswordHash }
    });
    
    console.log(`Password for ${email} updated to password123`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
