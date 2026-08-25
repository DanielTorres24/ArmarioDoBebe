/** Formatacoes partilhadas pela interface. */

/** "1 peça", "6 peças", "nenhuma peça". */
export const pecas = (unidades: number) =>
  unidades === 0 ? 'nenhuma peça' : plural(unidades, 'peça', 'peças');

export const plural = (valor: number, singular: string, plural_: string) =>
  `${valor} ${valor === 1 ? singular : plural_}`;

const data = new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'long' });

export const dataCurta = (iso: string) => data.format(new Date(iso));
