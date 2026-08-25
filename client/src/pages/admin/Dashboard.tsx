import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { EstadoVazio, Esqueleto, Etiqueta, juntar } from '../../components/ui';
import { adminApi } from '../../lib/api';
import { dataCurta, plural } from '../../lib/format';
import type { DashboardData } from '../../types';

const ROTULOS_DE_RESERVA: Record<string, string> = {
  THINKING: 'A pensar',
  RESERVED: 'Reservada',
  GIFTED: 'Oferecida',
  CANCELLED: 'Cancelada',
};

/**
 * Barras de uma só cor: medem grandeza, não identidade.
 * Cada linha traz o rótulo e o valor em texto, por isso lê-se sem depender da cor.
 */
function Barras({ linhas }: { linhas: { id: string; label: string; valor: number }[] }) {
  const maximo = Math.max(1, ...linhas.map((linha) => linha.valor));

  return (
    <ul className="flex flex-col gap-2.5">
      {linhas.map((linha) => (
        <li key={linha.id} className="grid grid-cols-[minmax(96px,38%)_1fr_auto] items-center gap-3">
          <span className="text-sm [overflow-wrap:anywhere]">{linha.label}</span>
          <span className="block h-3.5 rounded-r bg-azul-100" aria-hidden="true">
            <span
              className="block h-full rounded-r bg-grafico"
              style={{ width: linha.valor === 0 ? '0%' : `${Math.max(4, (linha.valor / maximo) * 100)}%` }}
            />
          </span>
          <span className="text-sm font-extrabold tabular-nums">{linha.valor}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Dashboard() {
  const [dados, setDados] = useState<DashboardData | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;

    adminApi
      .dashboard()
      .then((resposta) => ativo && setDados(resposta))
      .catch((problema: unknown) => {
        if (ativo) setErro(problema instanceof Error ? problema.message : 'Não foi possível carregar.');
      })
      .finally(() => ativo && setCarregando(false));

    return () => {
      ativo = false;
    };
  }, []);

  if (carregando) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((indice) => (
          <div className="cartao p-5" key={indice}>
            <Esqueleto className="mb-2 h-8 w-16" />
            <Esqueleto className="h-3 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (erro || !dados) {
    return <EstadoVazio emoji="😕" titulo="Não foi possível carregar" texto={erro} />;
  }

  const { totals } = dados;

  const cartoes = [
    { valor: totals.items, rotulo: 'artigos no total', emoji: '📦' },
    { valor: totals.needed, rotulo: 'fazem falta', emoji: '🟢' },
    { valor: totals.wanted, rotulo: 'muito desejados', emoji: '⭐' },
    { valor: totals.owned + totals.some, rotulo: 'já existentes', emoji: '🔴' },
    { valor: totals.reservations, rotulo: 'reservas', emoji: '🤝' },
    { valor: totals.thinking, rotulo: 'ainda a pensar', emoji: '🟠' },
    { valor: totals.reserved, rotulo: 'confirmadas', emoji: '🎁' },
    { valor: totals.units, rotulo: 'peças (com quantidades)', emoji: '🧺' },
  ];

  return (
    <>
      <header className="mb-5">
        <h1 className="text-2xl">Dashboard</h1>
        <p className="mt-1 text-sm text-tinta-suave">Como está o armário do Diogo neste momento.</p>
      </header>

      <section aria-label="Números principais" className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cartoes.map((cartao) => (
          <div key={cartao.rotulo} className="cartao p-4">
            <span className="mb-1 block text-xl" aria-hidden="true">
              {cartao.emoji}
            </span>
            <span className="block text-3xl font-extrabold text-azul-700">{cartao.valor}</span>
            <span className="text-sm text-tinta-suave">{cartao.rotulo}</span>
          </div>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="cartao p-5" aria-labelledby="titulo-categorias">
          <h2 id="titulo-categorias" className="mb-4 text-lg">
            Artigos por categoria
          </h2>
          {dados.byCategory.length === 0 ? (
            <p className="text-sm text-tinta-suave">Ainda não há categorias.</p>
          ) : (
            <Barras
              linhas={dados.byCategory.map((categoria) => ({
                id: categoria.id,
                label: `${categoria.icon} ${categoria.name}`,
                valor: categoria.count,
              }))}
            />
          )}
        </section>

        <section className="cartao p-5" aria-labelledby="titulo-ultimos">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 id="titulo-ultimos" className="text-lg">
              Últimos artigos
            </h2>
            <Link to="/admin/items" className="text-sm font-bold text-azul-700 underline underline-offset-2">
              Ver todos
            </Link>
          </div>

          {dados.latestItems.length === 0 ? (
            <p className="text-sm text-tinta-suave">Ainda não há artigos.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {dados.latestItems.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block font-bold [overflow-wrap:anywhere]">{item.name}</span>
                    <span className="text-xs text-tinta-suave">
                      {item.category?.name}
                      {item.ownerName ? ` · por ${item.ownerName}` : ' · pelos pais'}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-tinta-suave">{dataCurta(item.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="cartao p-5 lg:col-span-2" aria-labelledby="titulo-reservas">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 id="titulo-reservas" className="text-lg">
              Últimas reservas
            </h2>
            <Link
              to="/admin/reservations"
              className="text-sm font-bold text-azul-700 underline underline-offset-2"
            >
              Ver todas
            </Link>
          </div>

          {dados.latestReservations.length === 0 ? (
            <p className="text-sm text-tinta-suave">
              Ainda ninguém reservou nada. {plural(totals.needed, 'artigo está', 'artigos estão')} à
              espera de quem os ofereça.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {dados.latestReservations.map((reserva) => (
                <li
                  key={reserva.id}
                  className={juntar(
                    'flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-azul-50 px-3 py-2.5',
                  )}
                >
                  <span>
                    <span className="block font-bold [overflow-wrap:anywhere]">
                      {reserva.item?.name ?? 'Artigo removido'}
                    </span>
                    <span className="text-xs text-tinta-suave">
                      {reserva.guestName}
                      {reserva.guestEmail ? ` · ${reserva.guestEmail}` : ''}
                    </span>
                  </span>
                  <Etiqueta tom={reserva.status === 'THINKING' ? 'ambar' : 'verde'}>
                    {ROTULOS_DE_RESERVA[reserva.status] ?? reserva.status}
                  </Etiqueta>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
