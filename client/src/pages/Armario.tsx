import ListaDeArtigos from '../components/ListaDeArtigos';

/** Tudo o que existe no armário, sem filtro de estado imposto. */
export default function Armario() {
  return (
    <>
      <header className="mb-5">
        <h1 className="text-3xl">📦 Tudo o que já temos</h1>
        <p className="mt-2 max-w-2xl text-tinta-suave">
          O armário completo do Diogo. Vê o que já existe antes de escolheres a prenda — e se
          souberes de alguma coisa que falta aqui, acrescenta-a.
        </p>
      </header>

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
