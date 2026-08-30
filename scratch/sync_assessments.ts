import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
    const submissions = await prisma.submission.findMany({
        where: {
            type: "COURSE_TOPICS"
        }
    });

    console.log(`Syncing assessment weights for ${submissions.length} submissions...`);

    const standardAssessments = [
        { id: 1, name: "Continuous Assessment / Quizzes", weight: 20, description: "Weekly quizzes, assignments, and practical exercises." },
        { id: 2, name: "Mid-Semester Examination & Labs", weight: 20, description: "Mid-term theoretical evaluation and laboratory test." },
        { id: 3, name: "End of Semester Examination", weight: 60, description: "Comprehensive final examination." }
    ];

    for (const sub of submissions) {
        if (sub.content && typeof sub.content === "object") {
            const content = { ...(sub.content as any), assessments: standardAssessments };
            await prisma.submission.update({
                where: { id: sub.id },
                data: { content }
            });
        }
    }

    console.log("✅ All submissions updated with 20% - 20% - 60% assessment weights!");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
