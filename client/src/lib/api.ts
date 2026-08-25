import { lerConvidado } from './guest';
import { lerTokenDeAdmin, limparTokenDeAdmin } from './adminAuth';
import type {
  AdminItem,
  AdminReservation,
  AgeRange,
  Category,
  DashboardData,
  Item,
  ParentPreference,
  PublicReservation,
  SiteSettings,
  StatusSetting,
  Suggestion,
} from '../types';

// Em produção o frontend é servido pelo mesmo domínio da API.
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: { field: string; message: string }[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Opcoes = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Junta o token de administrador ao pedido. */
  admin?: boolean;
};

async function pedir<T>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  const cabecalhos: Record<string, string> = { 'Content-Type': 'application/json' };

  const convidado = lerConvidado();
  if (convidado) cabecalhos['X-Guest-Id'] = convidado.id;

  if (opcoes.admin) {
    const token = lerTokenDeAdmin();
    if (token) cabecalhos.Authorization = `Bearer ${token}`;
  }

  let resposta: Response;
  try {
    resposta = await fetch(`${BASE}${caminho}`, {
      method: opcoes.method ?? 'GET',
      headers: cabecalhos,
      body: opcoes.body === undefined ? undefined : JSON.stringify(opcoes.body),
    });
  } catch {
    throw new ApiError('Não foi possível ligar ao servidor. Verifica a tua ligação.', 0);
  }

  if (resposta.status === 204) return undefined as T;

  const dados = (await resposta.json().catch(() => null)) as
    | { error?: string; details?: { field: string; message: string }[] }
    | null;

  if (!resposta.ok) {
    // Uma sessão de administrador expirada volta ao ecrã de login.
    if (opcoes.admin && resposta.status === 401) limparTokenDeAdmin();
    throw new ApiError(
      dados?.error ?? 'Ocorreu um erro inesperado. Tenta novamente.',
      resposta.status,
      dados?.details,
    );
  }

  return dados as T;
}

/* --------------------------------- pública -------------------------------- */

export interface FiltrosDeArtigos {
  search?: string;
  category?: string;
  status?: string;
  ageRange?: string;
  priority?: number;
  minPrice?: number;
  maxPrice?: number;
  reserved?: boolean;
  mine?: boolean;
  sort?: 'newest' | 'oldest' | 'priority' | 'name';
}

const query = (filtros: Record<string, unknown>) => {
  const parametros = new URLSearchParams();
  for (const [chave, valor] of Object.entries(filtros)) {
    if (valor === undefined || valor === null || valor === '' || valor === false) continue;
    parametros.set(chave, String(valor));
  }
  const texto = parametros.toString();
  return texto ? `?${texto}` : '';
};

export const api = {
  settings: () => pedir<{ settings: SiteSettings }>('/api/settings').then((r) => r.settings),
  categories: () => pedir<{ categories: Category[] }>('/api/categories').then((r) => r.categories),
  ageRanges: () => pedir<{ ageRanges: AgeRange[] }>('/api/age-ranges').then((r) => r.ageRanges),
  statuses: () => pedir<{ statuses: StatusSetting[] }>('/api/statuses').then((r) => r.statuses),
  preferences: () =>
    pedir<{ preferences: ParentPreference[] }>('/api/preferences').then((r) => r.preferences),

  suggestions: (faixa?: { min?: number; max?: number }) =>
    pedir<{ suggestions: Suggestion[] }>(
      `/api/suggestions${query({ minPrice: faixa?.min, maxPrice: faixa?.max })}`,
    ).then((r) => r.suggestions),

  items: (filtros: FiltrosDeArtigos = {}) =>
    pedir<{ items: Item[] }>(`/api/items${query(filtros as Record<string, unknown>)}`).then(
      (r) => r.items,
    ),

  item: (id: string) => pedir<{ item: Item }>(`/api/items/${id}`).then((r) => r.item),

  criarArtigo: (dados: Record<string, unknown>) =>
    pedir<{ item: Item }>('/api/items', { method: 'POST', body: dados }).then((r) => r.item),

  editarArtigo: (id: string, dados: Record<string, unknown>) =>
    pedir<{ item: Item }>(`/api/items/${id}`, { method: 'PUT', body: dados }).then((r) => r.item),

  apagarArtigo: (id: string, ownerId: string) =>
    pedir<void>(`/api/items/${id}`, { method: 'DELETE', body: { ownerId } }),

  minhasReservas: () =>
    pedir<{ reservations: AdminReservation[] }>('/api/reservations').then((r) => r.reservations),

  reservar: (dados: Record<string, unknown>) =>
    pedir<{ reservation: PublicReservation }>('/api/reservations', {
      method: 'POST',
      body: dados,
    }).then((r) => r.reservation),

  editarReserva: (id: string, dados: Record<string, unknown>) =>
    pedir<{ reservation: PublicReservation }>(`/api/reservations/${id}`, {
      method: 'PUT',
      body: dados,
    }).then((r) => r.reservation),

  cancelarReserva: (id: string, guestId: string) =>
    pedir<void>(`/api/reservations/${id}`, { method: 'DELETE', body: { guestId } }),
};

/* ------------------------------ administração ----------------------------- */

