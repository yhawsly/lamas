import { prisma } from "./prisma";

export interface TermGuardResult {
    allowed: boolean;
    reason?: string;
    term?: {
        id: number;
        name: string;
        isActive: boolean;
        endDate: Date;
    } | null;
}

/**
 * Backend Security Guard for Term Archiving.
 * Verifies that a target term is active and not expired/archived.
 * Rejects mutation requests (POST, PUT, PATCH, DELETE) targeted at archived terms.
 */
export async function assertTermIsActive(termId?: number | null): Promise<TermGuardResult> {
    if (!termId) {
        // If no termId specified, check if there is a globally active term
        const activeTerm = await prisma.academicTerm.findFirst({
            where: { isActive: true },
        });

        if (!activeTerm) {
            return {
                allowed: false,
                reason: "No active academic term configured in the system.",
            };
        }

        return { allowed: true, term: activeTerm };
    }

    const targetTerm = await prisma.academicTerm.findUnique({
        where: { id: Number(termId) },
    });

    if (!targetTerm) {
        return {
            allowed: false,
            reason: `Academic term with ID ${termId} not found.`,
        };
    }

    if (!targetTerm.isActive) {
        return {
            allowed: false,
            reason: `Read-Only Archive: Academic term "${targetTerm.name}" is archived. Modifications are disabled.`,
            term: targetTerm,
        };
    }

    const now = new Date();
    if (new Date(targetTerm.endDate) < now) {
        return {
            allowed: false,
            reason: `Read-Only Archive: Term "${targetTerm.name}" expired on ${new Date(targetTerm.endDate).toLocaleDateString()}. Modifications are disabled.`,
            term: targetTerm,
        };
    }

    return { allowed: true, term: targetTerm };
}
