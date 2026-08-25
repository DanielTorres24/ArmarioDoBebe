/** Token de sessao dos pais. Fica no sessionStorage: fecha o separador, sai. */
const CHAVE = 'armario-do-diogo:admin-token';

export function lerTokenDeAdmin(): string | null {
  try {
    return window.sessionStorage.getItem(CHAVE);
  } catch {
    return null;
  }
}

export function guardarTokenDeAdmin(token: string): void {
  try {
    window.sessionStorage.setItem(CHAVE, token);
  } catch {
    /* sem persistencia; a sessao dura enquanto a pagina estiver aberta */
  }
}

export function limparTokenDeAdmin(): void {
  try {
    window.sessionStorage.removeItem(CHAVE);
  } catch {
    /* nada a fazer */
  }
}
