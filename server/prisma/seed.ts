import { PrismaClient, type ItemStatus } from '@prisma/client';

import { env } from '../src/env.js';
import { hashPassword } from '../src/lib/auth.js';
import { DEFINICOES_INICIAIS } from '../src/lib/settings.js';

const prisma = new PrismaClient();

/**
 * Seed idempotente: pode correr as vezes que forem precisas.
 * Cria o administrador a partir das variáveis de ambiente — a palavra-passe
 * nunca está no código.
 */

const CATEGORIAS = [
  { slug: 'roupas', name: 'Roupas', icon: '👕', sortOrder: 1 },
  { slug: 'alimentacao', name: 'Alimentação', icon: '🍼', sortOrder: 2 },
  { slug: 'higiene', name: 'Higiene e cuidados', icon: '🛁', sortOrder: 3 },
  { slug: 'quarto', name: 'Quarto e sono', icon: '🛏️', sortOrder: 4 },
  { slug: 'brinquedos', name: 'Brinquedos', icon: '🧸', sortOrder: 5 },
  { slug: 'passeios', name: 'Passeios e transporte', icon: '🚗', sortOrder: 6 },
  { slug: 'livros', name: 'Livros', icon: '📚', sortOrder: 7 },
  { slug: 'outros', name: 'Outros', icon: '💙', sortOrder: 8 },
];

const FAIXAS = [
  { slug: '0-3', label: '0-3 meses', sortOrder: 1 },
  { slug: '3-6', label: '3-6 meses', sortOrder: 2 },
  { slug: '6-9', label: '6-9 meses', sortOrder: 3 },
  { slug: '9-12', label: '9-12 meses', sortOrder: 4 },
  { slug: '12-mais', label: '12+ meses', sortOrder: 5 },
];

const ESTADOS = [
  {
    status: 'NEEDED' as ItemStatus,
    label: 'Faz falta',
    icon: '🟢',
    color: 'green',
    description: 'Seria uma prenda útil — ainda não temos.',
    sortOrder: 1,
  },
  {
    status: 'WANTED' as ItemStatus,
    label: 'Muito desejado',
    icon: '⭐',
    color: 'amber',
    description: 'Uma das coisas que mais gostávamos de receber.',
    sortOrder: 2,
  },
  {
    status: 'SOME' as ItemStatus,
    label: 'Já temos alguns',
    icon: '🟡',
    color: 'yellow',
    description: 'Já temos alguns, mas mais umas unidades dão jeito.',
    sortOrder: 3,
  },
  {
    status: 'OWNED' as ItemStatus,
    label: 'Já temos',
    icon: '🔴',
    color: 'rose',
    description: 'Já está tratado — não é preciso oferecer mais.',
    sortOrder: 4,
  },
];

const PREFERENCIAS = [
  { icon: '👕', title: 'Preferimos roupa confortável e prática', description: 'Algodão macio e fácil de vestir ganha sempre.', sortOrder: 1 },
  { icon: '🎨', title: 'Gostamos de tons neutros, azul e verde', description: null, sortOrder: 2 },
  { icon: '📚', title: 'Adoramos livros para bebé', description: 'Livros de pano e de cartão são sempre bem-vindos.', sortOrder: 3 },
  { icon: '🧸', title: 'Já temos muitos peluches', description: 'Esta é a única categoria em que já estamos servidos!', sortOrder: 4 },
  { icon: '💙', title: 'Preferimos prendas úteis a decorativas', description: null, sortOrder: 5 },
  { icon: '📏', title: 'Evitamos tamanhos de recém-nascido', description: 'O Diogo cresce depressa — tamanhos maiores duram mais.', sortOrder: 6 },
];

type SemenaDeArtigo = {
  name: string;
  categoria: string;
  status: ItemStatus;
  faixa?: string;
  size?: string;
  quantity?: number;
  priority?: number;
  description?: string;
  minPrice?: number;
  maxPrice?: number;
  isFeatured?: boolean;
};

