import { useCallback, useEffect, useMemo, useState } from 'react';

import Filters, { FILTROS_INICIAIS, type EstadoDosFiltros } from './Filters';
import ItemCard from './ItemCard';
import ItemFormModal from './ItemFormModal';
import ReserveModal from './ReserveModal';
import GuestNameModal from './GuestNameModal';
import ConfirmDialog from './ConfirmDialog';
import { Botao, EstadoVazio, Esqueleto, Toast, type Aviso } from './ui';
import { api, type FiltrosDeArtigos } from '../lib/api';
import { useCatalogo } from '../lib/catalogo';
import { plural } from '../lib/format';
import type { Item } from '../types';

type Dialogo =
  | { tipo: 'nome'; depois?: Dialogo }
  | { tipo: 'criar' }
  | { tipo: 'editar'; item: Item }
  | { tipo: 'remover'; item: Item }
  | { tipo: 'reservar'; item: Item }
  | null;

/**
 * O miolo partilhado pelas páginas que mostram artigos.
 * Recebe os filtros fixos da página (por exemplo, só o que faz falta) e
 * acrescenta-lhes os filtros que o visitante escolher.
 */
export default function ListaDeArtigos({
  filtrosFixos,
  ordemInicial = 'newest',
  mostrarFiltroDeEstado = true,
  permitirAdicionar = true,
  vazio,
}: {
  filtrosFixos?: FiltrosDeArtigos;
  ordemInicial?: EstadoDosFiltros['sort'];
  mostrarFiltroDeEstado?: boolean;
  permitirAdicionar?: boolean;
  vazio: { titulo: string; texto: string; emoji?: string; imagem?: string };
}) {
  const { convidado } = useCatalogo();

  const [items, setItems] = useState<Item[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [filtros, setFiltros] = useState<EstadoDosFiltros>({
    ...FILTROS_INICIAIS,
    sort: ordemInicial,
  });
  const [dialogo, setDialogo] = useState<Dialogo>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  const pedido = useMemo<FiltrosDeArtigos>(
    () => ({
      ...filtrosFixos,
      search: filtros.search || undefined,
      category: filtros.category || undefined,
      status: filtros.status || filtrosFixos?.status,
      ageRange: filtros.ageRange || undefined,
      priority: filtros.priority ? Number(filtros.priority) : undefined,
      reserved: filtros.reserved === '' ? undefined : filtros.reserved === 'true',
      mine: filtros.mine || undefined,
      sort: filtros.sort,
    }),
    [filtros, filtrosFixos],
  );

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      setItems(await api.items(pedido));
    } catch (problema) {
      setErro(problema instanceof Error ? problema.message : 'Não foi possível carregar.');
    } finally {
      setCarregando(false);
    }
  }, [pedido]);

  useEffect(() => {
    // Pequena espera para a pesquisa não disparar um pedido a cada tecla.
    const temporizador = setTimeout(() => void carregar(), filtros.search ? 250 : 0);
    return () => clearTimeout(temporizador);
  }, [carregar, filtros.search]);

  /** Garante que há nome antes de abrir o diálogo pedido. */
  const comIdentidade = (proximo: Exclude<Dialogo, null>) =>
    setDialogo(convidado ? proximo : { tipo: 'nome', depois: proximo });

  const filtrosAplicados =
    filtros.search !== '' ||
    filtros.category !== '' ||
    filtros.status !== '' ||
    filtros.ageRange !== '' ||
    filtros.priority !== '' ||
    filtros.reserved !== '' ||
    filtros.mine;

  return (
    <>
      <Filters valor={filtros} onMudar={setFiltros} mostrarEstado={mostrarFiltroDeEstado} />

      {permitirAdicionar && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-tinta-suave" aria-live="polite">
            {carregando ? 'A carregar...' : plural(items.length, 'artigo', 'artigos')}
          </p>
          <Botao variante="primario" onClick={() => comIdentidade({ tipo: 'criar' })}>
            + Adicionar algo ao armário
          </Botao>
        </div>
      )}

      <section aria-busy={carregando}>
        {carregando && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-3">
            {[0, 1, 2, 3, 4, 5].map((indice) => (
              <div className="cartao p-5" key={indice}>
                <Esqueleto className="mb-3 h-11 w-11 rounded-2xl" />
                <Esqueleto className="mb-3 h-5 w-3/4" />
                <Esqueleto className="mb-2 h-3 w-full" />
                <Esqueleto className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        )}

        {!carregando && erro && (
          <EstadoVazio emoji="😕" titulo="Não foi possível carregar" texto={erro}>
            <Botao variante="primario" onClick={() => void carregar()}>
              Tentar novamente
            </Botao>
          </EstadoVazio>
        )}

        {!carregando && !erro && items.length === 0 && (
          <EstadoVazio
            emoji={filtrosAplicados ? '🔍' : vazio.emoji}
            imagem={filtrosAplicados ? undefined : vazio.imagem}
            titulo={filtrosAplicados ? 'Nada encontrado' : vazio.titulo}
            texto={
              filtrosAplicados
                ? 'Experimenta outra palavra ou limpa os filtros.'
                : vazio.texto
            }
          >
            {filtrosAplicados ? (
              <Botao variante="contorno" onClick={() => setFiltros({ ...FILTROS_INICIAIS, sort: ordemInicial })}>
                Limpar filtros
              </Botao>
            ) : (
              permitirAdicionar && (
                <Botao variante="primario" onClick={() => comIdentidade({ tipo: 'criar' })}>
                  + Adicionar o primeiro artigo
                </Botao>
              )
            )}
          </EstadoVazio>
        )}

        {!carregando && !erro && items.length > 0 && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-3">
            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onOferecer={(alvo) => comIdentidade({ tipo: 'reservar', item: alvo })}
                onGerirReserva={(alvo) => setDialogo({ tipo: 'reservar', item: alvo })}
                onEditar={(alvo) => setDialogo({ tipo: 'editar', item: alvo })}
                onRemover={(alvo) => setDialogo({ tipo: 'remover', item: alvo })}
              />
            ))}
          </div>
        )}
      </section>

      {dialogo?.tipo === 'nome' && (
        <GuestNameModal
          pedirEmail={dialogo.depois?.tipo === 'reservar'}
          onGuardado={() => setDialogo(dialogo.depois ?? null)}
          onFechar={() => setDialogo(null)}
        />
      )}

      {(dialogo?.tipo === 'criar' || dialogo?.tipo === 'editar') && convidado && (
        <ItemFormModal
          item={dialogo.tipo === 'editar' ? dialogo.item : undefined}
          onMudarNome={() => setDialogo({ tipo: 'nome', depois: dialogo })}
          onFechar={() => setDialogo(null)}
          onGuardado={(_guardado, criado) => {
            setDialogo(null);
            setAviso({
              tipo: 'sucesso',
              mensagem: criado ? 'Artigo acrescentado. Obrigado! 💙' : 'Artigo atualizado.',
            });
            void carregar();
          }}
        />
      )}

      {dialogo?.tipo === 'reservar' && convidado && (
        <ReserveModal
          item={dialogo.item}
          onFechar={() => setDialogo(null)}
          onConcluido={(mensagem) => {
            setDialogo(null);
            setAviso({ tipo: 'sucesso', mensagem });
            void carregar();
          }}
        />
      )}

      {dialogo?.tipo === 'remover' && convidado && (
        <ConfirmDialog
          titulo="Remover artigo?"
          mensagem={
            <>
              Queres mesmo remover <strong>{dialogo.item.name}</strong> do armário? Esta ação não
              pode ser anulada.
            </>
          }
          onFechar={() => setDialogo(null)}
          onConfirmar={async () => {
            await api.apagarArtigo(dialogo.item.id, convidado.id);
            setDialogo(null);
            setAviso({ tipo: 'sucesso', mensagem: `"${dialogo.item.name}" foi removido.` });
            void carregar();
          }}
        />
      )}

      <Toast aviso={aviso} onFechar={() => setAviso(null)} />
    </>
  );
}
