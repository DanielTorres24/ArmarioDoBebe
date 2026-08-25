# O Armário do Diogo 💙

Aplicação do baby shower do bebé Diogo. Os convidados veem **o que ele já tem**, **o que ainda faz
falta** e **o que é mais desejado**, reservam a prenda que vão dar (para ninguém repetir) e podem
acrescentar ao armário o que trouxeram. Os pais controlam tudo numa área de administração.

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + React Router
- **Backend:** Node.js + TypeScript + Express
- **Base de dados:** PostgreSQL com Prisma ORM
- **Deploy:** Render (um serviço web + uma base de dados)

---

## As duas áreas

### Área pública — para os convidados

| Página | Endereço | O que responde |
| ------ | -------- | -------------- |
| 🏠 Início | `/` | O que é isto, os números do armário e o que faz mais falta agora |
| 🎁 Faz falta | `/precisamos` | Tudo o que está como *Faz falta* ou *Muito desejado* — com o botão de reservar |
| ⭐ Desejados | `/mais-desejados` | Só os muito desejados, por ordem de prioridade |
| 📦 Armário | `/armario` | Tudo o que existe, e onde se acrescenta o que o Diogo já tem |
| 🤔 Sugestões | `/sugestoes` | Ideias de prenda por faixa de orçamento |
| 💙 Gostos | `/preferencias` | O que os pais gostam, evitam e já têm de sobra |

### Área dos pais — protegida por palavra-passe

| Página | Endereço | O que permite |
| ------ | -------- | ------------- |
| 📊 Dashboard | `/admin` | Números, artigos por categoria, últimos artigos e reservas |
| 📦 Armário | `/admin/items` | Criar, editar e remover **qualquer** artigo, com estado, prioridade, preços, link e destaque |
| 🏷️ Categorias | `/admin/categories` | Categorias, faixas etárias e o texto/ícone/cor de cada estado |
| 🎁 Sugestões | `/admin/suggestions` | Ideias por orçamento — mostra em que faixas cada uma aparece |
| 🤝 Reservas | `/admin/reservations` | Quem se ofereceu para dar o quê, com nome, email e recado |
| 💙 Preferências | `/admin/preferences` | Os gostos dos pais, reordenáveis |
| ⚙️ Definições | `/admin/settings` | Nome do bebé, todos os textos do site e as regras das reservas |

---

## Como funcionam os estados

Cada artigo tem um estado, definido pelos pais. O nome, o ícone, a cor e a explicação são todos
editáveis em `/admin/categories`.

| Estado | Valor interno | Significa |
| ------ | ------------- | --------- |
| 🟢 Faz falta | `NEEDED` | Seria uma prenda útil — ainda não temos |
| ⭐ Muito desejado | `WANTED` | Uma das coisas que os pais mais gostavam de receber |
| 🟡 Já temos alguns | `SOME` | Já há alguns, mas mais unidades dão jeito |
| 🔴 Já temos | `OWNED` | Não é preciso oferecer mais |

A prioridade vai de **1 (baixa)** a **5 (prioridade máxima)** e ordena a página dos mais desejados.

Quando um **convidado** acrescenta algo ao armário, o artigo entra automaticamente como `OWNED` —
acrescentar significa "isto já existe". Só os pais atribuem os outros estados.

---

## Reservas e privacidade

Quem encontra uma prenda carrega em **🎁 Quero oferecer isto** e escolhe:

- **🤔 Estou a pensar oferecer** (`THINKING`) — fica assinalado, mas não é uma promessa
- **🎁 Vou oferecer este artigo** (`RESERVED`) — fica reservado e mais ninguém o pode reservar

Depois pode voltar atrás: **💙 Já ofereci** (`GIFTED`) ou cancelar.

Um artigo só aceita **uma reserva ativa** — a segunda tentativa recebe `409` e uma mensagem a pedir
que atualize a página.

Em `/admin/settings` os pais escolhem quem vê o nome de quem reservou:

