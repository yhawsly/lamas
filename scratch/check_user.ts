require('dotenv').config();
const { prisma } = require("../lib/prisma");
const bcrypt = require("bcrypt");

async function main() {
    console.log("Checking superadmin user password...");
    const user = await prisma.user.findUnique({
        where: { email: "superadmin@lamas.edu" }
    });
    if (!user) {
        console.log("User not found!");
        return;
    }
    console.log("User email:", user.email);
    console.log("User passwordHash:", user.passwordHash);
    
    const match = await bcrypt.compare("password123", user.passwordHash);
    console.log("Password match result:", match);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
