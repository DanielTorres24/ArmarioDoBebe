import { useEffect, useState } from 'react';

import { EstadoVazio, Esqueleto } from '../components/ui';
import { api } from '../lib/api';
import { useCatalogo } from '../lib/catalogo';
import type { ParentPreference } from '../types';

/** O que os pais gostam — para ajudar quem não sabe o que escolher. */
export default function Preferencias() {
  const { settings } = useCatalogo();
  const [preferencias, setPreferencias] = useState<ParentPreference[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;

    api
      .preferences()
      .then((lista) => ativo && setPreferencias(lista))
      .catch((problema: unknown) => {
        if (ativo) setErro(problema instanceof Error ? problema.message : 'Não foi possível carregar.');
      })
      .finally(() => ativo && setCarregando(false));

    return () => {
      ativo = false;
    };
  }, []);

  return (
    <>
      <header className="mb-5">
        <h1 className="text-3xl">{settings?.preferencesTitle ?? '💙 Algumas coisas que gostamos'}</h1>
        {settings?.preferencesIntro && (
          <p className="mt-2 max-w-2xl text-tinta-suave">{settings.preferencesIntro}</p>
        )}
      </header>

      <section aria-busy={carregando}>
        {carregando && (
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((indice) => (
              <div className="cartao p-5" key={indice}>
                <Esqueleto className="mb-2 h-5 w-3/4" />
                <Esqueleto className="h-3 w-full" />
              </div>
            ))}
          </div>
        )}

        {!carregando && erro && <EstadoVazio emoji="😕" titulo="Não foi possível carregar" texto={erro} />}

        {!carregando && !erro && preferencias.length === 0 && (
          <EstadoVazio
            imagem="/icons/principal.png"
            titulo="Ainda não há preferências"
            texto="Os pais ainda não escreveram nada aqui."
          />
        )}

        {!carregando && !erro && preferencias.length > 0 && (
          <ul className="grid gap-3 sm:grid-cols-2">
            {preferencias.map((preferencia) => (
              <li key={preferencia.id} className="cartao flex items-start gap-3.5 p-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-azul-100 text-2xl" aria-hidden="true">
                  {preferencia.icon}
                </span>
                <div>
                  <h2 className="text-base [overflow-wrap:anywhere]">{preferencia.title}</h2>
                  {preferencia.description && (
                    <p className="mt-1 text-sm text-tinta-suave [overflow-wrap:anywhere]">
                      {preferencia.description}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
