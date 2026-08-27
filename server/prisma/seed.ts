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
  { slug: 'fraldas', name: 'Fraldas e mudas', icon: '🧷', sortOrder: 2 },
  { slug: 'alimentacao', name: 'Alimentação', icon: '🍼', sortOrder: 3 },
  { slug: 'higiene', name: 'Higiene e banho', icon: '🛁', sortOrder: 4 },
  { slug: 'saude', name: 'Saúde', icon: '🌡️', sortOrder: 5 },
  { slug: 'quarto', name: 'Quarto e sono', icon: '🛏️', sortOrder: 6 },
  { slug: 'brinquedos', name: 'Brinquedos e conforto', icon: '🧸', sortOrder: 7 },
  { slug: 'passeios', name: 'Passeios e transporte', icon: '🚗', sortOrder: 8 },
  { slug: 'livros', name: 'Livros', icon: '📚', sortOrder: 9 },
  { slug: 'outros', name: 'Outros', icon: '💙', sortOrder: 10 },
];


// monthsFrom/monthsTo servem para calcular em que estação do ano o bebé
// estará em cada faixa, a partir da data prevista do parto.
const FAIXAS = [
  { slug: '0-3', label: '0-3 meses', monthsFrom: 0, monthsTo: 3, sortOrder: 1 },
  { slug: '3-6', label: '3-6 meses', monthsFrom: 3, monthsTo: 6, sortOrder: 2 },
  { slug: '6-9', label: '6-9 meses', monthsFrom: 6, monthsTo: 9, sortOrder: 3 },
  { slug: '9-12', label: '9-12 meses', monthsFrom: 9, monthsTo: 12, sortOrder: 4 },
  { slug: '12-mais', label: '12+ meses', monthsFrom: 12, monthsTo: null, sortOrder: 5 },
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
  { icon: '📏', title: 'Já estamos servidos de recém-nascido', description: 'Temos muita roupa de 0-1 meses. Tamanhos a partir dos 3 meses são muito mais úteis.', sortOrder: 1 },
  { icon: '👕', title: 'Preferimos roupa confortável e prática', description: 'Algodão macio e fácil de vestir ganha sempre.', sortOrder: 2 },
  { icon: '🎨', title: 'Gostamos de tons neutros, azul e verde', description: null, sortOrder: 3 },
  { icon: '📚', title: 'Ainda não temos livros', description: 'Livros de pano e de cartão são muito bem-vindos.', sortOrder: 4 },
  { icon: '🧷', title: 'Fraldas dos tamanhos seguintes dão jeito', description: 'De recém-nascido só temos um pacote — o Diogo passa depressa ao tamanho 2 e 3.', sortOrder: 5 },
  { icon: '💙', title: 'Preferimos prendas úteis a decorativas', description: null, sortOrder: 6 },
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
  isFeatured?: boolean;
};

