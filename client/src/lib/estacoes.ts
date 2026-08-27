/**
 * Em que altura do ano o bebé estará em cada faixa de meses.
 *
 * Serve para quem vai oferecer roupa: "6-9 meses" não diz nada sobre o tempo
 * que vai fazer, mas "maio a agosto, verão" diz. Tudo é calculado a partir da
 * data prevista do parto, para continuar certo se essa data mudar.
 */

export interface Estacao {
  chave: 'inverno' | 'primavera' | 'verao' | 'outono';
  nome: string;
  emoji: string;
}

const INVERNO: Estacao = { chave: 'inverno', nome: 'inverno', emoji: '❄️' };
const PRIMAVERA: Estacao = { chave: 'primavera', nome: 'primavera', emoji: '🌸' };
const VERAO: Estacao = { chave: 'verao', nome: 'verão', emoji: '☀️' };
const OUTONO: Estacao = { chave: 'outono', nome: 'outono', emoji: '🍂' };

/** Início de cada estação no hemisfério norte: [mês (0-11), dia]. */
const LIMITES: [number, number, Estacao][] = [
  [2, 21, PRIMAVERA],
  [5, 21, VERAO],
  [8, 23, OUTONO],
  [11, 21, INVERNO],
];

/** A estação de um dia concreto. */
export function estacaoDe(data: Date): Estacao {
  const mes = data.getMonth();
  const dia = data.getDate();

  let atual = INVERNO; // antes de 21 de março ainda é inverno
  for (const [m, d, estacao] of LIMITES) {
    if (mes > m || (mes === m && dia >= d)) atual = estacao;
  }
  return atual;
}

/** Soma meses a uma data sem "transbordar" (31 de janeiro + 1 mês = 28/29 de fevereiro). */
function somarMeses(data: Date, meses: number): Date {
  const resultado = new Date(data.getTime());
  const diaOriginal = resultado.getDate();
  resultado.setDate(1);
  resultado.setMonth(resultado.getMonth() + meses);
  const ultimoDia = new Date(resultado.getFullYear(), resultado.getMonth() + 1, 0).getDate();
  resultado.setDate(Math.min(diaOriginal, ultimoDia));
  return resultado;
}

const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export interface PeriodoDoAno {
  /** As estações que o intervalo atravessa, da mais para a menos presente. */
  estacoes: Estacao[];
  /** "nov – fev" ou "a partir de nov". */
  meses: string;
  /** "outono e inverno" — pronto a ler. */
  descricao: string;
  /** Emojis das estações, pela ordem em que acontecem. */
  emojis: string;
}

/**
 * Que altura do ano corresponde a uma faixa de meses.
 * Devolve null quando faltam dados (sem data prevista, ou faixa sem meses).
 */
export function periodoDoAno(
  dataPrevista: string | Date | null | undefined,
  mesesDe: number | null | undefined,
  mesesAte: number | null | undefined,
): PeriodoDoAno | null {
  if (!dataPrevista || mesesDe == null) return null;

  const nascimento = new Date(dataPrevista);
  if (Number.isNaN(nascimento.getTime())) return null;

  const inicio = somarMeses(nascimento, mesesDe);
  // Sem limite superior (12+ meses), olha-se para os seis meses seguintes.
  const fim = somarMeses(nascimento, mesesAte ?? mesesDe + 6);

  // Conta os dias passados em cada estação, amostrando dia a dia. O intervalo
  // é de meses, portanto são poucas centenas de iterações.
  const dias = new Map<Estacao['chave'], { estacao: Estacao; dias: number; primeiro: number }>();
  let indice = 0;

  for (let d = new Date(inicio.getTime()); d < fim; d.setDate(d.getDate() + 1), indice++) {
    const estacao = estacaoDe(d);
    const registo = dias.get(estacao.chave);
    if (registo) registo.dias += 1;
    else dias.set(estacao.chave, { estacao, dias: 1, primeiro: indice });
  }

  if (dias.size === 0) return null;

  const total = indice;
  const porOrdemNoTempo = [...dias.values()].sort((a, b) => a.primeiro - b.primeiro);

  // Só se mencionam as estações com peso real; uma passagem de duas semanas
  // por uma estação não ajuda ninguém a escolher roupa.
  const relevantes = porOrdemNoTempo.filter((r) => r.dias / total >= 0.2);
  const escolhidas = (relevantes.length > 0 ? relevantes : porOrdemNoTempo).slice(0, 2);

  const nomes = escolhidas.map((r) => r.estacao.nome);
  const descricao = nomes.length === 2 ? `${nomes[0]} e ${nomes[1]}` : nomes[0]!;

  const mesInicio = MESES_CURTOS[inicio.getMonth()]!;
  const mesFim = MESES_CURTOS[fim.getMonth()]!;
  const meses = mesesAte == null ? `a partir de ${mesInicio}` : `${mesInicio} – ${mesFim}`;

  return {
    estacoes: escolhidas.map((r) => r.estacao),
    meses,
    descricao,
    emojis: escolhidas.map((r) => r.estacao.emoji).join(''),
  };
}
