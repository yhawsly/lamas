import { prisma } from "./prisma";

interface LogParams {
    userId: number;
    action: string;
    details?: string;
    ip?: string;
}

export async function logAction({ userId, action, details, ip }: LogParams) {
    try {
        await prisma.activityLog.create({
            data: {
                userId,
                action,
                detail: details,
                ip
            }
        });
    } catch (error) {
        console.error("Audit log failure:", error);
    }
}
