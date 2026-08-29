/**
 * A resposta a "já tem muitos disto?".
 *
 * Há duas escalas, porque a mesma quantidade não quer dizer o mesmo em
 * contextos diferentes: 6 bibes são muitos bibes, mas 6 peças de roupa para
 * cobrir três meses inteiros são poucas. Sem esta distinção, um tamanho com 6
 * peças aparecia a vermelho e afastava quem quisesse oferecer roupa desse
 * tamanho — o contrário do que o site existe para fazer.
 */

export interface Sinal {
  emoji: string;
  texto: string;
  /** Classes de fundo/texto para quando o sinal aparece em destaque. */
  tom: string;
}

const PEDIDO: Sinal = {
  emoji: '⭐',
  texto: 'Pedido dos pais',
  tom: 'bg-estado-ambar-fundo text-estado-ambar',
};
const FALTA: Sinal = {
  emoji: '🟢',
  texto: 'Faz falta',
  tom: 'bg-estado-verde-fundo text-estado-verde',
};
const POUCO: Sinal = {
  emoji: '🟠',
  texto: 'Tem pouco',
  tom: 'bg-estado-ambar-fundo text-estado-ambar',
};
const ALGUNS: Sinal = {
  emoji: '🟡',
  texto: 'Tem alguns',
  tom: 'bg-estado-amarelo-fundo text-estado-amarelo',
};
const BASTANTE: Sinal = {
  emoji: '🔴',
  texto: 'Já tem bastante',
  tom: 'bg-estado-rosa-fundo text-estado-rosa',
};

/**
 * Onde acaba cada nível.
 *
 * `artigo` conta um artigo concreto ou uma categoria — meia dúzia já é bastante.
 * `tamanho` conta um escalão de meses inteiro, onde é preciso muito mais para
 * se poder dizer que está tratado.
 */
const ESCALAS = {
  artigo: { pouco: 2, alguns: 5 },
  tamanho: { pouco: 2, alguns: 20 },
} as const;

export type Escala = keyof typeof ESCALAS;

export function sinalDeQuantidade(unidades: number, pedidos = 0, escala: Escala = 'artigo'): Sinal {
  if (unidades === 0) return pedidos > 0 ? PEDIDO : FALTA;

  const limites = ESCALAS[escala];
  if (unidades <= limites.pouco) return POUCO;
  if (unidades <= limites.alguns) return ALGUNS;
  return BASTANTE;
}
