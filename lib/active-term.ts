import { prisma } from "./prisma";

/**
 * Validates and retrieves the active academic term strictly based on the current calendar date.
 * 
 * Rules:
 * 1. An academic term is active if `currentDate` is between its `startDate` (Commencement) and `endDate` (Conclusion).
 * 2. If the current date is within a term, that term is automatically activated (isActive: true) and all others are deactivated.
 * 3. If an active term has passed its `endDate`, it is automatically deactivated.
 * 4. Fallback: If currently in a break between terms, selects the closest upcoming or most recent valid term.
 */
export async function checkAndGetActiveTerm() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    // 1. Check if there is a term whose window covers the current date (startDate <= today <= endDate)
    const currentCalendarTerm = await prisma.academicTerm.findFirst({
        where: {
            startDate: { lte: today },
            endDate: { gte: startOfToday }
        },
        orderBy: { startDate: "desc" }
    });

    if (currentCalendarTerm) {
        // If it's not marked active in DB, synchronize it atomically
        if (!currentCalendarTerm.isActive) {
            console.log(`[Term Lifecycle] Date matches "${currentCalendarTerm.name}". Activating term.`);
            await prisma.$transaction([
                prisma.academicTerm.updateMany({
                    where: { id: { not: currentCalendarTerm.id } },
                    data: { isActive: false }
                }),
                prisma.academicTerm.update({
                    where: { id: currentCalendarTerm.id },
                    data: { isActive: true }
                })
            ]);
            currentCalendarTerm.isActive = true;
        }
        return currentCalendarTerm;
    }

    // 2. If no term directly encloses today, check existing active terms and deactivate expired ones
    const activeTerms = await prisma.academicTerm.findMany({
        where: { isActive: true }
    });

    for (const term of activeTerms) {
        const termEnd = new Date(term.endDate);
        if (termEnd < startOfToday) {
            console.log(`[Term Lifecycle] Term "${term.name}" has expired (Ended: ${term.endDate.toISOString()}). Deactivating.`);
            await prisma.academicTerm.update({
                where: { id: term.id },
                data: { isActive: false }
            });
        }
    }

    // 3. Check if an unexpired active term remains (e.g., upcoming semester manually primed)
    const remainingActive = await prisma.academicTerm.findFirst({
        where: { 
            isActive: true,
            endDate: { gte: startOfToday }
        },
        orderBy: { startDate: "asc" }
    });

    if (remainingActive) {
        return remainingActive;
    }

    // 4. Fallback: Find the closest upcoming semester or latest term
    const nextUpcomingTerm = await prisma.academicTerm.findFirst({
        where: {
            startDate: { gte: startOfToday }
        },
        orderBy: { startDate: "asc" }
    });

    if (nextUpcomingTerm) {
        return nextUpcomingTerm;
    }

    const latestPastTerm = await prisma.academicTerm.findFirst({
        orderBy: { endDate: "desc" }
    });

    return latestPastTerm || null;
}
