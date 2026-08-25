import { Botao, Etiqueta, juntar } from './ui';
import { tomDoEstado, useCatalogo, useEstado } from '../lib/catalogo';
import { pecas } from '../lib/format';
import type { Item } from '../types';

/**
 * Cartão de um artigo na área pública.
 * Editar/Remover só aparecem ao dono; o botão de oferecer só aparece quando
 * faz sentido oferecer aquilo.
 */
export default function ItemCard({
  item,
  onOferecer,
  onGerirReserva,
  onEditar,
  onRemover,
}: {
  item: Item;
  onOferecer?: (item: Item) => void;
  onGerirReserva?: (item: Item) => void;
  onEditar?: (item: Item) => void;
  onRemover?: (item: Item) => void;
}) {
  const { settings, statuses } = useCatalogo();
  const estadoDe = useEstado(statuses);
  const estado = estadoDe(item.status);

  // Só faz sentido dizer "já tem N" do que é posse; um pedido não se conta.
  const jaTem = item.status === 'OWNED' || item.status === 'SOME';

  const minhaReserva = item.reservations.find((reserva) => reserva.isMine);
  const reservaDeOutro = item.reservations.find((reserva) => !reserva.isMine);

  // Não faz sentido oferecer o que já está tratado.
  const podeOferecer =
    settings?.reservationEnabled && !item.isReserved && item.status !== 'OWNED';

  return (
    <article className="cartao flex flex-col p-4 sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-azul-100 text-2xl">
          {item.category?.icon ?? '💙'}
        </span>
        <div className="flex flex-wrap justify-end gap-1.5">
          <Etiqueta tom={tomDoEstado(estado.color)}>
            <span aria-hidden="true">{estado.icon}</span> {estado.label}
          </Etiqueta>
          {jaTem && item.quantity > 1 && (
            <Etiqueta tom="neutro">
              {item.quantity} <span className="sr-only">unidades</span>
            </Etiqueta>
          )}
        </div>
      </div>

      <h3 className="mb-2 text-lg [overflow-wrap:anywhere]">{item.name}</h3>

      <div className="mb-2 flex flex-wrap gap-1.5">
        {item.category && <Etiqueta>{item.category.name}</Etiqueta>}
        {item.ageRange && <Etiqueta tom="neutro">{item.ageRange.label}</Etiqueta>}
        {item.size && !item.ageRange && <Etiqueta tom="neutro">{item.size}</Etiqueta>}
        {item.status === 'WANTED' && item.priority >= 4 && (
          <Etiqueta tom="ambar">⭐ Prioridade {item.priority}</Etiqueta>
        )}
      </div>

      {item.description && (
        <p className="text-sm text-tinta-suave [overflow-wrap:anywhere]">{item.description}</p>
      )}

      {jaTem && (
        <p className="mt-2 text-sm font-bold text-azul-700">
          Já temos {pecas(item.quantity)}
        </p>
      )}

      {item.productUrl && (
        <a
          href={item.productUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-2 text-sm font-bold text-azul-700 underline underline-offset-2"
        >
          Ver exemplo do produto ↗
        </a>
      )}

      <div className="mt-auto pt-4">
        {/* Estado da reserva: quem reservou só aparece se os pais o permitirem. */}
        {minhaReserva && (
          <div
            className={juntar(
              'mb-3 rounded-2xl px-3 py-2 text-sm font-semibold',
              minhaReserva.status === 'THINKING'
                ? 'bg-estado-ambar-fundo text-estado-ambar'
                : 'bg-estado-verde-fundo text-estado-verde',
            )}
          >
            {minhaReserva.status === 'THINKING'
              ? '🟠 Estás a pensar oferecer isto'
              : minhaReserva.status === 'GIFTED'
                ? '💙 Já ofereceste isto'
                : '🎁 Reservaste esta prenda'}
          </div>
        )}

        {!minhaReserva && reservaDeOutro && (
          <div className="mb-3 rounded-2xl bg-azul-100 px-3 py-2 text-sm font-semibold text-azul-800">
            {reservaDeOutro.guestName
              ? reservaDeOutro.status === 'THINKING'
                ? `🟠 ${reservaDeOutro.guestName} está a pensar oferecer`
                : `🎁 ${reservaDeOutro.guestName} vai oferecer esta prenda`
              : reservaDeOutro.status === 'THINKING'
                ? '🟠 Alguém está a pensar oferecer'
                : '🎁 Esta prenda já foi reservada'}
          </div>
        )}

        {item.ownerName && (
          <p className="text-xs text-tinta-suave [overflow-wrap:anywhere]">
            Adicionado por <strong className="text-tinta">{item.ownerName}</strong>
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {podeOferecer && onOferecer && (
            <Botao variante="primario" tamanho="pequeno" onClick={() => onOferecer(item)} className="flex-1">
              🎁 Quero oferecer isto
            </Botao>
          )}

          {minhaReserva && onGerirReserva && (
            <Botao variante="contorno" tamanho="pequeno" onClick={() => onGerirReserva(item)} className="flex-1">
              Gerir a minha reserva
            </Botao>
          )}

          {item.isMine && onEditar && (
            <Botao variante="suave" tamanho="pequeno" onClick={() => onEditar(item)} aria-label={`Editar ${item.name}`}>
              ✏️ Editar
            </Botao>
          )}

          {item.isMine && onRemover && (
            <Botao variante="perigo" tamanho="pequeno" onClick={() => onRemover(item)} aria-label={`Remover ${item.name}`}>
              🗑️ Remover
            </Botao>
          )}
        </div>
      </div>
    </article>
  );
}
