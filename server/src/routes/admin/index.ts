import { Router } from 'express';
import type { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { asyncHandler, HttpError, naoEncontrado, validar } from '../../lib/http.js';
import { requireAdmin, signAdminToken, verifyPassword } from '../../lib/auth.js';
import { definicoes, limparCacheDeDefinicoes } from '../../lib/settings.js';
import { precos } from '../../lib/serialize.js';
import {
  categoriaSchema,
  criarArtigoDeAdmin,
  definicoesSchema,
  editarArtigoDeAdmin,
  estadoSchema,
  faixaEtariaSchema,
  loginSchema,
  preferenciaSchema,
  sugestaoSchema,
} from '../../lib/validation.js';

export const adminRouter = Router();

const slugificar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'sem-nome';

/* ------------------------------ autenticação ------------------------------ */

adminRouter.post(
  '/auth/login',
  asyncHandler(async (req, res) => {
    const dados = validar(loginSchema, req.body);

    const admin = await prisma.adminUser.findUnique({
      where: { email: dados.email.toLowerCase() },
    });

    // A mesma mensagem para email errado e password errada, para não revelar
    // quais os emails registados.
    const invalido = new HttpError(401, 'Email ou palavra-passe incorretos.');
    if (!admin) throw invalido;
    if (!(await verifyPassword(dados.password, admin.passwordHash))) throw invalido;

    res.json({
      token: signAdminToken({ sub: admin.id, email: admin.email }),
      admin: { id: admin.id, email: admin.email, name: admin.name },
    });
  }),
);

// Tudo o que vem a seguir exige sessão de administrador.
adminRouter.use(requireAdmin);

adminRouter.get(
  '/auth/me',
  asyncHandler(async (req, res) => {
    const admin = await prisma.adminUser.findUnique({ where: { id: req.admin!.sub } });
    if (!admin) throw naoEncontrado('Administrador');
    res.json({ admin: { id: admin.id, email: admin.email, name: admin.name } });
  }),
);

/* -------------------------------- dashboard ------------------------------- */

adminRouter.get(
  '/dashboard',
  asyncHandler(async (_req, res) => {
    const [porEstado, totalArtigos, unidades, reservas, porCategoria, ultimosArtigos, ultimasReservas] =
      await Promise.all([
        prisma.item.groupBy({ by: ['status'], _count: { _all: true } }),
        prisma.item.count(),
        prisma.item.aggregate({ _sum: { quantity: true } }),
        prisma.reservation.groupBy({ by: ['status'], _count: { _all: true } }),
        prisma.item.groupBy({ by: ['categoryId'], _count: { _all: true } }),
        prisma.item.findMany({
          take: 6,
          orderBy: { createdAt: 'desc' },
          include: { category: true },
        }),
        prisma.reservation.findMany({
          take: 6,
          orderBy: { createdAt: 'desc' },
          include: { item: { select: { id: true, name: true } } },
        }),
      ]);

    const estados = Object.fromEntries(porEstado.map((l) => [l.status, l._count._all]));
    const estadosReserva = Object.fromEntries(reservas.map((l) => [l.status, l._count._all]));

    const categorias = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } });

    res.json({
      totals: {
        items: totalArtigos,
        units: unidades._sum.quantity ?? 0,
        needed: estados.NEEDED ?? 0,
        wanted: estados.WANTED ?? 0,
        some: estados.SOME ?? 0,
        owned: estados.OWNED ?? 0,
        reservations:
          (estadosReserva.THINKING ?? 0) + (estadosReserva.RESERVED ?? 0) + (estadosReserva.GIFTED ?? 0),
        thinking: estadosReserva.THINKING ?? 0,
        reserved: estadosReserva.RESERVED ?? 0,
        gifted: estadosReserva.GIFTED ?? 0,
      },
      byCategory: categorias.map((categoria) => ({
        id: categoria.id,
        name: categoria.name,
        icon: categoria.icon,
        count: porCategoria.find((l) => l.categoryId === categoria.id)?._count._all ?? 0,
      })),
      latestItems: ultimosArtigos.map(precos),
      latestReservations: ultimasReservas,
    });
  }),
);

/* --------------------------------- artigos -------------------------------- */

