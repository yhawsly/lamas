import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

const config: any = {
    log: ["query"],
};

if (process.env.DATABASE_URL) {
    config.datasources = {
        db: {
            url: process.env.DATABASE_URL,
        },
    };
}

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient(config);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
