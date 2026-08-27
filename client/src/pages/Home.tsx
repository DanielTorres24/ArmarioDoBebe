import { useEffect, useRef, useState } from 'react';

import Categorias from '../components/Categorias';
import ListaDeArtigos from '../components/ListaDeArtigos';
import NotaDePrendas from '../components/NotaDePrendas';
import RoupaPorTamanho from '../components/RoupaPorTamanho';
import SugestoesSeccao from '../components/SugestoesSeccao';
import Verificador from '../components/Verificador';
import { Esqueleto } from '../components/ui';
import { api } from '../lib/api';
import { pecas } from '../lib/format';
import { useCatalogo } from '../lib/catalogo';
import type { Estatisticas } from '../types';

/**
 * A área pública, numa página só.
 *
 * A ordem responde à pergunta de quem chega, por esta ordem: "posso oferecer
 * isto?" (verificador), "o que é que já têm?" (categorias e lista), "e de
 * roupa?" (por tamanho), "então o que ofereço?" (sugestões).
 */
export default function Home() {
  const { settings, carregando: aCarregarSite } = useCatalogo();

  const [stats, setStats] = useState<Estatisticas | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [selecao, setSelecao] = useState<{ category: string | null; ageRange: string | null }>({
    category: null,
    ageRange: null,
  });

  const lista = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ativo = true;

    api
      .stats()
      .then((numeros) => ativo && setStats(numeros))
      .catch(() => undefined)
      .finally(() => ativo && setCarregando(false));

    return () => {
      ativo = false;
    };
  }, []);

  /** Escolher uma categoria ou um tamanho filtra a lista e leva-nos até lá. */
  const escolher = (campo: 'category' | 'ageRange') => (id: string | null) => {
    setSelecao(campo === 'category' ? { category: id, ageRange: null } : { category: null, ageRange: id });
    if (id) lista.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      {/* ------------------------------- Hero ------------------------------- */}
      <section className="relative mb-6 overflow-hidden rounded-card bg-gradient-to-br from-azul-400 to-azul-100 px-4 py-10 text-center sm:px-8 sm:py-14">
        <img
          src="/icons/principal.png"
          alt=""
          width={112}
          height={112}
          className="mx-auto mb-4 h-24 w-24 rounded-full bg-white/90 p-2.5 shadow-suave sm:h-28 sm:w-28"
        />

        {aCarregarSite ? (
          <Esqueleto className="mx-auto h-10 w-2/3" />
        ) : (
          <h1 className="text-balance text-[1.7rem] text-azul-900 sm:text-5xl">{settings?.heroTitle}</h1>
        )}

        <p className="mx-auto mt-4 max-w-2xl text-azul-900/80 sm:text-lg">{settings?.heroSubtitle}</p>

        {stats && (
          <p className="mt-4 font-extrabold text-azul-900">
            {stats.totalUnidades === 0
              ? 'Ainda não há nada registado.'
              : `${pecas(stats.totalUnidades)} no armário, em ${stats.totalArtigos} artigos.`}
          </p>
        )}
      </section>

      <NotaDePrendas className="mb-6" />

      {/* ---------------------------- Verificador --------------------------- */}
      <div className="mb-8">
        <Verificador />
      </div>

      {/* ---------------------------- Categorias ---------------------------- */}
      <div className="mb-8">
        <Categorias
          dados={stats?.porCategoria ?? []}
          carregando={carregando}
          escolhida={selecao.category}
          onEscolher={escolher('category')}
        />
      </div>

      {/* ------------------------- Tudo o que já tem ------------------------ */}
      <div className="mb-8 scroll-mt-20" ref={lista}>
        <h2 className="mb-3 text-lg">📦 Tudo o que o Diogo já tem</h2>
        <ListaDeArtigos
          selecao={selecao}
          vazio={{
            imagem: '/icons/principal.png',
            titulo: 'O armário ainda está vazio',
            texto: 'Sê a primeira pessoa a acrescentar alguma coisa!',
          }}
        />
      </div>

      {/* -------------------------- Roupa por tamanho ----------------------- */}
      <div className="mb-8">
        <RoupaPorTamanho
          dados={stats?.roupaPorTamanho ?? []}
          semTamanho={stats?.roupaSemTamanho}
          carregando={carregando}
          escolhido={selecao.ageRange}
          onEscolher={escolher('ageRange')}
        />
      </div>

      {/* ------------------------------ Sugestões --------------------------- */}
      <SugestoesSeccao />
    </>
  );
}
