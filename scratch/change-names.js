const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    // 1. Rename Dr. Ahmad Razif duplicates
    const ahmadUsers = await prisma.user.findMany({
        where: { name: { contains: "Ahmad Razif" } },
        orderBy: { id: "asc" }
    });
    console.log("Found Ahmad users:", ahmadUsers.length);
    if (ahmadUsers.length > 1) {
        await prisma.user.update({
            where: { id: ahmadUsers[1].id },
            data: { name: "Dr. Redeemer" }
        });
        console.log(`Renamed user ID ${ahmadUsers[1].id} to Dr. Redeemer`);
    }

    // 2. Rename Mr. Hafiz Rahman duplicates
    const hafizUsers = await prisma.user.findMany({
        where: { name: { contains: "Hafiz Rahman" } },
        orderBy: { id: "asc" }
    });
    console.log("Found Hafiz users:", hafizUsers.length);
    if (hafizUsers.length > 1) {
        await prisma.user.update({
            where: { id: hafizUsers[1].id },
            data: { name: "Mr. Manuel" }
        });
        console.log(`Renamed user ID ${hafizUsers[1].id} to Mr. Manuel`);
    }
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