const ARTIGOS: SemenaDeArtigo[] = [
  // ------------------------------- Roupas -------------------------------
  // O que tem tamanho de recém-nascido entra na faixa 0-3 meses; o resto
  // fica sem faixa por não haver tamanho indicado na listagem dos papás.
  { name: 'Body de manga curta', categoria: 'roupas', faixa: '0-3', size: '0-1 meses', status: 'OWNED', quantity: 19 },
  { name: 'Body de manga comprida', categoria: 'roupas', faixa: '0-3', size: '0-1 meses', status: 'OWNED', quantity: 12 },
  { name: 'Casaco', categoria: 'roupas', faixa: '0-3', size: '0-2 meses', status: 'OWNED', quantity: 8 },
  { name: 'Baby grow', categoria: 'roupas', faixa: '0-3', size: '0-1 meses', status: 'OWNED', quantity: 7 },
  { name: 'Camisola', categoria: 'roupas', faixa: '0-3', size: '0-1 meses', status: 'OWNED', quantity: 7 },
  { name: 'Casaco de malha', categoria: 'roupas', status: 'OWNED', quantity: 6 },
  { name: 'Meias', categoria: 'roupas', status: 'OWNED', quantity: 14 },
  { name: 'Touca', categoria: 'roupas', status: 'OWNED', quantity: 3 },
  { name: 'Luvas', categoria: 'roupas', status: 'OWNED', quantity: 1 },
  { name: 'Sapatos', categoria: 'roupas', status: 'OWNED', quantity: 1 },

  // Roupa dos escaloes seguintes, escolhida a pensar na altura do ano:
  // 3-6 meses cai entre fevereiro e maio (inverno e primavera), 6-9 meses
  // entre maio e agosto (primavera e verao).
  { name: 'Body de manga comprida 3-6 meses', categoria: 'roupas', faixa: '3-6', size: '3-6 meses', status: 'OWNED', quantity: 4 },
  { name: 'Baby grow 3-6 meses', categoria: 'roupas', faixa: '3-6', size: '3-6 meses', status: 'OWNED', quantity: 3 },
  { name: 'Camisola 3-6 meses', categoria: 'roupas', faixa: '3-6', size: '3-6 meses', status: 'OWNED', quantity: 2 },
  { name: 'Calças 3-6 meses', categoria: 'roupas', faixa: '3-6', size: '3-6 meses', status: 'OWNED', quantity: 1 },
  { name: 'Body de manga curta 6-9 meses', categoria: 'roupas', faixa: '6-9', size: '6-9 meses', status: 'OWNED', quantity: 3 },
  { name: 'Calções 6-9 meses', categoria: 'roupas', faixa: '6-9', size: '6-9 meses', status: 'OWNED', quantity: 2 },
  { name: 'Conjunto de verão 6-9 meses', categoria: 'roupas', faixa: '6-9', size: '6-9 meses', status: 'OWNED', quantity: 1 },

  // --------------------------- Fraldas e mudas ---------------------------
  { name: 'Toalhitas', categoria: 'fraldas', status: 'OWNED', quantity: 68, description: 'Pacotes.' },
  { name: 'Fralda de pano', categoria: 'fraldas', status: 'OWNED', quantity: 5 },
  { name: 'Creme para a zona da fralda', categoria: 'fraldas', status: 'OWNED', quantity: 4 },
  { name: 'Muda-fraldas de pano', categoria: 'fraldas', status: 'OWNED', quantity: 2 },
  { name: 'Fraldas descartáveis 2-5 kg', categoria: 'fraldas', status: 'OWNED', quantity: 1, description: 'Um pacote, tamanho recém-nascido.' },

  // ----------------------------- Alimentação -----------------------------
  { name: 'Biberão 0 meses', categoria: 'alimentacao', status: 'OWNED', quantity: 5 },
  { name: 'Chupeta 0 meses', categoria: 'alimentacao', status: 'OWNED', quantity: 2 },
  { name: 'Porta-chupetas', categoria: 'alimentacao', status: 'OWNED', quantity: 2 },
  { name: 'Babete', categoria: 'alimentacao', status: 'OWNED', quantity: 2 },

  // --------------------------- Higiene e banho ---------------------------
  { name: 'Gel de banho', categoria: 'higiene', status: 'OWNED', quantity: 3 },
  { name: 'Água de limpeza', categoria: 'higiene', status: 'OWNED', quantity: 3 },
  { name: 'Loção corporal', categoria: 'higiene', status: 'OWNED', quantity: 3 },
  { name: 'Creme de rosto', categoria: 'higiene', status: 'OWNED', quantity: 2 },
  { name: 'Toalha de banho', categoria: 'higiene', status: 'OWNED', quantity: 2 },

  // -------------------------------- Saúde --------------------------------
  { name: 'Kit corta-unhas', categoria: 'saude', status: 'OWNED', quantity: 1 },
  { name: 'Kit termómetro', categoria: 'saude', status: 'OWNED', quantity: 1 },

  // ---------------------------- Quarto e sono ----------------------------
  { name: 'Cobertor', categoria: 'quarto', status: 'OWNED', quantity: 6 },
  { name: 'Manta', categoria: 'quarto', status: 'OWNED', quantity: 4 },
  { name: 'Luz de presença', categoria: 'quarto', status: 'OWNED', quantity: 1 },
  { name: 'Contorno de berço', categoria: 'quarto', status: 'OWNED', quantity: 1 },

  // ----------------------- Brinquedos e conforto -------------------------
  { name: 'Doudou', categoria: 'brinquedos', status: 'OWNED', quantity: 3 },
  { name: 'Mordedor', categoria: 'brinquedos', status: 'OWNED', quantity: 1 },

  // ------------------------ Passeios e transporte ------------------------
  { name: 'Mochila ou saco', categoria: 'passeios', status: 'OWNED', quantity: 4 },
];


// Escritas a partir das falhas reais do inventário: os papás estão servidos
// para os primeiros meses e não têm nada a partir dos 3.
const SUGESTOES = [
  { name: 'Roupa 3-6 meses', categoria: 'roupas', priority: 5, description: 'O Diogo terá 3 a 6 meses entre fevereiro e maio — ainda com frio à mistura.' },
  { name: 'Roupa 6-9 meses', categoria: 'roupas', priority: 5, description: 'De maio a agosto: roupa fresca, de verão.' },
  { name: 'Roupa 9-12 meses', categoria: 'roupas', priority: 4, description: 'De agosto a novembro, já a arrefecer.' },
  { name: 'Fraldas tamanho 2 ou 3', categoria: 'fraldas', priority: 4, description: 'Só temos um pacote de recém-nascido — os tamanhos seguintes duram mais.' },
  { name: 'Livros de pano ou de cartão', categoria: 'livros', priority: 4, description: 'Ainda não temos nenhum livro.' },
  { name: 'Tapete de atividades', categoria: 'brinquedos', priority: 4, description: 'Para os primeiros meses de brincadeira no chão.' },
  { name: 'Brinquedo de encaixe ou educativo', categoria: 'brinquedos', priority: 3, description: 'Para quando começar a agarrar as coisas.' },
  { name: 'Contribuição para um artigo maior', categoria: 'outros', priority: 4, description: 'Carrinho, cadeira auto ou cómoda — juntamo-nos e oferecemos em conjunto.' },
];


