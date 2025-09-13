import { PrismaClient } from '@prisma/client';

// Global Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined;
}

// Create a single instance of Prisma Client
export const prisma =
  globalThis.__prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Database connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Create default categories for a new user
export async function createDefaultCategories(userId: string) {
  const defaultCategories = [
    {
      userId,
      name: 'Work',
      color: '#3B82F6',
      isDefault: true,
    },
    {
      userId,
      name: 'Personal',
      color: '#10B981',
      isDefault: true,
    },
    {
      userId,
      name: 'School',
      color: '#F59E0B',
      isDefault: true,
    },
  ];

  try {
    await prisma.category.createMany({
      data: defaultCategories,
      skipDuplicates: true,
    });

    console.log(`✅ Created default categories for user ${userId}`);
  } catch (error) {
    console.error('❌ Failed to create default categories:', error);
    throw error;
  }
}

// Database cleanup utility
export async function cleanupDatabase() {
  if (process.env.NODE_ENV === 'test') {
    // Only allow cleanup in test environment
    await prisma.calendarIntegration.deleteMany();
    await prisma.task.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
  }
}

// Graceful shutdown
export async function disconnectDatabase() {
  await prisma.$disconnect();
}
