# Publicar no Render — passo a passo

Segue isto de cima a baixo. São cerca de dez minutos, quase tudo à espera do build.

O plano gratuito do Render tem duas limitações que este guia contorna: **só permite
uma base de dados PostgreSQL por conta** e **não dá acesso à Shell** do serviço.

---

## Antes de começar

Se já tentaste publicar e falhou, **apaga o Blueprint anterior** antes de repetir.
Um blueprint que falhou guarda o plano antigo e volta a tentar criar a base de dados
que rebentou, mesmo depois de corrigires o ficheiro.

No Render: **Dashboard → Blueprints →** o teu blueprint **→ Settings → Delete Blueprint**.
Apagar o blueprint não apaga bases de dados que já existam.

---

## Passo 1 — A base de dados

O `render.yaml` **não** cria a base de dados de propósito: declarar uma segunda base
de dados gratuita faz o blueprint inteiro falhar. Escolhe **um** destes caminhos.

### A. Ainda não tens nenhuma base de dados no Render

1. **New → Postgres**
2. Name: `armario-do-diogo-db` · Region: **Frankfurt** · Plan: **Free**
3. **Create Database** e espera até ficar *Available*
4. Copia a **Internal Database URL**

### B. Já tens uma base de dados gratuita noutro projeto

Podes partilhá-la sem misturar os dados. **Não é preciso mudar nada no código** —
o schema vai todo na ligação.

Copia a **Internal Database URL** dessa base de dados e acrescenta-lhe `?schema=`
no fim. Se a base de dados se chamar `quidiogo`, fica assim:

```
postgresql://utilizador:palavra-passe@dpg-….frankfurt-postgres.render.com/quidiogo?schema=armario_diogo
```

Se a ligação já tiver um `?` (raro), usa `&schema=armario_diogo` em vez de `?`.

O Prisma cria o schema `armario_diogo` no primeiro deploy e põe lá dentro tudo o
que é nosso — tabelas, tipos e o próprio histórico de migrações. A outra aplicação
continua no `public` e nunca se cruzam.

#### Os dados entram em choque?

Não. Um schema em PostgreSQL é um compartimento fechado: duas tabelas com o
**mesmo nome** em schemas diferentes são tabelas diferentes, sem qualquer relação.

Isto foi testado, e não deduzido. A simulação criou uma base de dados com outra
aplicação já instalada no `public`, incluindo tabelas `items` e `categories` — de
propósito, os mesmos nomes que os nossos — e instalou o Armário ao lado:

| Verificação | Resultado |
| ----------- | --------- |
| As tabelas da outra aplicação | intactas |
| Os dados da outra aplicação | intactos, linha a linha |
| `items` a existir nos dois schemas | sem colisão |
| As nossas tabelas no `public` | nenhuma |
| Histórico de migrações do Prisma | no nosso schema, separado |
| Tipos enum (`ItemStatus`, …) | no nosso schema |

Depois disso, as 53 verificações da API correram contra essa base de dados
partilhada — todas passaram, e os dados da outra aplicação continuaram intactos
no fim.

#### O que é mesmo partilhado

O compartimento é estanque, mas a **máquina** é a mesma. As duas aplicações
partilham:

- **Espaço em disco.** Este site ocupa muito pouco (algumas centenas de linhas);
  o que enche uma base de dados é a outra aplicação, não esta.
- **Ligações simultâneas.** Se a outra aplicação já usa muitas, podes limitar as
  nossas acrescentando `&connection_limit=5` ao fim da ligação.
- **A validade da base de dados.** Bases de dados gratuitas no Render expiram — a
  data está na página da base de dados. Quando essa expirar, **caem as duas
  aplicações**, não só uma.

### C. Queres uma base de dados só para isto

Apaga a que já tens (**confirma primeiro o que ela guarda** — é irreversível) ou
faz upgrade de uma delas para um plano pago. Depois segue o caminho A.

### Qual é, exatamente, o valor a copiar

Na página da base de dados, o Render mostra vários campos parecidos. **Só um serve.**

| Campo no Render | Serve? |
| --------------- | ------ |
| **Internal Database URL** | **Sim** — é este, se a base de dados e o serviço estiverem na mesma região |
| **External Database URL** | Sim, se estiverem em regiões diferentes |
| PSQL Command | Não — é um comando de terminal, começa por `PGPASSWORD=` |
| Hostname / Port / Database / Username | Não — são as peças soltas da ligação |

O valor certo tem esta forma, tudo numa linha:

```
postgresql://utilizador:palavra-passe@servidor.frankfurt-postgres.render.com/nome_da_base
```

Ao colar no painel do Render, **não ponhas aspas à volta**. As aspas só fazem
sentido dentro de um ficheiro `.env`; no painel passam a fazer parte do valor e a
ligação deixa de funcionar.

