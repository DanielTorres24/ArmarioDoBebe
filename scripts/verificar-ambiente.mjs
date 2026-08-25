/**
 * Corre no inicio do build. Falha depressa e em portugues claro quando falta
 * uma variavel de ambiente, em vez de deixar o Prisma rebentar mais a frente
 * com uma mensagem que nao ajuda ninguem.
 *
 * Quando um valor esta errado, diz *o que* la esta — sem nunca imprimir a
 * palavra-passe.
 */

/** Mostra o suficiente para se perceber o erro, escondendo as credenciais. */
function amostra(valor) {
  const v = valor.trim();
  if (v.includes('://')) {
    const [esquema, resto] = v.split('://', 2);
    const anfitriao = resto.includes('@') ? resto.slice(resto.indexOf('@') + 1) : resto;
    return `"${esquema}://…@${anfitriao.split('/')[0] || '?'}" (${v.length} caracteres)`;
  }
  // Ex.: o "PSQL Command" do Render comeca por PGPASSWORD=<palavra-passe>.
  const semSegredos = v.replace(/([\w]*(?:PASSWORD|PASSWD|PWD)[\w]*)=\S+/gi, '$1=…');
  const inicio = semSegredos.slice(0, 24).replace(/\s+/g, ' ');
  return `"${inicio}${semSegredos.length > 24 ? '…' : ''}" (${v.length} caracteres)`;
}

/** Diagnostico especifico para os enganos mais comuns ao copiar do Render. */
function diagnosticarLigacao(bruto) {
  const v = bruto.trim();
  const semAspas = v.replace(/^['"]|['"]$/g, '');

  if (semAspas !== v && /^postgres(ql)?:\/\//.test(semAspas)) {
    return 'o valor esta entre aspas. No painel do Render mete a ligacao sem aspas — as aspas so fazem sentido dentro de um ficheiro .env.';
  }
  if (/^postgres(ql)?:\/\//.test(v)) return null; // esta bem

  if (/\bpsql\b/.test(v)) {
    return 'colaste o "PSQL Command" do Render. O que faz falta e a "Internal Database URL" (ou "External"), mais abaixo na mesma pagina — comeca por postgresql://.';
  }
  if (/^rediss?:\/\//.test(v)) {
    return 'isso e a ligacao de um Key Value/Redis, nao do PostgreSQL. Abre a base de dados Postgres e copia a "Internal Database URL".';
  }
  if (/^https?:\/\//.test(v)) {
    return 'colaste um endereco do painel do Render, nao a ligacao a base de dados. Procura "Internal Database URL" na pagina da base de dados.';
  }
  if (/^[\w.-]+\.render\.com$/.test(v) || !v.includes('://')) {
    return 'isto parece so o nome do servidor, nao a ligacao completa. A ligacao tem a forma postgresql://utilizador:palavra-passe@servidor/base_de_dados.';
  }
  return 'tem de comecar por postgresql:// — no Render e a "Internal Database URL" da base de dados (ou a "External" se a base de dados estiver noutra regiao).';
}

const erros = [];
const avisos = [];

// ---------------------------------------------------------------- DATABASE_URL
const ligacao = process.env.DATABASE_URL;
if (!ligacao || !ligacao.trim()) {
  erros.push(['DATABASE_URL', 'nao esta definida (ligacao ao PostgreSQL).', null]);
} else {
  const problema = diagnosticarLigacao(ligacao);
  if (problema) erros.push(['DATABASE_URL', problema, amostra(ligacao)]);
}

// ------------------------------------------------------------------ JWT_SECRET
const segredo = process.env.JWT_SECRET;
if (!segredo || !segredo.trim()) {
  erros.push(['JWT_SECRET', 'nao esta definida (assinatura das sessoes dos pais).', null]);
} else if (segredo.trim().length < 16) {
  erros.push([
    'JWT_SECRET',
    'tem de ter pelo menos 16 caracteres. No Render usa generateValue: true e deixa o Render escolher.',
    `${segredo.trim().length} caracteres`,
  ]);
}

// ------------------------------------------------------------------ conta admin
for (const [nome, porque] of [
  ['ADMIN_EMAIL', 'sem isto o seed nao cria a conta dos pais e nao consegues entrar em /admin'],
  ['ADMIN_PASSWORD', 'idem — e escolhe uma palavra-passe forte, o site fica publico'],
]) {
  if (!process.env[nome]?.trim()) avisos.push(`${nome} nao esta definida — ${porque}.`);
}

for (const aviso of avisos) console.warn(`aviso: ${aviso}`);

if (erros.length > 0) {
  console.error('\nO build parou: ha variaveis de ambiente por corrigir.\n');
  for (const [nome, problema, encontrado] of erros) {
    console.error(`  ${nome}: ${problema}`);
    if (encontrado) console.error(`    recebido: ${encontrado}`);
  }
  console.error(
    '\nOnde corrigir: painel do Render > o servico > Environment.' +
      '\nGuia passo a passo: DEPLOY.md no repositorio.\n',
  );
  process.exit(1);
}

console.log('Ambiente verificado: DATABASE_URL e JWT_SECRET presentes e com bom aspeto.');