const incluirArtigo = {
  category: true,
  ageRange: true,
  reservations: { orderBy: { createdAt: 'desc' } },
} satisfies Prisma.ItemInclude;

adminRouter.get(
  '/items',
  asyncHandler(async (req, res) => {
    const { search, category, status } = req.query as Record<string, string | undefined>;

    const where: Prisma.ItemWhereInput = {};
    if (search?.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
        { ownerName: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }
    if (category) where.categoryId = category;
    if (status) where.status = status as Prisma.EnumItemStatusFilter['equals'];

    const items = await prisma.item.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: incluirArtigo,
    });

    res.json({ items: items.map(precos) });
  }),
);

adminRouter.post(
  '/items',
  asyncHandler(async (req, res) => {
    const dados = validar(criarArtigoDeAdmin, req.body);

    const item = await prisma.item.create({
      data: {
        name: dados.name,
        categoryId: dados.categoryId,
        description: dados.description ?? null,
        size: dados.size ?? null,
        ageRangeId: dados.ageRangeId ?? null,
        quantity: dados.quantity,
        status: dados.status,
        priority: dados.priority,
        minPrice: dados.minPrice ?? null,
        maxPrice: dados.maxPrice ?? null,
        productUrl: dados.productUrl ?? null,
        isFeatured: dados.isFeatured,
      },
      include: incluirArtigo,
    });

    res.status(201).json({ item: precos(item) });
  }),
);

adminRouter.put(
  '/items/:id',
  asyncHandler(async (req, res) => {
    const dados = validar(editarArtigoDeAdmin, req.body);

    const existente = await prisma.item.findUnique({ where: { id: req.params.id } });
    if (!existente) throw naoEncontrado('Artigo');

    // Os pais podem editar qualquer artigo, incluindo os dos convidados.
    const item = await prisma.item.update({
      where: { id: existente.id },
      data: {
        ...(dados.name !== undefined ? { name: dados.name } : {}),
        ...(dados.categoryId !== undefined ? { categoryId: dados.categoryId } : {}),
        ...(dados.description !== undefined ? { description: dados.description } : {}),
        ...(dados.size !== undefined ? { size: dados.size } : {}),
        ...(dados.ageRangeId !== undefined ? { ageRangeId: dados.ageRangeId } : {}),
        ...(dados.quantity !== undefined ? { quantity: dados.quantity } : {}),
        ...(dados.status !== undefined ? { status: dados.status } : {}),
        ...(dados.priority !== undefined ? { priority: dados.priority } : {}),
        ...(dados.minPrice !== undefined ? { minPrice: dados.minPrice } : {}),
        ...(dados.maxPrice !== undefined ? { maxPrice: dados.maxPrice } : {}),
        ...(dados.productUrl !== undefined ? { productUrl: dados.productUrl } : {}),
        ...(dados.isFeatured !== undefined ? { isFeatured: dados.isFeatured } : {}),
      },
      include: incluirArtigo,
    });

    res.json({ item: precos(item) });
  }),
);

adminRouter.delete(
  '/items/:id',
  asyncHandler(async (req, res) => {
    const existente = await prisma.item.findUnique({ where: { id: req.params.id } });
    if (!existente) throw naoEncontrado('Artigo');
    await prisma.item.delete({ where: { id: existente.id } });
    res.status(204).end();
  }),
);

/* ------------------------------- categorias ------------------------------- */

adminRouter.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { items: true, suggestions: true } } },
    });
    res.json({ categories });
  }),
);

adminRouter.post(
  '/categories',
  asyncHandler(async (req, res) => {
    const dados = validar(categoriaSchema, req.body);
    const category = await prisma.category.create({
      data: { ...dados, slug: await slugLivre(slugificar(dados.name)) },
    });
    res.status(201).json({ category });
  }),
);

adminRouter.put(
  '/categories/:id',
  asyncHandler(async (req, res) => {
    const dados = validar(categoriaSchema, req.body);
    const existente = await prisma.category.findUnique({ where: { id: req.params.id } });
    if (!existente) throw naoEncontrado('Categoria');

    const category = await prisma.category.update({ where: { id: existente.id }, data: dados });
    res.json({ category });
  }),
);

