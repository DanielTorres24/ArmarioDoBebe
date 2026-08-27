import { useEffect, useState } from 'react';

import RoupaPorTamanho from '../../components/RoupaPorTamanho';
import { EstadoVazio, Esqueleto } from '../../components/ui';
import { adminApi, api } from '../../lib/api';
import { pecas } from '../../lib/format';
import type { DashboardData, Estatisticas } from '../../types';


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
  const [stats, setStats] = useState<Estatisticas | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;

    // O /api/stats já conta unidades (e não linhas) por categoria e por
    // tamanho de roupa — é o mesmo cálculo que o site público mostra, para os
    // dois lados não darem números diferentes.
    Promise.all([adminApi.dashboard(), api.stats()])
      .then(([painel, numeros]) => {
        if (!ativo) return;
        setDados(painel);
        setStats(numeros);
      })
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
    { valor: totals.units, rotulo: 'peças no armário', emoji: '🧺' },
    { valor: totals.items, rotulo: 'artigos', emoji: '📦' },
    { valor: totals.needed + totals.wanted, rotulo: 'por oferecer', emoji: '🟢' },
    { valor: totals.reservations, rotulo: 'reservas', emoji: '🤝' },
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
          <h2 id="titulo-categorias" className="mb-1 text-lg">
            Peças por categoria
          </h2>
          <p className="mb-4 text-sm text-tinta-suave">
            Conta unidades, não linhas: um artigo com 6 unidades vale 6.
          </p>

          {!stats || stats.porCategoria.length === 0 ? (
            <p className="text-sm text-tinta-suave">Ainda não há categorias.</p>
          ) : (
            <Barras
              linhas={stats.porCategoria.map((categoria) => ({
                id: categoria.id,
                label: `${categoria.icon} ${categoria.name}`,
                valor: categoria.unidades,
              }))}
            />
          )}

          {stats && (
            <p className="mt-4 border-t border-azul-100 pt-3 text-sm font-bold text-azul-700">
              {pecas(stats.totalUnidades)} no total.
            </p>
          )}
        </section>

        <RoupaPorTamanho
          dados={stats?.roupaPorTamanho ?? []}
          semTamanho={stats?.roupaSemTamanho}
        />
      </div>
    </>
  );
}
