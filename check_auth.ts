import { PrismaClient } from "@prisma/client";
import { verifyPassword } from "./lib/password";

const prisma = new PrismaClient();

async function check() {
    const email = "admin@lamas.edu";
    const password = "password123";
    
    console.log(`Checking password for ${email}...`);
    
    const user = await prisma.user.findUnique({
        where: { email }
    });
    
    if (!user) {
        console.error("User not found!");
        return;
    }
    
    console.log("User found. Hash:", user.passwordHash);
    
    try {
        const match = await verifyPassword(password, user.passwordHash);
        console.log("Password match result:", match);
        
        if (match) {
            console.log("✅ Password verification logic is WORKING correctly.");
        } else {
            console.log("❌ Password verification logic FAILED.");
        }
    } catch (e) {
        console.error("Error during verification:", e);
    }
}

check().finally(() => prisma.$disconnect());
