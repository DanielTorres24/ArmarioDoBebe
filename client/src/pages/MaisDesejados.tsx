import ListaDeArtigos from '../components/ListaDeArtigos';

/** Os artigos marcados como muito desejados, por ordem de prioridade. */
export default function MaisDesejados() {
  return (
    <>
      <header className="mb-5">
        <h1 className="text-3xl">⭐ Os mais desejados</h1>
        <p className="mt-2 max-w-2xl text-tinta-suave">
          As coisas que os pais mais gostavam de receber, das mais importantes para as menos
          urgentes.
        </p>
      </header>

      <ListaDeArtigos
        filtrosFixos={{ status: 'WANTED' }}
        ordemInicial="priority"
        mostrarFiltroDeEstado={false}
        permitirAdicionar={false}
        vazio={{
          imagem: '/icons/laco.png',
          titulo: 'Ainda não há nada nesta lista',
          texto: 'Os pais ainda não assinalaram nenhuma prenda como muito desejada.',
        }}
      />
    </>
  );
}
