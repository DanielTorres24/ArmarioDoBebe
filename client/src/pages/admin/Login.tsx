import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Botao, Campo, MensagemDeErro } from '../../components/ui';
import { adminApi } from '../../lib/api';
import { guardarTokenDeAdmin } from '../../lib/adminAuth';

/** Entrada na área dos pais. */
export default function Login() {
  const navegar = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const submeter = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setErro('');

    if (!email.trim() || !password) {
      setErro('Preenche o utilizador e a palavra-passe.');
      return;
    }

    setOcupado(true);
    try {
      const resposta = await adminApi.login(email.trim(), password);
      guardarTokenDeAdmin(resposta.token);
      navegar('/admin', { replace: true });
    } catch (problema) {
      setErro(problema instanceof Error ? problema.message : 'Não foi possível iniciar sessão.');
      setOcupado(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-azul-400 to-azul-100 p-4">
      <div className="w-full max-w-md">
        <div className="cartao p-6 sm:p-8">
          <img
            src="/icons/principal.png"
            alt=""
            width={72}
            height={72}
            className="mx-auto mb-3 h-16 w-16 rounded-full bg-white object-cover shadow-suave"
          />
          <h1 className="mb-1 text-center text-2xl">Área dos pais</h1>
          <p className="mb-6 text-center text-sm text-tinta-suave">
            Só os pais do Diogo entram aqui.
          </p>

          <form onSubmit={submeter} noValidate>
            <Campo id="admin-email" label="Utilizador ou email">
              <input
                id="admin-email"
                className="campo"
                type="text"
                value={email}
                autoComplete="username"
                placeholder="admin"
                onChange={(evento) => setEmail(evento.target.value)}
              />
            </Campo>

            <Campo id="admin-password" label="Palavra-passe">
              <input
                id="admin-password"
                className="campo"
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(evento) => setPassword(evento.target.value)}
              />
            </Campo>

            {erro && <MensagemDeErro>{erro}</MensagemDeErro>}

            <Botao type="submit" variante="primario" disabled={ocupado} className="mt-5 w-full">
              {ocupado ? 'A entrar...' : 'Entrar'}
            </Botao>
          </form>
        </div>

        <p className="mt-4 text-center">
          <Link to="/" className="text-sm font-bold text-azul-900 underline underline-offset-2">
            ← Voltar ao site
          </Link>
        </p>
      </div>
    </div>
  );
}
