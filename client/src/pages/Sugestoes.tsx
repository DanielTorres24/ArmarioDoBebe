import { useEffect, useState } from 'react';

import NotaDePrendas from '../components/NotaDePrendas';
import { Botao, EstadoVazio, Esqueleto, Etiqueta, juntar } from '../components/ui';
import { api } from '../lib/api';
import { pecas } from '../lib/format';
import { useCatalogo } from '../lib/catalogo';
import type { ContagemPorCategoria, Estatisticas, Suggestion } from '../types';

/**
 * "Não sabes o que oferecer?" — ideias que os pais deixaram, por categoria.
 *
 * Esta página filtrava por orçamento. Deixou de o fazer: em vez de dizer quanto
 * custa, diz quantas peças já existem naquela categoria, que é o que evita
 * repetidos.
 */
export default function Sugestoes() {
  const { categories } = useCatalogo();

  const [categoria, setCategoria] = useState<string | null>(null);
  const [sugestoes, setSugestoes] = useState<Suggestion[]>([]);
  const [stats, setStats] = useState<Estatisticas | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro('');

    Promise.all([api.suggestions(categoria ? { category: categoria } : undefined), api.stats()])
      .then(([lista, numeros]) => {
        if (!ativo) return;
        setSugestoes(lista);
        setStats(numeros);
      })
      .catch((problema: unknown) => {
        if (ativo) setErro(problema instanceof Error ? problema.message : 'Não foi possível carregar.');
      })
      .finally(() => ativo && setCarregando(false));

    return () => {
      ativo = false;
    };
  }, [categoria]);

  const contagem = (id: string | null | undefined): ContagemPorCategoria | undefined =>
    id ? stats?.porCategoria.find((c) => c.id === id) : undefined;

  return (
    <>
      <header className="mb-5">
        <h1 className="text-3xl">🤔 Não sabes o que oferecer?</h1>
        <p className="mt-2 max-w-2xl text-tinta-suave">
          Estas são ideias que os pais deixaram sugeridas. Ao lado de cada uma dizemos quantas peças
          o Diogo já tem nessa categoria, para não haver repetidos.
        </p>
      </header>

      <NotaDePrendas className="mb-5" />

      <div role="group" aria-label="Filtrar por categoria" className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={categoria === null}
          onClick={() => setCategoria(null)}
          className={juntar(
            'min-h-[44px] rounded-pill px-4 py-2 font-bold transition',
            categoria === null
              ? 'bg-azul-500 text-white shadow-botao'
              : 'border border-azul-200 bg-white text-tinta hover:bg-azul-50',
          )}
        >
          Todas
        </button>

        {categories.map((opcao) => {
          const numeros = contagem(opcao.id);
          return (
            <button
              key={opcao.id}
              type="button"
              aria-pressed={categoria === opcao.id}
              onClick={() => setCategoria(opcao.id)}
              className={juntar(
                'min-h-[44px] rounded-pill px-4 py-2 font-bold transition',
                categoria === opcao.id
                  ? 'bg-azul-500 text-white shadow-botao'
                  : 'border border-azul-200 bg-white text-tinta hover:bg-azul-50',
              )}
            >
              <span aria-hidden="true">{opcao.icon}</span> {opcao.name}
              {numeros ? (
                <span className="ml-1.5 font-normal opacity-80 tabular-nums">
                  {numeros.unidades}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <section aria-busy={carregando} aria-live="polite">
        {carregando && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-3">
            {[0, 1, 2, 3].map((indice) => (
              <div className="cartao p-5" key={indice}>
                <Esqueleto className="mb-3 h-5 w-2/3" />
                <Esqueleto className="mb-2 h-3 w-full" />
                <Esqueleto className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        )}

        {!carregando && erro && <EstadoVazio emoji="😕" titulo="Não foi possível carregar" texto={erro} />}

        {!carregando && !erro && sugestoes.length === 0 && (
          <EstadoVazio
            emoji="🎁"
            titulo="Ainda não há ideias nesta categoria"
            texto="Experimenta outra categoria — ou vê diretamente o que faz falta."
          >
            <Botao variante="contorno" onClick={() => setCategoria(null)}>
              Ver todas as ideias
            </Botao>
          </EstadoVazio>
        )}

        {!carregando && !erro && sugestoes.length > 0 && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-3">
            {sugestoes.map((sugestao) => {
              const numeros = contagem(sugestao.categoryId);

              return (
                <article key={sugestao.id} className="cartao flex flex-col p-5">
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {sugestao.category && (
                      <Etiqueta>
                        {sugestao.category.icon} {sugestao.category.name}
                      </Etiqueta>
                    )}
                    {sugestao.priority >= 4 && <Etiqueta tom="ambar">⭐ Muito útil</Etiqueta>}
                  </div>

                  <h2 className="mb-1.5 text-lg [overflow-wrap:anywhere]">{sugestao.name}</h2>

                  {sugestao.description && (
                    <p className="text-sm text-tinta-suave [overflow-wrap:anywhere]">
                      {sugestao.description}
                    </p>
                  )}

                  <div className="mt-auto pt-3">
                    {numeros && (
                      <p className="text-sm font-bold text-azul-700">
                        {numeros.unidades === 0
                          ? `Ainda não temos nada em ${numeros.name.toLowerCase()}`
                          : `Já temos ${pecas(numeros.unidades)} em ${numeros.name.toLowerCase()}`}
                      </p>
                    )}
                    {sugestao.productUrl && (
                      <a
                        href={sugestao.productUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="mt-1 inline-block text-sm font-bold text-azul-700 underline underline-offset-2"
                      >
                        Ver exemplo ↗
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <p className="mt-6 text-sm text-tinta-suave">
        Estas são ideias genéricas. Para reservares uma prenda concreta e evitares repetidos, vê a
        página <strong>🎁 Faz falta</strong>.
      </p>
    </>
  );
}