const ARTIGOS: SemenaDeArtigo[] = [
  { name: 'Body branco', categoria: 'roupas', faixa: '0-3', size: '0-3 meses', status: 'OWNED', quantity: 6 },
  { name: 'Pijama', categoria: 'roupas', faixa: '3-6', size: '3-6 meses', status: 'OWNED', quantity: 3 },
  { name: 'Roupa para 6-9 meses', categoria: 'roupas', faixa: '6-9', size: '6-9 meses', status: 'NEEDED', priority: 4, description: 'O Diogo já tem bastante roupa para os primeiros meses, mas roupa para os 6-9 meses seria muito útil.', minPrice: 15, maxPrice: 40, isFeatured: true },
  { name: 'Roupa para 9-12 meses', categoria: 'roupas', faixa: '9-12', size: '9-12 meses', status: 'NEEDED', priority: 3, minPrice: 15, maxPrice: 40 },
  { name: 'Biberão', categoria: 'alimentacao', status: 'OWNED', quantity: 2 },
  { name: 'Babetes', categoria: 'alimentacao', status: 'SOME', quantity: 3, description: 'Já temos alguns, mas nunca são de mais.', minPrice: 5, maxPrice: 15 },
  { name: 'Termómetro', categoria: 'higiene', status: 'NEEDED', priority: 3, minPrice: 15, maxPrice: 35 },
  { name: 'Toalha com capuz', categoria: 'higiene', status: 'OWNED', quantity: 2 },
  { name: 'Manta', categoria: 'quarto', status: 'OWNED', quantity: 2 },
  { name: 'Luz de presença', categoria: 'quarto', status: 'WANTED', priority: 5, description: 'Para as mudas de fralda a meio da noite sem acordar toda a gente.', minPrice: 20, maxPrice: 45, isFeatured: true },
  { name: 'Peluches', categoria: 'brinquedos', status: 'SOME', quantity: 5, description: 'Já temos bastantes — obrigado! 😊' },
  { name: 'Tapete de atividades', categoria: 'brinquedos', status: 'WANTED', priority: 5, description: 'Seria o presente perfeito para os primeiros meses de brincadeira no chão.', minPrice: 50, maxPrice: 90, isFeatured: true },
  { name: 'Livros para bebé', categoria: 'livros', status: 'NEEDED', priority: 4, description: 'Livros de pano ou de cartão, para morder e virar páginas.', minPrice: 8, maxPrice: 20 },
  { name: 'Mochila de bebé', categoria: 'passeios', status: 'WANTED', priority: 4, minPrice: 60, maxPrice: 120 },
];

const SUGESTOES = [
  { name: 'Livro infantil', categoria: 'livros', minPrice: 8, maxPrice: 18, priority: 4, description: 'De pano, de banho ou de cartão grosso.' },
  { name: 'Babete', categoria: 'alimentacao', minPrice: 5, maxPrice: 15, priority: 3 },
  { name: 'Conjunto de meias', categoria: 'roupas', minPrice: 6, maxPrice: 15, priority: 3 },
  { name: 'Produtos de higiene', categoria: 'higiene', minPrice: 8, maxPrice: 20, priority: 2 },
  { name: 'Roupa', categoria: 'roupas', minPrice: 20, maxPrice: 45, priority: 5, description: 'Sobretudo tamanhos de 6 meses para cima.' },
  { name: 'Kit de banho', categoria: 'higiene', minPrice: 25, maxPrice: 50, priority: 3 },
  { name: 'Brinquedo educativo', categoria: 'brinquedos', minPrice: 20, maxPrice: 45, priority: 4 },
  { name: 'Luz de presença', categoria: 'quarto', minPrice: 20, maxPrice: 45, priority: 5 },
  { name: 'Tapete de atividades', categoria: 'brinquedos', minPrice: 50, maxPrice: 95, priority: 5 },
  { name: 'Mochila de bebé', categoria: 'passeios', minPrice: 60, maxPrice: 100, priority: 4 },
  { name: 'Artigo para o quarto', categoria: 'quarto', minPrice: 50, maxPrice: 100, priority: 3, description: 'Um candeeiro, uma cadeira de amamentação, uma prateleira.' },
  { name: 'Contribuição para um artigo maior', categoria: 'outros', minPrice: 100, maxPrice: 300, priority: 4, description: 'Carrinho, cadeira auto ou cómoda — juntamo-nos e oferecemos em conjunto.' },
];

