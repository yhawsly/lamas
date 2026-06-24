import { prisma } from "../lib/prisma";

async function main() {
  const users = await prisma.user.findMany({
    where: {
      role: "HOD"
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });
  console.log("HOD Users:", users);
}

main().catch(console.error).finally(() => prisma.$disconnect());
