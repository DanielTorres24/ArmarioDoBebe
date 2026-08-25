import { useState } from 'react';

import { Botao, Campo, Modal } from './ui';
import { useCatalogo } from '../lib/catalogo';

/** Pede o nome antes de qualquer ação que fique associada a alguém. */
export default function GuestNameModal({
  onGuardado,
  onFechar,
  pedirEmail = false,
}: {
  onGuardado: () => void;
  onFechar: () => void;
  pedirEmail?: boolean;
}) {
  const { convidado, guardarNome } = useCatalogo();
  const [nome, setNome] = useState(convidado?.name ?? '');
  const [email, setEmail] = useState(convidado?.email ?? '');
  const [erro, setErro] = useState('');

  const submeter = (evento: React.FormEvent) => {
    evento.preventDefault();

    if (nome.trim().length < 2) {
      setErro('Escreve o teu nome (pelo menos 2 letras).');
      return;
    }

    if (guardarNome(nome, email.trim() || undefined)) onGuardado();
  };

  return (
    <Modal titulo="Como te chamas? 👋" onFechar={onFechar}>
      <form onSubmit={submeter} noValidate>
        <p className="mb-4 text-sm text-tinta-suave">
          O teu nome fica ao lado do que acrescentares ou reservares, para os pais saberem quem
          trouxe o quê. Fica guardado neste telemóvel — não precisas de o escrever outra vez.
        </p>

        <Campo id="nome-convidado" label="O teu nome" erro={erro}>
          <input
            id="nome-convidado"
            className="campo"
            type="text"
            value={nome}
            autoComplete="name"
            placeholder="Ex.: Maria Silva"
            aria-invalid={erro ? 'true' : 'false'}
            onChange={(evento) => {
              setNome(evento.target.value);
              if (erro) setErro('');
            }}
          />
        </Campo>

        {pedirEmail && (
          <Campo
            id="email-convidado"
            label="Email (opcional)"
            dica="Só para os pais te poderem contactar sobre a prenda."
          >
            <input
              id="email-convidado"
              className="campo"
              type="email"
              value={email}
              autoComplete="email"
              placeholder="maria@exemplo.pt"
              onChange={(evento) => setEmail(evento.target.value)}
            />
          </Campo>
        )}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Botao type="button" variante="contorno" onClick={onFechar}>
            Cancelar
          </Botao>
          <Botao type="submit" variante="primario">
            Continuar
          </Botao>
        </div>
      </form>
    </Modal>
  );
}