adminRouter.delete(
  '/categories/:id',
  asyncHandler(async (req, res) => {
    const existente = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { items: true, suggestions: true } } },
    });
    if (!existente) throw naoEncontrado('Categoria');

    // Só se pode apagar uma categoria que não esteja em uso, para não perder artigos.
    if (existente._count.items > 0 || existente._count.suggestions > 0) {
      throw new HttpError(
        409,
        'Esta categoria ainda está a ser usada. Muda os artigos de categoria ou desativa-a.',
      );
    }

    await prisma.category.delete({ where: { id: existente.id } });
    res.status(204).end();
  }),
);

async function slugLivre(base: string): Promise<string> {
  let tentativa = base;
  let contador = 2;
  while (await prisma.category.findUnique({ where: { slug: tentativa } })) {
    tentativa = `${base}-${contador++}`;
  }
  return tentativa;
}

/* ------------------------------ faixas etárias ---------------------------- */

adminRouter.get(
  '/age-ranges',
  asyncHandler(async (_req, res) => {
    const ageRanges = await prisma.ageRange.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { items: true } } },
    });
    res.json({ ageRanges });
  }),
);

adminRouter.post(
  '/age-ranges',
  asyncHandler(async (req, res) => {
    const dados = validar(faixaEtariaSchema, req.body);
    let slug = slugificar(dados.label);
    let contador = 2;
    while (await prisma.ageRange.findUnique({ where: { slug } })) {
      slug = `${slugificar(dados.label)}-${contador++}`;
    }
    const ageRange = await prisma.ageRange.create({ data: { ...dados, slug } });
    res.status(201).json({ ageRange });
  }),
);

adminRouter.put(
  '/age-ranges/:id',
  asyncHandler(async (req, res) => {
    const dados = validar(faixaEtariaSchema, req.body);
    const existente = await prisma.ageRange.findUnique({ where: { id: req.params.id } });
    if (!existente) throw naoEncontrado('Faixa etária');
    const ageRange = await prisma.ageRange.update({ where: { id: existente.id }, data: dados });
    res.json({ ageRange });
  }),
);

adminRouter.delete(
  '/age-ranges/:id',
  asyncHandler(async (req, res) => {
    const existente = await prisma.ageRange.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { items: true } } },
    });
    if (!existente) throw naoEncontrado('Faixa etária');
    if (existente._count.items > 0) {
      throw new HttpError(409, 'Esta faixa etária ainda está a ser usada por artigos.');
    }
    await prisma.ageRange.delete({ where: { id: existente.id } });
    res.status(204).end();
  }),
);

/* --------------------------------- estados -------------------------------- */

adminRouter.get(
  '/statuses',
  asyncHandler(async (_req, res) => {
    const statuses = await prisma.statusSetting.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json({ statuses });
  }),
);

adminRouter.put(
  '/statuses/:status',
  asyncHandler(async (req, res) => {
    const dados = validar(estadoSchema, req.body);
    const chave = req.params.status as Prisma.StatusSettingWhereUniqueInput['status'];

    const existente = await prisma.statusSetting.findUnique({ where: { status: chave } });
    if (!existente) throw naoEncontrado('Estado');

    const status = await prisma.statusSetting.update({ where: { status: chave }, data: dados });
    res.json({ status });
  }),
);

/* -------------------------------- sugestões ------------------------------- */

adminRouter.get(
  '/suggestions',
  asyncHandler(async (_req, res) => {
    const suggestions = await prisma.suggestion.findMany({
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
      include: { category: true },
    });
    res.json({ suggestions: suggestions.map(precos) });
  }),
);

adminRouter.post(
  '/suggestions',
  asyncHandler(async (req, res) => {
    const dados = validar(sugestaoSchema, req.body);
    const suggestion = await prisma.suggestion.create({
      data: {
        name: dados.name,
        description: dados.description ?? null,
        categoryId: dados.categoryId ?? null,
        minPrice: dados.minPrice ?? null,
        maxPrice: dados.maxPrice ?? null,
        priority: dados.priority,
        productUrl: dados.productUrl ?? null,
        imageUrl: dados.imageUrl ?? null,
        isActive: dados.isActive,
      },
      include: { category: true },
    });
    res.status(201).json({ suggestion: precos(suggestion) });
  }),
);

