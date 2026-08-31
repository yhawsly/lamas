import { prisma } from "../lib/prisma";

async function main() {
    const resources = await prisma.resource.findMany({
        select: { id: true, title: true, type: true, url: true, status: true }
    });
    console.log("=== ALL RESOURCES ===");
    for (const r of resources) {
        console.log(`[ID ${r.id}] Type: ${r.type} | URL: "${r.url}" | Title: "${r.title}"`);
    }
}

main().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
