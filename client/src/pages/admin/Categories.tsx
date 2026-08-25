import { useCallback, useEffect, useState } from 'react';

import { Botao, Campo, Esqueleto, Etiqueta, MensagemDeErro, Modal, Toast, type Aviso } from '../../components/ui';
import ConfirmDialog from '../../components/ConfirmDialog';
import { adminApi } from '../../lib/api';
import { tomDoEstado, useCatalogo } from '../../lib/catalogo';
import type { AgeRange, Category, StatusSetting } from '../../types';

/**
 * Categorias, faixas etárias e estados — as três listas que dão forma ao resto
 * da aplicação. Ficam juntas porque são todas configuração da mesma natureza.
 */
export default function Categories() {
  const { recarregar } = useCatalogo();

  const [categorias, setCategorias] = useState<Category[]>([]);
  const [faixas, setFaixas] = useState<AgeRange[]>([]);
  const [estados, setEstados] = useState<StatusSetting[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  const [editarCategoria, setEditarCategoria] = useState<Category | 'nova' | null>(null);
  const [removerCategoria, setRemoverCategoria] = useState<Category | null>(null);
  const [editarFaixa, setEditarFaixa] = useState<AgeRange | 'nova' | null>(null);
  const [removerFaixa, setRemoverFaixa] = useState<AgeRange | null>(null);
  const [editarEstado, setEditarEstado] = useState<StatusSetting | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [c, f, e] = await Promise.all([
      adminApi.categories(),
      adminApi.ageRanges(),
      adminApi.statuses(),
    ]);
    setCategorias(c);
    setFaixas(f);
    setEstados(e);
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const depoisDeGuardar = async (mensagem: string) => {
    setAviso({ tipo: 'sucesso', mensagem });
    await carregar();
    // As listas alimentam toda a aplicação — o catálogo público também recarrega.
    await recarregar();
  };

  if (carregando) {
    return (
      <div className="flex flex-col gap-3">
        <Esqueleto className="h-40 w-full rounded-card" />
        <Esqueleto className="h-40 w-full rounded-card" />
      </div>
    );
  }

  return (
    <>
      <header className="mb-5">
        <h1 className="text-2xl">Categorias e listas</h1>
        <p className="mt-1 text-sm text-tinta-suave">
          O que aqui defines aparece nos filtros e nos formulários de toda a aplicação.
        </p>
      </header>

      {/* ------------------------------ Categorias ----------------------------- */}
      <section className="cartao mb-4 p-5" aria-labelledby="t-categorias">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 id="t-categorias" className="text-lg">
            🏷️ Categorias
          </h2>
          <Botao variante="primario" tamanho="pequeno" onClick={() => setEditarCategoria('nova')}>
            + Nova categoria
          </Botao>
        </div>

        <ul className="flex flex-col gap-2">
          {categorias.map((categoria) => (
            <li key={categoria.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-azul-50 px-3 py-2.5">
              <span className="text-2xl" aria-hidden="true">
                {categoria.icon}
              </span>
              <span className="min-w-[120px] flex-1 font-bold [overflow-wrap:anywhere]">{categoria.name}</span>
              <Etiqueta tom="neutro">ordem {categoria.sortOrder}</Etiqueta>
              {!categoria.isActive && <Etiqueta tom="rosa">oculta</Etiqueta>}
              <Etiqueta tom="neutro">{categoria._count?.items ?? 0} artigos</Etiqueta>
              <div className="flex gap-2">
                <Botao variante="suave" tamanho="pequeno" onClick={() => setEditarCategoria(categoria)}>
                  Editar
                </Botao>
                <Botao variante="perigo" tamanho="pequeno" onClick={() => setRemoverCategoria(categoria)}>
                  Remover
                </Botao>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------------------------- Faixas etárias --------------------------- */}
      <section className="cartao mb-4 p-5" aria-labelledby="t-faixas">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 id="t-faixas" className="text-lg">
            📏 Faixas etárias
          </h2>
          <Botao variante="primario" tamanho="pequeno" onClick={() => setEditarFaixa('nova')}>
            + Nova faixa
          </Botao>
        </div>

        <ul className="flex flex-col gap-2">
          {faixas.map((faixa) => (
            <li key={faixa.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-azul-50 px-3 py-2.5">
              <span className="min-w-[120px] flex-1 font-bold">{faixa.label}</span>
              <Etiqueta tom="neutro">ordem {faixa.sortOrder}</Etiqueta>
              {!faixa.isActive && <Etiqueta tom="rosa">oculta</Etiqueta>}
              <Etiqueta tom="neutro">{faixa._count?.items ?? 0} artigos</Etiqueta>
              <div className="flex gap-2">
                <Botao variante="suave" tamanho="pequeno" onClick={() => setEditarFaixa(faixa)}>
                  Editar
                </Botao>
                <Botao variante="perigo" tamanho="pequeno" onClick={() => setRemoverFaixa(faixa)}>
                  Remover
                </Botao>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* -------------------------------- Estados ------------------------------ */}
      <section className="cartao p-5" aria-labelledby="t-estados">
        <h2 id="t-estados" className="mb-1 text-lg">
          🚦 Estados dos artigos
        </h2>
        <p className="mb-4 text-sm text-tinta-suave">
          Os quatro estados são fixos, mas o nome, o ícone, a cor e a explicação são teus.
        </p>

        <ul className="flex flex-col gap-2">
          {estados.map((estado) => (
            <li key={estado.status} className="flex flex-wrap items-center gap-3 rounded-2xl bg-azul-50 px-3 py-2.5">
              <Etiqueta tom={tomDoEstado(estado.color)}>
                {estado.icon} {estado.label}
              </Etiqueta>
              <span className="min-w-[160px] flex-1 text-sm text-tinta-suave">{estado.description}</span>
              <Botao variante="suave" tamanho="pequeno" onClick={() => setEditarEstado(estado)}>
                Editar
              </Botao>
            </li>
          ))}
        </ul>
      </section>

      {editarCategoria && (
        <FormularioSimples
          titulo={editarCategoria === 'nova' ? 'Nova categoria' : 'Editar categoria'}
          campos={{
            name: editarCategoria === 'nova' ? '' : editarCategoria.name,
            icon: editarCategoria === 'nova' ? '💙' : editarCategoria.icon,
            sortOrder: String(editarCategoria === 'nova' ? categorias.length + 1 : editarCategoria.sortOrder),
            isActive: editarCategoria === 'nova' ? true : editarCategoria.isActive,
          }}
          rotuloNome="Nome da categoria *"
          onFechar={() => setEditarCategoria(null)}
          onGuardar={async (valores) => {
            const dados = {
              name: valores.name,
              icon: valores.icon,
              sortOrder: Number(valores.sortOrder),
              isActive: valores.isActive,
            };
            if (editarCategoria === 'nova') await adminApi.criarCategoria(dados);
            else await adminApi.editarCategoria(editarCategoria.id, dados);
            setEditarCategoria(null);
            await depoisDeGuardar('Categoria guardada.');
          }}
        />
      )}

      {removerCategoria && (
        <ConfirmDialog
          titulo="Remover categoria?"
          mensagem={
            <>
              Queres mesmo remover <strong>{removerCategoria.name}</strong>? Só é possível se não
              estiver a ser usada por nenhum artigo nem sugestão.
            </>
          }
          onFechar={() => setRemoverCategoria(null)}
          onConfirmar={async () => {
            await adminApi.apagarCategoria(removerCategoria.id);
            setRemoverCategoria(null);
            await depoisDeGuardar('Categoria removida.');
          }}
        />
      )}

      {editarFaixa && (
        <FormularioSimples
          titulo={editarFaixa === 'nova' ? 'Nova faixa etária' : 'Editar faixa etária'}
          campos={{
            name: editarFaixa === 'nova' ? '' : editarFaixa.label,
            icon: null,
            sortOrder: String(editarFaixa === 'nova' ? faixas.length + 1 : editarFaixa.sortOrder),
            isActive: editarFaixa === 'nova' ? true : editarFaixa.isActive,
          }}
          rotuloNome="Nome da faixa *"
          onFechar={() => setEditarFaixa(null)}
          onGuardar={async (valores) => {
            const dados = {
              label: valores.name,
              sortOrder: Number(valores.sortOrder),
              isActive: valores.isActive,
            };
            if (editarFaixa === 'nova') await adminApi.criarFaixa(dados);
            else await adminApi.editarFaixa(editarFaixa.id, dados);
            setEditarFaixa(null);
            await depoisDeGuardar('Faixa etária guardada.');
          }}
        />
      )}

      {removerFaixa && (
        <ConfirmDialog
          titulo="Remover faixa etária?"
          mensagem={
            <>
              Queres mesmo remover <strong>{removerFaixa.label}</strong>? Só é possível se nenhum
              artigo a estiver a usar.
            </>
          }
          onFechar={() => setRemoverFaixa(null)}
          onConfirmar={async () => {
            await adminApi.apagarFaixa(removerFaixa.id);
            setRemoverFaixa(null);
            await depoisDeGuardar('Faixa etária removida.');
          }}
        />
      )}

      {editarEstado && (
        <FormularioDeEstado
          estado={editarEstado}
          onFechar={() => setEditarEstado(null)}
          onGuardado={async () => {
            setEditarEstado(null);
            await depoisDeGuardar('Estado guardado.');
          }}
        />
      )}

      <Toast aviso={aviso} onFechar={() => setAviso(null)} />
    </>
  );
}

/* ------------------ formulário partilhado (categoria / faixa) ----------------- */

interface ValoresSimples {
  name: string;
  icon: string | null;
  sortOrder: string;
  isActive: boolean;
}

function FormularioSimples({
  titulo,
  campos,
  rotuloNome,
  onGuardar,
  onFechar,
}: {
  titulo: string;
  campos: ValoresSimples;
  rotuloNome: string;
  onGuardar: (valores: ValoresSimples) => Promise<void>;
  onFechar: () => void;
}) {
  const [valores, setValores] = useState(campos);
  const [erro, setErro] = useState('');
  const [erroGeral, setErroGeral] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const submeter = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setErroGeral('');

    if (!valores.name.trim()) {
      setErro('Escreve um nome.');
      return;
    }

    setOcupado(true);
    try {
      await onGuardar({ ...valores, name: valores.name.trim() });
    } catch (problema) {
      setErroGeral(problema instanceof Error ? problema.message : 'Não foi possível guardar.');
      setOcupado(false);
    }
  };

  return (
    <Modal titulo={titulo} onFechar={onFechar} largura="max-w-md">
      <form onSubmit={submeter} noValidate>
        <Campo id="s-nome" label={rotuloNome} erro={erro}>
          <input
            id="s-nome"
            className="campo"
            value={valores.name}
            aria-invalid={!!erro}
            onChange={(evento) => {
              setValores({ ...valores, name: evento.target.value });
              setErro('');
            }}
          />
        </Campo>

        {valores.icon !== null && (
          <Campo id="s-icone" label="Ícone" dica="Um emoji — aparece nos cartões e nos filtros.">
            <input
              id="s-icone"
              className="campo"
              maxLength={4}
              value={valores.icon}
              onChange={(evento) => setValores({ ...valores, icon: evento.target.value })}
            />
          </Campo>
        )}

        <Campo id="s-ordem" label="Ordem" dica="Números mais baixos aparecem primeiro.">
          <input
            id="s-ordem"
            className="campo"
            type="number"
            min={0}
            max={999}
            value={valores.sortOrder}
            onChange={(evento) => setValores({ ...valores, sortOrder: evento.target.value })}
          />
        </Campo>

        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            className="h-5 w-5 accent-azul-600"
            checked={valores.isActive}
            onChange={(evento) => setValores({ ...valores, isActive: evento.target.checked })}
          />
          <span>Visível na área pública</span>
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

/* ------------------------------ estado do artigo ------------------------------ */

const CORES = [
  { valor: 'green', nome: 'Verde' },
  { valor: 'amber', nome: 'Âmbar' },
  { valor: 'yellow', nome: 'Amarelo' },
  { valor: 'rose', nome: 'Rosa' },
];

function FormularioDeEstado({
  estado,
  onGuardado,
  onFechar,
}: {
  estado: StatusSetting;
  onGuardado: () => Promise<void>;
  onFechar: () => void;
}) {
  const [valores, setValores] = useState({
    label: estado.label,
    icon: estado.icon,
    color: estado.color,
    description: estado.description,
  });
  const [erroGeral, setErroGeral] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const submeter = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setOcupado(true);
    setErroGeral('');
    try {
      await adminApi.editarEstado(estado.status, valores);
      await onGuardado();
    } catch (problema) {
      setErroGeral(problema instanceof Error ? problema.message : 'Não foi possível guardar.');
      setOcupado(false);
    }
  };

  return (
    <Modal titulo={`Estado: ${estado.status}`} onFechar={onFechar} largura="max-w-md">
      <form onSubmit={submeter} noValidate>
        <Campo id="e-nome" label="Nome visível *">
          <input id="e-nome" className="campo" value={valores.label} onChange={(evento) => setValores({ ...valores, label: evento.target.value })} />
        </Campo>

        <div className="flex gap-3">
          <div className="w-[110px] shrink-0">
            <Campo id="e-icone" label="Ícone">
              <input id="e-icone" className="campo" maxLength={4} value={valores.icon} onChange={(evento) => setValores({ ...valores, icon: evento.target.value })} />
            </Campo>
          </div>
          <div className="flex-1">
            <Campo id="e-cor" label="Cor">
              <select id="e-cor" className="campo" value={valores.color} onChange={(evento) => setValores({ ...valores, color: evento.target.value })}>
                {CORES.map((cor) => (
                  <option key={cor.valor} value={cor.valor}>
                    {cor.nome}
                  </option>
                ))}
              </select>
            </Campo>
          </div>
        </div>

        <Campo id="e-descricao" label="Explicação *" dica="Uma frase que diga o que este estado significa.">
          <textarea id="e-descricao" className="campo" rows={2} value={valores.description} onChange={(evento) => setValores({ ...valores, description: evento.target.value })} />
        </Campo>

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