async function main() {
  // 1. Definições do site
  // Não sobrepõe o que os pais já escreveram. A exceção é a nota sobre prendas
  // usadas: em sites que já existiam, a coluna nasce vazia — preenche-se uma
  // única vez, e só se ainda estiver por preencher.
  const definicoesAtuais = await prisma.siteSettings.findUnique({ where: { id: 1 } });

  if (!definicoesAtuais) {
    await prisma.siteSettings.create({ data: DEFINICOES_INICIAIS });
  } else {
    // Campos acrescentados depois: nascem vazios em bases que já existiam.
    // Preenchem-se uma única vez, e só se ainda estiverem por preencher.
    const porPreencher: { giftNote?: string; dueDate?: Date } = {};
    if (definicoesAtuais.giftNote.trim() === '') porPreencher.giftNote = DEFINICOES_INICIAIS.giftNote;
    if (definicoesAtuais.dueDate === null) porPreencher.dueDate = DEFINICOES_INICIAIS.dueDate;

    if (Object.keys(porPreencher).length > 0) {
      await prisma.siteSettings.update({ where: { id: 1 }, data: porPreencher });
      console.log(`Definições preenchidas: ${Object.keys(porPreencher).join(', ')}.`);
    }
  }

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
    await prisma.ageRange.upsert({
      where: { slug: faixa.slug },
      create: faixa,
      // Em bases que ja existiam os meses estao a null: preenche-se sem tocar
      // no que os pais tenham mudado (o rotulo, a ordem).
      update: { monthsFrom: faixa.monthsFrom, monthsTo: faixa.monthsTo },
    });
  }

  const categorias = new Map(
    (await prisma.category.findMany()).map((categoria) => [categoria.slug, categoria.id]),
  );
  const faixas = new Map(
    (await prisma.ageRange.findMany()).map((faixa) => [faixa.slug, faixa.id]),
  );

  // 5. Preferências
  // Uma a uma, e não "só se a tabela estiver vazia": assim uma preferência
  // nova na lista aparece no deploy seguinte, em vez de ficar para trás.
  let preferenciasCriadas = 0;
  for (const preferencia of PREFERENCIAS) {
    const existe = await prisma.parentPreference.findFirst({ where: { title: preferencia.title } });
    if (existe) continue;
    await prisma.parentPreference.create({ data: preferencia });
    preferenciasCriadas++;
  }
  if (preferenciasCriadas > 0) console.log(`${preferenciasCriadas} preferências criadas.`);

  // 6. Artigos dos papás
  // Também um a um. A guarda é o próprio artigo já existir, e não a tabela ter
  // linhas: com a guarda antiga, bastava um convidado ter acrescentado alguma
  // coisa para o inventário dos papás nunca mais entrar.
  let artigosCriados = 0;
  for (const artigo of ARTIGOS) {
    const categoryId = categorias.get(artigo.categoria);
    if (!categoryId) continue;

    const existe = await prisma.item.findFirst({ where: { name: artigo.name, ownerId: null } });
    if (existe) continue;

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
        isFeatured: artigo.isFeatured ?? false,
        // Sao os artigos que os papas ja tinham em casa. ownerId fica a null
        // de proposito: nao pertencem a nenhum convidado, e e por ownerId
        // que se distingue o que um convidado pode editar.
        ownerName: 'Papás',
      },
    });
    artigosCriados++;
  }
  if (artigosCriados > 0) console.log(`${artigosCriados} artigos dos papás criados.`);

  // 7. Sugestões
  let sugestoesCriadas = 0;
  for (const sugestao of SUGESTOES) {
    const existe = await prisma.suggestion.findFirst({ where: { name: sugestao.name } });
    if (existe) continue;
    await prisma.suggestion.create({
      data: {
        name: sugestao.name,
        description: sugestao.description ?? null,
        categoryId: categorias.get(sugestao.categoria) ?? null,
        priority: sugestao.priority,
      },
    });
    sugestoesCriadas++;
  }
  if (sugestoesCriadas > 0) console.log(`${sugestoesCriadas} sugestões criadas.`);

  console.log('Seed concluído. 💙');
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
