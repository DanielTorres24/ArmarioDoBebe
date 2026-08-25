import { useCallback, useEffect, useState } from 'react';

import { Botao, Campo, EstadoVazio, Esqueleto, Etiqueta, MensagemDeErro, Modal, Toast, type Aviso } from '../../components/ui';
import ConfirmDialog from '../../components/ConfirmDialog';
import { adminApi } from '../../lib/api';
import { useCatalogo } from '../../lib/catalogo';
import { PRIORIDADES, type Suggestion } from '../../types';

interface Formulario {
  name: string;
  description: string;
  categoryId: string;
  priority: string;
  productUrl: string;
  imageUrl: string;
  isActive: boolean;
}

const vazio: Formulario = {
  name: '',
  description: '',
  categoryId: '',
  priority: '2',
  productUrl: '',
  imageUrl: '',
  isActive: true,
};

/** Ideias de prenda por orçamento, para quem não sabe o que escolher. */
export default function Suggestions() {
  const { categories } = useCatalogo();

  const [sugestoes, setSugestoes] = useState<Suggestion[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aEditar, setAEditar] = useState<Suggestion | 'nova' | null>(null);
  const [aRemover, setARemover] = useState<Suggestion | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setSugestoes(await adminApi.suggestions());
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return (
    <>
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl">Sugestões</h1>
          <p className="mt-1 text-sm text-tinta-suave">
            Aparecem na página <strong>🤔 Não sabes o que oferecer?</strong>, agrupadas por categoria.
          </p>
        </div>
        <Botao variante="primario" onClick={() => setAEditar('nova')}>
          + Nova sugestão
        </Botao>
      </header>

      {carregando && (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((indice) => (
            <Esqueleto key={indice} className="h-20 w-full rounded-card" />
          ))}
        </div>
      )}

      {!carregando && sugestoes.length === 0 && (
        <EstadoVazio emoji="🎁" titulo="Ainda não há sugestões" texto="Cria a primeira ideia de prenda.">
          <Botao variante="primario" onClick={() => setAEditar('nova')}>
            + Nova sugestão
          </Botao>
        </EstadoVazio>
      )}

      {!carregando && sugestoes.length > 0 && (
        <ul className="flex flex-col gap-2.5">
          {sugestoes.map((sugestao) => (
            <li key={sugestao.id} className="cartao flex flex-wrap items-start gap-3 p-4">
              <div className="min-w-[180px] flex-1">
                <h2 className="text-base [overflow-wrap:anywhere]">{sugestao.name}</h2>
                {sugestao.description && (
                  <p className="mt-1 text-sm text-tinta-suave [overflow-wrap:anywhere]">
                    {sugestao.description}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {sugestao.category && (
                    <Etiqueta>
                      {sugestao.category.icon} {sugestao.category.name}
                    </Etiqueta>
                  )}
                  <Etiqueta tom="neutro">prioridade {sugestao.priority}</Etiqueta>
                  {!sugestao.isActive && <Etiqueta tom="rosa">inativa</Etiqueta>}
                </div>
              </div>

              <div className="flex gap-2">
                <Botao variante="suave" tamanho="pequeno" onClick={() => setAEditar(sugestao)}>
                  Editar
                </Botao>
                <Botao variante="perigo" tamanho="pequeno" onClick={() => setARemover(sugestao)}>
                  Remover
                </Botao>
              </div>
            </li>
          ))}
        </ul>
      )}

      {aEditar && (
        <FormularioDeSugestao
          sugestao={aEditar === 'nova' ? undefined : aEditar}
          categorias={categories}
          onFechar={() => setAEditar(null)}
          onGuardado={async () => {
            setAEditar(null);
            setAviso({ tipo: 'sucesso', mensagem: 'Sugestão guardada.' });
            await carregar();
          }}
        />
      )}

      {aRemover && (
        <ConfirmDialog
          titulo="Remover sugestão?"
          mensagem={
            <>
              Queres mesmo remover <strong>{aRemover.name}</strong>?
            </>
          }
          onFechar={() => setARemover(null)}
          onConfirmar={async () => {
            await adminApi.apagarSugestao(aRemover.id);
            setARemover(null);
            setAviso({ tipo: 'sucesso', mensagem: 'Sugestão removida.' });
            await carregar();
          }}
        />
      )}

      <Toast aviso={aviso} onFechar={() => setAviso(null)} />
    </>
  );
}

function FormularioDeSugestao({
  sugestao,
  categorias,
  onGuardado,
  onFechar,
}: {
  sugestao?: Suggestion;
  categorias: { id: string; name: string; icon: string }[];
  onGuardado: () => Promise<void>;
  onFechar: () => void;
}) {
  const [form, setForm] = useState<Formulario>(() =>
    sugestao
      ? {
          name: sugestao.name,
          description: sugestao.description ?? '',
          categoryId: sugestao.categoryId ?? '',
          priority: String(sugestao.priority),
          productUrl: sugestao.productUrl ?? '',
          imageUrl: sugestao.imageUrl ?? '',
          isActive: sugestao.isActive,
        }
      : vazio,
  );
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

  const submeter = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setErroGeral('');

    const novos: Partial<Record<keyof Formulario, string>> = {};
    if (!form.name.trim()) novos.name = 'Escreve o nome da sugestão.';

    setErros(novos);
    if (Object.keys(novos).length > 0) return;

    setOcupado(true);
    try {
      const dados = {
        name: form.name.trim(),
        description: form.description.trim(),
        categoryId: form.categoryId || null,
        priority: Number(form.priority),
        productUrl: form.productUrl.trim(),
        imageUrl: form.imageUrl.trim(),
        isActive: form.isActive,
      };

      if (sugestao) await adminApi.editarSugestao(sugestao.id, dados);
      else await adminApi.criarSugestao(dados);

      await onGuardado();
    } catch (problema) {
      setErroGeral(problema instanceof Error ? problema.message : 'Não foi possível guardar.');
      setOcupado(false);
    }
  };

  return (
    <Modal titulo={sugestao ? 'Editar sugestão' : 'Nova sugestão'} onFechar={onFechar} largura="max-w-xl">
      <form onSubmit={submeter} noValidate>
        <Campo id="sg-nome" label="Nome *" erro={erros.name}>
          <input id="sg-nome" className="campo" value={form.name} onChange={mudar('name')} aria-invalid={!!erros.name} />
        </Campo>

        <Campo id="sg-descricao" label="Descrição">
          <textarea id="sg-descricao" className="campo" rows={2} value={form.description} onChange={mudar('description')} />
        </Campo>

        <div className="flex flex-wrap gap-3">
          <div className="min-w-[170px] flex-1">
            <Campo id="sg-categoria" label="Categoria">
              <select id="sg-categoria" className="campo" value={form.categoryId} onChange={mudar('categoryId')}>
                <option value="">Sem categoria</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.icon} {categoria.name}
                  </option>
                ))}
              </select>
            </Campo>
          </div>
          <div className="min-w-[170px] flex-1">
            <Campo id="sg-prioridade" label="Prioridade">
              <select id="sg-prioridade" className="campo" value={form.priority} onChange={mudar('priority')}>
                {PRIORIDADES.map((prioridade) => (
                  <option key={prioridade.valor} value={prioridade.valor}>
                    {prioridade.label}
                  </option>
                ))}
              </select>
            </Campo>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="min-w-[130px] flex-1">
          </div>
          <div className="min-w-[130px] flex-1">
          </div>
        </div>

        <Campo id="sg-link" label="Link do produto" dica="Opcional.">
          <input id="sg-link" className="campo" type="url" placeholder="https://..." value={form.productUrl} onChange={mudar('productUrl')} />
        </Campo>

        <Campo id="sg-imagem" label="Link da imagem" dica="Opcional.">
          <input id="sg-imagem" className="campo" type="url" placeholder="https://..." value={form.imageUrl} onChange={mudar('imageUrl')} />
        </Campo>

        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
          <input type="checkbox" className="h-5 w-5 accent-azul-600" checked={form.isActive} onChange={mudar('isActive')} />
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
