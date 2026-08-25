import { useCallback, useEffect, useState } from 'react';

import { Botao, EstadoVazio, Esqueleto, Etiqueta, Toast, juntar, type Aviso } from '../../components/ui';
import ConfirmDialog from '../../components/ConfirmDialog';
import { adminApi } from '../../lib/api';
import { dataCurta } from '../../lib/format';
import type { AdminReservation } from '../../types';

const ESTADOS = [
  { valor: '', rotulo: 'Todas' },
  { valor: 'THINKING', rotulo: '🟠 A pensar' },
  { valor: 'RESERVED', rotulo: '🎁 Reservadas' },
  { valor: 'GIFTED', rotulo: '💙 Oferecidas' },
  { valor: 'CANCELLED', rotulo: 'Canceladas' },
];

const TOM: Record<string, 'ambar' | 'verde' | 'azul' | 'neutro'> = {
  THINKING: 'ambar',
  RESERVED: 'verde',
  GIFTED: 'azul',
  CANCELLED: 'neutro',
};

const ROTULO: Record<string, string> = {
  THINKING: '🟠 A pensar oferecer',
  RESERVED: '🎁 Reservada',
  GIFTED: '💙 Já ofereceu',
  CANCELLED: 'Cancelada',
};

/** Todas as reservas, com o nome e o contacto de quem reservou. */
export default function Reservations() {
  const [reservas, setReservas] = useState<AdminReservation[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [aRemover, setARemover] = useState<AdminReservation | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setReservas(await adminApi.reservations(filtro || undefined));
    setCarregando(false);
  }, [filtro]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return (
    <>
      <header className="mb-4">
        <h1 className="text-2xl">Reservas</h1>
        <p className="mt-1 text-sm text-tinta-suave">
          Quem se ofereceu para dar o quê. Só tu vês os nomes e os contactos.
        </p>
      </header>

      <div role="group" aria-label="Filtrar por estado" className="mb-4 flex flex-wrap gap-2">
        {ESTADOS.map((estado) => (
          <button
            key={estado.valor}
            type="button"
            aria-pressed={filtro === estado.valor}
            onClick={() => setFiltro(estado.valor)}
            className={juntar(
              'min-h-[40px] rounded-pill px-3.5 py-2 text-sm font-bold transition',
              filtro === estado.valor
                ? 'bg-azul-500 text-white'
                : 'border border-azul-200 bg-white text-tinta hover:bg-azul-50',
            )}
          >
            {estado.rotulo}
          </button>
        ))}
      </div>

      {carregando && (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((indice) => (
            <Esqueleto key={indice} className="h-20 w-full rounded-card" />
          ))}
        </div>
      )}

      {!carregando && reservas.length === 0 && (
        <EstadoVazio
          emoji="🤝"
          titulo="Ainda não há reservas"
          texto="Quando alguém carregar em “Quero oferecer isto”, aparece aqui."
        />
      )}

      {!carregando && reservas.length > 0 && (
        <ul className="flex flex-col gap-2.5">
          {reservas.map((reserva) => (
            <li key={reserva.id} className="cartao flex flex-wrap items-start gap-3 p-4">
              <div className="min-w-[180px] flex-1">
                <h2 className="text-base [overflow-wrap:anywhere]">
                  {reserva.item?.name ?? 'Artigo removido'}
                </h2>
                <p className="mt-1 text-sm [overflow-wrap:anywhere]">
                  <strong>{reserva.guestName}</strong>
                  {reserva.guestEmail && (
                    <>
                      {' · '}
                      <a href={`mailto:${reserva.guestEmail}`} className="underline underline-offset-2">
                        {reserva.guestEmail}
                      </a>
                    </>
                  )}
                </p>
                {reserva.note && (
                  <p className="mt-1.5 rounded-2xl bg-azul-50 px-3 py-2 text-sm text-tinta-suave [overflow-wrap:anywhere]">
                    “{reserva.note}”
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Etiqueta tom={TOM[reserva.status] ?? 'neutro'}>
                    {ROTULO[reserva.status] ?? reserva.status}
                  </Etiqueta>
                  {reserva.item?.category && (
                    <Etiqueta tom="neutro">
                      {reserva.item.category.icon} {reserva.item.category.name}
                    </Etiqueta>
                  )}
                  <Etiqueta tom="neutro">{dataCurta(reserva.createdAt)}</Etiqueta>
                  {reserva.expiresAt && (
                    <Etiqueta tom="ambar">expira {dataCurta(reserva.expiresAt)}</Etiqueta>
                  )}
                </div>
              </div>

              <Botao variante="perigo" tamanho="pequeno" onClick={() => setARemover(reserva)}>
                Cancelar reserva
              </Botao>
            </li>
          ))}
        </ul>
      )}

      {aRemover && (
        <ConfirmDialog
          titulo="Cancelar esta reserva?"
          confirmar="Sim, cancelar"
          mensagem={
            <>
              A reserva de <strong>{aRemover.guestName}</strong> para{' '}
              <strong>{aRemover.item?.name ?? 'este artigo'}</strong> vai ser apagada e o artigo fica
              outra vez disponível.
            </>
          }
          onFechar={() => setARemover(null)}
          onConfirmar={async () => {
            await adminApi.apagarReserva(aRemover.id);
            setARemover(null);
            setAviso({ tipo: 'sucesso', mensagem: 'Reserva cancelada.' });
            await carregar();
          }}
        />
      )}

      <Toast aviso={aviso} onFechar={() => setAviso(null)} />
    </>
  );
}
