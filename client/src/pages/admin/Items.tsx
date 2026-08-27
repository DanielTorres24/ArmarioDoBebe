import { useCallback, useEffect, useState } from 'react';

import { Botao, Campo, EstadoVazio, Esqueleto, Etiqueta, MensagemDeErro, Modal, Toast, type Aviso } from '../../components/ui';
import ConfirmDialog from '../../components/ConfirmDialog';
import { adminApi } from '../../lib/api';
import { tomDoEstado, useCatalogo, useEstado } from '../../lib/catalogo';
import { PRIORIDADES, type AdminItem } from '../../types';

interface Formulario {
  name: string;
  categoryId: string;
  status: string;
  priority: string;
  ageRangeId: string;
  size: string;
  quantity: string;
  description: string;
  productUrl: string;
  isFeatured: boolean;
}

const vazio: Formulario = {
  name: '',
  categoryId: '',
  status: 'NEEDED',
  priority: '2',
  ageRangeId: '',
  size: '',
  quantity: '1',
  description: '',
  productUrl: '',
  isFeatured: false,
};

const deItem = (item: AdminItem): Formulario => ({
  name: item.name,
  categoryId: item.categoryId,
  status: item.status,
  priority: String(item.priority),
  ageRangeId: item.ageRangeId ?? '',
  size: item.size ?? '',
  quantity: String(item.quantity),
  description: item.description ?? '',
  productUrl: item.productUrl ?? '',
  isFeatured: item.isFeatured,
});