async function main() {
  // 1. Definições do site
  await prisma.siteSettings.upsert({
    where: { id: 1 },
    create: DEFINICOES_INICIAIS,
    update: {},
  });

  // 2. Administrador
  if (env.ADMIN_EMAIL && env.ADMIN_PASSWORD) {
    const email = env.ADMIN_EMAIL.toLowerCase();
    const existente = await prisma.adminUser.findUnique({ where: { email } });

    if (existente) {
      console.log(`Administrador ${email} já existe — palavra-passe não alterada.`);
    } else {
      await prisma.adminUser.create({
        data: {
          email,
          passwordHash: await hashPassword(env.ADMIN_PASSWORD),
          name: env.ADMIN_NAME ?? null,
        },
      });
      console.log(`Administrador criado: ${email}`);
    }
  } else {
    console.warn('ADMIN_EMAIL/ADMIN_PASSWORD não definidos — nenhum administrador criado.');
  }

  // 3. Estados
  for (const estado of ESTADOS) {
    await prisma.statusSetting.upsert({
      where: { status: estado.status },
      create: estado,
      update: {},
    });
  }

  // 4. Categorias e faixas etárias
  for (const categoria of CATEGORIAS) {
    await prisma.category.upsert({
      where: { slug: categoria.slug },
      create: categoria,
      update: {},
    });
  }

  for (const faixa of FAIXAS) {
    await prisma.ageRange.upsert({ where: { slug: faixa.slug }, create: faixa, update: {} });
  }

  const categorias = new Map(
    (await prisma.category.findMany()).map((categoria) => [categoria.slug, categoria.id]),
  );
  const faixas = new Map(
    (await prisma.ageRange.findMany()).map((faixa) => [faixa.slug, faixa.id]),
  );

  // 5. Preferências
  if ((await prisma.parentPreference.count()) === 0) {
    await prisma.parentPreference.createMany({ data: PREFERENCIAS });
  }

  // 6. Artigos de exemplo
  if ((await prisma.item.count()) === 0) {
    for (const artigo of ARTIGOS) {
      const categoryId = categorias.get(artigo.categoria);
      if (!categoryId) continue;

      await prisma.item.create({
        data: {
          name: artigo.name,
          categoryId,
          ageRangeId: artigo.faixa ? (faixas.get(artigo.faixa) ?? null) : null,
          size: artigo.size ?? null,
          status: artigo.status,
          priority: artigo.priority ?? 2,
          quantity: artigo.quantity ?? 1,
          description: artigo.description ?? null,
          minPrice: artigo.minPrice ?? null,
          maxPrice: artigo.maxPrice ?? null,
          isFeatured: artigo.isFeatured ?? false,
        },
      });
    }
    console.log(`${ARTIGOS.length} artigos de exemplo criados.`);
  }

  // 7. Sugestões
  if ((await prisma.suggestion.count()) === 0) {
    await prisma.suggestion.createMany({
      data: SUGESTOES.map((sugestao) => ({
        name: sugestao.name,
        description: sugestao.description ?? null,
        categoryId: categorias.get(sugestao.categoria) ?? null,
        minPrice: sugestao.minPrice,
        maxPrice: sugestao.maxPrice,
        priority: sugestao.priority,
      })),
    });
    console.log(`${SUGESTOES.length} sugestões criadas.`);
  }

  console.log('Seed concluído. 💙');
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
