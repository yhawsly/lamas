import "dotenv/config";
import { prisma } from "../lib/prisma";

async function addPrograms() {
    console.log("Adding additional programs...");
    
    const newPrograms = [
        { name: "BSc Nursing", code: "BSC_NUR", description: "Bachelor of Science in Nursing" },
        { name: "BEng Mechanical Engineering", code: "BENG_ME", description: "Bachelor of Engineering in Mechanical Engineering" },
        { name: "BA Graphic Design", code: "BA_GD", description: "Bachelor of Arts in Graphic Design" },
        { name: "BSc Data Science", code: "BSC_DS", description: "Bachelor of Science in Data Science" },
        { name: "BBA Marketing", code: "BBA_MKT", description: "Bachelor of Business Administration in Marketing" },
    ];

    for (const prog of newPrograms) {
        await prisma.program.upsert({
            where: { code: prog.code },
            update: {},
            create: prog,
        });
        console.log(`Created: ${prog.name}`);
    }

    console.log("Done adding programs.");
}

addPrograms()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
