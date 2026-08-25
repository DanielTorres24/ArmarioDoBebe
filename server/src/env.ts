import 'dotenv/config';
import { z } from 'zod';

/**
 * Todas as configuracoes sensiveis vem do ambiente. O arranque falha cedo e com
 * uma mensagem clara se faltar alguma coisa, em vez de rebentar a meio.
 */
const schema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória.'),
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET tem de ter pelo menos 16 caracteres.'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().optional(),
  // Pode ser um email ou um nome de utilizador simples (ex.: "admin").
  ADMIN_EMAIL: z.string().trim().min(3, 'ADMIN_EMAIL tem de ter pelo menos 3 caracteres.').optional(),
  ADMIN_PASSWORD: z.string().min(8, 'ADMIN_PASSWORD tem de ter pelo menos 8 caracteres.').optional(),
  ADMIN_NAME: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const problemas = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
  console.error('Configuração inválida:\n' + problemas.join('\n'));
  process.exit(1);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === 'production';

export const corsOrigins = (env.CORS_ORIGIN ?? '')
  .split(',')
  .map((origem) => origem.trim())
  .filter(Boolean);