> **Internal ou External?** Usa a **Internal Database URL** se a base de dados
> estiver na mesma região do serviço web (Frankfurt). Se estiver noutra região,
> tem de ser a **External Database URL** — a interna não atravessa regiões.

---

## Passo 2 — O serviço web

1. **New → Blueprint**
2. Escolhe o repositório `DanielTorres24/ArmarioDoBebe`, branch `main`
3. O Render lê o [`render.yaml`](render.yaml) e pede as variáveis marcadas como
   `sync: false`. Preenche as quatro:

   | Variável | Valor |
   | -------- | ----- |
   | `DATABASE_URL` | a ligação do Passo 1 |
   | `ADMIN_EMAIL` | `admin` (ou um email, à tua escolha) |
   | `ADMIN_PASSWORD` | **uma palavra-passe forte** — ver aviso abaixo |
   | `ADMIN_NAME` | `Pais do Diogo` |

   O `JWT_SECRET` é gerado pelo Render e nunca passa pelo repositório.

4. **Apply**. O build demora alguns minutos.

> **Sobre a palavra-passe:** o site fica acessível a qualquer pessoa na internet, e
> `/admin` é o primeiro sítio onde alguém curioso vai bater. Não uses `admin123`.

---

## Passo 3 — Confirmar

Quando o deploy acabar, o Render dá-te um endereço tipo
`https://armario-do-diogo.onrender.com`.

| O quê | Onde | Esperado |
| ----- | ---- | -------- |
| API viva | `/api/health` | `{"status":"ok","database":"ok"}` |
| Site | `/` | a página inicial com os contadores |
| Área dos pais | `/admin` | o ecrã de login |

Entra em `/admin` com o `ADMIN_EMAIL` e a `ADMIN_PASSWORD` que escolheste.

O **primeiro pedido pode demorar cerca de um minuto**: o Render suspende serviços
gratuitos após algum tempo sem tráfego. Não é um erro.

---

## O que o build faz

```
npm run build && npm run seed
```

1. **verifica o ambiente** — para logo, com uma mensagem em português, se faltar
   `DATABASE_URL` ou `JWT_SECRET`
2. instala e compila o frontend para `server/public`
3. instala e compila o servidor, e gera o cliente Prisma
4. aplica as migrações (`prisma migrate deploy`)
5. **corre o seed** — cria categorias, faixas etárias, estados, preferências,
   artigos de exemplo e a conta dos pais

O seed corre no build porque o plano gratuito não dá Shell, e sem ele não haveria
como criar a conta de administrador. É idempotente: corre em todos os deploys sem
duplicar nada, e **nunca altera a palavra-passe de um administrador que já exista**.

---

## Se falhar

| Mensagem | O que se passa |
| -------- | -------------- |
| `cannot have more than one active free tier database` | O blueprint está a tentar criar uma base de dados e já tens uma gratuita. Confirma que o `render.yaml` do repositório não tem secção `databases:` e **apaga o blueprint antigo** antes de repetir. |
| `O build parou: ha variaveis de ambiente por corrigir` | A mensagem diz qual e porquê, e mostra o que recebeu (sem a palavra-passe). Ver a secção "Qual é, exatamente, o valor a copiar". |
| `DATABASE_URL: o valor esta entre aspas` | Tiraste a ligação de um `.env` com aspas. No painel do Render, cola-a sem aspas. |
| `DATABASE_URL: colaste o "PSQL Command"` | Copiaste o campo errado da página da base de dados. Procura **Internal Database URL**. |
| `tsc: not found`, `vite: not found` | As devDependencies não foram instaladas. O build já força `--include=dev`; confirma que estás no commit mais recente de `main`. |
| `Can't reach database server` | Ligação errada, ou estás a usar a *Internal* URL com a base de dados noutra região. Tenta a *External*. |
| `no equivalent in encoding "WIN1252"` | A base de dados não está em UTF8. As do Render estão sempre — isto só acontece num PostgreSQL local. |
| O site abre mas `/admin` diz que as credenciais estão erradas | O seed não chegou a criar a conta: `ADMIN_EMAIL`/`ADMIN_PASSWORD` não estavam definidas no momento do build. Define-as e faz **Manual Deploy → Clear build cache & deploy**. |

Os logs completos estão em **Dashboard → o serviço → Logs**. O erro real costuma
estar algumas linhas acima da última.

---

## Mudar a palavra-passe dos pais mais tarde

O seed não a altera se a conta já existir. Para a trocar, apaga a linha da tabela
`admin_users` (com um cliente PostgreSQL, ou `npx prisma studio` local apontado à
base de dados do Render), muda `ADMIN_PASSWORD` no painel e faz um novo deploy.
