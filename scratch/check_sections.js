const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true }
    });
    console.log("USERS:", JSON.stringify(users, null, 2));

    const sections = await prisma.courseSection.findMany({
        include: {
            course: true,
            lecturer: true
        }
    });
    console.log("SECTIONS:", JSON.stringify(sections.map(s => ({
        id: s.id,
        name: s.name,
        courseCode: s.course.code,
        lecturer: s.lecturer ? { id: s.lecturer.id, email: s.lecturer.email } : null,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        venue: s.venue
    })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
