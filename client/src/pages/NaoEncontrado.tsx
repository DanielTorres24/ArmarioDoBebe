import { Link } from 'react-router-dom';

import { Botao, EstadoVazio } from '../components/ui';

export default function NaoEncontrado() {
  return (
    <EstadoVazio
      imagem="/icons/principal.png"
      titulo="Esta página não existe"
      texto="O link pode estar errado ou a página pode ter mudado de sítio."
    >
      <Link to="/">
        <Botao variante="primario">Voltar ao início</Botao>
      </Link>
    </EstadoVazio>
  );
}
