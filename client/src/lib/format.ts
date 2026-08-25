/** Formatacoes partilhadas pela interface. */

const moeda = new Intl.NumberFormat('pt-PT', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

/** "20€ – 45€", "a partir de 50€", "até 20€" ou nada. */
export function intervaloDePreco(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null) {
    return min === max ? moeda.format(min) : `${moeda.format(min)} – ${moeda.format(max)}`;
  }
  if (min != null) return `a partir de ${moeda.format(min)}`;
  return `até ${moeda.format(max as number)}`;
}

export const plural = (valor: number, singular: string, plural_: string) =>
  `${valor} ${valor === 1 ? singular : plural_}`;

const data = new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'long' });

export const dataCurta = (iso: string) => data.format(new Date(iso));