| Opção | Na área pública aparece |
| ----- | ----------------------- |
| `PUBLIC` | "🎁 A Ana vai oferecer esta prenda" |
| `ADMIN_ONLY` | "🎁 Esta prenda já foi reservada" (só os pais veem o nome) |
| `HIDDEN` | "🎁 Esta prenda já foi reservada" |

**Quem reservou vê sempre a sua própria reserva**, seja qual for a definição — senão não conseguiria
geri-la. Os pais veem sempre tudo, incluindo o email.

As reservas podem ainda ser desligadas por completo, e o estado "estou a pensar" e o cancelamento
podem ser desativados separadamente.

---

## Identidade e permissões

Os convidados **não criam conta**. Quando fazem algo que precisa de nome, a aplicação pede-o e
guarda no `localStorage`:

```json
{ "id": "uuid-gerado-no-navegador", "name": "Maria Silva" }
```

- **`ownerId` / `guestId`** — um UUID gerado no navegador. É **este** valor que o servidor compara
  para autorizar edições, remoções e reservas.
- **`ownerName` / `guestName`** — apenas o nome mostrado.

| Pode… | Convidado | Pais |
| ----- | :-------: | :--: |
| Ver tudo, pesquisar e filtrar | ✅ | ✅ |
| Acrescentar artigos ao armário | ✅ | ✅ |
| Editar/remover artigos **próprios** | ✅ | ✅ |
| Editar/remover artigos **de outros** | ❌ | ✅ |
| Reservar prendas | ✅ | — |
| Gerir reservas **próprias** | ✅ | ✅ (todas) |
| Categorias, estados, textos, sugestões | ❌ | ✅ |

O servidor valida sempre — o frontend esconder um botão não é segurança. Um `PUT`/`DELETE` com o
`ownerId` errado devolve `403` mesmo que o pedido venha direto à API.

> **Nota de segurança:** o `guestId` vem do navegador, portanto é um mecanismo de conveniência entre
> convidados de um baby shower, não uma autenticação forte. Quem souber mexer nas ferramentas de
> programador consegue passar-se por outro convidado. A separação `guestId` / `guestName` foi feita
> para que trocar isto por autenticação a sério (magic link, OAuth) exija mudar só a origem do
> `guestId` no servidor. **A área dos pais é diferente**: usa email + palavra-passe com hash bcrypt
> e sessões assinadas (JWT).

---

## Estrutura do projeto

```
ArmarioDiogo/
├── client/                       Frontend React + TypeScript + Vite
│   ├── tailwind.config.js        Paleta (azul bebé) e tokens do design
│   ├── public/icons/             Ilustrações otimizadas (192px)
│   └── src/
│       ├── App.tsx               Rotas públicas e de administração
│       ├── types.ts              Tipos partilhados com a API
│       ├── index.css             Base do Tailwind + componentes (.cartao, .campo)
│       ├── lib/
│       │   ├── api.ts            Cliente da API (público + admin)
│       │   ├── catalogo.tsx      Contexto: definições, categorias, estados, convidado
│       │   ├── guest.ts          Identidade local do convidado (UUID)
│       │   ├── adminAuth.ts      Token da sessão dos pais
│       │   └── format.ts         Preços, plurais e datas
│       ├── components/
│       │   ├── ui/               Botão, Modal, Etiqueta, Campo, Toast, estados vazios
│       │   ├── admin/            Moldura da área dos pais
│       │   ├── ListaDeArtigos.tsx  O miolo partilhado pelas páginas de artigos
│       │   ├── ItemCard.tsx      Cartão de artigo
│       │   ├── ReserveModal.tsx  "Quero oferecer isto"
│       │   └── ...
│       └── pages/                Uma por endereço, mais pages/admin/
├── server/                       API Express + TypeScript
│   ├── prisma/
│   │   ├── schema.prisma         10 tabelas e 3 enums
│   │   ├── migrations/           Migração inicial, pronta para `migrate deploy`
│   │   └── seed.ts               Administrador, categorias, estados e dados de exemplo
│   └── src/
│       ├── index.ts              Servidor, middlewares, ficheiros estáticos, erros
│       ├── env.ts                Validação das variáveis de ambiente (falha cedo)
│       ├── lib/                  prisma, auth (bcrypt+JWT), validation (zod), settings
│       └── routes/
│           ├── public/           items, catalogo, reservations
│           └── admin/            tudo o resto, atrás de `requireAdmin`
├── assets/                       Ilustrações originais
├── demo/index.html               Maqueta estática da 1.ª versão (histórico)
├── .env.example                  Variáveis de ambiente documentadas
├── render.yaml                   Blueprint de deploy
└── package.json                  Scripts que orquestram client + server
```

