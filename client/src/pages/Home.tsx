import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { Botao, Esqueleto, Etiqueta, juntar } from '../components/ui';
import ItemCard from '../components/ItemCard';
import NotaDePrendas from '../components/NotaDePrendas';
import RoupaPorTamanho from '../components/RoupaPorTamanho';
import { api } from '../lib/api';
import { useCatalogo } from '../lib/catalogo';
import type { Estatisticas, Item, ParentPreference } from '../types';

interface Resumo {
  armario: number;
  fazFalta: number;
  desejados: number;
  reservadas: number;
}

/** Página inicial: o que é isto, os números e o que mais interessa ver já. */
export default function Home() {
  const { settings, carregando: aCarregarSite } = useCatalogo();

  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [stats, setStats] = useState<Estatisticas | null>(null);
  const [destaques, setDestaques] = useState<Item[]>([]);
  const [preferencias, setPreferencias] = useState<ParentPreference[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    (async () => {
      try {
        const [todos, gostos, numeros] = await Promise.all([
          api.items(),
          api.preferences(),
          api.stats(),
        ]);
        if (!ativo) return;

        setStats(numeros);

        const fazFalta = todos.filter((item) => item.status === 'NEEDED');
        const desejados = todos.filter((item) => item.status === 'WANTED');

        setResumo({
          armario: todos.filter((item) => item.status === 'OWNED' || item.status === 'SOME').length,
          fazFalta: fazFalta.length,
          desejados: desejados.length,
          reservadas: todos.filter((item) => item.isReserved).length,
        });

        // Em destaque: primeiro o que os pais marcaram, depois a prioridade.
        setDestaques(
          [...desejados, ...fazFalta]
            .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.priority - a.priority)
            .slice(0, 3),
        );
        setPreferencias(gostos.slice(0, 4));
      } finally {
        if (ativo) setCarregando(false);
      }
    })();

    return () => {
      ativo = false;
    };
  }, []);

  const cartoes = [
    { emoji: '📦', valor: stats?.totalUnidades, rotulo: 'peças no armário', para: '/armario' },
    { emoji: '🟢', valor: resumo?.fazFalta, rotulo: 'coisas que fazem falta', para: '/precisamos' },
    { emoji: '⭐', valor: resumo?.desejados, rotulo: 'coisas muito desejadas', para: '/mais-desejados' },
    { emoji: '🎁', valor: resumo?.reservadas, rotulo: 'prendas já reservadas', para: '/armario' },
  ];

  return (
    <>
      {/* ------------------------------- Hero ------------------------------- */}
      <section className="relative mb-6 overflow-hidden rounded-card bg-gradient-to-br from-azul-400 to-azul-100 px-4 py-10 text-center sm:px-8 sm:py-14">
        <img
          src="/icons/principal.png"
          alt=""
          width={112}
          height={112}
          className="mx-auto mb-4 h-24 w-24 rounded-full bg-white/90 p-2.5 shadow-suave sm:h-28 sm:w-28"
        />

        {aCarregarSite ? (
          <Esqueleto className="mx-auto h-10 w-2/3" />
        ) : (
          <h1 className="text-balance text-[1.7rem] text-azul-900 sm:text-5xl">{settings?.heroTitle}</h1>
        )}

        <p className="mx-auto mt-4 max-w-2xl text-azul-900/80 sm:text-lg">{settings?.heroSubtitle}</p>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/precisamos">
            <Botao variante="primario" tamanho="grande" className="w-full sm:w-auto">
              {settings?.primaryCtaLabel ?? '🎁 Ver o que o Diogo precisa'}
            </Botao>
          </Link>
          <Link to="/armario">
            <Botao variante="contorno" tamanho="grande" className="w-full sm:w-auto">
              {settings?.secondaryCtaLabel ?? '📦 Ver tudo o que já temos'}
            </Botao>
          </Link>
        </div>
      </section>

      <NotaDePrendas className="mb-6" />

      {/* ------------------------------ Resumo ------------------------------ */}
      <section aria-label="Resumo rápido" className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cartoes.map((cartao) => (
          <Link
            key={cartao.rotulo}
            to={cartao.para}
            className={juntar(
              'cartao flex flex-col items-center px-3 py-5 text-center transition',
              'hover:border-azul-300 hover:shadow-forte',
            )}
          >
            <span className="mb-1 text-2xl" aria-hidden="true">
              {cartao.emoji}
            </span>
            {carregando ? (
              <Esqueleto className="my-1 h-8 w-12" />
            ) : (
              <span className="text-3xl font-extrabold text-azul-700">{cartao.valor ?? 0}</span>
            )}
            <span className="text-sm text-tinta-suave">{cartao.rotulo}</span>
          </Link>
        ))}
      </section>

      {/* --------------------------- Roupa por mês -------------------------- */}
      <div className="mb-8">
        <RoupaPorTamanho
          dados={stats?.roupaPorTamanho ?? []}
          semTamanho={stats?.roupaSemTamanho}
          carregando={carregando}
        />
      </div>

      {/* ----------------------------- Destaques ---------------------------- */}
      {destaques.length > 0 && (
        <section className="mb-8" aria-labelledby="titulo-destaques">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="titulo-destaques" className="text-2xl">
                🎁 O que ainda pode fazer falta
              </h2>
              <p className="mt-1 text-sm text-tinta-suave">
                As coisas que dariam mais jeito neste momento.
              </p>
            </div>
            <Link to="/precisamos" className="text-sm font-bold text-azul-700 underline underline-offset-2">
              Ver tudo
            </Link>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-3">
            {destaques.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* ---------------------------- Preferências -------------------------- */}
      {preferencias.length > 0 && (
        <section className="cartao p-5 sm:p-6" aria-labelledby="titulo-gostos">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <h2 id="titulo-gostos" className="text-xl">
              {settings?.preferencesTitle ?? '💙 Algumas coisas que gostamos'}
            </h2>
            <Link to="/preferencias" className="text-sm font-bold text-azul-700 underline underline-offset-2">
              Ver todas
            </Link>
          </div>

          <ul className="grid gap-2.5 sm:grid-cols-2">
            {preferencias.map((preferencia) => (
              <li key={preferencia.id} className="flex items-start gap-3 rounded-2xl bg-azul-50 p-3">
                <span className="text-xl" aria-hidden="true">
                  {preferencia.icon}
                </span>
                <span>
                  <span className="block font-bold">{preferencia.title}</span>
                  {preferencia.description && (
                    <span className="block text-sm text-tinta-suave">{preferencia.description}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---------------------------- Como funciona ------------------------- */}
      <section className="mt-8" aria-labelledby="titulo-como">
        <h2 id="titulo-como" className="mb-4 text-xl">
          Como funciona
        </h2>
        <ol className="grid gap-3 sm:grid-cols-3">
          {[
            { n: '1', t: 'Vê o que faz falta', d: 'Consulta a lista antes de decidires a prenda.' },
            { n: '2', t: 'Reserva a tua prenda', d: 'Carrega em "Quero oferecer isto" para ninguém repetir.' },
            { n: '3', t: 'Ajuda a manter atualizado', d: 'Se souberes de algo que o Diogo já tem, acrescenta.' },
          ].map((passo) => (
            <li key={passo.n} className="cartao p-4">
              <Etiqueta className="mb-2">Passo {passo.n}</Etiqueta>
              <h3 className="mb-1 text-base">{passo.t}</h3>
              <p className="text-sm text-tinta-suave">{passo.d}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
