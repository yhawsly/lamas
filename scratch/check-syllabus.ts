import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();


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
