/**
 * Repõe o armário com o inventário dos papás, apagando o que o seed criou.
 *
 * Só apaga o que NÃO pertence a convidados (ownerId a null) — nada do que as
 * pessoas acrescentarem no site é tocado. É explícito de propósito: o seed
 * normal nunca destrói dados, e esta operação tem de ser pedida à mão.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const artigosDeConvidados = await prisma.item.count({ where: { ownerId: { not: null } } });
const nossos = await prisma.item.count({ where: { ownerId: null } });

const reservasApagadas = await prisma.reservation.deleteMany({
  where: { item: { ownerId: null } },
});
const artigosApagados = await prisma.item.deleteMany({ where: { ownerId: null } });
const sugestoesApagadas = await prisma.suggestion.deleteMany({});
const preferenciasApagadas = await prisma.parentPreference.deleteMany({});

console.log(`Apagados ${artigosApagados.count} artigos dos papás (de ${nossos}).`);
console.log(`Apagadas ${reservasApagadas.count} reservas desses artigos.`);
console.log(`Apagadas ${sugestoesApagadas.count} sugestões e ${preferenciasApagadas.count} preferências.`);
console.log(`Mantidos ${artigosDeConvidados} artigos de convidados.`);
console.log('Corre agora "npm run seed" para repor a partir da listagem.');

await prisma.$disconnect();
