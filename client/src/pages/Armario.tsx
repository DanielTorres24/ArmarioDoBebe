import { useEffect, useState } from 'react';

import ListaDeArtigos from '../components/ListaDeArtigos';
import NotaDePrendas from '../components/NotaDePrendas';
import RoupaPorTamanho from '../components/RoupaPorTamanho';
import { api } from '../lib/api';
import { pecas } from '../lib/format';
import type { Estatisticas } from '../types';

/** Tudo o que existe no armário, sem filtro de estado imposto. */
export default function Armario() {
  const [stats, setStats] = useState<Estatisticas | null>(null);
  const [carregando, setCarregando] = useState(true);

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

  return (
    <>
      <header className="mb-5">
        <h1 className="text-3xl">📦 Tudo o que já temos</h1>
        <p className="mt-2 max-w-2xl text-tinta-suave">
          O armário completo do Diogo. Vê o que já existe antes de escolheres a prenda — e se
          souberes de alguma coisa que falta aqui, acrescenta-a.
        </p>
        {stats && (
          <p className="mt-2 font-bold text-azul-700">
            {stats.totalUnidades === 0
              ? 'Ainda não há nada registado.'
              : `${pecas(stats.totalUnidades)} no armário, em ${stats.totalArtigos} artigos.`}
          </p>
        )}
      </header>

      <NotaDePrendas className="mb-5" />

      <div className="mb-6">
        <RoupaPorTamanho
          dados={stats?.roupaPorTamanho ?? []}
          semTamanho={stats?.roupaSemTamanho}
          carregando={carregando}
        />
      </div>

      <ListaDeArtigos
        vazio={{
          imagem: '/icons/principal.png',
          titulo: 'O armário ainda está vazio',
          texto: 'Sê a primeira pessoa a acrescentar alguma coisa!',
        }}
      />
    </>
  );
}