adminRouter.put(
  '/suggestions/:id',
  asyncHandler(async (req, res) => {
    const dados = validar(sugestaoSchema, req.body);
    const existente = await prisma.suggestion.findUnique({ where: { id: req.params.id } });
    if (!existente) throw naoEncontrado('Sugestão');

    const suggestion = await prisma.suggestion.update({
      where: { id: existente.id },
      data: {
        name: dados.name,
        description: dados.description ?? null,
        categoryId: dados.categoryId ?? null,
        minPrice: dados.minPrice ?? null,
        maxPrice: dados.maxPrice ?? null,
        priority: dados.priority,
        productUrl: dados.productUrl ?? null,
        imageUrl: dados.imageUrl ?? null,
        isActive: dados.isActive,
      },
      include: { category: true },
    });
    res.json({ suggestion: precos(suggestion) });
  }),
);

adminRouter.delete(
  '/suggestions/:id',
  asyncHandler(async (req, res) => {
    const existente = await prisma.suggestion.findUnique({ where: { id: req.params.id } });
    if (!existente) throw naoEncontrado('Sugestão');
    await prisma.suggestion.delete({ where: { id: existente.id } });
    res.status(204).end();
  }),
);

/* ------------------------------- preferências ----------------------------- */

adminRouter.get(
  '/preferences',
  asyncHandler(async (_req, res) => {
    const preferences = await prisma.parentPreference.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json({ preferences });
  }),
);

adminRouter.post(
  '/preferences',
  asyncHandler(async (req, res) => {
    const dados = validar(preferenciaSchema, req.body);
    const preference = await prisma.parentPreference.create({
      data: { ...dados, description: dados.description ?? null },
    });
    res.status(201).json({ preference });
  }),
);

adminRouter.put(
  '/preferences/:id',
  asyncHandler(async (req, res) => {
    const dados = validar(preferenciaSchema, req.body);
    const existente = await prisma.parentPreference.findUnique({ where: { id: req.params.id } });
    if (!existente) throw naoEncontrado('Preferência');

    const preference = await prisma.parentPreference.update({
      where: { id: existente.id },
      data: { ...dados, description: dados.description ?? null },
    });
    res.json({ preference });
  }),
);

adminRouter.delete(
  '/preferences/:id',
  asyncHandler(async (req, res) => {
    const existente = await prisma.parentPreference.findUnique({ where: { id: req.params.id } });
    if (!existente) throw naoEncontrado('Preferência');
    await prisma.parentPreference.delete({ where: { id: existente.id } });
    res.status(204).end();
  }),
);

/* --------------------------------- reservas ------------------------------- */

adminRouter.get(
  '/reservations',
  asyncHandler(async (req, res) => {
    const { status } = req.query as Record<string, string | undefined>;

    const reservations = await prisma.reservation.findMany({
      where: status ? { status: status as Prisma.EnumReservationStatusFilter['equals'] } : {},
      orderBy: { createdAt: 'desc' },
      include: { item: { include: { category: true } } },
    });

    // Os pais veem sempre o nome e o contacto de quem reservou.
    res.json({ reservations });
  }),
);

adminRouter.delete(
  '/reservations/:id',
  asyncHandler(async (req, res) => {
    const existente = await prisma.reservation.findUnique({ where: { id: req.params.id } });
    if (!existente) throw naoEncontrado('Reserva');
    await prisma.reservation.delete({ where: { id: existente.id } });
    res.status(204).end();
  }),
);

/* -------------------------------- definições ------------------------------ */

adminRouter.get(
  '/settings',
  asyncHandler(async (_req, res) => {
    res.json({ settings: await definicoes() });
  }),
);

adminRouter.put(
  '/settings',
  asyncHandler(async (req, res) => {
    const dados = validar(definicoesSchema, req.body);

    const settings = await prisma.siteSettings.update({
      where: { id: 1 },
      data: { ...dados, reservationTtlDays: dados.reservationTtlDays ?? null },
    });

    limparCacheDeDefinicoes();
    res.json({ settings });
  }),
);
