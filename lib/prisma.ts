import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
    pgPool: Pool | undefined;
};

const createPrismaClient = () => {
    const config: any = { log: ["query"] };

    if (process.env.DATABASE_URL) {
        if (!globalForPrisma.pgPool) {
            console.log("   ➤ Creating NEW PostgreSQL Pool...");
            globalForPrisma.pgPool = new Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: { rejectUnauthorized: false },
                max: 10,
                idleTimeoutMillis: 60000,
                connectionTimeoutMillis: 10000, // Increased to 10s for Neon cold-starts
            });
        }
        
        const adapter = new PrismaPg(globalForPrisma.pgPool);
        config.adapter = adapter;
    }

    return new PrismaClient(config);
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