---

## Instalação local

### 1. Pré-requisitos

- Node.js 18 ou superior
- PostgreSQL **em UTF8** (os ícones das categorias são emojis)

### 2. Instalar

```bash
npm run setup
```

Instala as dependências da raiz, do `server` e do `client`, e gera o Prisma Client.

### 3. Configurar

```bash
cp .env.example server/.env
```

Preenche em `server/.env`:

- `DATABASE_URL` — a ligação ao teu PostgreSQL
- `JWT_SECRET` — um valor aleatório longo (`openssl rand -base64 32`)
- `ADMIN_EMAIL` e `ADMIN_PASSWORD` — a conta dos pais que o seed vai criar.
  O `ADMIN_EMAIL` pode ser um email ou um nome de utilizador simples (ex.: `admin`).

As credenciais vivem sempre no `.env` (ignorado pelo Git) — nunca no código. O servidor recusa
arrancar se faltar alguma coisa, dizendo qual.

### 4. Criar as tabelas e os dados iniciais

```bash
npm run migrate
npm run seed
```

O seed é **idempotente** — pode correr as vezes que forem precisas. Cria o administrador, as 8
categorias, as 5 faixas etárias, os 4 estados, 6 preferências, 14 artigos de exemplo e 12 sugestões.
Se o administrador já existir, a palavra-passe **não** é alterada.

### 5. Arrancar

```bash
npm run dev
```

- Frontend: <http://localhost:5173>
- API: <http://localhost:4000>
- Área dos pais: <http://localhost:5173/admin>

O Vite encaminha `/api` para o backend, por isso não é preciso configurar URLs no frontend.

### Como entrar na área dos pais

1. Abre **<http://localhost:5173/admin>** (ou carrega em *Área dos pais*, no rodapé do site).
2. Entra com o `ADMIN_EMAIL` e o `ADMIN_PASSWORD` que puseste no `server/.env`.

Sem sessão, `/admin` reencaminha sempre para `/admin/login`. A sessão fica no `sessionStorage`:
fechar o separador termina-a.

**Mudar a palavra-passe:** o seed nunca altera a palavra-passe de um administrador que já exista.
Para a trocar, apaga a linha e volta a semear:

```bash
npx prisma studio          # na pasta server/ — apaga a linha em admin_users
npm run seed               # cria de novo com os valores do .env
```

### Outros comandos

```bash
npm run typecheck   # TypeScript do servidor e do cliente
npm run build       # compila tudo e aplica migrações
npm start           # serve API + frontend na mesma porta
```

---

## Deploy no Render

### Opção A — Blueprint (recomendado)

1. Faz push para um repositório no GitHub.
2. No Render: **New → Blueprint** e escolhe o repositório.
3. O [`render.yaml`](render.yaml) cria o serviço web, a base de dados PostgreSQL, liga o
   `DATABASE_URL` e **gera automaticamente o `JWT_SECRET`**.
4. Antes de confirmar, preenche `ADMIN_EMAIL` e `ADMIN_PASSWORD` (estão marcados como `sync: false`,
   ou seja, o Render pede-tos e nunca ficam no repositório).
5. Depois do primeiro deploy, abre a **Shell** do serviço e corre uma vez:

   ```bash
   npm run seed
   ```

   Isto cria a conta dos pais e os dados iniciais. Já podes entrar em `/admin`.

### Opção B — Manual

