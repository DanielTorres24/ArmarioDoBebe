import { NavLink, Outlet, Link } from 'react-router-dom';

import { useCatalogo } from '../lib/catalogo';
import { juntar } from './ui';

const LIGACOES = [
  { para: '/', rotulo: 'Início', emoji: '🏠', exato: true },
  { para: '/precisamos', rotulo: 'Faz falta', emoji: '🎁' },
  { para: '/mais-desejados', rotulo: 'Desejados', emoji: '⭐' },
  { para: '/armario', rotulo: 'Armário', emoji: '📦' },
  { para: '/sugestoes', rotulo: 'Sugestões', emoji: '🤔' },
  { para: '/preferencias', rotulo: 'Gostos', emoji: '💙' },
];

/** Moldura da área pública: navegação, conteúdo e rodapé. */
export default function Layout() {
  const { settings } = useCatalogo();

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-0 focus:top-0 focus:z-50 focus:rounded-br-2xl focus:bg-white focus:px-4 focus:py-3 focus:font-bold"
      >
        Saltar para o conteúdo
      </a>

      <header className="sticky top-0 z-30 border-b border-azul-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-conteudo items-center gap-3 px-3 py-2.5 sm:px-4">
          <Link to="/" className="flex shrink-0 items-center gap-2 font-extrabold text-azul-900">
            <img src="/icons/principal.png" alt="" width={36} height={36} className="h-9 w-9 object-contain" />
            <span className="hidden sm:inline">{settings?.siteName ?? 'Armário do Diogo'}</span>
          </Link>

          <nav aria-label="Navegação principal" className="sem-barra -mx-1 flex flex-1 gap-1 overflow-x-auto px-1">
            {LIGACOES.map((ligacao) => (
              <NavLink
                key={ligacao.para}
                to={ligacao.para}
                end={ligacao.exato}
                className={({ isActive }) =>
                  juntar(
                    'flex shrink-0 items-center gap-1.5 rounded-pill px-3 py-2 text-sm font-bold transition',
                    isActive ? 'bg-azul-500 text-white' : 'text-tinta-suave hover:bg-azul-50',
                  )
                }
              >
                <span aria-hidden="true">{ligacao.emoji}</span>
                <span>{ligacao.rotulo}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main id="conteudo" className="mx-auto w-full max-w-conteudo flex-1 px-3 py-5 sm:px-4 sm:py-8">
        <Outlet />
      </main>

      <footer className="border-t border-azul-100 bg-white px-4 py-6 text-center text-sm text-tinta-suave">
        <p>{settings?.footerText ?? 'Feito com carinho para o pequeno Diogo 💙👶'}</p>
        <Link to="/admin" className="mt-2 inline-block text-xs underline underline-offset-2">
          Área dos pais
        </Link>
      </footer>
    </div>
  );
}