const adminPedir = <T>(caminho: string, opcoes: Omit<Opcoes, 'admin'> = {}) =>
  pedir<T>(caminho, { ...opcoes, admin: true });

export const adminApi = {
  login: (email: string, password: string) =>
    pedir<{ token: string; admin: { id: string; email: string; name: string | null } }>(
      '/api/admin/auth/login',
      { method: 'POST', body: { email, password } },
    ),

  me: () =>
    adminPedir<{ admin: { id: string; email: string; name: string | null } }>('/api/admin/auth/me'),

  dashboard: () => adminPedir<DashboardData>('/api/admin/dashboard'),

  items: (filtros: { search?: string; category?: string; status?: string } = {}) =>
    adminPedir<{ items: AdminItem[] }>(`/api/admin/items${query(filtros)}`).then((r) => r.items),

  criarArtigo: (dados: Record<string, unknown>) =>
    adminPedir<{ item: AdminItem }>('/api/admin/items', { method: 'POST', body: dados }).then(
      (r) => r.item,
    ),

  editarArtigo: (id: string, dados: Record<string, unknown>) =>
    adminPedir<{ item: AdminItem }>(`/api/admin/items/${id}`, { method: 'PUT', body: dados }).then(
      (r) => r.item,
    ),

  apagarArtigo: (id: string) => adminPedir<void>(`/api/admin/items/${id}`, { method: 'DELETE' }),

  categories: () =>
    adminPedir<{ categories: Category[] }>('/api/admin/categories').then((r) => r.categories),
  criarCategoria: (dados: Record<string, unknown>) =>
    adminPedir<{ category: Category }>('/api/admin/categories', { method: 'POST', body: dados }),
  editarCategoria: (id: string, dados: Record<string, unknown>) =>
    adminPedir<{ category: Category }>(`/api/admin/categories/${id}`, { method: 'PUT', body: dados }),
  apagarCategoria: (id: string) =>
    adminPedir<void>(`/api/admin/categories/${id}`, { method: 'DELETE' }),

  ageRanges: () =>
    adminPedir<{ ageRanges: AgeRange[] }>('/api/admin/age-ranges').then((r) => r.ageRanges),
  criarFaixa: (dados: Record<string, unknown>) =>
    adminPedir<{ ageRange: AgeRange }>('/api/admin/age-ranges', { method: 'POST', body: dados }),
  editarFaixa: (id: string, dados: Record<string, unknown>) =>
    adminPedir<{ ageRange: AgeRange }>(`/api/admin/age-ranges/${id}`, { method: 'PUT', body: dados }),
  apagarFaixa: (id: string) => adminPedir<void>(`/api/admin/age-ranges/${id}`, { method: 'DELETE' }),

  statuses: () =>
    adminPedir<{ statuses: StatusSetting[] }>('/api/admin/statuses').then((r) => r.statuses),
  editarEstado: (status: string, dados: Record<string, unknown>) =>
    adminPedir<{ status: StatusSetting }>(`/api/admin/statuses/${status}`, {
      method: 'PUT',
      body: dados,
    }),

  suggestions: () =>
    adminPedir<{ suggestions: Suggestion[] }>('/api/admin/suggestions').then((r) => r.suggestions),
  criarSugestao: (dados: Record<string, unknown>) =>
    adminPedir<{ suggestion: Suggestion }>('/api/admin/suggestions', { method: 'POST', body: dados }),
  editarSugestao: (id: string, dados: Record<string, unknown>) =>
    adminPedir<{ suggestion: Suggestion }>(`/api/admin/suggestions/${id}`, {
      method: 'PUT',
      body: dados,
    }),
  apagarSugestao: (id: string) =>
    adminPedir<void>(`/api/admin/suggestions/${id}`, { method: 'DELETE' }),

  preferences: () =>
    adminPedir<{ preferences: ParentPreference[] }>('/api/admin/preferences').then(
      (r) => r.preferences,
    ),
  criarPreferencia: (dados: Record<string, unknown>) =>
    adminPedir<{ preference: ParentPreference }>('/api/admin/preferences', {
      method: 'POST',
      body: dados,
    }),
  editarPreferencia: (id: string, dados: Record<string, unknown>) =>
    adminPedir<{ preference: ParentPreference }>(`/api/admin/preferences/${id}`, {
      method: 'PUT',
      body: dados,
    }),
  apagarPreferencia: (id: string) =>
    adminPedir<void>(`/api/admin/preferences/${id}`, { method: 'DELETE' }),

  reservations: (status?: string) =>
    adminPedir<{ reservations: AdminReservation[] }>(`/api/admin/reservations${query({ status })}`)
      .then((r) => r.reservations),
  apagarReserva: (id: string) =>
    adminPedir<void>(`/api/admin/reservations/${id}`, { method: 'DELETE' }),

  settings: () =>
    adminPedir<{ settings: SiteSettings }>('/api/admin/settings').then((r) => r.settings),
  guardarDefinicoes: (dados: Record<string, unknown>) =>
    adminPedir<{ settings: SiteSettings }>('/api/admin/settings', { method: 'PUT', body: dados }).then(
      (r) => r.settings,
    ),
};