/** Gestão completa do armário: os pais mexem em tudo. */
export default function Items() {
  const { categories, ageRanges, statuses } = useCatalogo();
  const estadoDe = useEstado(statuses);

  const [items, setItems] = useState<AdminItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [filtros, setFiltros] = useState({ search: '', category: '', status: '' });
  const [aEditar, setAEditar] = useState<AdminItem | 'novo' | null>(null);
  const [aRemover, setARemover] = useState<AdminItem | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [aAjustar, setAAjustar] = useState<string | null>(null);

  /**
   * Aumenta ou diminui a quantidade de um artigo.
   * Nunca desce abaixo de 1: para deixar de existir, remove-se o artigo — é
   * uma decisão diferente, e tem confirmação própria.
   */
  const ajustarQuantidade = async (item: AdminItem, delta: number) => {
    const nova = item.quantity + delta;
    if (nova < 1 || nova > 999 || aAjustar) return;

    setAAjustar(item.id);
    // Atualiza já na lista; se o servidor recusar, repõe-se.
    setItems((atuais) => atuais.map((a) => (a.id === item.id ? { ...a, quantity: nova } : a)));

    try {
      await adminApi.editarArtigo(item.id, { quantity: nova });
    } catch (problema) {
      setItems((atuais) => atuais.map((a) => (a.id === item.id ? { ...a, quantity: item.quantity } : a)));
      setAviso({
        tipo: 'erro',
        mensagem: problema instanceof Error ? problema.message : 'Não foi possível alterar a quantidade.',
      });
    } finally {
      setAAjustar(null);
    }
  };

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      setItems(await adminApi.items(filtros));
    } catch (problema) {
      setErro(problema instanceof Error ? problema.message : 'Não foi possível carregar.');
    } finally {
      setCarregando(false);
    }
  }, [filtros]);

  useEffect(() => {
    const temporizador = setTimeout(() => void carregar(), filtros.search ? 250 : 0);
    return () => clearTimeout(temporizador);
  }, [carregar, filtros.search]);

  return (
    <>
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl">Armário</h1>
          <p className="mt-1 text-sm text-tinta-suave">Cria, edita e remove qualquer artigo.</p>
        </div>
        <Botao variante="primario" onClick={() => setAEditar('novo')}>
          + Novo artigo
        </Botao>
      </header>

      <section className="cartao mb-4 flex flex-wrap gap-2.5 p-3">
        <div className="min-w-[200px] flex-[2_1_200px]">
          <label className="sr-only" htmlFor="admin-pesquisa">Procurar</label>
          <input
            id="admin-pesquisa"
            type="search"
            className="campo"
            value={filtros.search}
            placeholder="Procurar por nome, descrição ou quem adicionou..."
            onChange={(evento) => setFiltros({ ...filtros, search: evento.target.value })}
          />
        </div>
        <div className="min-w-[160px] flex-1">
          <label className="sr-only" htmlFor="admin-categoria">Categoria</label>
          <select
            id="admin-categoria"
            className="campo"
            value={filtros.category}
            onChange={(evento) => setFiltros({ ...filtros, category: evento.target.value })}
          >
            <option value="">Todas as categorias</option>
            {categories.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.icon} {categoria.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[150px] flex-1">
          <label className="sr-only" htmlFor="admin-estado">Estado</label>
          <select
            id="admin-estado"
            className="campo"
            value={filtros.status}
            onChange={(evento) => setFiltros({ ...filtros, status: evento.target.value })}
          >
            <option value="">Todos os estados</option>
            {statuses.map((estado) => (
              <option key={estado.status} value={estado.status}>
                {estado.icon} {estado.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {carregando && (
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map((indice) => (
            <Esqueleto key={indice} className="h-20 w-full rounded-card" />
          ))}
        </div>
      )}

      {!carregando && erro && <EstadoVazio emoji="😕" titulo="Não foi possível carregar" texto={erro} />}

      {!carregando && !erro && items.length === 0 && (
        <EstadoVazio emoji="📦" titulo="Nenhum artigo encontrado" texto="Cria o primeiro ou limpa os filtros.">
          <Botao variante="primario" onClick={() => setAEditar('novo')}>
            + Novo artigo
          </Botao>
        </EstadoVazio>
      )}

      {!carregando && !erro && items.length > 0 && (
        <ul className="flex flex-col gap-2.5">
          {items.map((item) => {
            const estado = estadoDe(item.status);
            const reservasAtivas = item.reservations.filter((r) => r.status !== 'CANCELLED');

            return (
              <li key={item.id} className="cartao flex flex-wrap items-start gap-3 p-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-azul-100 text-2xl">
                  {item.category?.icon ?? '💙'}
                </span>

                <div className="min-w-[180px] flex-1">
                  <h2 className="text-base [overflow-wrap:anywhere]">{item.name}</h2>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Etiqueta tom={tomDoEstado(estado.color)}>
                      {estado.icon} {estado.label}
                    </Etiqueta>
                    {item.category && <Etiqueta tom="neutro">{item.category.name}</Etiqueta>}
                    {item.ageRange && <Etiqueta tom="neutro">{item.ageRange.label}</Etiqueta>}
                    {item.isFeatured && <Etiqueta tom="ambar">★ Destaque</Etiqueta>}
                    {item.status === 'WANTED' && <Etiqueta tom="ambar">Prioridade {item.priority}</Etiqueta>}
                    {reservasAtivas.length > 0 && (
                      <Etiqueta tom="verde">🎁 {reservasAtivas[0]!.guestName}</Etiqueta>
                    )}
                  </div>
                  {item.ownerName && (
                    <p className="mt-1 text-xs text-tinta-suave">Adicionado por {item.ownerName}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 rounded-pill border border-azul-200 bg-white p-1">
                    <button
                      type="button"
                      className="grid h-9 w-9 place-items-center rounded-full text-lg font-extrabold text-azul-700 transition hover:bg-azul-50 disabled:opacity-40"
                      onClick={() => void ajustarQuantidade(item, -1)}
                      disabled={item.quantity <= 1 || aAjustar === item.id}
                      aria-label={`Diminuir a quantidade de ${item.name}`}
                    >
                      −
                    </button>
                    <span
                      className="min-w-[2ch] text-center font-extrabold tabular-nums"
                      aria-live="polite"
                      aria-label={`${item.quantity} unidades de ${item.name}`}
                    >
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="grid h-9 w-9 place-items-center rounded-full text-lg font-extrabold text-azul-700 transition hover:bg-azul-50 disabled:opacity-40"
                      onClick={() => void ajustarQuantidade(item, 1)}
                      disabled={item.quantity >= 999 || aAjustar === item.id}
                      aria-label={`Aumentar a quantidade de ${item.name}`}
                    >
                      +
                    </button>
                  </div>

                  <Botao variante="suave" tamanho="pequeno" onClick={() => setAEditar(item)}>
                    Editar
                  </Botao>
                  <Botao variante="perigo" tamanho="pequeno" onClick={() => setARemover(item)}>
                    Remover
                  </Botao>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {aEditar && (
        <FormularioDeArtigo
          item={aEditar === 'novo' ? undefined : aEditar}
          categorias={categories}
          faixas={ageRanges}
          estados={statuses}
          onFechar={() => setAEditar(null)}
          onGuardado={(criado) => {
            setAEditar(null);
            setAviso({ tipo: 'sucesso', mensagem: criado ? 'Artigo criado.' : 'Artigo atualizado.' });
            void carregar();
          }}
        />
      )}

      {aRemover && (
        <ConfirmDialog
          titulo="Remover artigo?"
          mensagem={
            <>
              Queres mesmo remover <strong>{aRemover.name}</strong>? As reservas associadas também
              desaparecem.
            </>
          }
          onFechar={() => setARemover(null)}
          onConfirmar={async () => {
            await adminApi.apagarArtigo(aRemover.id);
            setARemover(null);
            setAviso({ tipo: 'sucesso', mensagem: 'Artigo removido.' });
            void carregar();
          }}
        />
      )}

      <Toast aviso={aviso} onFechar={() => setAviso(null)} />
    </>
  );
}

/* ---------------------------- formulário do artigo ---------------------------- */

function FormularioDeArtigo({
  item,
  categorias,
  faixas,
  estados,
  onGuardado,
  onFechar,
}: {
  item?: AdminItem;
  categorias: { id: string; name: string; icon: string }[];
  faixas: { id: string; label: string }[];
  estados: { status: string; label: string; icon: string }[];
  onGuardado: (criado: boolean) => void;
  onFechar: () => void;
}) {
  const [form, setForm] = useState<Formulario>(() => (item ? deItem(item) : vazio));
  const [erros, setErros] = useState<Partial<Record<keyof Formulario, string>>>({});
  const [erroGeral, setErroGeral] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const mudar =
    (campo: keyof Formulario) =>
    (evento: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const alvo = evento.target;
      const valor = alvo instanceof HTMLInputElement && alvo.type === 'checkbox' ? alvo.checked : alvo.value;
      setForm((anterior) => ({ ...anterior, [campo]: valor }));
      setErros((anterior) => ({ ...anterior, [campo]: undefined }));
    };

  const validar = () => {
    const novos: Partial<Record<keyof Formulario, string>> = {};
    if (!form.name.trim()) novos.name = 'Escreve o nome do artigo.';
    if (!form.categoryId) novos.categoryId = 'Escolhe uma categoria.';

    const quantidade = Number(form.quantity);
    if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 999) {
      novos.quantity = 'A quantidade tem de ser entre 1 e 999.';
    }


    setErros(novos);
    return Object.keys(novos).length === 0;
  };

  const submeter = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setErroGeral('');
    if (!validar()) return;

    setOcupado(true);
    try {
      const dados = {
        name: form.name.trim(),
        categoryId: form.categoryId,
        status: form.status,
        priority: Number(form.priority),
        ageRangeId: form.ageRangeId || null,
        size: form.size.trim(),
        quantity: Number(form.quantity),
        description: form.description.trim(),
        productUrl: form.productUrl.trim(),
        isFeatured: form.isFeatured,
      };

      if (item) await adminApi.editarArtigo(item.id, dados);
      else await adminApi.criarArtigo(dados);

      onGuardado(!item);
    } catch (problema) {
      setErroGeral(problema instanceof Error ? problema.message : 'Não foi possível guardar.');
      setOcupado(false);
    }
  };

  return (
    <Modal titulo={item ? 'Editar artigo' : 'Novo artigo'} onFechar={onFechar} largura="max-w-2xl">
      <form onSubmit={submeter} noValidate>
        <Campo id="f-nome" label="Nome *" erro={erros.name}>
          <input id="f-nome" className="campo" value={form.name} onChange={mudar('name')} aria-invalid={!!erros.name} />
        </Campo>

        <div className="flex flex-wrap gap-3">
          <div className="min-w-[180px] flex-1">
            <Campo id="f-categoria" label="Categoria *" erro={erros.categoryId}>
              <select id="f-categoria" className="campo" value={form.categoryId} onChange={mudar('categoryId')} aria-invalid={!!erros.categoryId}>
                <option value="">Escolhe...</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.icon} {categoria.name}
                  </option>
                ))}
              </select>
            </Campo>
          </div>

          <div className="min-w-[180px] flex-1">
            <Campo id="f-estado" label="Estado *">
              <select id="f-estado" className="campo" value={form.status} onChange={mudar('status')}>
                {estados.map((estado) => (
                  <option key={estado.status} value={estado.status}>
                    {estado.icon} {estado.label}
                  </option>
                ))}
              </select>
            </Campo>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="min-w-[180px] flex-1">
            <Campo id="f-prioridade" label="Prioridade">
              <select id="f-prioridade" className="campo" value={form.priority} onChange={mudar('priority')}>
                {PRIORIDADES.map((prioridade) => (
                  <option key={prioridade.valor} value={prioridade.valor}>
                    {prioridade.label}
                  </option>
                ))}
              </select>
            </Campo>
          </div>

          <div className="min-w-[150px] flex-1">
            <Campo id="f-faixa" label="Faixa etária">
              <select id="f-faixa" className="campo" value={form.ageRangeId} onChange={mudar('ageRangeId')}>
                <option value="">Não se aplica</option>
                {faixas.map((faixa) => (
                  <option key={faixa.id} value={faixa.id}>
                    {faixa.label}
                  </option>
                ))}
              </select>
            </Campo>
          </div>

          <div className="w-[110px] shrink-0">
            <Campo id="f-quantidade" label="Quantidade" erro={erros.quantity}>
              <input id="f-quantidade" className="campo" type="number" min={1} max={999} value={form.quantity} onChange={mudar('quantity')} aria-invalid={!!erros.quantity} />
            </Campo>
          </div>
        </div>

        <Campo id="f-tamanho" label="Tamanho">
          <input id="f-tamanho" className="campo" value={form.size} placeholder="Ex.: 6-9 meses" onChange={mudar('size')} />
        </Campo>

        <Campo id="f-descricao" label="Descrição">
          <textarea id="f-descricao" className="campo" rows={3} value={form.description} onChange={mudar('description')} />
        </Campo>

        <Campo id="f-link" label="Link para um produto de referência" dica="Opcional — ajuda quem não sabe o que procurar.">
          <input id="f-link" className="campo" type="url" placeholder="https://..." value={form.productUrl} onChange={mudar('productUrl')} />
        </Campo>

        <label className="mt-1 flex cursor-pointer items-center gap-2.5 text-sm">
          <input type="checkbox" className="h-5 w-5 accent-azul-600" checked={form.isFeatured} onChange={mudar('isFeatured')} />
          <span>Mostrar em destaque na página inicial</span>
        </label>

        {erroGeral && <MensagemDeErro>{erroGeral}</MensagemDeErro>}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Botao type="button" variante="contorno" onClick={onFechar} disabled={ocupado}>
            Cancelar
          </Botao>
          <Botao type="submit" variante="primario" disabled={ocupado}>
            {ocupado ? 'A guardar...' : 'Guardar'}
          </Botao>
        </div>
      </form>
    </Modal>
  );
}
