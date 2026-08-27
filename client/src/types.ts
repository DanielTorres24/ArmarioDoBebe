export type ItemStatus = 'NEEDED' | 'WANTED' | 'SOME' | 'OWNED';
export type ReservationStatus = 'THINKING' | 'RESERVED' | 'GIFTED' | 'CANCELLED';
export type ReserverVisibility = 'PUBLIC' | 'ADMIN_ONLY' | 'HIDDEN';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  _count?: { items: number; suggestions: number };
}

export interface AgeRange {
  id: string;
  label: string;
  slug: string;
  monthsFrom: number | null;
  monthsTo: number | null;
  sortOrder: number;
  isActive: boolean;
  _count?: { items: number };
}

export interface StatusSetting {
  id: number;
  status: ItemStatus;
  label: string;
  icon: string;
  color: string;
  description: string;
  sortOrder: number;
}

/** Reserva tal como a área pública a vê (nome só quando é permitido). */
export interface PublicReservation {
  id: string;
  status: ReservationStatus;
  guestName: string | null;
  isMine: boolean;
  createdAt: string;
}

export interface Item {
  id: string;
  name: string;
  description: string | null;
  categoryId: string;
  category?: Category;
  status: ItemStatus;
  priority: number;
  size: string | null;
  ageRangeId: string | null;
  ageRange?: AgeRange | null;
  quantity: number;
  productUrl: string | null;
  isFeatured: boolean;
  ownerId: string | null;
  ownerName: string | null;
  createdAt: string;
  updatedAt: string;
  reservations: PublicReservation[];
  isReserved: boolean;
  isMine: boolean;
}

/** Artigo na área de administração: reservas completas, com nome e contacto. */
export interface AdminReservation {
  id: string;
  itemId: string;
  guestId: string;
  guestName: string;
  guestEmail: string | null;
  status: ReservationStatus;
  note: string | null;
  createdAt: string;
  expiresAt: string | null;
  item?: { id: string; name: string; category?: Category };
}

export interface AdminItem extends Omit<Item, 'reservations' | 'isReserved' | 'isMine'> {
  reservations: AdminReservation[];
}

export interface Suggestion {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  category?: Category | null;
  priority: number;
  productUrl: string | null;
  imageUrl: string | null;
  isActive: boolean;
}

export interface ParentPreference {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  sortOrder: number;
  isActive: boolean;
}

export interface SiteSettings {
  id: number;
  babyName: string;
  siteName: string;
  heroIcon: string;
  heroTitle: string;
  heroSubtitle: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  preferencesTitle: string;
  preferencesIntro: string | null;
  footerText: string;
  /** Nota sobre prendas em segunda mão. Vazia = não aparece. */
  giftNote: string;
  /** Data prevista do parto (ISO). Base do cálculo das estações do ano. */
  dueDate: string | null;
  reservationEnabled: boolean;
  allowThinking: boolean;
  allowCancellation: boolean;
  reserverVisibility: ReserverVisibility;
  reservationTtlDays: number | null;
}

export interface DashboardData {
  totals: {
    items: number;
    units: number;
    needed: number;
    wanted: number;
    some: number;
    owned: number;
    reservations: number;
    thinking: number;
    reserved: number;
    gifted: number;
  };
  byCategory: { id: string; name: string; icon: string; count: number }[];
  latestItems: AdminItem[];
  latestReservations: AdminReservation[];
}

/** Quantidades devolvidas por /api/stats — substituem a informação de preço. */
export interface ContagemPorCategoria {
  id: string;
  slug: string;
  name: string;
  icon: string;
  unidades: number;
  pedidos: number;
}

export interface ContagemPorTamanho {
  id: string;
  label: string;
  monthsFrom: number | null;
  monthsTo: number | null;
  unidades: number;
  pedidos: number;
}

export interface Estatisticas {
  totalUnidades: number;
  totalArtigos: number;
  porCategoria: ContagemPorCategoria[];
  roupaPorTamanho: ContagemPorTamanho[];
  roupaSemTamanho: { unidades: number; pedidos: number };
}

export const PRIORIDADES: { valor: number; label: string }[] = [
  { valor: 1, label: '1 — Baixa' },
  { valor: 2, label: '2 — Normal' },
  { valor: 3, label: '3 — Importante' },
  { valor: 4, label: '4 — Muito importante' },
  { valor: 5, label: '5 — Prioridade máxima' },
];
