import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';

import { env } from '../env.js';
import { prisma } from './prisma.js';
import { HttpError } from './http.js';

export interface AdminToken {
  sub: string;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AdminToken;
    }
  }
}

export const hashPassword = (password: string) => bcrypt.hash(password, 12);

export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

export function signAdminToken(payload: AdminToken): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);
}

/**
 * Protege as rotas /api/admin. O token vem no cabecalho Authorization e e
 * sempre reconfirmado contra a base de dados, para que apagar um administrador
 * invalide de imediato as sessoes dele.
 */
export async function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  try {
    const cabecalho = req.header('authorization') ?? '';
    const token = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7).trim() : '';

    if (!token) throw new HttpError(401, 'Precisas de iniciar sessão.');

    let payload: AdminToken;
    try {
      payload = jwt.verify(token, env.JWT_SECRET) as AdminToken;
    } catch {
      throw new HttpError(401, 'A sessão expirou. Inicia sessão outra vez.');
    }

    const admin = await prisma.adminUser.findUnique({ where: { id: payload.sub } });
    if (!admin) throw new HttpError(401, 'A sessão já não é válida.');

    req.admin = { sub: admin.id, email: admin.email };
    next();
  } catch (erro) {
    next(erro);
  }
}
