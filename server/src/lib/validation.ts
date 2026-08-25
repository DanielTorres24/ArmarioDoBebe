import { z } from 'zod';

/**
 * Esquemas de validação partilhados pelas rotas.
 * As mensagens estão em português porque são mostradas tal e qual ao utilizador.
 */

const texto = (max: number, obrigatorio: string) =>
  z.string({ required_error: obrigatorio, invalid_type_error: obrigatorio }).trim().max(max);

const textoOpcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((valor) => (valor === '' ? null : valor))
    .nullable()
    .optional();

const urlOpcional = z
  .string()
  .trim()
  .max(500)
  .url('O endereço tem de ser um link válido (começado por http).')
  .or(z.literal(''))
  .transform((valor) => (valor === '' ? null : valor))
  .nullable()
  .optional();

export const itemStatus = z.enum(['NEEDED', 'WANTED', 'SOME', 'OWNED'], {
  errorMap: () => ({ message: 'Escolhe um estado válido.' }),
});

export const reservationStatus = z.enum(['THINKING', 'RESERVED', 'GIFTED', 'CANCELLED'], {
  errorMap: () => ({ message: 'Escolhe um estado de reserva válido.' }),
});

export const guestIdSchema = texto(64, 'Identificador de convidado em falta.').min(
  8,
  'Identificador de convidado inválido.',
);

export const guestNameSchema = texto(80, 'Escreve o teu nome.').min(
  2,
  'Escreve o teu nome (pelo menos 2 letras).',
);

/** Campos que tanto convidados como pais podem preencher. */
const camposBaseDoArtigo = {
  name: texto(120, 'O nome do artigo é obrigatório.').min(1, 'O nome do artigo é obrigatório.'),
  categoryId: texto(64, 'Escolhe uma categoria.').min(1, 'Escolhe uma categoria.'),
  description: textoOpcional(600),
  size: textoOpcional(60),
  ageRangeId: textoOpcional(64),
  quantity: z.coerce
    .number({ invalid_type_error: 'A quantidade tem de ser um número.' })
    .int('A quantidade tem de ser um número inteiro.')
    .min(1, 'A quantidade tem de ser pelo menos 1.')
    .max(999, 'A quantidade é demasiado alta.')
    .default(1),
};

/** Só os pais controlam estado, prioridade, preços, link e destaque. */
const camposDeAdmin = {
  status: itemStatus.default('NEEDED'),
  priority: z.coerce
    .number({ invalid_type_error: 'A prioridade tem de ser um número.' })
    .int()
    .min(1, 'A prioridade vai de 1 a 5.')
    .max(5, 'A prioridade vai de 1 a 5.')
    .default(2),
  productUrl: urlOpcional,
  isFeatured: z.coerce.boolean().default(false),
};

export const criarArtigoDeConvidado = z.object({
  ...camposBaseDoArtigo,
  ownerId: guestIdSchema,
  ownerName: guestNameSchema,
});

export const editarArtigoDeConvidado = z.object({
  ...camposBaseDoArtigo,
  ownerId: guestIdSchema,
});

export const criarArtigoDeAdmin = z.object({ ...camposBaseDoArtigo, ...camposDeAdmin });

export const editarArtigoDeAdmin = z
  .object({ ...camposBaseDoArtigo, ...camposDeAdmin })
  .partial();

export const apagarArtigoDeConvidado = z.object({ ownerId: guestIdSchema });

export const criarReserva = z.object({
  itemId: texto(64, 'Artigo em falta.').min(1, 'Artigo em falta.'),
  guestId: guestIdSchema,
  guestName: guestNameSchema,
  guestEmail: z
    .string()
    .trim()
    .max(160)
    .email('O email não parece válido.')
    .or(z.literal(''))
    .transform((valor) => (valor === '' ? null : valor))
    .nullable()
    .optional(),
  status: z.enum(['THINKING', 'RESERVED'], {
    errorMap: () => ({ message: 'Escolhe se estás a pensar oferecer ou se vais mesmo oferecer.' }),
  }),
  note: textoOpcional(300),
});

