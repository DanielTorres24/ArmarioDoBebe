import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';

import { Botao, Esqueleto, juntar } from '../ui';
import { adminApi } from '../../lib/api';
import { limparTokenDeAdmin, lerTokenDeAdmin } from '../../lib/adminAuth';

const SECCOES = [
  { para: '/admin', rotulo: 'Dashboard', emoji: '📊', exato: true },
  { para: '/admin/items', rotulo: 'Armário', emoji: '📦' },
  { para: '/admin/categories', rotulo: 'Categorias', emoji: '🏷️' },
  { para: '/admin/suggestions', rotulo: 'Sugestões', emoji: '🎁' },
  { para: '/admin/reservations', rotulo: 'Reservas', emoji: '🤝' },
  { para: '/admin/preferences', rotulo: 'Preferências', emoji: '💙' },
  { para: '/admin/settings', rotulo: 'Definições', emoji: '⚙️' },
];

/**
 * Moldura da área dos pais. Confirma a sessão contra o servidor antes de
 * mostrar seja o que for — o token sozinho não chega.
 */
export default function AdminLayout() {
  const navegar = useNavigate();
  const [estado, setEstado] = useState<'a-verificar' | 'dentro'>('a-verificar');
  const [email, setEmail] = useState('');

  useEffect(() => {
    let ativo = true;

    if (!lerTokenDeAdmin()) {
      navegar('/admin/login', { replace: true });
      return;
    }

    adminApi
      .me()
      .then((resposta) => {
        if (!ativo) return;
        setEmail(resposta.admin.email);
        setEstado('dentro');
      })
      .catch(() => {
        if (!ativo) return;
        limparTokenDeAdmin();
        navegar('/admin/login', { replace: true });
      });

    return () => {
      ativo = false;
    };
  }, [navegar]);

  if (estado === 'a-verificar') {
    return (
      <div className="mx-auto max-w-conteudo p-4">
        <Esqueleto className="mb-3 h-10 w-52" />
        <Esqueleto className="h-64 w-full" />
      </div>
    );
  }

  const sair = () => {
    limparTokenDeAdmin();
    navegar('/admin/login', { replace: true });
  };

  return (
    <div className="flex min-h-dvh flex-col bg-azul-50">
      <header className="border-b border-azul-100 bg-white">
        <div className="mx-auto flex max-w-conteudo flex-wrap items-center gap-3 px-3 py-3 sm:px-4">
          <Link to="/admin" className="flex items-center gap-2 font-extrabold text-azul-900">
            <img src="/icons/bone.png" alt="" width={32} height={32} className="h-8 w-8 object-contain" />
            Área dos pais
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm text-tinta-suave sm:inline">{email}</span>
            <Link to="/">
              <Botao variante="contorno" tamanho="pequeno">
                Ver o site
              </Botao>
            </Link>
            <Botao variante="suave" tamanho="pequeno" onClick={sair}>
              Sair
            </Botao>
          </div>
        </div>

        <nav aria-label="Secções da administração" className="mx-auto max-w-conteudo px-3 pb-2 sm:px-4">
          <div className="sem-barra -mx-1 flex gap-1 overflow-x-auto px-1">
            {SECCOES.map((seccao) => (
              <NavLink
                key={seccao.para}
                to={seccao.para}
                end={seccao.exato}
                className={({ isActive }) =>
                  juntar(
                    'flex shrink-0 items-center gap-1.5 rounded-pill px-3 py-2 text-sm font-bold transition',
                    isActive ? 'bg-azul-500 text-white' : 'text-tinta-suave hover:bg-azul-50',
                  )
                }
              >
                <span aria-hidden="true">{seccao.emoji}</span>
                {seccao.rotulo}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-conteudo flex-1 px-3 py-5 sm:px-4">
        <Outlet />
      </main>
    </div>
  );
}
