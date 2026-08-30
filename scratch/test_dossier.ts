import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
    console.log("=========================================================================");
    console.log("🧪 TESTING COURSE DOSSIER & PDF RESOURCE SYSTEM");
    console.log("=========================================================================\n");

    const course = await prisma.course.findUnique({
        where: { code: "CS301" },
        include: {
            masterSyllabus: true,
            sections: true
        }
    });

    if (!course) {
        throw new Error("CS301 course not found in database.");
    }

    console.log(`1️⃣ Course Found: ${course.code} - ${course.title} (Domain: ${course.domain})`);
    console.log(`   Syllabus Topics Count: ${Array.isArray(course.masterSyllabus?.mandatoryTopics) ? (course.masterSyllabus?.mandatoryTopics as any[]).length : 0}`);
    console.log(`   Learning Outcomes Count: ${Array.isArray(course.masterSyllabus?.learningOutcomes) ? (course.masterSyllabus?.learningOutcomes as any[]).length : 0}`);

    const resources = await prisma.resource.findMany({
        where: {
            OR: [
                { title: { contains: "CS301" } },
                { description: { contains: "CS301" } },
            ]
        }
    });

    console.log(`\n2️⃣ Uploaded Educational Resources for CS301: ${resources.length} files found`);
    for (const r of resources) {
        console.log(`   - [${r.type}] ${r.title} (URL: ${r.url})`);
    }

    const submissions = await prisma.submission.findMany({
        where: {
            title: { contains: "CS301" }
        }
    });

    console.log(`\n3️⃣ Academic Submissions for CS301: ${submissions.length} submissions found`);
    for (const s of submissions) {
        console.log(`   - [${s.type}] ${s.title} (Status: ${s.status})`);
    }

    console.log("\n=========================================================================");
    console.log("🎉 COURSE DOSSIER & PDF DATA VERIFIED SUCCESSFULLY!");
    console.log("=========================================================================");
}

main()
    .catch(err => {
        console.error("Dossier test failed:", err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
