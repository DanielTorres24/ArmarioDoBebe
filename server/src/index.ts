import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

import { corsOrigins, env, isProduction } from './env.js';
import { prisma } from './lib/prisma.js';
import { HttpError, respostaDeValidacao } from './lib/http.js';
import { itemsPublicRouter } from './routes/public/items.js';
import { catalogoRouter } from './routes/public/catalogo.js';
import { reservationsPublicRouter } from './routes/public/reservations.js';
import { adminRouter } from './routes/admin/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '..', 'public');

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

// CSP desligada: o bundle é servido do mesmo domínio e não usa CDNs.
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(compression());
app.use(express.json({ limit: '128kb' }));

app.use(
  cors({
    origin: corsOrigins.length > 0 ? corsOrigins : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Guest-Id'],
  }),
);

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'ok' });
  } catch {
    res.status(503).json({ status: 'degraded', database: 'unreachable' });
  }
});

app.use('/api/items', itemsPublicRouter);
app.use('/api/reservations', reservationsPublicRouter);
app.use('/api/admin', adminRouter);
app.use('/api', catalogoRouter);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint não encontrado.' }));

// Frontend compilado (client/dist copiado para server/public no build).
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir, { maxAge: isProduction ? '1h' : 0, index: false }));
  app.get('*', (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));
} else {
  app.get('/', (_req, res) =>
    res
      .type('text/plain')
      .send('API do Armário do Diogo a funcionar. Frontend em dev: http://localhost:5173'),
  );
}

app.use((erro: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (erro instanceof ZodError) {
    return res.status(400).json(respostaDeValidacao(erro));
  }

  if (erro instanceof HttpError) {
    return res.status(erro.status).json({ error: erro.message });
  }

  if (erro instanceof Prisma.PrismaClientKnownRequestError) {
    // Chave estrangeira inválida (categoria ou faixa etária que não existe).
    if (erro.code === 'P2003' || erro.code === 'P2025') {
      return res.status(400).json({ error: 'Há uma referência inválida no pedido.' });
    }
    if (erro.code === 'P2002') {
      return res.status(409).json({ error: 'Já existe um registo com esses dados.' });
    }
  }

  if ((erro as { type?: string })?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Pedido inválido.' });
  }

  console.error('[erro]', erro);
  return res.status(500).json({ error: 'Ocorreu um erro no servidor. Tenta novamente.' });
});

const server = app.listen(env.PORT, () => {
  console.log(`Armário do Diogo — API a ouvir na porta ${env.PORT}`);
});

const encerrar = (sinal: string) => {
  console.log(`\n${sinal} recebido, a encerrar...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGTERM', () => encerrar('SIGTERM'));
process.on('SIGINT', () => encerrar('SIGINT'));
