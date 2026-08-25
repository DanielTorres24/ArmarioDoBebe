import { PrismaClient } from '@prisma/client';
import { isProduction } from '../env.js';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: isProduction ? ['error'] : ['error', 'warn'] });

// Em dev o tsx recarrega o modulo; reutilizar evita esgotar as ligacoes.
if (!isProduction) globalForPrisma.prisma = prisma;
