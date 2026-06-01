import { prisma } from '../lib/prisma';

async function test() {
    try {
        const term = await prisma.academicTerm.findFirst({ where: { isActive: true } });
        console.log("Active Term:", JSON.stringify(term, null, 2));
        
        const depts = await prisma.department.findMany();
        console.log("Departments:", JSON.stringify(depts, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
test();
