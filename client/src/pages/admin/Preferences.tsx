import { useCallback, useEffect, useState } from 'react';

import { Botao, Campo, EstadoVazio, Esqueleto, Etiqueta, MensagemDeErro, Modal, Toast, type Aviso } from '../../components/ui';
import ConfirmDialog from '../../components/ConfirmDialog';
import { adminApi } from '../../lib/api';
import type { ParentPreference } from '../../types';

/** "Algumas coisas que gostamos" — ajuda os convidados a escolher bem. */
export default function Preferences() {
  const [preferencias, setPreferencias] = useState<ParentPreference[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aEditar, setAEditar] = useState<ParentPreference | 'nova' | null>(null);
  const [aRemover, setARemover] = useState<ParentPreference | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setPreferencias(await adminApi.preferences());
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  /** Trocar a ordem com a preferência vizinha. */
  const mover = async (indice: number, direcao: -1 | 1) => {
    const atual = preferencias[indice];
    const vizinha = preferencias[indice + direcao];
    if (!atual || !vizinha) return;

    await Promise.all([
      adminApi.editarPreferencia(atual.id, {
        title: atual.title,
        description: atual.description ?? '',
        icon: atual.icon,
        sortOrder: vizinha.sortOrder,
        isActive: atual.isActive,
      }),
      adminApi.editarPreferencia(vizinha.id, {
        title: vizinha.title,
        description: vizinha.description ?? '',
        icon: vizinha.icon,
        sortOrder: atual.sortOrder,
        isActive: vizinha.isActive,
      }),
    ]);

    await carregar();
  };

  return (
    <>
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl">Preferências</h1>
          <p className="mt-1 text-sm text-tinta-suave">
            Aparecem na página <strong>💙 Gostos</strong> e na página inicial.
          </p>
        </div>
        <Botao variante="primario" onClick={() => setAEditar('nova')}>
          + Nova preferência
        </Botao>
      </header>

      {carregando && (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((indice) => (
            <Esqueleto key={indice} className="h-16 w-full rounded-card" />
          ))}
        </div>
      )}

      {!carregando && preferencias.length === 0 && (
        <EstadoVazio
          emoji="💙"
          titulo="Ainda não escreveste nada"
          texto="Diz aos convidados o que gostam, o que evitam e do que já têm de sobra."
        >
          <Botao variante="primario" onClick={() => setAEditar('nova')}>
            + Nova preferência
          </Botao>
        </EstadoVazio>
      )}

      {!carregando && preferencias.length > 0 && (
        <ul className="flex flex-col gap-2.5">
          {preferencias.map((preferencia, indice) => (
            <li key={preferencia.id} className="cartao flex flex-wrap items-start gap-3 p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-azul-100 text-2xl">
                {preferencia.icon}
              </span>

              <div className="min-w-[180px] flex-1">
                <h2 className="text-base [overflow-wrap:anywhere]">{preferencia.title}</h2>
                {preferencia.description && (
                  <p className="mt-1 text-sm text-tinta-suave [overflow-wrap:anywhere]">
                    {preferencia.description}
                  </p>
                )}
                {!preferencia.isActive && (
                  <Etiqueta tom="rosa" className="mt-2">
                    oculta
                  </Etiqueta>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Botao
                  variante="contorno"
                  tamanho="pequeno"
                  disabled={indice === 0}
                  aria-label={`Mover ${preferencia.title} para cima`}
                  onClick={() => void mover(indice, -1)}
                >
                  ↑
                </Botao>
                <Botao
                  variante="contorno"
                  tamanho="pequeno"
                  disabled={indice === preferencias.length - 1}
                  aria-label={`Mover ${preferencia.title} para baixo`}
                  onClick={() => void mover(indice, 1)}
                >
                  ↓
                </Botao>
                <Botao variante="suave" tamanho="pequeno" onClick={() => setAEditar(preferencia)}>
                  Editar
                </Botao>
                <Botao variante="perigo" tamanho="pequeno" onClick={() => setARemover(preferencia)}>
                  Remover
                </Botao>
              </div>
            </li>
          ))}
        </ul>
      )}

      {aEditar && (
        <FormularioDePreferencia
          preferencia={aEditar === 'nova' ? undefined : aEditar}
          ordemSeguinte={preferencias.length + 1}
          onFechar={() => setAEditar(null)}
          onGuardado={async () => {
            setAEditar(null);
            setAviso({ tipo: 'sucesso', mensagem: 'Preferência guardada.' });
            await carregar();
          }}
        />
      )}

      {aRemover && (
        <ConfirmDialog
          titulo="Remover preferência?"
          mensagem={
            <>
              Queres mesmo remover <strong>{aRemover.title}</strong>?
            </>
          }
          onFechar={() => setARemover(null)}
          onConfirmar={async () => {
            await adminApi.apagarPreferencia(aRemover.id);
            setARemover(null);
            setAviso({ tipo: 'sucesso', mensagem: 'Preferência removida.' });
            await carregar();
          }}
        />
      )}

      <Toast aviso={aviso} onFechar={() => setAviso(null)} />
    </>
  );
}

function FormularioDePreferencia({
  preferencia,
  ordemSeguinte,
  onGuardado,
  onFechar,
}: {
  preferencia?: ParentPreference;
  ordemSeguinte: number;
  onGuardado: () => Promise<void>;
  onFechar: () => void;
}) {
  const [form, setForm] = useState({
    title: preferencia?.title ?? '',
    description: preferencia?.description ?? '',
    icon: preferencia?.icon ?? '💙',
    sortOrder: String(preferencia?.sortOrder ?? ordemSeguinte),
    isActive: preferencia?.isActive ?? true,
  });
  const [erro, setErro] = useState('');
  const [erroGeral, setErroGeral] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const submeter = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setErroGeral('');

    if (!form.title.trim()) {
      setErro('Escreve o título da preferência.');
      return;
    }

    setOcupado(true);
    try {
      const dados = {
        title: form.title.trim(),
        description: form.description.trim(),
        icon: form.icon,
        sortOrder: Number(form.sortOrder),
        isActive: form.isActive,
      };

      if (preferencia) await adminApi.editarPreferencia(preferencia.id, dados);
      else await adminApi.criarPreferencia(dados);

      await onGuardado();
    } catch (problema) {
      setErroGeral(problema instanceof Error ? problema.message : 'Não foi possível guardar.');
      setOcupado(false);
    }
  };

  return (
    <Modal titulo={preferencia ? 'Editar preferência' : 'Nova preferência'} onFechar={onFechar} largura="max-w-lg">
      <form onSubmit={submeter} noValidate>
        <Campo id="p-titulo" label="Título *" erro={erro} dica="Ex.: Preferimos roupa confortável">
          <input
            id="p-titulo"
            className="campo"
            value={form.title}
            aria-invalid={!!erro}
            onChange={(evento) => {
              setForm({ ...form, title: evento.target.value });
              setErro('');
            }}
          />
        </Campo>

        <Campo id="p-descricao" label="Descrição">
          <textarea
            id="p-descricao"
            className="campo"
            rows={2}
            value={form.description}
            onChange={(evento) => setForm({ ...form, description: evento.target.value })}
          />
        </Campo>

        <div className="flex gap-3">
          <div className="w-[110px] shrink-0">
            <Campo id="p-icone" label="Ícone">
              <input
                id="p-icone"
                className="campo"
                maxLength={4}
                value={form.icon}
                onChange={(evento) => setForm({ ...form, icon: evento.target.value })}
              />
            </Campo>
          </div>
          <div className="flex-1">
            <Campo id="p-ordem" label="Ordem">
              <input
                id="p-ordem"
                className="campo"
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(evento) => setForm({ ...form, sortOrder: evento.target.value })}
              />
            </Campo>
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            className="h-5 w-5 accent-azul-600"
            checked={form.isActive}
            onChange={(evento) => setForm({ ...form, isActive: evento.target.checked })}
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
