import { PrismaClient } from '@prisma/client';

// Un solo cliente para todo el proceso. Va en `globalThis` porque `tsx watch`
// recarga los módulos en cada cambio y, sin esto, cada guardado abriría una
// conexión nueva a SQLite hasta agotarlas.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
