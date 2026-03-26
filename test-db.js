const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing connection...');
    await prisma.$connect();
    console.log('Connection successful!');
    
    // Check ResourceType enum if possible via raw query or just model check
    console.log('Checking Resource model...');
    const count = await prisma.resource.count();
    console.log('Total resources:', count);
    
  } catch (e) {
    console.error('DATABASE_ERROR:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
