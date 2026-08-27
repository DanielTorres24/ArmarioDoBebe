import { Esqueleto } from './ui';
import { pecas } from '../lib/format';
import { sinalDeQuantidade } from '../lib/sinais';
import type { ContagemPorCategoria } from '../types';

/**
 * Todas as categorias, com a quantidade que já existe em cada uma.
 * Tocar numa filtra a lista de artigos logo abaixo.
 */
export default function Categorias({
  dados,
  carregando,
  escolhida,
  onEscolher,
}: {
  dados: ContagemPorCategoria[];
  carregando?: boolean;
  escolhida?: string | null;
  onEscolher?: (id: string | null) => void;
}) {
  if (carregando) {
    return (
      <section aria-labelledby="t-categorias">
        <h2 id="t-categorias" className="text-lg">
          📂 Todas as categorias
        </h2>
        <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(min(160px,100%),1fr))] gap-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Esqueleto key={i} className="h-28 rounded-card" />
          ))}
        </div>
      </section>
    );
  }

  const maximo = Math.max(1, ...dados.map((c) => c.unidades));

  return (
    <section aria-labelledby="t-categorias">
      <h2 id="t-categorias" className="text-lg">
        📂 Todas as categorias
      </h2>
      <p className="mt-1 text-sm text-tinta-suave">
        A barra mostra quanto o Diogo já tem em cada uma. Toca para veres o que lá está.
      </p>

      <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(min(160px,100%),1fr))] gap-3">
        {dados.map((categoria) => {
          const sinal = sinalDeQuantidade(categoria.unidades, categoria.pedidos);
          const largura = (categoria.unidades / maximo) * 100;
          const ativa = escolhida === categoria.id;

          return (
            <button
              key={categoria.id}
              type="button"
              aria-pressed={ativa}
              onClick={() => onEscolher?.(ativa ? null : categoria.id)}
              className={[
                'cartao flex min-h-[44px] flex-col p-3 text-left transition',
                ativa ? 'border-azul-500 bg-azul-50' : 'hover:border-azul-300 hover:shadow-forte',
              ].join(' ')}
            >
              <span className="sr-only">
                {categoria.name}: {pecas(categoria.unidades)}. {sinal.texto}.
              </span>

              <span aria-hidden="true" className="text-2xl leading-none">
                {categoria.icon}
              </span>
              <span aria-hidden="true" className="mt-1.5 font-bold [overflow-wrap:anywhere]">
                {categoria.name}
              </span>

              <span aria-hidden="true" className="mt-2 flex items-center gap-2">
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-azul-100">
                  <span className="block h-full rounded-full bg-grafico" style={{ width: `${largura}%` }} />
                </span>
                <span className="shrink-0 font-extrabold tabular-nums text-azul-900">
                  {categoria.unidades}
                </span>
              </span>

              <span aria-hidden="true" className="mt-1 text-xs text-tinta-suave">
                {sinal.emoji} {sinal.texto}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
