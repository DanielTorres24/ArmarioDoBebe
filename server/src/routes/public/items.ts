import { Router } from 'express';
import type { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { asyncHandler, naoEncontrado, semPermissao, validar } from '../../lib/http.js';
import {
  apagarArtigoDeConvidado,
  criarArtigoDeConvidado,
  editarArtigoDeConvidado,
} from '../../lib/validation.js';
import { guestIdDoPedido, reservaPublica, RESERVAS_ATIVAS } from '../../lib/serialize.js';
import { definicoes } from '../../lib/settings.js';

export const itemsPublicRouter = Router();

const incluir = {
  category: true,
  ageRange: true,
  reservations: {
    where: { status: { in: [...RESERVAS_ATIVAS] } },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.ItemInclude;

type ArtigoCarregado = Prisma.ItemGetPayload<{ include: typeof incluir }>;

/** Monta a resposta pública de um artigo, já com a privacidade das reservas aplicada. */
async function comoPublico(item: ArtigoCarregado, guestId: string | null) {
  const { reserverVisibility } = await definicoes();

  return {
    ...item,
    reservations: item.reservations.map((r) => reservaPublica(r, reserverVisibility, guestId)),
    isReserved: item.reservations.length > 0,
    isMine: guestId !== null && item.ownerId === guestId,
  };
}

/** GET /api/items — lista com todos os filtros da área pública. */
itemsPublicRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const guestId = guestIdDoPedido(req.header('x-guest-id'));
    const { search, category, status, ageRange, priority, reserved, mine, sort } =
      req.query as Record<string, string | undefined>;

    const where: Prisma.ItemWhereInput = {};
    const condicoes: Prisma.ItemWhereInput[] = [];

    if (search?.trim()) {
      const termo = search.trim();
      condicoes.push({
        OR: [
          { name: { contains: termo, mode: 'insensitive' } },
          { description: { contains: termo, mode: 'insensitive' } },
          { size: { contains: termo, mode: 'insensitive' } },
        ],
      });
    }

    if (category) where.categoryId = category;
    if (ageRange) where.ageRangeId = ageRange;
    if (priority) where.priority = Number(priority);

    if (status) {
      const estados = status.split(',').filter((s) => ['NEEDED', 'WANTED', 'SOME', 'OWNED'].includes(s));
      if (estados.length > 0) where.status = { in: estados as Prisma.EnumItemStatusFilter['in'] };
    }


    if (reserved === 'true') where.reservations = { some: { status: { in: [...RESERVAS_ATIVAS] } } };
    if (reserved === 'false') where.reservations = { none: { status: { in: [...RESERVAS_ATIVAS] } } };

    if (mine === 'true' && guestId) where.ownerId = guestId;

    if (condicoes.length > 0) where.AND = condicoes;

    const orderBy: Prisma.ItemOrderByWithRelationInput[] =
      sort === 'priority'
        ? [{ priority: 'desc' }, { createdAt: 'desc' }]
        : sort === 'oldest'
          ? [{ createdAt: 'asc' }]
          : sort === 'name'
            ? [{ name: 'asc' }]
            : [{ createdAt: 'desc' }];

    const items = await prisma.item.findMany({ where, orderBy, include: incluir });
    const { reserverVisibility } = await definicoes();

    res.json({
      items: items.map((item) => ({
        ...item,
        reservations: item.reservations.map((r) => reservaPublica(r, reserverVisibility, guestId)),
        isReserved: item.reservations.length > 0,
        isMine: guestId !== null && item.ownerId === guestId,
      })),
    });
  }),
);

/** GET /api/items/:id */
itemsPublicRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const guestId = guestIdDoPedido(req.header('x-guest-id'));
    const item = await prisma.item.findUnique({ where: { id: req.params.id }, include: incluir });
    if (!item) throw naoEncontrado('Artigo');
    res.json({ item: await comoPublico(item, guestId) });
  }),
);

/** POST /api/items — um convidado acrescenta algo que já existe no armário. */
itemsPublicRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const dados = validar(criarArtigoDeConvidado, req.body);

    const categoria = await prisma.category.findUnique({ where: { id: dados.categoryId } });
    if (!categoria) throw naoEncontrado('Categoria');

    // Quem acrescenta está a dizer "isto já existe", por isso entra como OWNED.
    const item = await prisma.item.create({
      data: {
        name: dados.name,
        categoryId: dados.categoryId,
        description: dados.description ?? null,
        size: dados.size ?? null,
        ageRangeId: dados.ageRangeId ?? null,
        quantity: dados.quantity,
        status: 'OWNED',
        ownerId: dados.ownerId,
        ownerName: dados.ownerName,
      },
      include: incluir,
    });

    await prisma.guest.upsert({
      where: { id: dados.ownerId },
      create: { id: dados.ownerId, name: dados.ownerName },
      update: { name: dados.ownerName },
    });

    res.status(201).json({ item: await comoPublico(item, dados.ownerId) });
  }),
);

/** PUT /api/items/:id — só o convidado que criou o artigo. */
itemsPublicRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const dados = validar(editarArtigoDeConvidado, req.body);

    const existente = await prisma.item.findUnique({ where: { id: req.params.id } });
    if (!existente) throw naoEncontrado('Artigo');

    if (!existente.ownerId || existente.ownerId !== dados.ownerId) {
      throw semPermissao('Só podes editar os artigos que tu adicionaste.');
    }

    const item = await prisma.item.update({
      where: { id: existente.id },
      data: {
        name: dados.name,
        categoryId: dados.categoryId,
        description: dados.description ?? null,
        size: dados.size ?? null,
        ageRangeId: dados.ageRangeId ?? null,
        quantity: dados.quantity,
      },
      include: incluir,
    });

    res.json({ item: await comoPublico(item, dados.ownerId) });
  }),
);

/** DELETE /api/items/:id — só o convidado que criou o artigo. */
itemsPublicRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const dados = validar(apagarArtigoDeConvidado, {
      ownerId: req.body?.ownerId ?? req.query?.ownerId ?? req.header('x-guest-id'),
    });

    const existente = await prisma.item.findUnique({ where: { id: req.params.id } });
    if (!existente) throw naoEncontrado('Artigo');

    if (!existente.ownerId || existente.ownerId !== dados.ownerId) {
      throw semPermissao('Só podes remover os artigos que tu adicionaste.');
    }

    await prisma.item.delete({ where: { id: existente.id } });
    res.status(204).end();
  }),
);
