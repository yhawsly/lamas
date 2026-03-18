import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
    pgPool: Pool | undefined;
};

export const prisma = (() => {
    if (globalForPrisma.prisma) return globalForPrisma.prisma;

    const config: any = { log: ["query"] };

    if (process.env.DATABASE_URL) {
        // Only create one pool and cache it globally
        const pool = globalForPrisma.pgPool ?? new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }, // Neon requirement workaround for some environments
        });
        
        if (process.env.NODE_ENV !== "production") globalForPrisma.pgPool = pool;

        const adapter = new PrismaPg(pool);
        config.adapter = adapter;
    }

    const client = new PrismaClient(config);
    if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
    return client;
})();
