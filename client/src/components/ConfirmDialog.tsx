import { useState } from 'react';

import { Botao, MensagemDeErro, Modal } from './ui';

/** Confirmação antes de qualquer remoção. */
export default function ConfirmDialog({
  titulo = 'Tens a certeza?',
  mensagem,
  confirmar = 'Sim, remover',
  onConfirmar,
  onFechar,
}: {
  titulo?: string;
  mensagem: React.ReactNode;
  confirmar?: string;
  onConfirmar: () => Promise<void> | void;
  onFechar: () => void;
}) {
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');

  const executar = async () => {
    setOcupado(true);
    setErro('');
    try {
      await onConfirmar();
    } catch (problema) {
      setErro(problema instanceof Error ? problema.message : 'Não foi possível concluir.');
      setOcupado(false);
    }
  };

  return (
    <Modal titulo={titulo} onFechar={onFechar} largura="max-w-md">
      <p className="text-sm text-tinta-suave">{mensagem}</p>

      {erro && <MensagemDeErro>{erro}</MensagemDeErro>}

      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Botao type="button" variante="contorno" onClick={onFechar} disabled={ocupado}>
          Manter
        </Botao>
        <Botao type="button" variante="perigo" onClick={executar} disabled={ocupado}>
          {ocupado ? 'A remover...' : confirmar}
        </Botao>
      </div>
    </Modal>
  );
}
