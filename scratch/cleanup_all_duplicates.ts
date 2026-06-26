import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    try {
        console.log("🔍 Scanning for duplicate users by name...");
        
        // Get all users
        const allUsers = await prisma.user.findMany({
            orderBy: { createdAt: 'asc' }
        });

        // Group by name
        const usersByName: Record<string, typeof allUsers> = {};
        for (const u of allUsers) {
            if (!usersByName[u.name]) usersByName[u.name] = [];
            usersByName[u.name].push(u);
        }

        let totalDeleted = 0;

        for (const [name, users] of Object.entries(usersByName)) {
            if (users.length > 1 && name !== "System Administrator" && name !== "Super Administrator") {
                console.log(`\nFound ${users.length} duplicates for "${name}"`);
                
                // Try to keep the one that has an @lamas.edu email, or just the first one
                let keepIndex = 0;
                
                // Prefer the specific seeded demo accounts if possible
                const preferredEmail = users.find(u => 
                    u.email === "ghtrial41922@gmail.com" || // specific seed
                    u.email === "lecturer2@lamas.edu" || // specific seed
                    u.email === "slyyhaw@gmail.com" || // broadcast target
                    u.email.includes("@lamas.edu")
                );

                if (preferredEmail) {
                    keepIndex = users.indexOf(preferredEmail);
                }

                const keepUser = users[keepIndex];
                const deleteUsers = users.filter((_, i) => i !== keepIndex);

                console.log(`  -> Keeping: ${keepUser.email}`);
                console.log(`  -> Deleting: ${deleteUsers.map(u => u.email).join(', ')}`);

                const deletedIds = deleteUsers.map(u => u.id);

                // 1. Delete dependencies
                // Find all submissions for these lecturers
                const submissions = await prisma.submission.findMany({
                    where: { lecturerId: { in: deletedIds } },
                    select: { id: true }
                });
                const submissionIds = submissions.map(s => s.id);
                
                await prisma.submissionVersion.deleteMany({ where: { submissionId: { in: submissionIds } } });
                await prisma.submission.deleteMany({ where: { lecturerId: { in: deletedIds } } });
                await prisma.observation.deleteMany({ where: { observerId: { in: deletedIds } } });
                await prisma.observation.deleteMany({ where: { lecturerId: { in: deletedIds } } });
                await prisma.examModeration.deleteMany({ where: { lecturerId: { in: deletedIds } } });
                await prisma.examModeration.deleteMany({ where: { moderatorId: { in: deletedIds } } });
                await prisma.examModeration.deleteMany({ where: { deoId: { in: deletedIds } } });
                await prisma.teachingObservation.deleteMany({ where: { lecturerId: { in: deletedIds } } });
                await prisma.teachingObservation.deleteMany({ where: { observerId: { in: deletedIds } } });
                await prisma.teachingObservation.deleteMany({ where: { deoId: { in: deletedIds } } });
                await prisma.passwordReset.deleteMany({ where: { userId: { in: deletedIds } } });
                await prisma.resource.deleteMany({ where: { lecturerId: { in: deletedIds } } });
                await prisma.notification.deleteMany({ where: { userId: { in: deletedIds } } });
                await prisma.activityLog.deleteMany({ where: { userId: { in: deletedIds } } });
                await prisma.courseSection.updateMany({ where: { lecturerId: { in: deletedIds } }, data: { lecturerId: null } });

                // 2. Delete the actual users
                const result = await prisma.user.deleteMany({
                    where: { id: { in: deletedIds } }
                });
                
                totalDeleted += result.count;
            }
        }

        console.log(`\n✅ Finished cleanup. Deleted ${totalDeleted} duplicate users total.`);

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}
main();
