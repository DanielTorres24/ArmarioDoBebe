import { useEffect, useRef, useState } from 'react';

import { Etiqueta, juntar } from './ui';
import { api } from '../lib/api';
import { pecas } from '../lib/format';
import { sinalDeQuantidade } from '../lib/sinais';
import type { Item } from '../types';

const ATALHOS = ['body', 'meias', 'fralda', 'casaco', 'livro'];

/**
 * "Estás a pensar oferecer alguma coisa?"
 *
 * Escreve-se o que se tem em mente e o site responde já se o Diogo tem muitos
 * disso. É a pergunta que trouxe a pessoa ao site, por isso vem no topo.
 */
export default function Verificador() {
  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState<Item[] | null>(null);
  const [aProcurar, setAProcurar] = useState(false);
  const pedidoAtual = useRef(0);

  useEffect(() => {
    const procurado = termo.trim();

    if (procurado.length < 2) {
      setResultados(null);
      setAProcurar(false);
      return;
    }

    setAProcurar(true);
    // Espera que a pessoa pare de escrever, para não disparar um pedido por tecla.
    const temporizador = setTimeout(() => {
      const meuPedido = ++pedidoAtual.current;

      api
        .items({ search: procurado })
        .then((lista) => {
          // Uma resposta atrasada de uma procura antiga não pode sobrepor-se.
          if (meuPedido === pedidoAtual.current) setResultados(lista);
        })
        .catch(() => {
          if (meuPedido === pedidoAtual.current) setResultados([]);
        })
        .finally(() => {
          if (meuPedido === pedidoAtual.current) setAProcurar(false);
        });
    }, 350);

    return () => clearTimeout(temporizador);
  }, [termo]);

  const posse = (item: Item) => item.status === 'OWNED' || item.status === 'SOME';
  const unidades = (resultados ?? [])
    .filter(posse)
    .reduce((soma, item) => soma + item.quantity, 0);
  const pedidos = (resultados ?? []).filter((item) => !posse(item)).length;

  const sinal = sinalDeQuantidade(unidades, pedidos);
  const semNada = resultados !== null && resultados.length === 0;

  const explicacao = semNada
    ? 'O Diogo não tem nada assim no armário — é provável que faça falta. Boa escolha!'
    : unidades === 0 && pedidos > 0
      ? 'Os pais pediram isto e ainda não têm nenhum. Seria muito bem-vindo.'
      : unidades === 0
        ? 'Não há nada disto no armário.'
        : unidades <= 5
          ? 'Não é de mais, mas talvez haja algo que dê mais jeito. Vê o que faz falta.'
          : 'Está bem servido — o melhor é escolheres outra coisa.';

  return (
    <section className="cartao p-4 sm:p-5" aria-labelledby="t-verificador">
      <h2 id="t-verificador" className="text-lg">
        🔎 Estás a pensar oferecer alguma coisa?
      </h2>
      <p className="mt-1 text-sm text-tinta-suave">
        Escreve o que tens em mente e dizemos-te logo se o Diogo já tem muitos.
      </p>

      <label className="sr-only" htmlFor="verificador">
        O que estás a pensar oferecer?
      </label>
      <input
        id="verificador"
        type="search"
        autoComplete="off"
        className="campo mt-3"
        placeholder="Ex.: body, manta, livro, chupeta..."
        value={termo}
        onChange={(evento) => setTermo(evento.target.value)}
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-sm text-tinta-suave">Experimenta:</span>
        {ATALHOS.map((atalho) => (
          <button
            key={atalho}
            type="button"
            onClick={() => setTermo(atalho)}
            className="min-h-[36px] rounded-pill border border-azul-200 bg-white px-3 py-1 text-sm font-bold text-tinta transition hover:bg-azul-50"
          >
            {atalho}
          </button>
        ))}
      </div>

      <div role="status" aria-live="polite" className="mt-4">
        {aProcurar && <p className="text-sm text-tinta-suave">A procurar...</p>}

        {!aProcurar && resultados !== null && (
          <div className={juntar('flex gap-3 rounded-card p-4', semNada ? 'bg-estado-verde-fundo' : sinal.tom)}>
            <span aria-hidden="true" className="text-2xl leading-none">
              {semNada ? '✅' : sinal.emoji}
            </span>
            <div>
              <p className="font-extrabold">
                {semNada
                  ? 'Não encontrámos nada parecido'
                  : unidades === 0
                    ? sinal.texto
                    : `Já tem ${pecas(unidades)} disto`}
              </p>
              <p className="mt-0.5 text-sm">{explicacao}</p>
            </div>
          </div>
        )}
      </div>

      {!aProcurar && resultados !== null && resultados.length > 0 && (
        <ul className="mt-3 space-y-2">
          {resultados.slice(0, 6).map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-azul-50 px-3 py-2"
            >
              <span className="font-bold [overflow-wrap:anywhere]">
                <span aria-hidden="true">{item.category?.icon ?? '💙'}</span> {item.name}
              </span>
              <span className="flex flex-wrap items-center gap-1.5">
                {item.ageRange && <Etiqueta tom="neutro">{item.ageRange.label}</Etiqueta>}
                <Etiqueta tom="neutro">{posse(item) ? `${item.quantity}×` : 'pedido dos pais'}</Etiqueta>
              </span>
            </li>
          ))}
          {resultados.length > 6 && (
            <li className="px-3 text-sm text-tinta-suave">
              e mais {resultados.length - 6} artigos parecidos.
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
