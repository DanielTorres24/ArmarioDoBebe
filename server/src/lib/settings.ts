import type { SiteSettings } from '@prisma/client';
import { prisma } from './prisma.js';

/** Valores por omissao usados quando a linha de definicoes ainda nao existe. */
export const DEFINICOES_INICIAIS = {
  id: 1,
  babyName: 'Diogo',
  siteName: 'Armário do Diogo',
  heroIcon: '🧸',
  heroTitle: 'O Armário do Diogo 💙',
  heroSubtitle:
    'Antes de escolheres uma prenda, vê o que o pequeno Diogo já tem e descobre o que ainda lhe pode fazer falta. Assim evitamos prendas repetidas e aproveitamos melhor cada mimo. 💙',
  primaryCtaLabel: '🎁 Ver o que o Diogo precisa',
  secondaryCtaLabel: '📦 Ver tudo o que já temos',
  preferencesTitle: '💙 Algumas coisas que gostamos',
  preferencesIntro:
    'Não é uma lista de regras — é só para ajudar quem não sabe bem o que escolher.',
  footerText: 'Feito com carinho para o pequeno Diogo 💙👶',
  giftNote:
    'Não é preciso comprar nada novo! Em segunda mão e em bom estado é igualmente bem-vindo — a vida está cara e nós agradecemos de coração. O que conta é o carinho. 💙',
  reservationEnabled: true,
  allowThinking: true,
  allowCancellation: true,
  reserverVisibility: 'PUBLIC',
  reservationTtlDays: null,
} as const;

let cache: SiteSettings | null = null;

/** Le as definicoes do site, criando a linha inicial na primeira utilizacao. */
export async function definicoes(): Promise<SiteSettings> {
  if (cache) return cache;

  const existente = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  cache = existente ?? (await prisma.siteSettings.create({ data: DEFINICOES_INICIAIS }));

  return cache;
}

/** Invalida a cache depois de os pais gravarem alteracoes. */
export function limparCacheDeDefinicoes(): void {
  cache = null;
}
