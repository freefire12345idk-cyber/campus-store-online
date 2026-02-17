import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error'],
    // Connection pooling for high traffic
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// Enable connection pooling in production
if (process.env.NODE_ENV === 'production') {
  prisma.$connect();
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
