import { useState } from 'react';

import { Botao, Campo, MensagemDeErro, Modal, juntar } from './ui';
import { useCatalogo } from '../lib/catalogo';
import { api } from '../lib/api';
import type { Item } from '../types';

/** "Quero oferecer isto" — criar, alterar ou cancelar a própria reserva. */
export default function ReserveModal({
  item,
  onConcluido,
  onFechar,
}: {
  item: Item;
  onConcluido: (mensagem: string) => void;
  onFechar: () => void;
}) {
  const { settings, convidado, guardarNome } = useCatalogo();
  const minhaReserva = item.reservations.find((reserva) => reserva.isMine);

  const [intencao, setIntencao] = useState<'THINKING' | 'RESERVED'>(
    minhaReserva?.status === 'THINKING' ? 'THINKING' : 'RESERVED',
  );
  const [nome, setNome] = useState(convidado?.name ?? '');
  const [email, setEmail] = useState(convidado?.email ?? '');
  const [nota, setNota] = useState('');
  const [erroNome, setErroNome] = useState('');
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const permiteAPensar = settings?.allowThinking ?? true;
  const permiteCancelar = settings?.allowCancellation ?? true;

  const submeter = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setErro('');

    if (nome.trim().length < 2) {
      setErroNome('Escreve o teu nome (pelo menos 2 letras).');
      return;
    }

    const identidade = guardarNome(nome, email.trim() || undefined);
    if (!identidade) return;

    setOcupado(true);
    try {
      if (minhaReserva) {
        await api.editarReserva(minhaReserva.id, {
          guestId: identidade.id,
          status: intencao,
          note: nota.trim(),
        });
        onConcluido('Reserva atualizada. 💙');
      } else {
        await api.reservar({
          itemId: item.id,
          guestId: identidade.id,
          guestName: identidade.name,
          guestEmail: email.trim(),
          status: intencao,
          note: nota.trim(),
        });
        onConcluido(
          intencao === 'THINKING'
            ? 'Ficou registado que estás a pensar oferecer. 🟠'
            : 'Prenda reservada. Obrigado! 🎁',
        );
      }
    } catch (problema) {
      setErro(problema instanceof Error ? problema.message : 'Não foi possível guardar a reserva.');
      setOcupado(false);
    }
  };

  const marcarComoOferecido = async () => {
    if (!minhaReserva || !convidado) return;
    setOcupado(true);
    try {
      await api.editarReserva(minhaReserva.id, { guestId: convidado.id, status: 'GIFTED', note: '' });
      onConcluido('Marcado como oferecido. Obrigado! 💙');
    } catch (problema) {
      setErro(problema instanceof Error ? problema.message : 'Não foi possível atualizar.');
      setOcupado(false);
    }
  };

  const cancelar = async () => {
    if (!minhaReserva || !convidado) return;
    setOcupado(true);
    try {
      await api.cancelarReserva(minhaReserva.id, convidado.id);
      onConcluido('Reserva cancelada. Fica outra vez disponível.');
    } catch (problema) {
      setErro(problema instanceof Error ? problema.message : 'Não foi possível cancelar.');
      setOcupado(false);
    }
  };

  const opcoes = [
    {
      valor: 'THINKING' as const,
      titulo: '🤔 Estou a pensar oferecer',
      texto: 'Fica assinalado para os outros, mas ainda não é uma promessa.',
      disponivel: permiteAPensar,
    },
    {
      valor: 'RESERVED' as const,
      titulo: '🎁 Vou oferecer este artigo',
      texto: 'Fica reservado para ti e ninguém mais o vai comprar.',
      disponivel: true,
    },
  ].filter((opcao) => opcao.disponivel);

  return (
    <Modal titulo={minhaReserva ? 'A tua reserva 🎁' : 'Quero oferecer isto 🎁'} onFechar={onFechar}>
      <p className="mb-4 rounded-2xl bg-azul-100 px-3.5 py-2.5 text-sm font-semibold text-azul-800">
        {item.category?.icon} {item.name}
      </p>

      <form onSubmit={submeter} noValidate>
        <fieldset className="mb-4">
          <legend className="rotulo">O que queres fazer?</legend>
          <div className="flex flex-col gap-2">
            {opcoes.map((opcao) => (
              <label
                key={opcao.valor}
                className={juntar(
                  'flex cursor-pointer gap-3 rounded-2xl border p-3 transition',
                  intencao === opcao.valor
                    ? 'border-azul-500 bg-azul-50 ring-2 ring-azul-500/25'
                    : 'border-azul-100 hover:bg-azul-50',
                )}
              >
                <input
                  type="radio"
                  name="intencao"
                  className="mt-1 h-5 w-5 shrink-0 accent-azul-600"
                  checked={intencao === opcao.valor}
                  onChange={() => setIntencao(opcao.valor)}
                />
                <span>
                  <span className="block font-bold">{opcao.titulo}</span>
                  <span className="block text-sm text-tinta-suave">{opcao.texto}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <Campo id="reserva-nome" label="O teu nome *" erro={erroNome}>
          <input
            id="reserva-nome"
            className="campo"
            type="text"
            value={nome}
            autoComplete="name"
            placeholder="Ex.: Maria Silva"
            aria-invalid={erroNome ? 'true' : 'false'}
            onChange={(evento) => {
              setNome(evento.target.value);
              if (erroNome) setErroNome('');
            }}
          />
        </Campo>

        <Campo
          id="reserva-email"
          label="Email (opcional)"
          dica="Só os pais o veem — serve para te contactarem se for preciso."
        >
          <input
            id="reserva-email"
            className="campo"
            type="email"
            value={email}
            autoComplete="email"
            placeholder="maria@exemplo.pt"
            onChange={(evento) => setEmail(evento.target.value)}
          />
        </Campo>

        <Campo id="reserva-nota" label="Recado para os pais (opcional)">
          <textarea
            id="reserva-nota"
            className="campo"
            rows={2}
            value={nota}
            placeholder="Ex.: vou levar no dia da festa"
            onChange={(evento) => setNota(evento.target.value)}
          />
        </Campo>

        {settings?.reserverVisibility !== 'PUBLIC' && (
          <p className="mt-1 text-xs text-tinta-suave">
            {settings?.reserverVisibility === 'HIDDEN'
              ? 'Os outros convidados vão ver apenas "Reservado", sem o teu nome.'
              : 'O teu nome só é visível para os pais.'}
          </p>
        )}

        {erro && <MensagemDeErro>{erro}</MensagemDeErro>}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Botao type="button" variante="contorno" onClick={onFechar} disabled={ocupado}>
            Fechar
          </Botao>
          <Botao type="submit" variante="primario" disabled={ocupado}>
            {ocupado ? 'A guardar...' : minhaReserva ? 'Guardar alterações' : 'Confirmar'}
          </Botao>
        </div>
      </form>

      {minhaReserva && (
        <div className="mt-5 flex flex-col gap-2 border-t border-azul-100 pt-4 sm:flex-row">
          {minhaReserva.status !== 'GIFTED' && (
            <Botao type="button" variante="suave" onClick={marcarComoOferecido} disabled={ocupado} className="flex-1">
              💙 Já ofereci
            </Botao>
          )}
          {permiteCancelar && (
            <Botao type="button" variante="perigo" onClick={cancelar} disabled={ocupado} className="flex-1">
              Cancelar reserva
            </Botao>
          )}
        </div>
      )}
    </Modal>
  );
}
