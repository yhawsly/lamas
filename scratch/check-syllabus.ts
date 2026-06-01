import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://neondb_owner:npg_UfDwtkd7zoV0@ep-snowy-bread-ai5c6uw4-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&connection_limit=20"
        }
    }
});

async function checkSyllabus() {
    try {
        const syllabi = await prisma.masterSyllabus.findMany({
            include: { course: true }
        });
        console.log("Total Syllabi:", syllabi.length);
        syllabi.forEach(s => {
            console.log(`Course: ${s.course.code} - ${s.course.title}`);
            const topics = s.mandatoryTopics as any[];
            console.log(`Topics Count:`, topics.length);
            console.log(`First Topic:`, topics[0]?.topic || "None");
        });
    } catch (e) {
        console.error("Prisma error:", e);
    }
}

checkSyllabus().finally(() => prisma.$disconnect());
