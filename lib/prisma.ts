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
                max: 10, // Reduced from 20 to be more conservative with serverless limits
                idleTimeoutMillis: 10000, // Reduced to 10s to cycle connections faster
                connectionTimeoutMillis: 5000, // Fail faster if we can't connect
                maxUses: 7500, // Recycle connections after 7500 uses
                keepAlive: true,
            });

            // Add background error handler to prevent process crashes
            globalForPrisma.pgPool.on('error', (err) => {
                console.error('❌ PostgreSQL Pool Error:', err);
                // If it's a connection reset, we might want to clear the pool, 
                // but usually pg handles this by removing the bad client.
            });
        }
        
        const adapter = new PrismaPg(globalForPrisma.pgPool as Pool);
        config.adapter = adapter;
    }

    return new PrismaClient(config);
};

const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export { prisma };
export default prisma;
