import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Note: Default categories are created per-user during registration
  // This seed script can be used for development data or global settings

  console.log('✅ Database seed completed successfully!');
  console.log('');
  console.log(
    '📝 Default categories will be created automatically when users register:'
  );
  console.log('   • Work (Blue - #3B82F6)');
  console.log('   • Personal (Green - #10B981)');
  console.log('   • School (Yellow - #F59E0B)');
  console.log('');
  console.log('🚀 Database is ready for use!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
