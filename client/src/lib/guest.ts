/**
 * Identidade local do convidado.
 *
 * O `id` e um UUID gerado no navegador e e ele - nao o nome - que o servidor
 * usa para autorizar edicoes, remocoes e reservas. O nome serve so para ser
 * mostrado. Assim, duas pessoas com o mesmo nome nao se afetam uma a outra e a
 * arquitetura fica pronta para trocar isto por autenticacao a serio.
 */

const CHAVE = 'armario-do-diogo:guest';

export interface Convidado {
  id: string;
  name: string;
  email?: string;
}

function novoId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function lerConvidado(): Convidado | null {
  try {
    const cru = window.localStorage.getItem(CHAVE);
    if (!cru) return null;
    const dados = JSON.parse(cru) as Partial<Convidado>;
    if (typeof dados?.id === 'string' && typeof dados?.name === 'string') {
      return { id: dados.id, name: dados.name, email: dados.email };
    }
    return null;
  } catch {
    // localStorage indisponivel (modo privado) - seguimos sem persistencia.
    return null;
  }
}

export function guardarConvidado(nome: string, email?: string): Convidado | null {
  const name = nome.trim();
  if (name.length < 2) return null;

  const convidado: Convidado = { id: lerConvidado()?.id ?? novoId(), name, ...(email ? { email } : {}) };

  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(convidado));
  } catch {
    // Continua a funcionar apenas nesta sessao.
  }

  return convidado;
}
