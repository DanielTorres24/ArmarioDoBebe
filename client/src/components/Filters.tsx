import { useCatalogo } from '../lib/catalogo';
import { Botao } from './ui';
import { PRIORIDADES } from '../types';

export interface EstadoDosFiltros {
  search: string;
  category: string;
  status: string;
  ageRange: string;
  priority: string;
  reserved: string;
  mine: boolean;
  sort: 'newest' | 'oldest' | 'priority' | 'name';
}

export const FILTROS_INICIAIS: EstadoDosFiltros = {
  search: '',
  category: '',
  status: '',
  ageRange: '',
  priority: '',
  reserved: '',
  mine: false,
  sort: 'newest',
};

/**
 * Uma só barra de filtros por cima de tudo o que ela filtra.
 * Os filtros avançados ficam recolhidos para não pesar no telemóvel.
 */
export default function Filters({
  valor,
  onMudar,
  mostrarEstado = true,
  mostrarAvancados = true,
}: {
  valor: EstadoDosFiltros;
  onMudar: (novo: EstadoDosFiltros) => void;
  mostrarEstado?: boolean;
  mostrarAvancados?: boolean;
}) {
  const { categories, ageRanges, statuses, convidado } = useCatalogo();

  const mudar =
    (campo: keyof EstadoDosFiltros) =>
    (evento: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onMudar({ ...valor, [campo]: evento.target.value });

  const algumFiltroAtivo =
    valor.search !== '' ||
    valor.category !== '' ||
    valor.status !== '' ||
    valor.ageRange !== '' ||
    valor.priority !== '' ||
    valor.reserved !== '' ||
    valor.mine;

  return (
    <section className="cartao mb-4 flex flex-col gap-2.5 p-3 sm:p-4" aria-label="Pesquisar e filtrar">
      <div className="relative">
        <label className="sr-only" htmlFor="pesquisa">
          Procurar
        </label>
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true">
          🔍
        </span>
        <input
          id="pesquisa"
          type="search"
          className="campo pl-10"
          value={valor.search}
          placeholder="Procurar..."
          onChange={mudar('search')}
        />
      </div>

      <div className="flex flex-wrap gap-2.5">
        <div className="min-w-[190px] flex-[1_1_190px]">
          <label className="sr-only" htmlFor="filtro-categoria">
            Categoria
          </label>
          <select id="filtro-categoria" className="campo" value={valor.category} onChange={mudar('category')}>
            <option value="">Todas as categorias</option>
            {categories.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.icon} {categoria.name}
              </option>
            ))}
          </select>
        </div>

        {mostrarEstado && (
          <div className="min-w-[160px] flex-[1_1_160px]">
            <label className="sr-only" htmlFor="filtro-estado">
              Estado
            </label>
            <select id="filtro-estado" className="campo" value={valor.status} onChange={mudar('status')}>
              <option value="">Todos os estados</option>
              {statuses.map((estado) => (
                <option key={estado.status} value={estado.status}>
                  {estado.icon} {estado.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="min-w-[150px] flex-[1_1_150px]">
          <label className="sr-only" htmlFor="filtro-faixa">
            Faixa etária
          </label>
          <select id="filtro-faixa" className="campo" value={valor.ageRange} onChange={mudar('ageRange')}>
            <option value="">Todas as idades</option>
            {ageRanges.map((faixa) => (
              <option key={faixa.id} value={faixa.id}>
                {faixa.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {mostrarAvancados && (
        <details className="group">
          <summary className="cursor-pointer list-none text-sm font-bold text-azul-700 underline underline-offset-2">
            Mais filtros
          </summary>

          <div className="mt-2.5 flex flex-wrap gap-2.5">
            <div className="min-w-[170px] flex-[1_1_170px]">
              <label className="sr-only" htmlFor="filtro-prioridade">
                Prioridade
              </label>
              <select id="filtro-prioridade" className="campo" value={valor.priority} onChange={mudar('priority')}>
                <option value="">Qualquer prioridade</option>
                {PRIORIDADES.map((prioridade) => (
                  <option key={prioridade.valor} value={prioridade.valor}>
                    {prioridade.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-[170px] flex-[1_1_170px]">
              <label className="sr-only" htmlFor="filtro-reservado">
                Disponibilidade
              </label>
              <select id="filtro-reservado" className="campo" value={valor.reserved} onChange={mudar('reserved')}>
                <option value="">Reservados e disponíveis</option>
                <option value="false">Só os disponíveis</option>
                <option value="true">Só os já reservados</option>
              </select>
            </div>

            <div className="min-w-[170px] flex-[1_1_170px]">
              <label className="sr-only" htmlFor="filtro-ordem">
                Ordenar
              </label>
              <select id="filtro-ordem" className="campo" value={valor.sort} onChange={mudar('sort')}>
                <option value="newest">Mais recentes</option>
                <option value="oldest">Mais antigos</option>
                <option value="priority">Prioridade</option>
                <option value="name">Nome</option>
              </select>
            </div>
          </div>
        </details>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        {convidado ? (
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-tinta-suave">
            <input
              type="checkbox"
              className="h-5 w-5 accent-azul-600"
              checked={valor.mine}
              onChange={(evento) => onMudar({ ...valor, mine: evento.target.checked })}
            />
            <span>Só os que eu acrescentei</span>
          </label>
        ) : (
          <span />
        )}

        {algumFiltroAtivo && (
          <Botao type="button" variante="ligacao" onClick={() => onMudar(FILTROS_INICIAIS)} className="text-sm">
            Limpar filtros
          </Botao>
        )}
      </div>
    </section>
  );
}
