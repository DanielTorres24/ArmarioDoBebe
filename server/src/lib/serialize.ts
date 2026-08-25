import type { ReserverVisibility } from '@prisma/client';

/**
 * Prepara as linhas da base de dados para o frontend: reservas filtradas
 * conforme a privacidade escolhida pelos pais.
 */

/** Reservas que ainda "ocupam" um artigo. */
export const RESERVAS_ATIVAS = ['THINKING', 'RESERVED', 'GIFTED'] as const;

type ReservaCrua = {
  id: string;
  guestId: string;
  guestName: string;
  status: string;
  createdAt: Date;
};

export interface ReservaPublica {
  id: string;
  status: string;
  /** Só preenchido quando a privacidade o permite, ou para o próprio convidado. */
  guestName: string | null;
  isMine: boolean;
  createdAt: Date;
}

/**
 * Decide o que cada pessoa pode ver de uma reserva.
 * Quem reservou vê sempre o seu próprio nome, independentemente da definição —
 * é a única forma de poder gerir a sua reserva.
 */
export function reservaPublica(
  reserva: ReservaCrua,
  visibilidade: ReserverVisibility,
  guestId: string | null,
): ReservaPublica {
  const minha = guestId !== null && reserva.guestId === guestId;
  const mostrarNome = minha || visibilidade === 'PUBLIC';

  return {
    id: reserva.id,
    status: reserva.status,
    guestName: mostrarNome ? reserva.guestName : null,
    isMine: minha,
    createdAt: reserva.createdAt,
  };
}

/** Lê o id do convidado do cabeçalho, para saber o que é dele. */
export const guestIdDoPedido = (cabecalho: string | undefined): string | null => {
  const valor = (cabecalho ?? '').trim();
  return valor.length >= 8 && valor.length <= 64 ? valor : null;
};
