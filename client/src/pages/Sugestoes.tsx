import { useEffect, useState } from 'react';

import { Botao, EstadoVazio, Esqueleto, Etiqueta, juntar } from '../components/ui';
import { api } from '../lib/api';
import { intervaloDePreco } from '../lib/format';
import { FAIXAS_DE_ORCAMENTO, type Suggestion } from '../types';

/** "Não sabes o que oferecer?" — sugestões por faixa de orçamento. */
export default function Sugestoes() {
  const [faixa, setFaixa] = useState(FAIXAS_DE_ORCAMENTO[1]!.id);
  const [sugestoes, setSugestoes] = useState<Suggestion[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const escolhida = FAIXAS_DE_ORCAMENTO.find((f) => f.id === faixa)!;

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro('');

    api
      .suggestions({ min: escolhida.min, max: escolhida.max })
      .then((lista) => ativo && setSugestoes(lista))
      .catch((problema: unknown) => {
        if (ativo) setErro(problema instanceof Error ? problema.message : 'Não foi possível carregar.');
      })
      .finally(() => ativo && setCarregando(false));

    return () => {
      ativo = false;
    };
  }, [escolhida]);

  return (
    <>
      <header className="mb-5">
        <h1 className="text-3xl">🤔 Não sabes o que oferecer?</h1>
        <p className="mt-2 max-w-2xl text-tinta-suave">
          Escolhe quanto queres gastar e mostramos-te ideias que os pais deixaram sugeridas.
        </p>
      </header>

      <div
        role="group"
        aria-label="Escolher orçamento"
        className="mb-6 flex flex-wrap gap-2"
      >
        {FAIXAS_DE_ORCAMENTO.map((opcao) => (
          <button
            key={opcao.id}
            type="button"
            aria-pressed={faixa === opcao.id}
            onClick={() => setFaixa(opcao.id)}
            className={juntar(
              'min-h-[44px] rounded-pill px-4 py-2 font-bold transition',
              faixa === opcao.id
                ? 'bg-azul-500 text-white shadow-botao'
                : 'border border-azul-200 bg-white text-tinta hover:bg-azul-50',
            )}
          >
            {opcao.label}
          </button>
        ))}
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
            titulo="Ainda não há sugestões nesta faixa"
            texto="Experimenta outro orçamento — ou vê diretamente o que faz falta."
          >
            <Botao variante="contorno" onClick={() => setFaixa(FAIXAS_DE_ORCAMENTO[1]!.id)}>
              Ver outra faixa
            </Botao>
          </EstadoVazio>
        )}

        {!carregando && !erro && sugestoes.length > 0 && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-3">
            {sugestoes.map((sugestao) => {
              const preco = intervaloDePreco(sugestao.minPrice, sugestao.maxPrice);

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
                    {preco && <p className="font-bold text-azul-700">{preco}</p>}
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