| Definição | Valor |
| --------- | ----- |
| Runtime | Node |
| Build Command | `npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

Variáveis: `DATABASE_URL` (Internal Database URL do PostgreSQL do Render), `NODE_ENV=production`,
`JWT_SECRET` (valor aleatório), `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CORS_ORIGIN` vazio. O `PORT` é
definido pelo Render.

As migrações correm sozinhas durante o build (`prisma migrate deploy`).

---

## API

Base: `/api`. Os pedidos de convidado enviam o cabeçalho `X-Guest-Id`; os de administração enviam
`Authorization: Bearer <token>`.

### Pública

| Método | Endpoint | Notas |
| ------ | -------- | ----- |
| `GET` | `/api/health` | Estado do servidor e da base de dados |
| `GET` | `/api/settings` | Textos e regras do site |
| `GET` | `/api/categories` · `/api/age-ranges` · `/api/statuses` | Listas configuráveis (só as ativas) |
| `GET` | `/api/preferences` | Gostos dos pais |
| `GET` | `/api/suggestions?minPrice=&maxPrice=` | Sugestões que se cruzam com a faixa |
| `GET` | `/api/items` | Filtros: `search`, `category`, `status`, `ageRange`, `priority`, `minPrice`, `maxPrice`, `reserved`, `mine`, `sort` |
| `GET` | `/api/items/:id` | |
| `POST` | `/api/items` | Cria como `OWNED`, associado ao `ownerId` |
| `PUT` / `DELETE` | `/api/items/:id` | **403** se o `ownerId` não for o dono |
| `GET` | `/api/reservations` | Só as do próprio convidado |
| `POST` | `/api/reservations` | **409** se já estiver reservado |
| `PUT` / `DELETE` | `/api/reservations/:id` | **403** se não for quem reservou |

### Administração — todas exigem sessão

`POST /api/admin/auth/login` · `GET /api/admin/auth/me` · `GET /api/admin/dashboard`

CRUD completo em `/api/admin/items`, `/api/admin/categories`, `/api/admin/age-ranges`,
`/api/admin/suggestions`, `/api/admin/preferences`; `PUT /api/admin/statuses/:status`;
`GET` + `DELETE /api/admin/reservations`; `GET` + `PUT /api/admin/settings`.

Erros previsíveis: **400** validação (com `details` campo a campo), **401** sessão,
**403** permissão, **404** inexistente, **409** conflito (reserva ocupada, categoria em uso).

---

## O que foi testado

Contra um **PostgreSQL real**, com o servidor a correr:

- **52 testes de API** — catálogo, sugestões por orçamento, criação de artigos, as permissões entre
  dois convidados diferentes, o ciclo completo das reservas (incluindo o conflito de dois
  convidados a reservar a mesma prenda), autenticação (password errada, token inventado, mensagem
  que não revela se o email existe), gestão pelos pais, as três opções de privacidade e a proteção
  contra apagar categorias em uso.
- **27 testes de interface** num telemóvel emulado (390×844) e no desktop — navegar todas as
  páginas, reservar uma prenda de ponta a ponta, acrescentar um artigo, entrar na área dos pais com
  a password errada e depois com a certa, e confirmar que não há scroll horizontal.

Não testado: envio de emails (não existe), carregamento de imagens para os artigos (só se guarda o
link) e o comportamento com muitos milhares de artigos.

---

## Qualidade e experiência

- TypeScript **strict** nas duas pontas
- Validação com **zod** no servidor e validação campo a campo no cliente, em português
- Estados de carregamento (esqueletos), vazios distintos ("nada aqui" vs "nada encontrado") e erro
  com botão de repetir
- Confirmação antes de qualquer remoção
- Acessibilidade: link para saltar o conteúdo, foco preso nos modais, fecho com `Esc`, `aria-live`,
  `aria-invalid` nos campos com erro, áreas de toque ≥ 40 px e campos de 16 px (evitam o zoom do iOS)
- Mobile-first: o layout foi verificado dos 280 px ao desktop