export const editarReserva = z.object({
  guestId: guestIdSchema,
  status: reservationStatus,
  note: textoOpcional(300),
});

export const apagarReserva = z.object({ guestId: guestIdSchema });

export const loginSchema = z.object({
  // Aceita um email ou um nome de utilizador simples.
  email: z.string().trim().min(1, 'Escreve o utilizador ou o email.'),
  password: z.string().min(1, 'Escreve a palavra-passe.'),
});

export const categoriaSchema = z.object({
  name: texto(60, 'A categoria precisa de um nome.').min(1, 'A categoria precisa de um nome.'),
  icon: texto(16, 'Escolhe um ícone.').min(1, 'Escolhe um ícone.').default('💙'),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  isActive: z.coerce.boolean().default(true),
});

export const faixaEtariaSchema = z.object({
  label: texto(40, 'A faixa etária precisa de um nome.').min(1, 'A faixa etária precisa de um nome.'),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  isActive: z.coerce.boolean().default(true),
});

export const sugestaoSchema = z.object({
  name: texto(120, 'A sugestão precisa de um nome.').min(1, 'A sugestão precisa de um nome.'),
  description: textoOpcional(600),
  categoryId: textoOpcional(64),
  priority: z.coerce.number().int().min(1).max(5).default(2),
  productUrl: urlOpcional,
  imageUrl: urlOpcional,
  isActive: z.coerce.boolean().default(true),
});

export const preferenciaSchema = z.object({
  title: texto(120, 'A preferência precisa de um título.').min(1, 'A preferência precisa de um título.'),
  description: textoOpcional(400),
  icon: texto(16, 'Escolhe um ícone.').min(1, 'Escolhe um ícone.').default('💙'),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  isActive: z.coerce.boolean().default(true),
});

export const estadoSchema = z.object({
  label: texto(60, 'O estado precisa de um nome.').min(1, 'O estado precisa de um nome.'),
  icon: texto(16, 'Escolhe um ícone.').min(1, 'Escolhe um ícone.'),
  color: texto(20, 'Escolhe uma cor.').min(1, 'Escolhe uma cor.'),
  description: texto(240, 'Escreve uma explicação.').min(1, 'Escreve uma explicação.'),
});

export const definicoesSchema = z.object({
  babyName: texto(60, 'O nome do bebé é obrigatório.').min(1, 'O nome do bebé é obrigatório.'),
  siteName: texto(80, 'O nome do site é obrigatório.').min(1, 'O nome do site é obrigatório.'),
  heroIcon: texto(16, 'Escolhe um ícone.').min(1, 'Escolhe um ícone.'),
  heroTitle: texto(120, 'O título é obrigatório.').min(1, 'O título é obrigatório.'),
  heroSubtitle: texto(600, 'O texto de apresentação é obrigatório.').min(1, 'O texto de apresentação é obrigatório.'),
  primaryCtaLabel: texto(60, 'O botão principal precisa de texto.').min(1, 'O botão principal precisa de texto.'),
  secondaryCtaLabel: texto(60, 'O botão secundário precisa de texto.').min(1, 'O botão secundário precisa de texto.'),
  preferencesTitle: texto(120, 'O título das preferências é obrigatório.').min(1, 'O título das preferências é obrigatório.'),
  preferencesIntro: textoOpcional(600),
  footerText: texto(200, 'O rodapé é obrigatório.').min(1, 'O rodapé é obrigatório.'),
  // Pode ficar vazia: os pais decidem se querem mostrar a nota.
  giftNote: texto(400, 'A nota é demasiado longa.').default(''),
  reservationEnabled: z.coerce.boolean(),
  allowThinking: z.coerce.boolean(),
  allowCancellation: z.coerce.boolean(),
  reserverVisibility: z.enum(['PUBLIC', 'ADMIN_ONLY', 'HIDDEN'], {
    errorMap: () => ({ message: 'Escolhe uma opção de privacidade válida.' }),
  }),
  reservationTtlDays: z.coerce
    .number()
    .int()
    .min(1, 'O prazo tem de ser pelo menos 1 dia.')
    .max(365, 'O prazo é demasiado longo.')
    .nullable()
    .optional(),
});
