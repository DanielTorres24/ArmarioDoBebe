import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodError, type ZodSchema } from 'zod';

/** Erro com codigo HTTP, para ser apanhado pelo middleware de erro. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const naoEncontrado = (o = 'Recurso') => new HttpError(404, `${o} não encontrado.`);
export const semPermissao = (mensagem: string) => new HttpError(403, mensagem);

/** Envolve handlers async para que as rejeicoes cheguem ao middleware de erro. */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

/** Valida o corpo do pedido e devolve os dados ja convertidos. */
export function validar<T>(schema: ZodSchema<T>, dados: unknown): T {
  const resultado = schema.safeParse(dados);
  if (resultado.success) return resultado.data;
  throw new ZodError(resultado.error.issues);
}

/** Transforma um ZodError na resposta simples que o frontend mostra. */
export function respostaDeValidacao(erro: ZodError) {
  const primeiro = erro.issues[0];
  return {
    error: primeiro?.message ?? 'Dados inválidos.',
    details: erro.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
  };
}

/** Converte "" em undefined, para campos opcionais vindos de formularios. */
export const vazioParaIndefinido = (valor: unknown) =>
  typeof valor === 'string' && valor.trim() === '' ? undefined : valor;
