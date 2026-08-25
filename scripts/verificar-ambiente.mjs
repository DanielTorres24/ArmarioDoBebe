/**
 * Corre no inicio do build. Falha depressa e em portugues claro quando falta
 * uma variavel de ambiente, em vez de deixar o Prisma rebentar mais a frente
 * com uma mensagem que nao ajuda ninguem.
 */

const obrigatorias = [
  {
    nome: 'DATABASE_URL',
    porque: 'ligacao ao PostgreSQL',
    valida: (v) => v.startsWith('postgres://') || v.startsWith('postgresql://'),
    problema: 'tem de comecar por postgresql:// — no Render e a "Internal Database URL" da base de dados.',
  },
  {
    nome: 'JWT_SECRET',
    porque: 'assinatura das sessoes dos pais',
    valida: (v) => v.length >= 16,
    problema: 'tem de ter pelo menos 16 caracteres. No Render usa generateValue: true.',
  },
];

const recomendadas = [
  ['ADMIN_EMAIL', 'sem isto o seed nao cria a conta dos pais e nao consegues entrar em /admin'],
  ['ADMIN_PASSWORD', 'idem — e escolhe uma palavra-passe forte, o site fica publico'],
];

const erros = [];
const avisos = [];

for (const { nome, porque, valida, problema } of obrigatorias) {
  const valor = process.env[nome];
  if (!valor || !valor.trim()) {
    erros.push(`${nome} nao esta definida (${porque}).`);
  } else if (!valida(valor.trim())) {
    erros.push(`${nome} ${problema}`);
  }
}

for (const [nome, porque] of recomendadas) {
  if (!process.env[nome]?.trim()) avisos.push(`${nome} nao esta definida — ${porque}.`);
}

for (const aviso of avisos) console.warn(`aviso: ${aviso}`);

if (erros.length > 0) {
  console.error('\nO build parou: faltam variaveis de ambiente.\n');
  for (const erro of erros) console.error(`  - ${erro}`);
  console.error(
    '\nNo Render: painel do servico > Environment. As instrucoes completas estao' +
      '\nno README, seccao "Deploy no Render".\n',
  );
  process.exit(1);
}

console.log('Ambiente verificado: DATABASE_URL e JWT_SECRET presentes.');
