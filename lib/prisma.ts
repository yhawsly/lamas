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
                max: 20, // Increased to 20 per user recommendation
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 30000,
                keepAlive: true,
            });

            // Add background error handler to prevent process crashes
            globalForPrisma.pgPool.on('error', (err) => {
                console.error('❌ Unexpected error on idle PostgreSQL client', err);
            });
        }
        
        const adapter = new PrismaPg(globalForPrisma.pgPool as Pool);
        config.adapter = adapter;
    }

    return new PrismaClient(config);
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
