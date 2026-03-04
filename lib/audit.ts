import { prisma } from './prisma';

export async function logAction({
    userId,
    action,
    details,
    ipAddress = null,
}: {
    userId: number;
    action: string;
    details?: string;
    ipAddress?: string | null;
}) {
    try {
        await prisma.activityLog.create({
            data: {
                userId,
                action,
                detail: details || null,
                ip: ipAddress,
            },
        });
    } catch (error) {
        console.error("Failed to write to audit log:", error);
        // We shouldn't crash the main process if logging fails, so we just catch it.
    }
}
