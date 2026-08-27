import { Outlet, Link } from 'react-router-dom';

import { useCatalogo } from '../lib/catalogo';


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
            <span>{settings?.siteName ?? 'Armário do Diogo'}</span>
          </Link>

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
