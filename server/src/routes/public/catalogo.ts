import { Router } from 'express';

import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../lib/http.js';
import { definicoes } from '../../lib/settings.js';

/** Rotas publicas de leitura: categorias, faixas etarias, estados, definicoes,
 *  preferencias e sugestoes. */
export const catalogoRouter = Router();

catalogoRouter.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    res.json({ categories });
  }),
);

catalogoRouter.get(
  '/age-ranges',
  asyncHandler(async (_req, res) => {
    const ageRanges = await prisma.ageRange.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ ageRanges });
  }),
);

catalogoRouter.get(
  '/statuses',
  asyncHandler(async (_req, res) => {
    const statuses = await prisma.statusSetting.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json({ statuses });
  }),
);

catalogoRouter.get(
  '/settings',
  asyncHandler(async (_req, res) => {
    const { createdAt: _c, updatedAt: _u, ...publicas } = await definicoes();
    res.json({ settings: publicas });
  }),
);

catalogoRouter.get(
  '/preferences',
  asyncHandler(async (_req, res) => {
    const preferences = await prisma.parentPreference.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ preferences });
  }),
);

catalogoRouter.get(
  '/suggestions',
  asyncHandler(async (req, res) => {
    const { category } = req.query as Record<string, string | undefined>;

    const suggestions = await prisma.suggestion.findMany({
      where: { isActive: true, ...(category ? { categoryId: category } : {}) },
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
      include: { category: true },
    });

    res.json({ suggestions });
  }),
);

/**
 * Quantidades — o que substituiu os precos.
 * Conta *unidades* (a soma das quantidades), nao linhas: dois pacotes de body
 * com 3 cada sao 6 pecas, e e isso que interessa a quem vai oferecer.
 */
catalogoRouter.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const [categorias, faixas, artigos] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      prisma.ageRange.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.item.findMany({
        select: { categoryId: true, ageRangeId: true, quantity: true, status: true },
      }),
    ]);

    // "Ja tem" conta unidades; NEEDED e WANTED sao pedidos, nao posses.
    const posse = (estado: string) => estado === 'OWNED' || estado === 'SOME';
    const unidades = (lista: typeof artigos) =>
      lista.reduce((soma, a) => soma + (posse(a.status) ? a.quantity : 0), 0);

    const porCategoria = categorias.map((categoria) => {
      const dela = artigos.filter((a) => a.categoryId === categoria.id);
      return {
        id: categoria.id,
        slug: categoria.slug,
        name: categoria.name,
        icon: categoria.icon,
        unidades: unidades(dela),
        pedidos: dela.filter((a) => !posse(a.status)).length,
      };
    });

    const roupa = categorias.find((c) => c.slug === 'roupas');
    const daRoupa = roupa ? artigos.filter((a) => a.categoryId === roupa.id) : [];

    const roupaPorTamanho = faixas.map((faixa) => {
      const dela = daRoupa.filter((a) => a.ageRangeId === faixa.id);
      return {
        id: faixa.id,
        label: faixa.label,
        unidades: unidades(dela),
        pedidos: dela.filter((a) => !posse(a.status)).length,
      };
    });

    const semTamanho = daRoupa.filter((a) => a.ageRangeId === null);

    res.json({
      stats: {
        totalUnidades: unidades(artigos),
        totalArtigos: artigos.filter((a) => posse(a.status)).length,
        porCategoria,
        roupaPorTamanho,
        roupaSemTamanho: {
          unidades: unidades(semTamanho),
          pedidos: semTamanho.filter((a) => !posse(a.status)).length,
        },
      },
    });
  }),
);
