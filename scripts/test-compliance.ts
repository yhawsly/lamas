import { prisma } from '../lib/prisma';
import { computeComplianceScores } from '../lib/compliance';

async function test() {
    try {
        const ahmad = await prisma.user.findUnique({ where: { email: "ahmad@lamas.edu" } });
        console.log("Ahmad:", JSON.stringify(ahmad, null, 2));
        
        if (ahmad && ahmad.departmentId) {
            const activeTerm = await prisma.academicTerm.findFirst({ where: { isActive: true } });
            console.log("Term:", activeTerm?.id);
            
            const scores = await computeComplianceScores(ahmad.departmentId, activeTerm?.id);
            console.log("Scores for Dept", ahmad.departmentId, ":", JSON.stringify(scores, null, 2));
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
test();
