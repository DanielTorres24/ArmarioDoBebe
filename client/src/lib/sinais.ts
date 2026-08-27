/**
 * A resposta a "já tem muitos disto?".
 *
 * O mesmo critério em todo o lado — no gráfico da roupa, nas categorias e no
 * verificador — para não haver dois sítios do site a dizer coisas diferentes
 * sobre o mesmo número.
 */

export interface Sinal {
  emoji: string;
  texto: string;
  /** Classes de fundo/texto para quando o sinal aparece em destaque. */
  tom: string;
}

export function sinalDeQuantidade(unidades: number, pedidos = 0): Sinal {
  if (unidades === 0 && pedidos > 0) {
    return { emoji: '⭐', texto: 'Pedido dos pais', tom: 'bg-estado-ambar-fundo text-estado-ambar' };
  }
  if (unidades === 0) {
    return { emoji: '🟢', texto: 'Faz falta', tom: 'bg-estado-verde-fundo text-estado-verde' };
  }
  if (unidades <= 2) {
    return { emoji: '🟠', texto: 'Tem pouco', tom: 'bg-estado-ambar-fundo text-estado-ambar' };
  }
  if (unidades <= 5) {
    return { emoji: '🟡', texto: 'Tem alguns', tom: 'bg-estado-amarelo-fundo text-estado-amarelo' };
  }
  return { emoji: '🔴', texto: 'Já tem bastante', tom: 'bg-estado-rosa-fundo text-estado-rosa' };
}
