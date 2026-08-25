import { Router } from 'express';

import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../lib/http.js';
import { definicoes } from '../../lib/settings.js';
import { precos } from '../../lib/serialize.js';

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
    const { minPrice, maxPrice } = req.query as Record<string, string | undefined>;

    const suggestions = await prisma.suggestion.findMany({
      where: {
        isActive: true,
        // Uma sugestao entra na faixa se o seu intervalo se cruzar com ela.
        ...(minPrice ? { OR: [{ maxPrice: null }, { maxPrice: { gte: Number(minPrice) } }] } : {}),
        ...(maxPrice ? { AND: [{ OR: [{ minPrice: null }, { minPrice: { lte: Number(maxPrice) } }] }] } : {}),
      },
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
      include: { category: true },
    });

    res.json({ suggestions: suggestions.map(precos) });
  }),
);
