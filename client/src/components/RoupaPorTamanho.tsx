import { Esqueleto } from './ui';
import { pecas } from '../lib/format';
import { periodoDoAno } from '../lib/estacoes';
import { useCatalogo } from '../lib/catalogo';
import type { ContagemPorTamanho } from '../types';

/**
 * Quantas peças de roupa já existem em cada escalão de meses.
 *
 * Uma série só, logo uma cor só — a barra mede a quantidade e nada mais.
 * O número aparece sempre em texto ao lado, para não depender de se medir a
 * barra a olho, e o sinal (🔴 🟡 🟢 ⭐) repete a leitura sem ser só pela cor.
 */

/** O mesmo critério da demo, para os dois lados dizerem o mesmo. */
export function sinalDeQuantidade(unidades: number, pedidos: number) {
  if (unidades === 0 && pedidos > 0) {
    return { emoji: '⭐', texto: 'Pedido dos pais' };
  }
  if (unidades === 0) return { emoji: '🟢', texto: 'Faz falta' };
  if (unidades <= 2) return { emoji: '🟠', texto: 'Tem pouco' };
  if (unidades <= 5) return { emoji: '🟡', texto: 'Tem alguns' };
  return { emoji: '🔴', texto: 'Já tem bastante' };
}

export default function RoupaPorTamanho({
  dados,
  semTamanho,
  carregando,
  onEscolher,
  escolhido,
}: {
  dados: ContagemPorTamanho[];
  semTamanho?: { unidades: number; pedidos: number };
  carregando?: boolean;
  onEscolher?: (id: string | null) => void;
  escolhido?: string | null;
}) {
  const { settings } = useCatalogo();

  if (carregando) {
    return (
      <div className="cartao p-4 sm:p-5">
        <Esqueleto className="mb-4 h-5 w-1/2" />
        {[0, 1, 2, 3, 4].map((i) => (
          <Esqueleto key={i} className="mb-3 h-8 w-full" />
        ))}
      </div>
    );
  }

  const maximo = Math.max(1, ...dados.map((d) => d.unidades));
  const total = dados.reduce((soma, d) => soma + d.unidades, 0) + (semTamanho?.unidades ?? 0);

  return (
    <section className="cartao p-4 sm:p-5" aria-label="Roupa por tamanho">
      <h2 className="text-lg">👕 Roupa por tamanho</h2>
      <p className="mt-1 text-sm text-tinta-suave">
        É em roupa que as prendas mais se repetem. Ao lado de cada tamanho dizemos em que
        altura do ano o Diogo lá estará, para se saber que roupa faz sentido.{' '}
        {onEscolher ? 'Toca num tamanho para veres o que já existe.' : null}
      </p>

      <p className="mt-3 text-sm font-bold text-azul-700">
        {total === 0 ? 'Ainda não há roupa registada.' : `${pecas(total)} no total`}
      </p>

      <ul className="mt-4 space-y-1">
        {dados.map((faixa) => {
          const sinal = sinalDeQuantidade(faixa.unidades, faixa.pedidos);
          const largura = (faixa.unidades / maximo) * 100;
          const ativo = escolhido === faixa.id;
          const periodo = periodoDoAno(settings?.dueDate, faixa.monthsFrom, faixa.monthsTo);

          const conteudo = (
            <>
              <span className="flex items-baseline justify-between gap-3">
                <span className="font-bold">{faixa.label}</span>
                <span className="shrink-0 text-sm text-tinta-suave">
                  <span aria-hidden="true">{sinal.emoji}</span> {sinal.texto}
                </span>
              </span>

              {periodo && (
                <span className="mt-0.5 text-xs text-tinta-suave">
                  <span aria-hidden="true">{periodo.emojis}</span> {periodo.meses} ·{' '}
                  {periodo.descricao}
                </span>
              )}

              <span className="mt-1.5 flex items-center gap-2">
                {/* A barra é decorativa: o número ao lado é que é lido. */}
                <span
                  aria-hidden="true"
                  className="h-2.5 min-w-[2px] flex-1 overflow-hidden rounded-full bg-azul-100"
                >
                  <span
                    className="block h-full rounded-full bg-grafico"
                    style={{ width: `${largura}%` }}
                  />
                </span>
                <span className="w-10 shrink-0 text-right font-extrabold tabular-nums text-azul-900">
                  {faixa.unidades}
                </span>
              </span>
            </>
          );

          return (
            <li key={faixa.id}>
              {onEscolher ? (
                <button
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => onEscolher(ativo ? null : faixa.id)}
                  className={[
                    'flex min-h-[44px] w-full flex-col rounded-2xl px-3 py-2 text-left transition',
                    ativo ? 'bg-azul-100' : 'hover:bg-azul-50',
                  ].join(' ')}
                >
                  <span className="sr-only">
                    {faixa.label}: {pecas(faixa.unidades)}. {sinal.texto}.
                    {periodo ? ` ${periodo.meses}, ${periodo.descricao}.` : ''}
                  </span>
                  {conteudo}
                </button>
              ) : (
                <div className="flex flex-col px-3 py-2">
                  <span className="sr-only">
                    {faixa.label}: {pecas(faixa.unidades)}. {sinal.texto}.
                    {periodo ? ` ${periodo.meses}, ${periodo.descricao}.` : ''}
                  </span>
                  {conteudo}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {semTamanho && semTamanho.unidades > 0 && (
        <p className="mt-3 border-t border-azul-100 pt-3 text-sm text-tinta-suave">
          Mais {pecas(semTamanho.unidades)} de roupa sem tamanho indicado.
        </p>
      )}
    </section>
  );
}
