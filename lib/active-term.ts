import { prisma } from "./prisma";

export async function checkAndGetActiveTerm() {
    const term = await prisma.academicTerm.findFirst({
        where: { isActive: true }
    });

    if (term) {
        const now = new Date();
        const end = new Date(term.endDate);
        if (end < now) {
            console.log(`[Term Lifecycle] Term "${term.name}" has expired (End Date: ${term.endDate.toISOString()}). Deactivating term.`);
            await prisma.academicTerm.update({
                where: { id: term.id },
                data: { isActive: false }
            });
            return null;
        }
    }
    return term;
}
