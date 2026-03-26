const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Adding enum values via raw SQL...');
    // PostgreSQL enum modification
    // Note: We swallow errors if values already exist
    try { await prisma.$executeRawUnsafe(`ALTER TYPE "ResourceType" ADD VALUE 'IMAGE'`); } catch(e) {}
    try { await prisma.$executeRawUnsafe(`ALTER TYPE "ResourceType" ADD VALUE 'SPREADSHEET'`); } catch(e) {}
    try { await prisma.$executeRawUnsafe(`ALTER TYPE "ResourceType" ADD VALUE 'DOCUMENT'`); } catch(e) {}
    
    console.log('Enum updates attempted.');
    
    const count = await prisma.resource.count();
    console.log('Current resource count:', count);
    
  } catch (e) {
    console.error('Migration failed:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
