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
  minPrice: number | null;
  maxPrice: number | null;
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
  minPrice: number | null;
  maxPrice: number | null;
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

/** Faixas de orçamento da página de sugestões. */
export interface FaixaDeOrcamento {
  id: string;
  label: string;
  min?: number;
  max?: number;
}

export const FAIXAS_DE_ORCAMENTO: FaixaDeOrcamento[] = [
  { id: 'ate-20', label: 'Até 20€', max: 20 },
  { id: '20-50', label: '20€ – 50€', min: 20, max: 50 },
  { id: '50-100', label: '50€ – 100€', min: 50, max: 100 },
  { id: 'mais-100', label: 'Mais de 100€', min: 100 },
];

export const PRIORIDADES: { valor: number; label: string }[] = [
  { valor: 1, label: '1 — Baixa' },
  { valor: 2, label: '2 — Normal' },
  { valor: 3, label: '3 — Importante' },
  { valor: 4, label: '4 — Muito importante' },
  { valor: 5, label: '5 — Prioridade máxima' },
];
