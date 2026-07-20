import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
    pgPool: Pool | undefined;
};


const createPrismaClient = () => {
    const config: any = process.env.NODE_ENV === "development" ? { log: ["query", "error", "warn"] } : { log: ["error"] };

    if (process.env.DATABASE_URL) {
        if (!globalForPrisma.pgPool) {
            // Pool settings are configurable via env vars for serverless/production tuning
            const poolMax = parseInt(process.env.DATABASE_POOL_MAX || (process.env.NODE_ENV === "production" ? "5" : "10"));
            const idleTimeout = parseInt(process.env.DATABASE_IDLE_TIMEOUT || "10000");
            const connectionTimeout = parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || "30000");

            console.log(`   ➤ Creating PostgreSQL Pool (max=${poolMax}, idleTimeout=${idleTimeout}ms, connTimeout=${connectionTimeout}ms)`);
            globalForPrisma.pgPool = new Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: process.env.NODE_ENV === "production" ? true : { rejectUnauthorized: false },
                max: poolMax,
                idleTimeoutMillis: idleTimeout,
                connectionTimeoutMillis: connectionTimeout,
                maxUses: 7500, // Recycle connections after 7500 uses
                keepAlive: true,
                allowExitOnIdle: true, // Allow graceful shutdown in serverless environments
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

// Cache Prisma instance in both dev and production to prevent connection exhaustion
const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
// Also cache in production — serverless environments benefit from singleton reuse
if (process.env.NODE_ENV === "production") globalForPrisma.prisma = prisma;

export { prisma };
export default prisma;
