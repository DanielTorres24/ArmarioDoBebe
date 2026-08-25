import { Router } from 'express';

import { prisma } from '../../lib/prisma.js';
import { asyncHandler, HttpError, naoEncontrado, semPermissao, validar } from '../../lib/http.js';
import { apagarReserva, criarReserva, editarReserva } from '../../lib/validation.js';
import { guestIdDoPedido, reservaPublica, RESERVAS_ATIVAS } from '../../lib/serialize.js';
import { definicoes } from '../../lib/settings.js';

export const reservationsPublicRouter = Router();

/** GET /api/reservations — as reservas do próprio convidado. */
reservationsPublicRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const guestId = guestIdDoPedido(req.header('x-guest-id'));
    if (!guestId) return res.json({ reservations: [] });

    const reservations = await prisma.reservation.findMany({
      where: { guestId, status: { not: 'CANCELLED' } },
      orderBy: { createdAt: 'desc' },
      include: { item: { include: { category: true } } },
    });

    return res.json({ reservations });
  }),
);

/** POST /api/reservations — "quero oferecer isto". */
reservationsPublicRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const config = await definicoes();
    if (!config.reservationEnabled) {
      throw new HttpError(409, 'As reservas estão desativadas de momento.');
    }

    const dados = validar(criarReserva, req.body);

    if (dados.status === 'THINKING' && !config.allowThinking) {
      throw new HttpError(409, 'Neste momento só é possível reservar mesmo a prenda.');
    }

    const item = await prisma.item.findUnique({
      where: { id: dados.itemId },
      include: { reservations: { where: { status: { in: [...RESERVAS_ATIVAS] } } } },
    });
    if (!item) throw naoEncontrado('Artigo');

    const jaMinha = item.reservations.find((r) => r.guestId === dados.guestId);
    if (jaMinha) throw new HttpError(409, 'Já tinhas reservado este artigo.');

    if (item.reservations.length > 0) {
      throw new HttpError(409, 'Alguém reservou este artigo entretanto. Atualiza a página.');
    }

    const expiresAt =
      config.reservationTtlDays && dados.status === 'THINKING'
        ? new Date(Date.now() + config.reservationTtlDays * 24 * 60 * 60 * 1000)
        : null;

    await prisma.guest.upsert({
      where: { id: dados.guestId },
      create: { id: dados.guestId, name: dados.guestName, email: dados.guestEmail ?? null },
      update: { name: dados.guestName, ...(dados.guestEmail ? { email: dados.guestEmail } : {}) },
    });

    const reserva = await prisma.reservation.create({
      data: {
        itemId: item.id,
        guestId: dados.guestId,
        guestName: dados.guestName,
        guestEmail: dados.guestEmail ?? null,
        status: dados.status,
        note: dados.note ?? null,
        expiresAt,
      },
    });

    res.status(201).json({
      reservation: reservaPublica(reserva, config.reserverVisibility, dados.guestId),
    });
  }),
);

/** PUT /api/reservations/:id — só quem criou a reserva. */
reservationsPublicRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const dados = validar(editarReserva, req.body);
    const config = await definicoes();

    const existente = await prisma.reservation.findUnique({ where: { id: req.params.id } });
    if (!existente) throw naoEncontrado('Reserva');

    if (existente.guestId !== dados.guestId) {
      throw semPermissao('Só podes alterar as reservas que fizeste.');
    }

    if (dados.status === 'CANCELLED' && !config.allowCancellation) {
      throw new HttpError(409, 'O cancelamento de reservas está desativado.');
    }

    const reserva = await prisma.reservation.update({
      where: { id: existente.id },
      data: { status: dados.status, note: dados.note ?? null },
    });

    res.json({ reservation: reservaPublica(reserva, config.reserverVisibility, dados.guestId) });
  }),
);

/** DELETE /api/reservations/:id — cancelar a própria reserva. */
reservationsPublicRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const config = await definicoes();
    if (!config.allowCancellation) {
      throw new HttpError(409, 'O cancelamento de reservas está desativado.');
    }

    const dados = validar(apagarReserva, {
      guestId: req.body?.guestId ?? req.query?.guestId ?? req.header('x-guest-id'),
    });

    const existente = await prisma.reservation.findUnique({ where: { id: req.params.id } });
    if (!existente) throw naoEncontrado('Reserva');

    if (existente.guestId !== dados.guestId) {
      throw semPermissao('Só podes cancelar as reservas que fizeste.');
    }

    await prisma.reservation.delete({ where: { id: existente.id } });
    res.status(204).end();
  }),
);
