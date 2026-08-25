import ListaDeArtigos from '../components/ListaDeArtigos';

/** Só o que faz falta ou é muito desejado — a página mais importante. */
export default function Precisamos() {
  return (
    <>
      <header className="mb-5">
        <h1 className="text-3xl">🎁 O que ainda pode fazer falta</h1>
        <p className="mt-2 max-w-2xl text-tinta-suave">
          Estas são as coisas que dariam mesmo jeito. Carrega em <strong>Quero oferecer isto</strong>{' '}
          para reservares a prenda e ninguém repetir.
        </p>
      </header>

      <ListaDeArtigos
        filtrosFixos={{ status: 'NEEDED,WANTED' }}
        ordemInicial="priority"
        mostrarFiltroDeEstado={false}
        permitirAdicionar={false}
        vazio={{
          imagem: '/icons/sapatilhas.png',
          titulo: 'Está tudo tratado!',
          texto: 'De momento os pais não assinalaram nada em falta. Volta a espreitar mais tarde.',
        }}
      />
    </>
  );
}
